# StackChan and the voice agent

Source: the Superthread research card "Research: StackChan with the N3 nail and a voice agent". Nothing here has been tested on a real StackChan yet.

## What StackChan is

- **Official K151 (2026):** CoreS3 (ESP32-S3, 16MB flash, 8MB PSRAM), pan and tilt feedback servos, 2" touchscreen, 1W speaker, dual mics, camera, three-zone touch strip on the body, 12 RGB LEDs and an ST25R3916 NFC reader in the head. Programmable in Arduino, UiFlow2, PlatformIO or ESP-IDF. The `M5StackChan` Arduino library moves the head with `Motion.move(x, y)`, in units of 10 = 1 degree. Docs: https://docs.m5stack.com/en/StackChan
- **Classic community StackChan:** JavaScript on the Moddable SDK, usually a Core2 with SG90 servos. https://github.com/stack-chan/stack-chan
- **Factory firmware:** a XiaoZhi AI agent that wakes on "Hi, StackChan", configured in the StackChan World app, on a Chinese cloud service. Firmware, app and server are open source (https://github.com/m5stack/StackChan) but pointing it at our own server isn't documented.
- Skip the older AI_StackChan2 projects: mostly Japanese, and the English fork uses a Japanese voice engine.

## Reading the nail

- **K151:** use the official NFC example (https://docs.m5stack.com/en/arduino/stackchan/nfc). Needs board manager 3.2.2+ and the M5StackChan, M5Unified and M5UnitUnified libraries with M5Unit-NFC (https://github.com/m5stack/M5Unit-NFC), which supports NTAG213. Tags go on top of the head.
- **Classic:** add a Unit RFID2 (https://docs.m5stack.com/en/unit/rfid2) on Grove Port A (I2C 0x28) with the `MFRC522_I2C` library. Range is under 20mm.
- Identify by UID. Nobody has documented a nail-sized tag on StackChan, so expect near contact.

## Open questions to test

Nothing is decided on how to build this. Things to find out first:

1. Does the nail read on StackChan's head?
2. Do the mic and speaker work with our own code, not just the factory agent?
3. How fast is a full speech round trip, and is it fast enough that a kid won't wander off?
4. Can the factory firmware be replaced and restored?
5. Can a kid talk to it without it hearing itself (the research suggested holding the head touch strip)?

Precedent for an ESP32 voice device talking to a realtime model: ElatoAI (https://github.com/akdeb/ElatoAI). The open-source XiaoZhi firmware and server (`xiaozhi-esp32`, `xiaozhi-esp32-server`) solve voice but lean Chinese and need C++ for NFC. A phone doing the voice behind StackChan was floated as a safe fallback.

## Tested so far

Factory baseline, tested on a real StackChan:

- **Firmware:** 1.6.0, after the on-device upgrade.
- **Wi-Fi:** set up on a 2.4GHz network through the StackChan World app.
- **Speech latency:** about 5 seconds from the end of speech to the start of the reply, on the factory agent.
- **Hearing itself:** it doesn't.
- **Factory agent:** uses Qwen or DeepSeek models by default. It has a personality setting and short-term memory, but no sign we can swap in our own model. It also has an "EzData" mode we haven't identified.

- **Build toolchain:** `arduino-cli` 1.6.0 with core `m5stack:esp32` 3.3.10 and libraries M5StackChan 1.1.1, M5Unified 0.3.0, M5UnitUnified 0.6.5 and M5Unit-NFC 0.1.2. The official NFC Detect example compiles for `m5stack:esp32:m5stack_cores3` with the newest versions, no pinning needed. Setup steps are in [../hardware-tests/README.md](../hardware-tests/README.md).
- **M5Burner web:** it can connect to our StackChan over USB. No burn attempted yet, and we didn't confirm a StackChan factory image is listed.

- **Nail on the head (open question 1): reads.** The official NFC Detect example, flashed over the factory firmware, read our N3 on top of the head. It printed the same UID as NFC Tools (`04E28F4A1F1D90`) and identified it as NTAG 213, repeatedly. One read out of eight showed a different ATQA (`0A40` instead of `0044`) with the right UID, probably a read glitch. Position on the head didn't matter much: it read as long as the nail was under the ports on top of the head. Read distance not measured yet.
- **Flashing:** the unit was flashed with `arduino-cli`, and every segment verified. The factory firmware is now overwritten and not yet restored.
- **macOS:** Terminal can't read `~/Documents`, so Arduino libraries live in `~/arduino-user` (`directories.user` in the `arduino-cli` config).

- **Mic and speaker with our own code (open question 2): work, quality poor.** A touch-to-record sketch (3 seconds at 16kHz mono, played back through `M5.Speaker` at volume 200) ran reliably six times in a row. Mic levels were low: peak 2,400 to 10,000 and RMS 130 to 790 out of a 32,767 scale, from about 30cm away and not speaking directly at it. Playback was muffled, a little tinny, distorted and too quiet, with white-noise background hiss. A loud voice was fine. Mic and speaker share one audio bus, so the sketch switches between them (no full duplex tested). Not yet tried: higher volume, mic gain, a higher sample rate.
- **NFC read reliability:** the nail was harder to read in later testing than in the first run. Cause not found yet.

Not yet tested: NFC read distance, a sticker as a control, full duplex audio, speech round trip with our own model, and restoring the factory firmware.

## Restoring the factory firmware (unverified)

A third-party write-up says the web version of M5Burner restored a StackChan to its initial state: connect by USB, pick StackChan, flash the factory image. It needs an M5Stack account and has limitations. Not yet tried on our unit. Source: https://dev.classmethod.jp/en/articles/web-m5burner/

## Custom server option (unverified)

The factory firmware is XiaoZhi, which is open source. Third-party guides say it can be pointed at our own XiaoZhi-compatible server by changing the OTA URL, which returns the WebSocket address used for voice. That would let us choose the model and character while keeping the factory audio and servo code. Needs ESP-IDF 5.5.4 to build, and NFC would still need firmware changes. Not an official M5Stack path.

## Toy cards (idea only)

Toys almost never have NFC, so cards are ours to make: a toy picture on card with an NTAG213 sticker on the back, each UID mapped to a toy. Cards can also be YES, NO or category cards for a 20 Questions game. Toniebox figures and Yoto cards already give kids "put a thing on the box and something happens". Shop security tags are a different technology StackChan can't read.

## Gotchas

- **Firmware:** flashing wipes the factory AI agent, and it's unclear how easily it comes back.
- **Power:** keep it on USB-C while live, the battery is small.
- **Tilt servo:** keep it between 5 and 85 degrees or it can stall and get damaged.
- **Speech:** the docs only show WAV playback, and text-to-speech output may not come in a format the ESP32 can play.
- **Wi-Fi:** 2.4GHz only.
- **Builds:** the Arduino StackChan README is in Japanese and warns that the latest library updates break builds. Do a first build before going live.

## Kit list

StackChan K151 (or classic plus Unit RFID2 and Grove cable), spare N3 nails and nail glue, 20+ NTAG213 stickers, a phone with NFC Tools, a USB-C data cable and 5V supply, a laptop with libraries installed, a 2.4GHz hotspot, a microSD card for sound files.
