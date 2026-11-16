# Day 11 brief

Source: the Superthread page "Day 11 - Brief & prep", from the team brainstorm on Monday 16 November 2026.

## Target user

The kid, not the parent. The age range was debated and left open:

- Screens tend to arrive in the early years (per the Poppy research).
- A friend keeps evenings screen free for kids up to about 6 or 7.
- Kids don't need to read to pick a gift.

The kids are screen free and the range can be narrowed later.

## Where and when

At home, before the holidays. It could also suit birthdays, but keep it to the holidays for now. There are two physical pieces: the voice device (can serve a whole household) and the identifying RFID item, so one or both may be 3D printed.

## Ideas considered

- **Chore points:** tap an RFID item to log chores, earn points, redeem against a gift catalogue. Rejected: it doesn't help discovery.
- **RFID advent calendar** that only opens after a chore.
- **Photo to list:** a parent photographs something the kid likes, the kid taps a chip on the phone to add it, and the list prints as a booklet.
- **Screen-limiting RFID sign-in** that unlocks a computer with a timer.
- **Bricked iPhone** with Wallet cards as catalogues.
- **Wand with a camera** that only works in the kid's hands.
- **Fairy godmother or Santa voice agent** with an RFID wand. This one won.
- **Santa scanner with NFC picture cards**, and a wish list URL on the chip so relatives can tap to see the list.
- **An old-fashioned Santa** who pushes wooden toys and train sets, to dodge plastic.
- **Discovery board** with a fixed set of about 60 healthy gifts.
- Toy rotation and second-hand options came up in passing.

## MVP

The kid taps her wand on the device and chats with Santa or an elf. The goal is to add five toys to the wish list, and the list goes to the parent.

- **Hardware:** an M5Stack device with a camera and a built-in NFC module, with a tiny NFC chip taped on. Candidate only, pending testing.
- **Latency:** real time should be within about a second but is untested. An instant filler reply could mask delay.
- **Memory:** past conversations and a dynamic toy list, like Poppy and an earlier project. Doesn't need to be sophisticated.
- **Auth:** RFID gives each kid an ID within a household, so siblings can't edit each other's lists.
- **Safety:** parents will want guardrails, which need testing.

## Risks

- Unknown setup friction and how programmable the NFC reader is.
- The device's built-in AI may not work with our own models.
- Latency of the speech round trip.
- A small localised model for safety may perform poorly unless fine-tuned.

## Roles

- Hardware and setup, including how programmable the RFID reader is.
- Product design and 3D modelling (wand or elf, components, something like the grandparent message recorder).
- Prompt work, QA and refining prompts, including scraping sources.
- Launch page or video, near the end.
- Check the repo exists. The Poppy waitlist was unconfirmed.
