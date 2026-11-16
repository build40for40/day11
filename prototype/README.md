# Prototype

A throwaway end-to-end test of the proposed shape in [../docs/architecture.md](../docs/architecture.md): the StackChan stays thin and a server does the thinking. It isn't the app. Results are in [../docs/stackchan.md](../docs/stackchan.md).

- `firmware/`: Arduino sketch for the K151. A wand tap starts a conversation. It then streams 16kHz PCM16 from the mic over a WebSocket, plays the 24kHz PCM16 reply as it arrives and reopens the mic afterwards. A tap on the head stops it.
- `server.ts`: a local Node WebSocket server for trying things on a laptop. It maps the UID to a kid and streams the reply back as it is generated.
- `worker/`: the same `hybrid` mode as a Cloudflare Worker with one Durable Object per device, deployed at `build40for40.com/glissen/api`. The device connects to `/glissen/api/ws` with a device token.

Shortcuts taken on purpose: the screen shows status text (the design says LCD off), the firmware doesn't check the server's TLS certificate, the local server has no auth, and there are no safety checks or storage. The only tool is `finish_session`.

## Run the server

```bash
npm install
npm run server
```

With an empty `.env` it speaks with the macOS `say` voice and echoes the mic back, which is enough to test the hardware. Set `OPENAI_API_KEY` for a real conversation, `ELEVENLABS_API_KEY` for the Harriet voice, and `WANDS` to name the kid behind each UID. See `../.env.example`.

`MODE` picks how a turn is answered:

- `chain` (default): speech to text, then a streamed chat model, then text to speech sentence by sentence. Saying bye doesn't end the chat reliably in this mode.
- `hybrid`: a realtime model takes the audio and replies in text, which is spoken sentence by sentence.
- `realtime`: a realtime model does speech to speech, in its own voice.

```bash
MODE=hybrid npm run server
```

## Deploy the Worker

Merging to `main` deploys it when `prototype/worker/`, `prompts/` or the package files change (`.github/workflows/deploy.yml`). The Worker bundles `prompts/aunty-bella.system.md`, so a prompt change needs a deploy to reach the robot. To deploy by hand, or to run it locally on port 8790 with `prototype/worker/.dev.vars` filled in from `.dev.vars.example`:

```bash
npm run wrangler -- deploy --config prototype/worker/wrangler.jsonc
npm run worker:dev
```

The secrets `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `DEVICE_TOKEN` and the optional `WANDS` are set once with `npm run wrangler -- secret put <NAME> --config prototype/worker/wrangler.jsonc`. Every deploy disconnects a chat in progress.

## Flash the firmware

Needs the setup in [../hardware-tests/README.md](../hardware-tests/README.md), plus `arduino-cli lib install WebSockets@2.7.2`.

Copy `firmware/secrets.h.example` to `firmware/secrets.h` and fill in a 2.4GHz Wi-Fi network. With `SERVER_TLS` set to 1 it talks to the deployed Worker and needs the `DEVICE_TOKEN`. Set it to 0 and fill in this machine's LAN address to use the local server. Then from this folder:

```bash
arduino-cli compile -u -p <PORT> --fqbn m5stack:esp32:m5stack_cores3 firmware
```

Tap the wand on the head for a greeting, then talk. Say bye to end the chat, or tap the head strip. With `WANDS` unset any wand works, and once it is set only the listed ones do. If the server restarts, reset the board: the firmware doesn't reconnect by itself yet.
