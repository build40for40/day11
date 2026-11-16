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
