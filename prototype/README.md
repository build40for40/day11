# Prototype

A throwaway end-to-end test of the proposed shape in [../docs/architecture.md](../docs/architecture.md): the StackChan stays thin and a server does the thinking. It isn't the app. Results are in [../docs/stackchan.md](../docs/stackchan.md).

- `firmware/`: Arduino sketch for the K151. A wand tap starts a conversation. It then streams 16kHz PCM16 from the mic over a WebSocket, plays the 24kHz PCM16 reply as it arrives and reopens the mic afterwards. Lifting the wand and tapping it again ends the conversation. The head strip is ignored: a wand tap sets it off, and it fires by itself.
- `server.ts`: a local Node WebSocket server for trying things on a laptop. It maps the UID to a kid and streams the reply back as it is generated.
- `worker/`: the same `hybrid` mode as a Cloudflare Worker with one Durable Object per device, deployed at `build40for40.com/glissen/api`. The device connects to `/glissen/api/ws` with a device token.

Shortcuts taken on purpose: the screen shows status text (the design says LCD off), the firmware doesn't check the server's TLS certificate, the local server has no auth, and there are no safety checks or storage. The model has no tools.

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

Merging to `main` deploys it when `prototype/worker/`, `prompts/` or the package files change (`.github/workflows/deploy.yml`). The Worker bundles `prompts/glisten.system.md`, so a prompt change needs a deploy to reach the robot. To deploy by hand:

```bash
npm run wrangler -- deploy --config prototype/worker/wrangler.jsonc
```

## Develop against a local Worker

Fill in `prototype/worker/.dev.vars` from `.dev.vars.example`, then:

```bash
npm run worker:dev
```

That serves the Worker on port 8790 on every network interface. At boot the robot looks for a server at `LOCAL_HOST` and uses it when one answers, otherwise it goes to the deployed Worker. The screen says which: "Ready (local)" or "Ready (cloud)". If the robot sees the connection drop it restarts after 8 seconds and looks again. It doesn't always notice a server that has gone away, so reset the robot after restarting the local server.

The secrets `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `DEVICE_TOKEN` and the optional `WANDS` are set once with `npm run wrangler -- secret put <NAME> --config prototype/worker/wrangler.jsonc`. Every deploy disconnects a chat in progress.

## Flash the firmware

Needs the setup in [../hardware-tests/README.md](../hardware-tests/README.md), plus `arduino-cli lib install WebSockets@2.7.2`.

Copy `firmware/secrets.h.example` to `firmware/secrets.h` and fill in a 2.4GHz Wi-Fi network and the `DEVICE_TOKEN` of the deployed Worker. For local development also set `LOCAL_HOST` to this machine's LAN address and `LOCAL_TOKEN` to the `DEVICE_TOKEN` in `.dev.vars`. Then from this folder:

```bash
arduino-cli compile -u -p <PORT> --fqbn m5stack:esp32:m5stack_cores3 firmware
```

Tap the wand on the head for a greeting, lift it away, then talk. Tap it again to end the chat. Saying bye doesn't end it: speech to text invents a "bye" out of room noise too easily. With `WANDS` unset any wand works, and once it is set only the listed ones do. If the server restarts, reset the board: the firmware doesn't reconnect by itself yet.
