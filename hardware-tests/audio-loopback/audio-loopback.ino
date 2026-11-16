#include <Arduino.h>
#include <M5StackChan.h>

namespace {
constexpr uint32_t kSampleRate = 16000;
constexpr size_t kSeconds = 3;
constexpr size_t kSamples = kSampleRate * kSeconds;

auto& lcd = M5.Display;
int16_t* recording = nullptr;

void status(const char* text, uint16_t color)
{
    lcd.fillScreen(TFT_BLACK);
    lcd.setTextColor(color);
    lcd.setTextSize(2);
    lcd.setCursor(0, 0);
    lcd.print(text);
}

void printLevels(const int16_t* samples, size_t count)
{
    int32_t peak = 0;
    double sumSquares = 0;
    for (size_t i = 0; i < count; ++i) {
        int32_t v = abs(samples[i]);
        if (v > peak) peak = v;
        sumSquares += static_cast<double>(samples[i]) * samples[i];
    }
    Serial.printf("levels: peak=%ld rms=%.0f\n", static_cast<long>(peak), sqrt(sumSquares / count));
}

void recordAndPlayBack()
{
    status("Recording...\nSpeak now", TFT_RED);
    M5.Speaker.end();
    M5.Mic.begin();

    uint32_t startedAt = millis();
    M5.Mic.record(recording, kSamples, kSampleRate);
    while (M5.Mic.isRecording()) delay(1);
    Serial.printf("recorded %u s in %lu ms\n", static_cast<unsigned>(kSeconds), millis() - startedAt);
    M5.Mic.end();
    printLevels(recording, kSamples);

    status("Playing back", TFT_GREEN);
    M5.Speaker.begin();
    M5.Speaker.setVolume(200);
    uint32_t playStart = millis();
    M5.Speaker.playRaw(recording, kSamples, kSampleRate, false, 1, 0);
    Serial.printf("playback queued after %lu ms\n", millis() - playStart);
    while (M5.Speaker.isPlaying()) delay(1);
    Serial.printf("playback done after %lu ms\n", millis() - playStart);

    status("Touch the head\nstrip to record", TFT_YELLOW);
}
}  // namespace

void setup()
{
    M5StackChan.begin();
    Serial.begin(115200);

    recording = static_cast<int16_t*>(ps_malloc(kSamples * sizeof(int16_t)));
    if (!recording) {
        status("No PSRAM for\nrecording buffer", TFT_RED);
        while (true) delay(1000);
    }
    status("Touch the head\nstrip to record", TFT_YELLOW);
}

void loop()
{
    M5StackChan.update();
    if (M5StackChan.TouchSensor.wasClicked()) {
        recordAndPlayBack();
    }
    delay(20);
}
