# Day 11 – Wish

Day 11 of 40 for 40. Wish lets screen-free kids discover what they'd like without a catalogue or a toy shop. A child taps their RFID wand on a StackChan robot and chats with **Glisten** (a provisional name; she was "Pip the Elf" in the planning chat), a kindly aunt figure voiced by ElevenLabs Harriet. Together they pick up to five open-ended gifts (the child decides when they are done, so fewer is fine; tapping the wand again later continues the same list), and that wishlist goes to the grown-up named at setup (default "your grown-up"), marked "finished early" if it has fewer than five. A setup setting, `holiday_mode`, chooses Christmas, a festive wishlist, or just a wishlist, so Santa is not assumed. The robot's face screen is off, so Glisten reacts only through lights and head movement. The mic is push-to-talk only (the wand tap starts the session; a steady green ring is the recording indicator). No child audio is stored. A privacy assessment (DPIA) must be done before any real-child session.

## Docs
- [Agent prompt & harness](docs/agent-prompt-and-harness.md): the system prompt, tools, event injection, guardrails, example dialogue and parent FAQ.
- [Architecture](docs/architecture.md): the StackChan device, the Cloudflare Worker, voice (language model plus ElevenLabs TTS), storage, parent setup and the wishlist page.
- [Child-speech research](docs/research/child-speech/README.md): CHILDES aggregate lengths for ages 3, 5 and 7 (CC BY-NC-SA 4.0 metadata only), used to set how long a simulated child talks.
- [Next research](docs/research/next-research.md): lunchtime research from 16 Nov 2026 on child speech-to-text, a UK never-suggest toy-safety list, connected-toy privacy lessons, and inclusive wording (`grownup_label`, `holiday_mode`).

These docs are mirrored from the Superthread pages in the 40for40 workspace (page-61, page-62, page-63 and page-64). The choice between OpenAI and Gemini is still open, and Ben will decide.

## Parent setup

The Worker in `worker/` is the one-off setup a grown-up does on their phone. It sits beside the throwaway voice prototype in `prototype/`, and it does not store audio or transcripts. An admin creates a household and gets a single setup link. The page asks for an email, the child's first name and age, what to call the grown-up, and whether the list is Christmas, festive, or just a wishlist. The parent ticks consent, privacy, and the two fixed "Are you real?" / "Is Santa real?" lines. Then they tap that child's wand on Glisten. The robot has ten minutes. Lists stay held until the email is confirmed, unless the household was created with the demo flag.

Ben has not chosen an email provider. Locally the Worker prints the confirmation in the console. Set `EMAIL_PROVIDER=resend` and `EMAIL_API_KEY` only if you want Resend.

```bash
cp worker/.dev.vars.example worker/.dev.vars
# put your own ADMIN_TOKEN, DEVICE_TOKEN and UID_SALT in worker/.dev.vars
npm install
npm run wrangler -- d1 migrations apply wish --local --config worker/wrangler.jsonc
npm run setup:dev
```

In another terminal:

```bash
curl -s -X POST http://127.0.0.1:8787/admin/households \
  -H "authorization: Bearer $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"device_id":"stackchan-01"}'
```

Open the `setup_url` on a phone. The device WebSocket is `GET /ws?device=stackchan-01` with `Authorization: Bearer $DEVICE_TOKEN`. A wand tap is a text frame `{"t":"nfc","uid":"04A1B2C3D4E5F6AA"}`. An unknown or unpaired wand gets `{t:"session", state:"unregistered"}` and the `friendly_unknown` clip, and does not start a chat. A wand that is already paired is recognised, but this slice does not open a chat.

`{"demo":true}` on the admin call confirms the email as soon as the form is saved, so a demo is not held. Do not commit `.dev.vars`.
