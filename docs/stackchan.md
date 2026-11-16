# StackChan and the voice agent

Source: the Superthread research card "Research: StackChan with the N3 nail and a voice agent". Only the "Tested so far" section was run on a real StackChan.

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

- **Thin device plus server, end to end (16 Nov): works.** The sketch in [../prototype/](../prototype/README.md) joined 2.4GHz Wi-Fi, opened a WebSocket to a Node server on a laptop on the same network and completed a push-to-talk turn on the first try. It streamed 2.5 seconds of 16kHz PCM16 from the mic in 100ms frames while the head strip was held, with no frames dropped, then received and played 5.6 seconds of 24kHz PCM16. From letting go of the strip, the first reply audio arrived after 1.0 second and playback started after 1.7 seconds. The server had no model behind it: it replied with a macOS `say` line (about 1 second to generate) plus an echo of the mic audio. The device waits for the whole reply before playing, so the 0.7 second gap grows with reply length until playback is streamed.
- **Built-in mic is good enough for speech to text (16 Nov).** Real turns spoken at the StackChan from close range transcribed correctly with `gpt-4o-mini-transcribe`, at `magnification` 16. A 1.2 second mumble came back as Danish, so very short turns are unreliable. The echo of the mic through the speaker sounds terrible, but that didn't stop transcription.
- **Blocking chain, through the StackChan (16 Nov): 3 to 5 seconds on the server.** Speech to text 0.6 to 1.1s, `gpt-4o-mini` 0.9 to 1.2s, `gpt-4o-mini-tts` 1.5 to 2.7s, each as one blocking HTTP call, before the device's own delay. Too slow.
- **Three faster modes, server only (16 Nov).** The same synthetic 2.3 second sentence, two turns each, sent to the prototype server at mic pace. Time from the end of speech to the first reply audio leaving the server:

  | `MODE` | How it works | First audio |
  |---|---|---|
  | `chain` | speech to text, streamed `gpt-4o-mini`, text to speech per sentence | 3.5s, then 1.6s |
  | `hybrid` | `gpt-realtime` with audio in and text out, text to speech per sentence | 0.9s, then 1.1s |
  | `realtime` | `gpt-realtime` speech to speech | 0.6s, then 0.4s |

  `hybrid` is the Option B shape in [architecture.md](architecture.md): the reply exists as text before it is spoken, so a safety check can sit in between. Two turns per mode is a small sample, and these numbers leave out the device (about 0.7s on the earlier test).
- **Mic gain:** with `magnification` raised from 16 to 32 the mic clipped (peak 32,752, RMS 10,731) on that one turn. Distance from the mic wasn't noted.

- **Hybrid mode through the StackChan (16 Nov): 1.4 seconds.** One real turn (6.8 seconds of speech, transcribed correctly) with streamed playback on the device: sound started 1.4 seconds after letting go of the head strip, against about 5 seconds on the factory agent. One turn only, so treat it as a first reading.
- **Hands-free conversation with a "bye" ending, server only (16 Nov): works in `hybrid` and `realtime`.** Tap the head to start, and the mic stays open between replies. The realtime model's own speech detection ends each turn after 0.7 seconds of silence, and the model calls a `finish_session` tool when the child says bye, which closes the mic. With a fake device, sound started 1.7 to 2.0 seconds after the last word (that includes the 0.7 second silence wait), and "Okay bye bye, I am all done now" ended the chat in both modes. In `chain` mode `gpt-4o-mini` wrote the tool call out as text and read it aloud, so the chat didn't end. Not yet confirmed through the StackChan: only a tap to start and a tap to stop were seen.
- **Hands-free on the StackChan in a busy room (16 Nov): works, but the room got in the way.** Eight turns ran with no tapping between them and the chat ended on "I need to go". Other people talking nearby were transcribed as the child, so the 0.7 second silence that ends a turn often didn't come and the robot kept listening, and "bye" only landed on the third try. Changed after that, and tested on a fake device only: speech threshold raised from 0.5 to 0.75, silence wait cut to 0.5 seconds, the realtime API's far-field noise reduction turned on, a turn forced to end after 10 seconds of speech, and "bye" in the transcript ends the chat even if the model doesn't call `finish_session`.
- **Phantom taps on the head strip (16 Nov).** After a chat ended properly, the StackChan reopened the mic with nobody touching it, several times. The likely cause is the touch strip misfiring when the speaker and mic switch over, not confirmed. The firmware now ignores the strip for 1.5 seconds after each switch, and only a wand tap can start a chat. A head tap still stops one. Not yet retested on the device.
- **The model says goodbye without ending the chat.** In `hybrid` mode it often said "Bye for now!" without calling `finish_session`, so the mic reopened. The server now also ends the chat when the reply itself contains a goodbye.
- **ElevenLabs Harriet voice, server only (16 Nov): faster than the OpenAI voice.** In `hybrid` mode with `eleven_flash_v2_5`, the first audio left the server 0.4 to 0.5 seconds after speech stopped, against about 0.8 to 1.0 with `gpt-4o-mini-tts`. From the last word that is about 1.1 seconds on a fake device. Two turns, not yet heard through the StackChan.
- **Deployed on Cloudflare (16 Nov): works.** `hybrid` mode runs as a Worker with one Durable Object per device on the route `build40for40.com/glissen/api*`, alongside the main site's custom domain. A fake device completed two turns and a "bye" ending against it, with sound about 1.1 seconds after the last word on the second turn, and a wrong device token got a 401. The first connections straight after the deploy failed with a 404 and a 500, then it settled. The StackChan connects to it over TLS (certificate not checked) and reaches "Ready". No conversation has been run through the StackChan on the deployed Worker yet, and the Workers subrequest limit over a long chat is untested.
- **Ending on "bye" dropped (16 Nov).** On the deployed Worker a chat ended as soon as it started. The cause wasn't captured, because the Worker keeps no logs. The likeliest one is the transcript check: speech to text had already been seen inventing words like "Thank you." from room noise, and any transcript containing "bye" ended the chat. The model's `finish_session` tool and both "bye" checks are removed. A chat now ends when the wand is lifted and tapped again, on a head tap, or after 30 seconds of silence. Not yet tested on the device.
- **Listening made shorter (16 Nov).** In the room it still listened for too long. Kids mostly say three to five words, so a turn is now cut off 4 seconds after speech starts (was 10), the silence wait is 0.35 seconds (was 0.5) and the speech threshold is 0.85 (was 0.75). The risk is cutting off a child who pauses or speaks quietly. Not yet tested on the device.
- **The prototype firmware doesn't recover when the server isn't there.** Twice it sat idle after the server restarted or started late, and needed a board reset. Cause not found.

Not yet tested: the wand tap on the prototype, a full hands-free conversation and `realtime` mode through the StackChan itself, false triggers from background noise, how streamed playback sounds over a long reply, NFC read distance, a sticker as a control, full duplex audio, and restoring the factory firmware.

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
