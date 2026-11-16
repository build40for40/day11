#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <M5StackChan.h>
#include <M5UnitUnified.h>
#include <M5UnitUnifiedNFC.h>
#include <vector>
#include "secrets.h"

using namespace m5::nfc::a;

namespace {
constexpr uint32_t kMicRate = 16000;
constexpr uint32_t kReplyRate = 24000;
constexpr size_t kFrameSamples = 1600;
constexpr size_t kReplyMaxBytes = kReplyRate * 2 * 60;
constexpr size_t kPrebufferBytes = kReplyRate * 2 / 5;
constexpr size_t kChunkMinBytes = kReplyRate * 2 / 10;
constexpr uint8_t kMicMagnification = 16;
constexpr uint8_t kSpeakerVolume = 255;
constexpr uint8_t kMissesBeforeTap = 3;
constexpr uint32_t kGiveUpOnServerMs = 8000;
constexpr uint32_t kWandPollMs = 200;
constexpr uint32_t kEchoGuardMs = 250;
constexpr uint32_t kWaitingTimeoutMs = 15000;

auto& lcd = M5.Display;
WebSocketsClient ws;
m5::unit::UnitUnified Units;
m5::unit::UnitNFC nfcUnit{};
m5::nfc::NFCLayerA nfcA{nfcUnit};
bool nfcReady = false;

int16_t* frames[3] = {nullptr, nullptr, nullptr};
uint8_t* reply = nullptr;
size_t replyBytes = 0;
size_t playedBytes = 0;
size_t framesQueued = 0;
bool replyActive = false;
bool replyEnded = false;
bool connected = false;
bool conversation = false;
bool listening = false;
bool thinkingRequested = false;
bool endRequested = false;
uint32_t waitingSince = 0;
String lastUid;
uint8_t wandMisses = kMissesBeforeTap;
uint32_t lastWandPollAt = 0;
uint32_t offlineSince = 0;
bool usingLocal = false;

void status(const char* text, uint16_t color, uint8_t r, uint8_t g, uint8_t b)
{
    lcd.fillScreen(TFT_BLACK);
    lcd.setTextColor(color);
    lcd.setTextSize(2);
    lcd.setCursor(0, 0);
    lcd.print(text);
    M5StackChan.showRgbColor(r, g, b);
    Serial.printf("[status] %s\n", text);
}

void ready()
{
    status(usingLocal ? "Ready (local)\nTap the wand\non my head" : "Ready (cloud)\nTap the wand\non my head", TFT_YELLOW, 40,
           28, 0);
}

void onSocket(WStype_t type, uint8_t* payload, size_t length)
{
    switch (type) {
        case WStype_CONNECTED:
            connected = true;
            offlineSince = 0;
            ws.sendTXT("{\"t\":\"hello\",\"device\":\"stackchan-01\",\"fw\":\"proto-0.9\"}");
            ready();
            break;
        case WStype_DISCONNECTED:
            if (connected) status("Server gone\nreconnecting", TFT_BLUE, 0, 0, 30);
            connected = false;
            endRequested = true;
            if (!offlineSince) offlineSince = millis();
            break;
        case WStype_TEXT: {
            const char* text = reinterpret_cast<const char*>(payload);
            Serial.printf("[ws] %s\n", text);
            if (strstr(text, "\"audio_start\"")) {
                if (!conversation) break;
                replyBytes = 0;
                playedBytes = 0;
                replyEnded = false;
                replyActive = true;
            } else if (strstr(text, "\"audio_end\"")) {
                replyEnded = true;
            } else if (strstr(text, "\"t\":\"thinking\"")) {
                thinkingRequested = true;
            } else if (strstr(text, "\"t\":\"end\"") || strstr(text, "\"t\":\"error\"")) {
                endRequested = true;
            }
            break;
        }
        case WStype_BIN:
            if (replyBytes + length <= kReplyMaxBytes) {
                memcpy(reply + replyBytes, payload, length);
                replyBytes += length;
            }
            break;
        default:
            break;
    }
}

void startListening()
{
    status("Listening...", TFT_GREEN, 0, 60, 0);
    M5.Speaker.end();
    M5.Mic.begin();
    framesQueued = 0;
    listening = true;
    waitingSince = 0;
    ws.sendTXT("{\"t\":\"listening\"}");
}

void stopListening()
{
    if (!listening) return;
    while (M5.Mic.isRecording()) delay(1);
    M5.Mic.end();
    M5.Speaker.begin();
    M5.Speaker.setVolume(kSpeakerVolume);
    listening = false;
}

void streamMic()
{
    if (M5.Mic.record(frames[framesQueued % 3], kFrameSamples, kMicRate)) {
        if (framesQueued >= 2) {
            ws.sendBIN(reinterpret_cast<uint8_t*>(frames[(framesQueued - 2) % 3]), kFrameSamples * sizeof(int16_t));
        }
        ++framesQueued;
    } else {
        delay(1);
    }
}

void endConversation()
{
    stopListening();
    M5.Speaker.stop();
    replyActive = false;
    conversation = false;
    endRequested = false;
    thinkingRequested = false;
    waitingSince = 0;
    wandMisses = 0;
    ready();
}

void pumpReply()
{
    size_t available = (replyBytes - playedBytes) & ~static_cast<size_t>(1);
    size_t needed = replyEnded ? 2 : (playedBytes ? kChunkMinBytes : kPrebufferBytes);
    if (available >= needed && M5.Speaker.isPlaying(0) < 2) {
        if (!playedBytes) status("Speaking", TFT_ORANGE, 60, 40, 0);
        M5.Speaker.playRaw(reinterpret_cast<const int16_t*>(reply + playedBytes), available / 2, kReplyRate, false, 1,
                           0);
        playedBytes += available;
    }
    if (replyEnded && replyBytes - playedBytes < 2 && !M5.Speaker.isPlaying(0)) {
        replyActive = false;
        ws.sendTXT("{\"t\":\"playback_done\"}");
        if (endRequested || !conversation) {
            endConversation();
        } else {
            delay(kEchoGuardMs);
            startListening();
        }
    }
}

bool wandTapped()
{
    if (!nfcReady || millis() - lastWandPollAt < kWandPollMs) return false;
    lastWandPollAt = millis();
    Units.update();
    std::vector<PICC> tags;
    if (!nfcA.detect(tags) || tags.empty()) {
        if (wandMisses < kMissesBeforeTap) ++wandMisses;
        return false;
    }
    lastUid = tags.front().uidAsString().c_str();
    lastUid.toUpperCase();
    nfcA.deactivate();
    bool lifted = wandMisses >= kMissesBeforeTap;
    wandMisses = 0;
    return lifted;
}

void startConversation()
{
    M5.Speaker.tone(3000, 30);
    String message = "{\"t\":\"nfc\",\"uid\":\"" + lastUid + "\"}";
    ws.sendTXT(message);
    conversation = true;
    waitingSince = millis();
    status("Wand!", TFT_CYAN, 0, 40, 60);
}
}  // namespace

