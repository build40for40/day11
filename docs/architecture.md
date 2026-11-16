> **Status:** proposed design for Day 11 ("Wish"). **The character name "Aunty Bella" is provisional.** Written 16 Nov 2026 and updated the same day for the voice, LCD-off, wand and parent-setup decisions. Nothing here is built or tested. It follows what the team already decided in [Day 11 - Brief & prep](https://app.superthread.com/40for40/page-60-day-11-brief--prep) (MVP, StackChan + Cloudflare Worker + speech/voice models, RFID as auth) and the research in cards [303](https://app.superthread.com/40for40/card-303-research-jakcom-n3-nail-chip) (N3 chip) and [304](https://app.superthread.com/40for40/card-304-research-stackchan-with-the-n3-nail-and-a-voice-agent) (StackChan + voice agent). Prompt, tools and parent FAQ: [Day 11 – Agent Prompt & Harness](https://app.superthread.com/40for40/page-61-day-11--agent-prompt--harness). Repo: https://github.com/build40for40/day11

## 0. Decisions since the first draft (16 Nov 2026)

| # | Decision | Effect |
|---|---|---|
| D1 | **Aunty Bella's voice is ElevenLabs "Harriet- Mature British Actress"**, `voice_id = aAsWcN5jdLdiYG7Hq0YL` (professional library voice, British accent; mature, educated, warm and clear). The character is Aunty Bella. | Voice output goes through ElevenLabs. Two ways to do it: section 3.3. **Recommended: Option B.** |
| D2 | **StackChan's LCD face is OFF.** Aunty Bella expresses herself with LEDs and head movement only. | `set_face` replaced by `set_mood` (LED pattern + head move). No face drawing in firmware. |
| D3 | **OpenAI vs Gemini: undecided. Decision: Ben.** | The `Upstream` (language model) adapter stays. Harriet is the voice either way. |
| D4 | **Parent setup captures Mum's email** and links the kid's wand UID to it. | New setup flow, D1 tables, endpoints and messages. Sections 4, 6.4 and 7. |
| D5 | **Wand, not nail.** | Today's wand is a marker with an RFID chip taped on (page 57). The N3 research (card 303) still applies to the chip. |
| D6 | The recovered prompt wording is OK. | Only the changes forced by D1-D5 and D7 were made to the prompt. |
| D7 | **The character is renamed from "Pip the Elf" to "Aunty Bella" (voiced by Harriet). The name is provisional.** She is a kindly aunt figure from the North Pole who works with Santa, not an elf. | Prompt, dialogue and diagrams renamed. Rules, tools, 5-cap, LEDs, head movement and the parent flow are unchanged. |

## 1. Summary of key decisions

| # | Decision | Why |
|---|---|---|
| 1 | **StackChan K151 is the body**; a **Cloudflare Worker is the brain**. | Card 304. The K151 has a built-in NFC reader (ST25R3916), mic, speaker, servos, 12 LEDs. |
| 2 | **Identify the kid by wand UID, not NDEF.** | Card 304: UID is the most reliable read. Card 303: the N3 is very likely an NTAG213 with a 7-byte UID (unconfirmed). RFID doubles as auth; siblings get separate lists (page 60). |
| 3 | **Voice = ElevenLabs Harriet, via Option B (recommended):** the language model replies with text, the Worker checks each sentence, then ElevenLabs streaming TTS (Flash model) speaks it. Option A (ElevenLabs Conversational AI agent) is the documented alternative and fallback. | Option B lets the output filter check text **before** it is spoken, which closes the "partly enforceable" gap. Trade-off: extra latency and more to build. Section 3.3. |
| 4 | **Language model: OpenAI Realtime or Gemini Live in text-out mode. Decision: Ben.** | Both can take audio in and give text out. Kept behind the `Upstream` adapter. |
| 5 | **Push to talk** on the head touch strip. | Card 304: stops the robot hearing itself and cutting itself off. Also a privacy feature: the mic is only open while held, and a steady green LED ring shows it. |
| 6 | **One Durable Object per chat session** holds the device socket, the upstream sockets, the session state and the 5-item cap. | A plain Worker request can't hold several long-lived sockets and state. A DO can. |
| 7 | **D1 for households, kids, cards, wishlists and a small session log** (card 304: "the kids, toys and wishlists live in this repo's own D1"). KV is not needed. | Relational and tiny. DO storage holds only in-flight session state. |
| 8 | **Hard cap of 5 and all safety checks live in the Worker**, never only in the prompt. | Prompt rules can drift. |
| 9 | **LCD off; LEDs + head movement only.** | Screen-free brief. The touch strip stays as the input. |
| 10 | **Parent setup before first use:** parent enters email and child's first name on a setup page, then taps the wand on the robot to link it. | Gives "send to Mum" a destination and stops unknown wands starting chats. |
| 11 | **Wishlist is a private web page** at an unguessable parent link (not the UID). Send-to-Mum = email that link to the address from setup. | Keeps the kid's UID out of URLs. |
| 12 | **Fallback is a phone hidden behind StackChan** if the mic/speaker/round-trip proofs fail. | Card 304. The Worker is unchanged; only the client changes. |
| 13 | **No audio saved, no transcripts by default.** | Child's voice data. See the FAQ on the Harness page. |

## 2. System overview

Recommended design (Option B). The ElevenLabs agent route (Option A) is in section 3.3.

```text
+-------------------------------+        wss (audio + JSON)         +-------------------------------------------+
|  StackChan K151 (device)      | <--------------------------------> |  Cloudflare Worker  "wish"                |
|                               |                                    |                                           |
|  NFC reader  -> wand / card   |                                    |  fetch handler: routes, auth              |
|                 UID events    |                                    |    /ws        -> Session DO               |
|  Mic (I2S)   -> PCM16 16kHz   |                                    |    /setup/*   -> parent setup page        |
|  Speaker     <- PCM16 24kHz   |                                    |    /w/:token  -> parent wishlist page     |
|  Servos      <- nod / shake / |                                    |    /admin/*   -> create household, cards  |
|                 mood head move|                                    |                                           |
|  12 RGB LEDs <- colour / mood |                                    |  Session Durable Object (1 per chat)      |
|  Touch strip -> push-to-talk  |                                    |    device socket <-> LLM socket + TTS     |
|  microSD     -> offline clips |                                    |    sentence splitter, OUTPUT FILTER       |
|  LCD: OFF (backlight off)     |                                    |    tool handler, cap=5, timers, pairing   |
+-------------------------------+                                    +---+-------------+-------------+-----------+-+
                                                                         |             |             |           |
                                          audio in, TEXT out (wss)       |   text (wss)|        D1   |     email |
                                                                         v             v             v           v
                                                       +---------------------+  +-----------------+ +-------+ +--------------+
                                                       | OpenAI Realtime  or |  | ElevenLabs TTS  | | D1    | | Email        |
                                                       | Gemini Live         |  | Flash model     | | (see  | | provider     |
                                                       | Decision: Ben       |  | voice Harriet   | |  6.4) | | (setup,      |
                                                       | tools + text reply  |  | aAsWcN5jdLdiYG7 | |       | |  verify,     |
                                                       +---------------------+  | Hq0YL -> PCM    | +-------+ |  link)       |
                                                                                +-----------------+           +--------------+

   Mum's phone ---- https /setup/:setupToken (one-off: email, kid name, tap the wand) ----> Worker
   Mum's phone ---- https /w/:parentToken   (wishlist: remove / reset / delete)        ----> Worker
```

Option B voice path in one line: `kid audio -> LLM (text out) -> sentence splitter -> output filter -> ElevenLabs TTS (Harriet) -> PCM 24 kHz -> Worker -> device speaker`.

The same picture as Mermaid, for a renderer that supports it:

```mermaid
flowchart LR
  subgraph Device[StackChan K151 - LCD off]
    NFC[NFC reader: wand and cards] --> FW[Firmware]
    MIC[Mic] --> FW
    FW --> SPK[Speaker]
    FW --> BODY[LEDs and head servos = mood, nod, shake]
    TOUCH[Touch strip PTT] --> FW
  end
  FW <-- wss PCM audio + JSON --> DO[Session Durable Object]
  subgraph CF[Cloudflare Worker]
    DO --> FILT[Sentence splitter + output filter]
    DO --> D1[(D1)]
    SETUP[Parent setup page] --> D1
    SETUP -. pairing window .-> DO
    PAGE[Parent wishlist page /w/token] --> D1
  end
  DO <-- audio in, text out --> LLM[OpenAI Realtime or Gemini Live - Decision: Ben]
  FILT -- approved sentences --> TTS[ElevenLabs TTS Flash - voice Harriet]
  TTS -- PCM audio --> DO
  DO --> MAIL[Email provider]
  MAIL --> MUM[Mum]
  MUM --> SETUP
  MUM --> PAGE
```

## 3. Components

### 3.1 StackChan device firmware

One Arduino (or PlatformIO) sketch on the K151, four jobs (from card 304):

1. **Mic -> WebSocket.** While the touch strip is held, stream 16 kHz mono PCM16 in ~40 ms binary frames.
2. **WebSocket -> speaker.** Play 24 kHz mono PCM16 from a ring buffer (about 500 ms). ElevenLabs can return raw PCM (`pcm_24000`), which avoids the WAV-only playback gotcha in card 304.
3. **NFC.** Poll the reader (M5Unit-NFC / `M5UnitUnified`, NTAG213 supported per card 304). On a new tag, send `{t:"nfc", uid}`. The wand sits on top of the head; expect near-contact reads. Debounce: ignore the same UID for 2 s.
4. **Commands.** Act on `set_mood`, `nod`, `shake`, `set_leds`.

Other behaviour:
- **LCD off.** Turn the display and backlight off at boot and never draw anything (check the exact M5Unified call on the day). The touch strip on the body is still used as the input. No face is drawn.
- **Mood = LEDs + head move** (table in 3.1.1). Everything the robot "feels" is shown this way.
- **Motion:** `Motion.move(x, y)` with units of 10 = 1 degree. Keep tilt between 5 and 85 degrees or the servo can stall (card 304). `nod` = small tilt down/up; `shake` = small pan left/right. Clamp in firmware, never trust the Worker.
- **Status LEDs** (replace the old sleepy face): connecting = slow white pulse; ready = dim warm-gold breathing; listening (strip held) = steady green ring; offline = slow red pulse with the head slightly lowered; pairing mode = slow blue pulse. A steady green ring while the mic is open is also the parent-visible mic indicator.
- **Camera:** never initialised.
- **Offline clips:** a handful of WAVs on the microSD, generated once in the Harriet voice (greeting fallback, "can't reach the North Pole", "ask a grown-up to set me up", apology, goodbye, "all paired").
- **Power/wifi:** USB-C power while live. 2.4 GHz wifi only. Credentials in a `secrets.h` that is not committed.
- **Flashing wipes the factory XiaoZhi agent** and it is unclear how easily it comes back (card 304). Decide before flashing; keep a second unit or a phone fallback.

#### 3.1.1 Mood mapping (starting point, tune on the day)

| mood | LEDs | Head | Used for |
|---|---|---|---|
| `happy` | soft gold glow, steady | one small nod | greeting, warm reply |
| `thinking` | slow pulse, white-blue | small tilt to one side, slow sway | picking the next idea, after a "no" |
| `surprised` | quick white flash then gold | quick small tilt up | surprising answer |
| `excited` | gold sparkle chase | double nod | a yes, the first greeting |
| `listening` | steady soft green ring | head level, tiny tilt toward the child | strip held (set by the robot) |

Risk: head and light cues are less expressive than a face. Test with a child-aged viewer early. See risks.

### 3.2 Cloudflare Worker ("wish")

- **fetch handler:** routing and auth. `GET /ws` (device WebSocket upgrade) is forwarded to a Session DO. `/setup/*` is the one-off parent setup. `/w/*` serves the parent wishlist. `/admin/*` creates households and cards. `GET /healthz`.
- **Session Durable Object** (id = `deviceId`; one active chat per device):
  - accepts the device WebSocket (hibernation API is optional; sessions are short);
  - on a **kid wand tap**: loads the kid from D1 (must be `active`, i.e. paired), opens the LLM socket (and, for Option B, the ElevenLabs TTS socket), sends the system prompt, the tool list and the audio format;
  - **pairing mode:** if the parent setup page has opened a pairing window for this device (10 minutes), the next wand UID is bound to the pending kid instead of starting a chat (section 4);
  - **audio in:** forwards device PCM to the LLM (resampling 16 kHz to 24 kHz for OpenAI by linear interpolation);
  - **turns:** PTT down/up maps to `input_audio_buffer.commit` + `response.create` with server VAD turned off;
  - **text out (Option B):** reads text deltas, splits into sentences, runs each sentence through the output filter, sends approved sentences to ElevenLabs TTS, forwards the returned PCM to the device;
  - **tool calls:** `add_to_wishlist` is executed in the DO (cap, dedupe, filter, D1 write, `SYSTEM:` injection). `set_mood` / `nod` / `shake` / `set_leds` are validated against the enums and forwarded to the device as `cmd` messages. Each tool call returns a small result to the model;
  - **NFC event injection** as `SYSTEM:` messages (see the Harness page, section 3);
  - **timers:** idle nudge 30 s, idle goodbye 60 s, hard stop 8 min;
  - **session state** (in memory + DO storage for reconnects): `kid_id`, `wishlist[]`, `items_added`, `last_suggestion`, preference flags, `last_seen`;
  - on end: writes a `sessions` row, emails the parent link once (first time the list reaches 5, or on end with >= 1 item, only to a verified or demo-approved address), closes all sockets.
- **Parent setup and wishlist pages:** server-rendered HTML, no JS needed except a status poll on the setup page. Section 6.4.
- **Secrets (Worker secrets, never in the repo; `.dev.vars` is already git-ignored):** `OPENAI_API_KEY` or `GEMINI_API_KEY` (Decision: Ben), `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` (Harriet: `aAsWcN5jdLdiYG7Hq0YL`), `ELEVENLABS_AGENT_ID` (Option A only), `DEVICE_TOKEN`, `ADMIN_TOKEN`, `UID_SALT`, `EMAIL_API_KEY`.

### 3.3 Voice output through ElevenLabs: Option A vs Option B

Voice: ElevenLabs "Harriet- Mature British Actress", `voice_id = aAsWcN5jdLdiYG7Hq0YL`. Everything below is the same voice. All API details are from the ElevenLabs docs read on 16 Nov 2026 and must be re-checked while building.

#### Option A: ElevenLabs Conversational AI (Agents) runs the conversation

```text
StackChan <-> Worker/Session DO <-> ElevenLabs agent (wss, signed URL)
                                       agent LLM + turn-taking + TTS in voice Harriet
```

- **Setup:** create an agent in ElevenLabs with `voice_id = aAsWcN5jdLdiYG7Hq0YL`, the Aunty Bella system prompt, and the LLM chosen in the agent settings (this is where OpenAI vs Gemini would be picked, Decision: Ben). Define **client tools** with the same names and schemas as the tool JSON: `add_to_wishlist`, `set_mood`, `nod`, `shake`, `set_leds`.
- **Worker brokers a signed URL:** the Worker calls the ElevenLabs "get signed URL" endpoint with the agent id and API key (`GET /v1/convai/conversation/get-signed-url?agent_id=...`) and opens the returned `signed_url` WebSocket. The API key never reaches the device.
- **Why the Worker stays in the middle:** the Session DO relays the socket between StackChan and the agent, so it can intercept tool calls. The device connects only to the Worker (the contract in section 7.1 is unchanged).
- **Per-session config:** on connect, the DO sends `conversation_initiation_client_data` with `dynamic_variables` (kid first name, item count) and, if enabled in the agent's security settings, a `conversation_config_override` for prompt, first message and `voice_id`.
- **Audio:** device PCM -> DO -> `user_audio_chunk` (base64). Agent audio events (base64) -> DO -> device. Agent output format must be set to PCM so the device can play it.
- **Tool calls:** the agent sends a client-tool request (`client_tool_call` with `tool_name`, `tool_call_id`, `parameters`). The DO handles it: `add_to_wishlist` runs in the Worker (**cap of 5, dedupe, filter, D1 write**) and the DO answers with `client_tool_result` (`tool_call_id`, `result`, `is_error`); the other four are forwarded to StackChan as `cmd` messages. **The cap is still enforced in the Worker**, never in the agent config.
- **SYSTEM events** (card taps, "wishlist now has 3 items") are sent as non-interrupting contextual updates.
- **Variant A2 (not recommended):** let the device connect straight to ElevenLabs with the signed URL. Then `add_to_wishlist` would have to be a webhook (server) tool calling our Worker so the cap still lives in the Worker, and the Worker no longer sees the conversation. Loses interception and logging.
- **Push to talk:** the agent runs its own voice-activity detection. We only stream audio while the strip is held, and a gap ends the turn. There is no explicit "commit" like OpenAI's; test that end-of-turn feels right.
- **Agent prompt lives in ElevenLabs** (or is overridden at session start), so it can drift from `prompts/aunty-bella.system.md` in the repo.

#### Option B: language model in text-out mode feeding ElevenLabs streaming TTS (Flash model)

```text
kid audio -> OpenAI Realtime / Gemini Live (audio in, TEXT out) -> Session DO
          -> sentence splitter -> OUTPUT FILTER -> ElevenLabs TTS WebSocket (Flash, voice Harriet)
          -> PCM 24 kHz -> Session DO -> StackChan speaker
```

- **LLM:** OpenAI Realtime with the response modality set to text, or Gemini Live with a TEXT response modality (**check the chosen Gemini Live model supports text output; some native-audio models only answer in audio, which would rule out B for that model**). Audio goes in, text and tool calls come out. Decision: Ben.
- **Sentence splitter:** accumulate text deltas, cut at sentence ends (`. ! ?`) or after ~25 words, so each unit is short enough to check and speak quickly.
- **Output filter on text, before speech:** each sentence is checked **before** it is sent to ElevenLabs. If it fails: nothing is spoken, the DO cancels the response (`response.cancel`), plays a canned in-voice line ("Oops, let's try something else") and re-prompts. This is the fix for the earlier "spoken output filter: partly enforceable" gap (section 3.4).
- **ElevenLabs TTS WebSocket:** `wss://api.elevenlabs.io/v1/text-to-speech/aAsWcN5jdLdiYG7Hq0YL/stream-input?model_id=eleven_flash_v2_5&output_format=pcm_24000`, authenticated with the `xi-api-key` header from the Worker. First message sets `voice_settings` (start: stability 0.5, similarity_boost 0.8, speed slightly under 1 for young children); then approved sentences are sent as text, with a flush at the end of each turn. The docs recommend `auto_mode` when sending whole sentences, which lowers latency. Audio chunks come back base64-encoded and go straight to the device. Per the docs, 44.1 kHz PCM needs a Pro plan, so use 24 kHz. Check the exact message fields (flush, end-of-input) in the current docs.
- **Interruption:** PTT down while Aunty Bella is speaking -> `audio_cancel` to the device, close or flush the TTS socket, `response.cancel` to the LLM.
- **Tool calls:** unchanged from the earlier design (function calls from the LLM, handled in the DO).
- **Prompt stays in the repo** and is the only copy.
- **Audio privacy:** the kid's voice goes only to the LLM provider. ElevenLabs sees only text.
- **Model names:** `eleven_flash_v2_5` is the Flash model id at the time of writing; verify. ElevenLabs quotes roughly 75 ms for Flash inference; that excludes network and our hops. Unmeasured by us.

#### Recommendation: Option B

| | Option A (ElevenLabs agent) | Option B (LLM text-out + ElevenLabs TTS) |
|---|---|---|
| Speech output check | After the fact (text arrives with or after audio; the platform has its own guardrails feature, scope unverified) | **Before speech.** Every sentence is checked first. Fully enforceable for what is spoken |
| Latency | Fewer hops, platform-tuned turn-taking and streaming. Likely the faster of the two | One extra hop and a sentence buffer: first audio waits for the first full sentence + filter + TTS first byte. Likely roughly 0.3-1 s slower than A (unmeasured) |
| Build effort today | Less: configure an agent, relay a socket, map tool calls | More: splitter, TTS socket, flush and cancel handling. Contained in one adapter |
| Vendors that hear the child | ElevenLabs (audio) + the agent's LLM | LLM provider only (audio). ElevenLabs gets text only |
| Prompt and config | Lives partly in the ElevenLabs dashboard | One copy, in the repo |
| OpenAI vs Gemini | Chosen in the agent's LLM setting | Chosen in the `Upstream` adapter. Gemini needs a text-capable Live model |
| Cap of 5 | In the Worker via client-tool interception | In the Worker (same) |
| Turn-taking / PTT | Platform VAD; PTT is approximate | Our own PTT commit, exact |
| Barge-in | Built in | We implement it |
| Fallback value | Good plan B if B's latency is too high | - |

**Recommended: Option B**, because the safety checks are what parents care about most, and B is the only option where "never spoken unless approved" is true. Prompt and tools stay in the repo, and B keeps the kid's voice away from a third vendor. The cost is latency and build time, so there is a **gate**: at the first end-to-end test (target 14:15 UK), measure time from the end of the child's turn to the first sound. If it is still over about 2.5 s after tuning (sentence splitting, `auto_mode`, shorter sentences, a short filler line such as "Hmm, let me think!" in Harriet's voice), switch to Option A. The tool schemas, device contract and Worker state are the same either way, so the switch is one adapter.

### 3.4 Safety layer in the Worker

| Control | Enforceable? | How |
|---|---|---|
| Hard cap of 5 items | Yes | `add_to_wishlist` returns an error result when `count >= 5`; the DO ignores any further add. The cap is a constant in the Worker, not in the prompt (both options). |
| Item and reason filter | Yes | Before saving, check length (<= 80 / 160 chars), strip anything that looks like a URL, price (pound or dollar signs, "pounds"), phone number or email, and run a small denylist (violence, adult, brand list). Reject with a tool error so Aunty Bella tries again. |
| "Only after a clear yes" | Partly | Prompt rule, plus a guard: no add unless a child turn (PTT) or a YES card arrived since the previous add. Cannot truly verify intent. |
| Dedupe | Yes | Same normalised item twice is ignored. |
| **Spoken output filter** | **Yes in Option B (changed from "partly"); partly in Option A** | Option B: every sentence is checked before it reaches ElevenLabs, so nothing unchecked is spoken. The check is still only as good as its rules: start with a denylist (violence, adult, brands, prices, personal-data patterns) and optionally a moderation call per sentence (adds latency). Test with adversarial prompts. Option A: only react-after-start (cancel on a transcript hit; a few hundred ms may already have played). |
| Worrying content | Partly | Prompt rule. The DO keyword-flags ("hurt", "scared", "alone", etc.) into the session log with a `flags` column so a grown-up can check. Not a safeguarding system. |
| Personal data | Partly | Prompt says first name only. Transcripts are not stored by default, so nothing to leak at rest. |
| Unknown wand | Yes | A UID that is not paired to a kid never starts a chat. |

### 3.5 Storage

See the schema in section 6.4. Durable Object storage holds only in-flight state (session state and the pairing window), with a 10-minute reconnect window, cleared at session end. KV is not used.

## 4. Sequences

### 4.1 One-off parent setup (new): email, kid name, link the wand

```text
Mum (phone)         Worker (setup page + D1)          Session DO (device)        StackChan        Email
 |                           |                              |                        |              |
 | open setup link --------> |  (link made by /admin/households, one-time token)      |              |
 | <------ form: email, kid first name(s), "device" ------   |                        |              |
 | submit email + "Lily" --> | create household (email, not yet verified)      |              |
 |                           | create kid(status=pending, no uid yet)                 |              |
 |                           | open pairing window: device, kid, expires in 10 min --> |              |
 |                           | send "confirm your email" link ---------------------------------> | Mum
 | <- page: "Tap Lily's wand on Aunty Bella now" (polls /status) |                        |              |
 |                           |                              | LEDs: slow blue pulse ->  (pairing mode)
 | tap wand on robot ----------------------------------------------------------> {nfc, uid} ----> |
 |                           |      <--------------- {nfc, uid} ------------------|              |
 |                           | uid not already paired? bind uid_hash to pending kid, status=active
 |                           |                              | <- {t:"paired", name} ---------> LEDs gold, nod, "all paired" clip
 | <- page: "Lily's wand is linked"                         |                        |              |
 | click confirm link in email -> /verify/:token  -> households.email_verified_at set  |              |
 | (repeat the wand tap step for each child)                |                        |              |
```

Rules:
- A pairing window is tied to one device and one pending kid, lasts 10 minutes, and is single-use.
- A UID that is already paired to another kid is rejected ("this wand is already linked") unless a parent deletes that kid first.
- Email verification can be skipped for the demo by an admin flag; real use should verify before sending list links.
- The wand UID is never shown to anyone. Only its salted hash is stored.

### 4.2 Chat: tap, greet, discover, add, recap, send to Mum (Option B shown)

```text
Kid     StackChan           Worker / Session DO              D1        LLM (text out)   ElevenLabs TTS      Mum
 |          |                       |                        |             |                  |               |
 | tap wand>|                       |                        |             |                  |               |
 |          | {nfc, uid} ---------> |                        |             |                  |               |
 |          |                       | kid by uid_hash, active? -------->   |                  |               |
 |          |                       | <---------------------- kid {name}   |                  |               |
 |          |                       | open LLM + TTS sockets, send prompt, tools, wand-tap SYSTEM line ---------->  |
 |          | <-- {session, kid} -- |                        |             |                  |               |
 |          | <-- cmd set_mood=excited, set_leds=gold, nod <----------- tool calls            |               |
 |          |                       | <---------- text "Oh! Hello! I'm Aunty Bella..." ------|               |
 |          |                       | sentence 1 -> OUTPUT FILTER (pass) -> text --------------------------->  |
 |          | <-- PCM audio (Harriet) <------------------------------------------ audio -------|               |
 | hold the |                       |                        |             |                  |               |
 | strip:   | {ptt:down}+PCM -----> | append audio ------------------------> |                  |               |
 | "I like  |                       |                        |             |                  |               |
 |  blocks" | {ptt:up} -----------> | commit + response.create ---------->  |                  |               |
 |          | <-- cmd set_mood=thinking (while waiting)       |             |                  |               |
 |          |                       | <---- text "Blocks are brilliant. Would you like wooden blocks?"              |
 |          |                       | each sentence: FILTER -> TTS ----------------------------------------> |
 |          | <-- PCM audio (Harriet) <-------------------------------------------- audio -----|               |
 | hold:    |                       |                        |             |                  |               |
 | "yes!"   | PCM, ptt:up --------> | ---------------------------------> |                  |               |
 |          |                       | <------- tool: add_to_wishlist(item, reason)          |               |
 |          |                       | cap, dedupe, filter, insert ---->   |             |                  |               |
 |          |                       | tool result ok(count=1) ---------->  |             |                  |               |
 |          |                       | SYSTEM: Wishlist now has 1 item. Aim for 5. ------>  |                  |               |
 |          | <-- cmd set_mood=excited, set_leds=gold, nod <--- tool calls |                  |               |
 |          | <-- PCM "That's one!..." (Harriet) <----------- filtered text -> TTS               |               |
 |   ... discovery loop repeats; card taps arrive as {nfc, uid} -> SYSTEM: tapped YES card ...                  |
 |          |                       | 5th add: SYSTEM: 5 items. Do the happy recap. ----> |                  |               |
 |          | <-- cmd set_leds=rainbow, set_mood=happy, PCM recap (Harriet)    |                  |               |
 |          | <-- {end, reason: complete} (after recap audio finishes)        |                  |               |
 |          |                       | write sessions row, close sockets                      |               |
 |          |                       | email parent link (to the email from setup) --------------------------> |
 |          |                       |                        |             |                  |  opens /w/:token
```

If Option A is used instead, the LLM and TTS columns collapse into one "ElevenLabs agent" column. Tool calls arrive as client-tool requests that the DO answers. Spoken audio comes back from the agent with no filter step in between.

Variants:
- **Unknown or unpaired wand UID:** Worker replies `{session, kid:null, unregistered:true}`; the device plays the offline "ask a grown-up to set me up" clip. The Worker never creates kids from taps.
- **Second tap of the same wand mid-chat:** ignored (debounce).
- **A different kid's wand mid-chat:** current session ends as `superseded` (items kept) and a new one starts.
- **Tap with no PTT for 30 s:** Aunty Bella nudges once ("Are you still there?"), then says goodbye at 60 s.
- **List already at 5 for this kid:** Aunty Bella is told so up front ("The list is full. Celebrate it and offer to start again only if the parent resets it").

## 5. Upstream adapters (Decision: Ben, provider)

Two small interfaces so the provider choice and the voice option are each one file.

```ts
// Language model. Decision: Ben (OpenAI Realtime or Gemini Live). Used by Option B.
interface Upstream {
  connect(cfg: { instructions: string; tools: ToolDef[]; textOnly: true }): Promise<void>;
  sendAudio(pcm16_16k: ArrayBuffer): void;          // adapter resamples if needed
  commitTurn(): void;                               // PTT up
  injectSystem(text: string): void;                 // SYSTEM: ... lines
  cancelResponse(): void;
  sendToolResult(callId: string, result: unknown): void;
  on(event: 'textDelta' | 'toolCall' | 'turnDone' | 'error' | 'closed', cb: (e: any) => void): void;
  close(): void;
}

// Voice. ElevenLabs Harriet (aAsWcN5jdLdiYG7Hq0YL). Used by Option B.
interface Voice {
  open(cfg: { voiceId: string; model: 'eleven_flash_v2_5'; format: 'pcm_24000' }): Promise<void>;
  speak(approvedSentence: string): void;            // only text that passed the output filter
  endTurn(): void;                                  // flush
  cancel(): void;                                   // barge-in or filter hit
  on(event: 'audio' | 'error' | 'closed', cb: (e: any) => void): void;
  close(): void;
}

// Option A: one object plays both roles. The ElevenLabs agent is the LLM, TTS and turn-taking.
interface AgentUpstream {
  connect(cfg: { agentId: string; dynamicVariables: Record<string, string> }): Promise<void>; // signed URL
  sendAudio(pcm16_16k: ArrayBuffer): void;
  injectContext(text: string): void;                // contextual update
  sendToolResult(callId: string, result: unknown, isError?: boolean): void;
  cancel(): void;
  on(event: 'audio' | 'agentText' | 'toolCall' | 'interrupted' | 'error' | 'closed', cb: (e: any) => void): void;
  close(): void;
}
```

- **Implementations:** `upstream/openai.ts` and `upstream/gemini.ts` (**Decision: Ben**; if undecided when the adapter work starts, write OpenAI first, the adapter makes switching cheap), `voice/elevenlabs-tts.ts` (Option B), `voice/elevenlabs-agent.ts` (Option A).
- **Selection:** `VOICE_MODE=tts|agent` and `LLM_PROVIDER=openai|gemini` in Worker config.
- **Same for all:** the five tools, the prompt text, the SYSTEM lines and the device contract.

## 6. Message contracts

### 6.1 Device <-> Worker WebSocket

URL: `wss://<worker-host>/ws?device=<deviceId>` with header `Authorization: Bearer <DEVICE_TOKEN>`. Text frames are JSON; binary frames are raw audio.

**Binary frames**
- Device -> Worker: PCM16 LE, mono, **16 kHz**, 1280 bytes (40 ms) per frame, only while PTT is held.
- Worker -> Device: PCM16 LE, mono, **24 kHz**, up to 4800 bytes (100 ms) per frame. In Option B this is ElevenLabs `pcm_24000` passed through; in Option A it is the agent's PCM output.
- Rationale: Gemini Live takes 16 kHz in; OpenAI Realtime pcm16 is 24 kHz in, so the Worker upsamples. Confirm against current provider docs.

**Device -> Worker (JSON)**

```json
{ "t": "hello", "device": "stackchan-01", "fw": "0.1.0", "battery": 87, "rssi": -52 }
{ "t": "nfc",   "uid": "04A1B2C3D4E5F6" }
{ "t": "ptt",   "state": "down" }
{ "t": "ptt",   "state": "up" }
{ "t": "playback_done" }
{ "t": "ping" }
{ "t": "error", "code": "nfc_read_failed", "detail": "..." }
```

`nfc.uid` is upper-case hex without separators. The Worker hashes it with `UID_SALT` and never logs the raw value. The Worker decides whether a UID is a paired wand, a card, a wand to pair, or unknown.

**Worker -> Device (JSON)**

```json
{ "t": "session", "id": "s_01H...", "state": "started", "kid_name": "Lily", "count": 0, "max": 5 }
{ "t": "cmd", "name": "set_mood", "args": { "mood": "excited" } }
{ "t": "cmd", "name": "set_leds", "args": { "color": "gold" } }
{ "t": "cmd", "name": "nod" }
{ "t": "cmd", "name": "shake" }
{ "t": "wishlist", "count": 3, "max": 5 }
{ "t": "audio_cancel" }
{ "t": "play_local", "clip": "offline_greeting" }
{ "t": "pairing", "state": "waiting", "kid_name": "Lily", "expires_in": 600 }
{ "t": "pairing", "state": "expired" }
{ "t": "paired", "kid_name": "Lily" }
{ "t": "pair_error", "reason": "uid_already_paired" }
{ "t": "end", "reason": "complete" }
{ "t": "error", "code": "upstream_unavailable" }
{ "t": "pong" }
```

- `cmd` names and args match the tool JSON exactly (Harness page, section 2). `set_face` no longer exists. Firmware must ignore unknown names and clamp servo ranges.
- `pairing waiting` puts the robot in pairing mode (slow blue pulse); `paired` plays the gold flash, a nod and the "all paired" clip.
- `audio_cancel` = flush the playback ring buffer now (filter hit or the kid pressed PTT mid-reply).
- `play_local` clips (pre-rendered in the Harriet voice): `offline_greeting`, `ask_grownup_setup`, `try_again`, `sorry`, `goodbye`, `paired`.
- Reconnect: the device reconnects with the same `device` id; the DO resumes if the session is under 10 minutes old and sends `{t:"session", state:"resumed"}`.

### 6.2 Worker <-> language model (OpenAI Realtime shape; Gemini Live maps the same, Decision: Ben)

Event names differ between OpenAI's beta and GA Realtime APIs; check the current docs before coding. In outline:

- Connect: `wss://api.openai.com/v1/realtime?model=<realtime model>` with `Authorization: Bearer <OPENAI_API_KEY>` (set from the Worker; the device never sees the key).
- `session.update`: `instructions` (system prompt), `tools` (the 5 functions), input audio format `pcm16`, **output modality text only** (Option B), turn detection off (PTT).
- Audio in: `input_audio_buffer.append` (base64), then `input_audio_buffer.commit` and `response.create` on PTT up.
- System injections: `conversation.item.create` (a text item starting with `SYSTEM:`), then `response.create`.
- Text out: text delta events -> sentence splitter -> filter -> TTS.
- Tool call: function-call-arguments-done event -> DO runs it -> `conversation.item.create` (function_call_output) -> `response.create`.

### 6.3 Worker <-> ElevenLabs

**Option B, streaming TTS WebSocket** (all fields to be re-checked against current docs):

```text
connect: wss://api.elevenlabs.io/v1/text-to-speech/aAsWcN5jdLdiYG7Hq0YL/stream-input
         ?model_id=eleven_flash_v2_5&output_format=pcm_24000&auto_mode=true
         header: xi-api-key: <ELEVENLABS_API_KEY>
send 1:  { "text": " ", "voice_settings": { "stability": 0.5, "similarity_boost": 0.8, "speed": 0.95 } }
send n:  { "text": "Oh! Hello! I'm Aunty Bella. " }        // one approved sentence at a time, trailing space
end turn:{ "text": "" }    (or a flush message; see docs)
receive: { "audio": "<base64 PCM16 24kHz>", "isFinal": false } ... { "isFinal": true }
```

Default connection inactivity timeout is 20 s (max 180). Either keep one socket per chat with a larger timeout, or open one per turn. Decide by measuring connection set-up time.

**Option A, agent WebSocket:**

```text
Worker: GET https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=<ELEVENLABS_AGENT_ID>
        header: xi-api-key  ->  { "signed_url": "wss://api.elevenlabs.io/v1/convai/conversation?agent_id=...&token=..." }
Worker opens signed_url, then sends:
  { "type": "conversation_initiation_client_data",
    "dynamic_variables": { "kid_name": "Lily", "items_so_far": "0" },
    "conversation_config_override": { "tts": { "voice_id": "aAsWcN5jdLdiYG7Hq0YL" } } }   // only if overrides are enabled
  { "user_audio_chunk": "<base64 PCM16 16kHz>" }                                              // while PTT is held
Receives (relevant): audio events, agent_response (text), interruption,
  client_tool_call { tool_name, tool_call_id, parameters }
Worker answers: { "type": "client_tool_result", "tool_call_id": "...", "result": "ok, count=1", "is_error": false }
```

Client tools in the agent config are named exactly `add_to_wishlist`, `set_mood`, `nod`, `shake`, `set_leds` (same schemas as the Harness page). Worker-side cap: an `add_to_wishlist` request at count 5 returns `is_error: true`.

### 6.4 HTTP API and D1 schema

| Method + path | Auth | Purpose |
|---|---|---|
| `GET /ws` | `DEVICE_TOKEN` | Device WebSocket upgrade |
| `GET /healthz` | none | Liveness |
| `POST /admin/households` | `ADMIN_TOKEN` | Create a household shell, returns a one-time `setup_url` for the parent |
| `GET /setup/:setupToken` | setup token in URL | **Parent setup page:** email, kid first name(s), device |
| `POST /setup/:setupToken` | setup token | Saves email + kid names (kids `pending`), opens the pairing window for the device, sends the confirm email |
| `GET /setup/:setupToken/status` | setup token | Page poll: `waiting` / `paired` / `expired`, per kid |
| `POST /setup/:setupToken/kids` | setup token | Add another child (starts another pairing) |
| `GET /verify/:verifyToken` | verify token | Marks the parent email verified |
| `GET /w/:token` | parent token in URL | Parent wishlist page (HTML) |
| `GET /w/:token.json` | parent token | JSON of the same |
| `POST /w/:token/items/:itemId/remove` | parent token | Remove one item |
| `POST /w/:token/kids/:kidId/reset` | parent token | Clear one kid's list |
| `POST /w/:token/kids/:kidId/delete` | parent token | Delete a kid, their items and sessions |
| `POST /w/:token/email` | parent token | Change the parent email (re-verify) |
| `POST /w/:token/delete` | parent token | Delete the household (and the email) |
| `POST /admin/cards` | `ADMIN_TOKEN` | `{ uid, kind, label? }` registers a toy / YES / NO / category card |

Setup and parent tokens are 32+ random bytes, base64url, never derivable from a UID. Setup tokens expire (for example 24 h, single use for the household creation step). All pages send `Cache-Control: no-store` and `X-Robots-Tag: noindex`; POST forms are same-origin with a CSRF token.

**D1 schema (changed for D4: email, pairing, wand linked to email):**

```sql
create table households (
  id                 text primary key,         -- uuid
  setup_token_hash   text unique,              -- sha256 of the setup token; null once used or expired
  setup_expires_at   text,
  parent_token       text not null unique,     -- long random, used in /w/:token
  parent_email       text,                     -- from parent setup; null until the parent submits it
  email_verified_at  text,                     -- set by /verify/:token
  verify_token_hash  text,
  created_at         text not null
);

create table kids (
  id            text primary key,              -- uuid
  household_id  text not null references households(id) on delete cascade,
  first_name    text,                          -- first name or nickname only
  status        text not null default 'pending', -- 'pending' (no wand yet) | 'active'
  uid_hash      text unique,                   -- sha256(UID_SALT || uid); null until the wand is paired
  paired_at     text,
  created_at    text not null
);

create table pairings (                         -- short-lived pairing windows
  id          text primary key,
  device_id   text not null,
  kid_id      text not null references kids(id) on delete cascade,
  expires_at  text not null,
  used_at     text
);

create table wishlist_items (
  id          text primary key,
  kid_id      text not null references kids(id) on delete cascade,
  item        text not null,
  reason      text,
  source      text not null,                   -- 'voice' | 'card'
  created_at  text not null,
  removed_at  text                              -- soft delete by parent
);

create table cards (                             -- toy / YES / NO / category cards
  uid_hash  text primary key,
  kind      text not null,                      -- 'yes' | 'no' | 'toy' | 'category'
  label     text                                 -- e.g. 'wooden train set'
);

create table sessions (                          -- no audio, no transcript
  id          text primary key,
  kid_id      text not null references kids(id) on delete cascade,
  started_at  text not null,
  ended_at    text,
  end_reason  text,                              -- complete | idle | timeout | error | superseded
  items_added integer not null default 0,
  flags       text,                              -- comma-separated safety flags
  emailed_at  text                               -- when the parent link was sent
);
```

Chain: wand UID (hashed) -> `kids` -> `households.parent_email`. A kid without `uid_hash` or `status = 'active'` cannot start a chat. Deleting a household cascades to kids, items, sessions and pairings.

Wishlist JSON shape:

```json
{ "household": "h_...", "kids": [ { "id": "k_...", "first_name": "Lily", "items": [ { "id": "i_...", "item": "wooden building blocks", "reason": "Loves building castles", "created_at": "2026-11-16T14:05:00Z" } ], "max": 5 } ] }
```

### 6.5 Parent wishlist page

- `GET /w/:parentToken` lists each kid with items and reasons, newest last, with remove / reset / delete buttons.
- Stretch (page 60): write an NDEF URL (`https://.../w/<token>` as the first record) to a separate parent tag so a phone tap opens the list. Card 303 caveats: iPhones read NDEF in the background but give no UID to Safari; never lock a tag; writing replaces the Jakcom profile URL.
- Once the product has a name, web-facing paths are served at `build40for40.com/<app>/` (repo `AGENTS.md`). Until then use the `workers.dev` URL.

## 7. Suggested repo layout for build40for40/day11

The repo today has only `.gitignore`, `AGENTS.md` and `CLAUDE.md`. The `.gitignore` already covers `node_modules/`, `dist/`, `.dev.vars*` and `.wrangler/`, which fits a Wrangler project. Proposal (nothing created yet; you merge it yourselves):

```text
day11/
  AGENTS.md  CLAUDE.md  .gitignore          (exist)
  README.md                                 what Wish is, how to run each part
  docs/
    architecture.md                         this page, as markdown
    agent-prompt-and-harness.md             prompt + tools + FAQ
  prompts/
    aunty-bella.system.md                           the system prompt, verbatim
    tools.json                              the 5 tool definitions (set_mood, not set_face)
    examples.md                             example dialogue (used as test cases)
  worker/
    wrangler.jsonc                          DO binding, D1 binding
    package.json  tsconfig.json
    src/
      index.ts                              fetch handler and routing
      session.ts                            Session Durable Object
      upstream/
        types.ts                            Upstream / Voice / AgentUpstream interfaces
        openai.ts                           OpenAI Realtime adapter   (Decision: Ben)
        gemini.ts                           Gemini Live adapter       (Decision: Ben)
      voice/
        elevenlabs-tts.ts                   Option B: streaming TTS, voice Harriet
        elevenlabs-agent.ts                 Option A: agent, signed URL
      sentence.ts                           sentence splitter
      filter.ts                             item filter + spoken-text filter
      tools.ts                              tool handlers, cap, dedupe
      audio.ts                              resample 16k->24k, framing
      db.ts                                 D1 queries
      setup.ts                              parent setup page, pairing window, verify
      parent.ts                             wishlist page + actions
      email.ts                              confirm email + send the link
      protocol.ts                           device message types (shared)
    migrations/0001_init.sql
    test/                                   tools.test.ts, filter.test.ts, pairing.test.ts
  firmware/
    stackchan/
      platformio.ini  (or .ino)
      src/main.cpp  nfc.cpp  audio.cpp  ws.cpp  mood.cpp  motion.cpp
      include/secrets.example.h             real secrets.h is git-ignored
      data/clips/*.wav                      offline clips in the Harriet voice, for the microSD
  scripts/
    seed.ts                                 create households and cards via /admin
    fake-device.ts                          WebSocket stand-in for the robot
    render-clips.ts                         render the offline clips with ElevenLabs
    uid-hash.ts
  .env.example  .dev.vars.example
```

Add `firmware/**/secrets.h` to `.gitignore`. A **fake device script** is worth building first: it lets the Worker be tested end to end with no hardware.

## 8. Bill of materials and accounts

From card 304 ("On the table"), card 303 and page 57. No prices are given: not verified.

| Item | Qty | Notes |
|---|---|---|
| M5Stack StackChan K151 (2026) | 1, ideally 2 | Built-in NFC. LCD stays off. A second unit protects against bricking while flashing. |
| **Wand** | 2-3 | **Today's wand is a marker with an RFID chip taped on top** (page 57; no 3D-printed wand yet, the printer arrives in about 30 days). Chip: Jakcom N3 (probably NTAG213, confirm with NFC Tools / TagInfo, card 303) or an NTAG213 sticker. Never lock it. Seal the chip under tape so a small child cannot pick it off. One wand per child. |
| NTAG213 stickers | 20+ | For toy picture cards, YES and NO cards, category cards and spare wand chips. |
| Printed cards | 10-20 | Toy pictures, YES, NO, outdoors, building, pretend play. Optional for the MVP. |
| USB-C data cable and 5 V supply | 2 | Keep powered while live (small battery). |
| 2.4 GHz wifi hotspot | 1 | StackChan is 2.4 GHz only. |
| microSD card | 1 | Offline clips in the Harriet voice. |
| Laptop | 1 | Arduino/PlatformIO, board manager 3.2.2+, M5StackChan, M5Unified, M5UnitUnified, M5Unit-NFC libraries (card 304), installed before the day. |
| Phone with NFC Tools | 1 | Read UIDs, identify the chip. Doubles as the parent setup device and the fallback voice device. |
| *Removed from the earlier list:* nail glue | - | Not needed with a wand. |

**Accounts and keys**

| Account | What for | Notes |
|---|---|---|
| Cloudflare | Workers, Durable Objects, D1 | |
| **ElevenLabs** | The voice. TTS (Option B) or an agent (Option A) | Needs an API key and credits. **Check:** the Harriet library voice (`aAsWcN5jdLdiYG7Hq0YL`) works through the API on our plan (library voices typically need a paid plan and to be added to the account), its licence allows our use, and which output formats our plan allows (24 kHz PCM is fine; 44.1 kHz PCM needs Pro). Set a usage limit. |
| **OpenAI or Gemini** | Understanding the child, deciding what Aunty Bella says | **Decision: Ben.** One key. Set a spend limit. For Option B check the chosen model gives text output. |
| Email provider (for example Resend) | Setup confirmation, verify link, wishlist link | Needed now that setup captures Mum's email. Needs a sending domain or a verified sender. |
| Superthread, GitHub | Docs and repo | Exist. |

## 9. Build-day timeline

Page 60: Samira and Ben deliver the build (page 57); one person on hardware and setup, one on product design/3D (Lawrence, marketing render), one on the prompt, QA and refining. Card 304 says prove three things in the first hour and fall back to the phone if the second or third fails by lunchtime. It was already about 12:30 UK when this was written, so the timeline below is a compressed plan for **12:45 to 17:00 UK**, to be shifted to the real start.

| Time (UK, suggested) | Hardware / firmware | Worker / voice / prompt | Gate |
|---|---|---|---|
| 12:45-13:30 | **Proofs:** (1) wand chip reads on K151 head by UID; (2) mic record + raw PCM speaker playback; (3) round trip to an echo server. LCD off. Pin library versions and build once (card 304). | `wrangler init`, D1 + DO bindings, `/healthz`, device WS echo, `fake-device.ts`. **Voice proof on the laptop:** one test sentence through ElevenLabs with Harriet (`aAsWcN5jdLdiYG7Hq0YL`, Flash, `pcm_24000`), listen, check API access. **Ben decides OpenAI vs Gemini.** | **Go / no-go:** if (2) or (3) fails, switch to the phone fallback. If the voice test fails (plan, access), fix or fall back to the other provider's own voice. |
| 13:30-14:15 | Firmware: WS client, PTT streaming, playback ring buffer, UID events, status LEDs. | `Upstream` adapter (Ben's pick; OpenAI first if undecided), text-out. Sentence splitter, ElevenLabs TTS socket, first filter pass. | **First spoken reply through the robot in Harriet's voice.** Measure end-of-turn to first sound. |
| 14:15-15:15 | Mood: LED patterns + head moves, `cmd` handler. Barge-in (`audio_cancel`). | Tools: `add_to_wishlist` (cap, dedupe, filter, D1 write), `SYSTEM:` injections. **Option B vs A latency gate:** over about 2.5 s after tuning -> switch to Option A. | Say "yes" to a suggestion -> item in D1 and robot nods. Latency decision made. |
| 15:15-16:00 | Pairing mode LEDs, card taps (YES/NO/toy), offline clips on SD, reconnect. | **Parent setup page** (email, kid name, pairing window, confirm email), wishlist page, remove/reset/delete, email the link, timers. | Pair a wand from the setup page, run a full 5-item chat, then Mum's page opens. |
| 16:00-16:45 | Soak test, USB power, hotspot wifi. | **Prompt QA** with the example dialogue, off-topic and "scary" probes, filter tests, listen to the whole dialogue in Harriet's voice; tune voice settings and wording. | Safety checks pass; decide ship / demo-only. |
| 16:45-17:00 | Tidy; write `README`; flash a known-good build. | Tag the commit; remove debug transcript mode. | Demo ready. Launch page / video comes after (page 60). |

Stretch if time: phone tap to open the wishlist (NDEF URL), WhatsApp, a curated gift list instead of free generation, a safety classifier (page 60 notes a local SLM may perform badly without fine-tuning), Gemini adapter if OpenAI is built first.

## 10. Open questions and risks

### Open questions for the team

1. **OpenAI or Gemini? Decision: Ben.** Harriet is the voice either way. For Option B the chosen model must give text output (a Gemini Live native-audio model may not). Retention terms need checking.
2. **Option B or A for the voice?** Recommended: B, with the 14:15 latency gate. Confirm.
3. **Is the Harriet library voice usable through our ElevenLabs plan, for this use?** Plan tier, adding it to the account, licence, and retention terms (ElevenLabs' API docs say history is kept by default and zero retention is Enterprise only).
4. **Does a mature British voice suit Aunty Bella for 3 to 7 year olds?** Harriet is described as mature, educated, warm and clear, and Aunty Bella is a warm, playful aunt figure from the North Pole who works with Santa, so the fit may be good, but it is untested. Listen-test the example dialogue with a child of that age (or a parent) early on the day. Voice settings (stability, speed) can add playfulness; if it does not fit, swap the `voice_id` (one config value).
5. **How does Mum get the setup link, and how does pairing mode start?** Proposed: admin creates a household and sends the one-time setup link; the setup page opens a 10-minute pairing window on the device. Alternative: a long-press on the robot's strip to enter pairing mode.
6. **Email provider and verification.** Which provider and sender address; skip verification for the demo?
7. **Name?** Holding name "Wish". Page 60 floats Wishbox, Elf, "11". Affects the URL path (`build40for40.com/<app>/`). The character name "Aunty Bella" is also provisional (she was "Pip the Elf" in the planning chat).
8. **Items per chat:** five (page 60 MVP). Card 304's "Toy 20 Questions" mentioned suggesting three toys; this design follows the five of the MVP.
9. **Toy cards:** do we make any today, or only the wand + YES/NO? Cards are optional for the MVP.
10. **Real kids on stream.** Twitch is live: no real child audio on camera without the parent's say-so.
*(Resolved since the first draft: face on the LCD = no, LCD is off; nail or wand = wand.)*

### Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Mic/speaker or latency on StackChan not good enough (card 304, untested) | No voice demo | Phone fallback behind the robot; Worker unchanged. Filler line in Harriet's voice ("Hmm, let me think...") to mask delay (page 60). |
| Option B adds latency (sentence buffer + extra hop) | Kid wanders off | Short sentences, `auto_mode`, filler line, 14:15 gate, switch to Option A. |
| Two vendors and more moving parts in B | More to break in a day | Fake-device script, adapters in single files, Option A as fallback. |
| Library voice not available via API, licence or cost | No Harriet | Test in the first hour; if blocked, use another ElevenLabs voice and tell the team. |
| Factory firmware wiped by flashing; hard to restore | Lose original agent | Use a second unit; decide before flashing. |
| Wand chip does not read, or reads only at contact (card 303/304) | Taps feel broken | Test first; NTAG213 stickers as backup; give the head a visible tap spot (a drawn circle). |
| Head and LED moods too subtle without a face | Kids miss the cues | Strong LED patterns, the voice carries the meaning, test with a child-aged viewer. |
| Spoken output filter is only as good as its rules (B) | Odd content still passes | Denylist + optional moderation call; adversarial QA; short supervised chat. Option A cannot block pre-speech at all. |
| Model says yes to everything / adds without a clear yes | Wrong list | Guard in `add_to_wishlist`; parent can remove; QA with example dialogue. |
| Suggestions are generated, not a product database | Vague or unavailable gifts | Say so in the FAQ (done); later swap in a curated list (page 60: about 60 "healthy" gifts). |
| Child's voice sent to a third party | Privacy | Push-to-talk only; no audio/transcript stored by us; in B only the LLM provider hears audio; state provider and retention; privacy review before a real product. |
| Parent email held; setup link or parent link leaks | Privacy | Unguessable tokens, expiry, no-store, delete buttons; no UID in URLs. |
| UID is not a secret | A sibling can use another's wand | Parent link is the real protection; UID hashed; pairing requires the parent. |
| Tilt servo stall, small battery | Hardware damage / dies mid-demo | Clamp 5-85; USB power. |
| Library updates break the Arduino build (card 304) | Lost hour | Pin versions; build once early; keep the `.bin`. |
| Wifi 2.4 GHz only / venue wifi | No connection | Phone hotspot on 2.4 GHz; offline clips. |
| Provider spend (LLM + ElevenLabs credits) | Surprise bill | Spend and usage limits; hard stop at 8 min; one active session per device. |
| Child safety / worrying disclosures | Serious | Prompt rule + flag in log; not a safeguarding tool; supervised use only. |

## 11. What is not decided here

The exact realtime model name, the ElevenLabs voice settings, resampler quality, the email provider and the final repo structure are placeholders to settle while building. Everything about OpenAI vs Gemini is Ben's call.
