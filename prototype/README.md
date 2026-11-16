# Prototype

A throwaway end-to-end test of the proposed shape in [../docs/architecture.md](../docs/architecture.md): the StackChan stays thin and a server does the thinking. It isn't the app. Results are in [../docs/stackchan.md](../docs/stackchan.md).

- `firmware/`: Arduino sketch for the K151. A wand tap starts a conversation. It then streams 16kHz PCM16 from the mic over a WebSocket, plays the 24kHz PCM16 reply as it arrives and reopens the mic afterwards. Lifting the wand and tapping it again ends the conversation. The head strip is ignored, because a wand tap sets it off, except that holding it for two seconds while idle restarts the robot.
- `server.ts`: a local Node WebSocket server for trying things on a laptop. It maps the UID to a kid and streams the reply back as it is generated.
- `worker/`: the same `hybrid` mode as a Cloudflare Worker with one Durable Object per device, deployed at `build40for40.com/glissen/api`. The device connects to `/glissen/api/ws` with a device token.

Shortcuts taken on purpose: the screen shows status text (the design says LCD off), the firmware doesn't check the server's TLS certificate, the local server has no auth, and there are no safety checks. Only the Worker stores anything or gives the model tools (see "Wands, memory and setup").

## Run the server

```bash
npm install
npm run server
```

With an empty `.env` it speaks with the macOS `say` voice and echoes the mic back, which is enough to test the hardware. Set `OPENAI_API_KEY` for a real conversation, `ELEVENLABS_API_KEY` for the Harriet voice, and `WANDS` to name the kid behind each UID. See `../.env.example`.

`MODE` picks how a turn is answered:

- `chain` (default): speech to text, then a streamed chat model, then text to speech sentence by sentence.
- `hybrid`: a realtime model takes the audio and replies in text, which is spoken sentence by sentence.
- `realtime`: a realtime model does speech to speech, in its own voice.

```bash
MODE=hybrid npm run server
```

## Deploy the Worker

Merging to `main` deploys it when `prototype/worker/`, `prompts/` or the package files change (`.github/workflows/deploy.yml`). The Worker bundles `prompts/aunty-bella.system.md` and `prompts/wand-setup.system.md`, so a prompt change needs a deploy to reach the robot. To deploy by hand:

```bash
npm run wrangler -- deploy --config prototype/worker/wrangler.jsonc
```

## Develop against a local Worker

Fill in `prototype/worker/.dev.vars` from `.dev.vars.example`, then:

```bash
npm run worker:dev
```

That serves the Worker on port 8790 on every network interface. At boot the robot looks for a server at `LOCAL_HOST` and uses it when one answers, otherwise it goes to the deployed Worker. The screen says which: "Ready (local)" or "Ready (cloud)". If the connection drops for 8 seconds the robot restarts and looks again, so stopping the local server sends it back to the cloud. To move it from the cloud to a local server you just started, hold the head strip for two seconds or reset it.

The secrets `OPENAI_API_KEY`, `ELEVENLABS_API_KEY` and `DEVICE_TOKEN` are set once with `npm run wrangler -- secret put <NAME> --config prototype/worker/wrangler.jsonc`. Every deploy disconnects a chat in progress.

## Wands, memory and setup

The Worker keeps one small Durable Object per wand, keyed by the wand's UID. It holds three plain text fields and nothing else: the child's first name, a short profile (age and a few likes) and a memory of at most 1,200 characters. The local `server.ts` still uses `WANDS` and remembers nothing.

- **Memory:** the memory is put into the prompt at the start of each chat. The model keeps it up to date with two tools: `remember` adds a line (the oldest lines drop off when it is full) and `rewrite_memory` replaces the lot with a shorter version.
- **Setup mode:** tapping a wand with no profile starts a chat with a grown-up instead of the child, using `prompts/wand-setup.system.md`. It asks for the name and a little about the child, reads it back, saves it with `save_wand` and closes. This is a voice shortcut for the prototype: the design in `docs/architecture.md` does setup on a web page.
- **Reset:** saying something like "wand setup" or "reset this wand" in a chat makes the model call `start_wand_setup`. The Worker then asks a times table question, and only the right number switches the chat into setup mode. One wrong answer locks setup until the next tap. A reset can change the name and profile, wipe the memory, or delete everything for the wand with `erase_wand`.
- **Logs:** the Worker never logs wand UIDs, names or memory. Transcripts are logged only when `LOG_TRANSCRIPTS=1` is set, which is meant for `.dev.vars` and not for the deployed Worker.

## When a turn ends

The Worker decides when the speaker has finished, in `worker/src/loudness.ts`. It learns the room's volume while nobody speaks, treats two loud 100ms frames in a row as speech, and ends the turn after 0.3 seconds of quiet. A turn is cut off after 4 seconds of speech in a chat and 6 in setup. Every turn logs the room level and the loudest frame, which is what to look at when tuning the constants at the top of that file.

## Flash the firmware

Needs the setup in [../hardware-tests/README.md](../hardware-tests/README.md), plus `arduino-cli lib install WebSockets@2.7.2`.

Copy `firmware/secrets.h.example` to `firmware/secrets.h` and fill in a 2.4GHz Wi-Fi network and the `DEVICE_TOKEN` of the deployed Worker. For local development also set `LOCAL_HOST` to this machine's LAN address and `LOCAL_TOKEN` to the `DEVICE_TOKEN` in `.dev.vars`. Then from this folder:

```bash
arduino-cli compile -u -p <PORT> --fqbn m5stack:esp32:m5stack_cores3 firmware
```

Tap the wand on the head for a greeting, lift it away, then talk. Tap it again to end the chat. Saying bye doesn't end it: speech to text invents a "bye" out of room noise too easily. A wand the Worker hasn't seen starts setup mode. On the local server, with `WANDS` unset any wand works, and once it is set only the listed ones do.