void setup()
{
    M5StackChan.begin();
    Serial.begin(115200);

    nfcReady = Units.add(nfcUnit, M5.In_I2C) && Units.begin();
    if (!nfcReady) Serial.println("[nfc] reader failed to start");

    for (auto& frame : frames) frame = static_cast<int16_t*>(ps_malloc(kFrameSamples * sizeof(int16_t)));
    reply = static_cast<uint8_t*>(ps_malloc(kReplyMaxBytes));
    if (!reply || !frames[2]) {
        status("No PSRAM", TFT_RED, 60, 0, 0);
        while (true) delay(1000);
    }

    auto mic = M5.Mic.config();
    mic.magnification = kMicMagnification;
    M5.Mic.config(mic);
    M5.Speaker.begin();
    M5.Speaker.setVolume(kSpeakerVolume);

    status("Joining Wi-Fi", TFT_WHITE, 20, 20, 20);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    while (WiFi.status() != WL_CONNECTED) delay(250);
    Serial.printf("[wifi] %s rssi %d\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());

    status("Finding server", TFT_WHITE, 20, 20, 20);
#ifdef LOCAL_HOST
    for (int attempt = 0; attempt < 3 && !usingLocal; ++attempt) {
        WiFiClient probe;
        usingLocal = probe.connect(LOCAL_HOST, LOCAL_PORT, 1500);
        probe.stop();
    }
#endif
    if (usingLocal) {
#ifdef LOCAL_HOST
        ws.setExtraHeaders("Authorization: Bearer " LOCAL_TOKEN);
        ws.begin(LOCAL_HOST, LOCAL_PORT, "/ws?device=stackchan-01");
#endif
    } else {
        ws.setExtraHeaders("Authorization: Bearer " DEVICE_TOKEN);
        ws.beginSSL(CLOUD_HOST, 443, CLOUD_PATH);
    }
    offlineSince = millis();
    ws.onEvent(onSocket);
    ws.setReconnectInterval(2000);
}

void loop()
{
    M5StackChan.update();
    ws.loop();
    if (!connected) {
        if (endRequested) endConversation();
        if (millis() - offlineSince > kGiveUpOnServerMs) ESP.restart();
        return;
    }
    bool wand = !replyActive && wandTapped();

    if (wand && (conversation || replyActive)) {
        Serial.println("[wand] second tap, ending");
        ws.sendTXT("{\"t\":\"stop\"}");
        endConversation();
        M5.Speaker.tone(1500, 60);
    } else if (replyActive) {
        stopListening();
        thinkingRequested = false;
        pumpReply();
    } else if (endRequested) {
        endConversation();
    } else if (thinkingRequested) {
        thinkingRequested = false;
        if (listening) {
            stopListening();
            waitingSince = millis();
            status("Thinking...", TFT_WHITE, 20, 20, 40);
        }
    } else if (listening) {
        streamMic();
    } else if (conversation) {
        if (millis() - waitingSince > kWaitingTimeoutMs) startListening();
    } else if (wand) {
        startConversation();
    }
}
