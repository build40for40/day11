# Architecture options (not decided)

Nothing here is decided. This lists a proposed shape, the decisions the team needs to make before building, and what the hardware tests have shown so far. Results are in [stackchan.md](stackchan.md) and [chip.md](chip.md).

## What the hardware tests tell us

- **The nail reads on the StackChan head** with the official NFC example, by UID, under the ports on top of the head. Reads got less reliable in later testing and we don't know why yet.
- **Mic and speaker work with our own code,** but quality is poor: quiet mic from 30cm, and playback that is quiet, muffled, distorted and hissy. Gain, volume and sample rate are untried.
- **The factory agent** is slow (about 5 seconds to reply), runs Qwen or DeepSeek, and can't be pointed at our own model from the app.
- **Restoring the factory firmware** probably works through web M5Burner, but we haven't tried it.

## Proposed shape

The StackChan stays thin: it reads the nail's UID and streams audio over a WebSocket. A server does the rest.

```
Nail tap, StackChan sends UID ──┐
Mic audio ──────────────────────┼── WebSocket ──► Server ──► speech to text, LLM, text to speech
Speaker ◄── reply audio ────────┘                    │
                                                     ├─ UID to kid to household
                                                     ├─ memory and wish list (five toys)
                                                     ├─ safety checks on input and output
                                                     └─ send the finished list to the parent
```

Why this shape:

- The model, memory, safety rules and kid identity live in one place and change without reflashing the device.
- Siblings can't edit each other's lists because identity is decided on the server from the UID.
- It could run on the stack we already use (Cloudflare Workers with a Durable Object per device, D1 for storage). That is an observation, not a choice.

## Decisions to make

1. **Realtime speech model or a chained pipeline.** A realtime model (speech in, speech out) probably cuts latency. A chain of speech to text, LLM and text to speech lets us put safety checks between steps and swap each part. ElatoAI is the precedent for an ESP32 talking to a realtime model.
2. **Device firmware.** Options:
   - Fork XiaoZhi and point it at our server through the OTA URL (unverified, third party). Keeps its audio code, needs C++ for NFC, leans Chinese.
   - Write our own Arduino firmware. Full control, but we build the audio stack.
   - A phone does the voice behind the StackChan, the fallback.
3. **Audio on the wire.** Raw PCM or Opus, and whether the ESP32 can play the model's output format.
4. **Safety.** What a guardrail layer must catch for kids, and how we test it. Also what a recorded child's voice means for privacy (UK rules for children's data, retention, parent consent).
5. **Cost and reliability.** Cost per conversation, and what happens when Wi-Fi drops mid chat.
6. **Latency budget.** The end to end time a kid will tolerate, measured against the 5 second factory baseline.
7. **Audio quality.** Whether software fixes (volume, mic gain, noise filter, sample rate) are enough, or the StackChan's 1W speaker is the limit.
8. **NFC reliability.** Why reads got worse, and whether the nail on a kid's finger works as well as a nail held still.

## Not decided

Stack, services and data model. Check with the team before building.
