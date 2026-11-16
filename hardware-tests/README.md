# Hardware tests

Throwaway Arduino sketches for testing the StackChan K151 and the Jakcom N3 nail. They aren't the app. Results are in [../docs/stackchan.md](../docs/stackchan.md).

- `nfc-detect/`: the official M5Stack NFC Detect example from the `M5StackChan` library, unchanged. Prints the UID of any tag on the head over serial.
- `audio-loopback/`: touch the head strip, it records 3 seconds from the mic, prints peak and RMS levels, then plays the recording back.

Flashing either one overwrites the factory firmware. Restoring it through web M5Burner is untested.

## Setup

Install `arduino-cli` (`brew install arduino-cli`), then add the M5Stack board index and install the core and libraries. The versions below are the ones the sketches were compiled and flashed with.

```bash
arduino-cli config add board_manager.additional_urls https://static-cdn.m5stack.com/resource/arduino/package_m5stack_index.json
arduino-cli core update-index
arduino-cli core install m5stack:esp32@3.3.10
arduino-cli lib install M5StackChan@1.1.1 M5Unified@0.3.0 M5UnitUnified@0.6.5 M5Unit-NFC@0.1.2
```

On macOS, Terminal can't read `~/Documents`, which is where Arduino keeps libraries by default. Move them somewhere else:

```bash
mkdir -p ~/arduino-user
arduino-cli config set directories.user ~/arduino-user
```

## Compile and flash

The board is `m5stack:esp32:m5stack_cores3`. Find the serial port with `arduino-cli board list`, then from this folder:

```bash
arduino-cli compile -u -p <PORT> --fqbn m5stack:esp32:m5stack_cores3 nfc-detect
arduino-cli monitor -p <PORT> -c baudrate=115200
```

Close web M5Burner and any open serial monitor first, or the port is busy.
