# Day 11

Day 11 of 40 for 40, built live on Twitch on Monday 16 November 2026. The problem is "Finding kids' Christmas gifts", from Maia. Work is tracked on the Superthread `day11` board and the "Day 11" page.

- **Form factor:** RFID, with a Jakcom N3 smart nail chip.
- **Name:** the app doesn't have one yet, so the repo is `day11` until it does. The holding name is "Wish" (also floated: Wishbox, Elf, "11"). Once it's named, anything web-facing is served at `build40for40.com/<app>/`.

Shared 40 for 40 context lives in `../AGENTS.md`.

## The problem

How do my (screen free) kids discover things they want for christmas without an argos catalogue / physical toy shop (thats not full of total plastic cr@p)

The real brief: help kids discover a bigger world of things they didn't realise existed. The experience is screen free and shop free, and the user is the kid, not the parent. No tight age range for now. Kids don't need to read to pick a gift.

## What we're building (MVP)

A kid taps an RFID item (the "wand", an N3 nail chip) on a voice device and chats with a Santa or elf character. The goal of the chat is five toys on the kid's wish list, which is then sent to the parent.

- **Kid identity:** the chip identifies each kid within a household, so siblings can't edit each other's lists.
- **Memory:** the character remembers past conversations and keeps a changing toy list. Nothing sophisticated.
- **Safety:** parents will want guardrails on what the character says and suggests, so test them.
- **Season:** pre-holiday only. Birthdays are a later idea.

**Stretch goals:** tap the same chip on a phone to open the wish list, a web page for parents, WhatsApp delivery, a localised small model for safety (may perform poorly unless fine-tuned).

## Not decided yet

No architecture decisions have been made. The candidate device is the M5Stack StackChan, but we test what the hardware can do first (chip reads, audio in and out, speech latency, how much of the built-in AI we can replace) and decide how to build it afterwards. Don't pick a stack, services or data model without checking with the team.

## Where to look

- [docs/brief.md](docs/brief.md): the Superthread brief, ideas considered, the MVP idea and open risks.
- [docs/chip.md](docs/chip.md): the Jakcom N3 nail chip research.
- [docs/stackchan.md](docs/stackchan.md): the M5Stack StackChan research, open questions and what we've tested.
- [docs/architecture.md](docs/architecture.md): the team's proposed design. Nothing in it is built or tested.
- [hardware-tests/](hardware-tests/README.md): throwaway Arduino sketches and setup steps for the hardware tests.

The brief and research docs were copied from Superthread (the "Day 11 - Brief & prep" page and the two research cards on the `day11` board). Results marked as tested were run on real hardware, and everything else is still desk research, so mark things verified as they are.
