# Day 11 – Wish

Day 11 of 40 for 40. Wish lets screen-free kids discover what they'd like without a catalogue or a toy shop. A child taps their RFID wand on a StackChan robot and chats with **Aunty Bella** (a provisional name; she was "Pip the Elf" in the planning chat), a kindly aunt figure voiced by ElevenLabs Harriet. Together they pick up to five open-ended gifts (the child decides when they are done, so fewer is fine; tapping the wand again later continues the same list), and that wishlist goes to the grown-up named at setup (default "your grown-up"), marked "finished early" if it has fewer than five. A setup setting, `holiday_mode`, chooses Christmas, a festive wishlist, or just a wishlist, so Santa is not assumed. The robot's face screen is off, so Aunty Bella reacts only through lights and head movement. The mic is push-to-talk only (the wand tap starts the session; a steady green ring is the recording indicator). No child audio is stored. A privacy assessment (DPIA) must be done before any real-child session.

## Docs
- [Agent prompt & harness](docs/agent-prompt-and-harness.md): the system prompt, tools, event injection, guardrails, example dialogue and parent FAQ.
- [Architecture](docs/architecture.md): the StackChan device, the Cloudflare Worker, voice (language model plus ElevenLabs TTS), storage, parent setup and the wishlist page.
- [Child-speech research](docs/research/child-speech/README.md): CHILDES aggregate lengths for ages 3, 5 and 7 (CC BY-NC-SA 4.0 metadata only), used to set how long a simulated child talks.
- [Next research](docs/research/next-research.md): lunchtime research from 16 Nov 2026 on child speech-to-text, a UK never-suggest toy-safety list, connected-toy privacy lessons, and inclusive wording (`grownup_label`, `holiday_mode`).

These docs are mirrored from the Superthread pages in the 40for40 workspace (page-61, page-62, page-63 and page-64). The choice between OpenAI and Gemini is still open, and Ben will decide.
