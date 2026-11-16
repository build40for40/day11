# Day 11 – Wish

Day 11 of 40 for 40. Wish lets screen-free kids discover what they'd like for Christmas without a catalogue or a toy shop. A child taps their RFID wand on a StackChan robot and chats with **Aunty Bella** (a provisional name; she was "Pip the Elf" in the planning chat), a kindly aunt figure from the North Pole who works with Santa and is voiced by ElevenLabs Harriet. Together they pick up to five open-ended gifts (the child decides when they are done, so fewer is fine; tapping the wand again later continues the same list), and that wishlist goes to Mum, marked "finished early" if it has fewer than five. The robot's face screen is off, so Aunty Bella reacts only through lights and head movement.

## Docs
- [Agent prompt & harness](docs/agent-prompt-and-harness.md): the system prompt, tools, event injection, guardrails, example dialogue and parent FAQ.
- [Architecture](docs/architecture.md): the StackChan device, the Cloudflare Worker, voice (language model plus ElevenLabs TTS), storage, parent setup and the wishlist page.

These docs are mirrored from the Superthread pages in the 40for40 workspace (page-61 and page-62), which are the source of truth. The choice between OpenAI and Gemini is still open, and Ben will decide.
