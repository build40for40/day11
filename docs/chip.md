# Jakcom N3 nail chip

Source: the Superthread research card "Research: Jakcom N3 nail chip". Desk research only, nothing tested on our chip yet.

## What it is

A passive 13.56 MHz NFC sticker, 7 x 7 x 0.12 mm, glued onto a nail. Jakcom's app sets it up with an activation code and it holds one "service" at a time. Jakcom's other models are the N2F (full NFC), N2L (an LED that lights near a reader, stores nothing) and N2M (access control). A teardown of an N2F found an NXP NTAG213 with 144 bytes of user memory.

**Tested on our N3:** NFC Tools on Android reads it as NXP Mifare Ultralight (ISO 14443-3A) with NfcA, MifareUltralight and Ndef, ATQA 0x0044, SAK 0x00, a 7-byte UID, NFC Forum Type 2, 137 bytes of NDEF space, writable and not locked. That matches an NTAG213. It holds one URL record, the Jakcom profile link. NXP TagInfo confirms an NXP NTAG213 with an NDEF Type 2 tag. It showed nothing about password protection, so we assume there is none. Still unchecked: a test write.

## Capabilities, assuming NTAG213

| Capability | Answer |
| --- | --- |
| Read the 7-byte UID | Yes |
| NDEF URL or text, about 137 bytes max | Yes |
| Rewrite | Yes, about 10k writes (unverified) |
| 32-bit password and permanent lock | Yes. **Never lock it**, it can't be undone |
| UID mirrored into the NDEF URL | Yes, but fiddly to configure |
| Clone access cards | No |
| Read range | Practically touching, positioning is fussy |

## Reading and writing

- **Identify kids by UID, not NDEF.** It's the most reliable read.
- **Android web app:** Web NFC in Chrome 89+. Needs HTTPS, a user tap to start scanning, and the page visible with the screen unlocked. Gives `serialNumber` (the UID), which can come back empty.
- **iPhone web app:** no Web NFC. iPhone XS and later read tags in the background, so a nail holding an NDEF URL opens Safari with no app. The URL must be the first record on the tag.
- **iPhone native:** Core NFC reads and writes NDEF and exposes the UID. Needs a paid developer account.
- **No-code writing:** NFC Tools or NXP TagWriter. Skip Jakcom's app, which reportedly asks for too many permissions.
- **125 kHz chips:** phones can't read them.

## Gotchas

- The nail is passive. Tapping it on a tag stuck to a toy does nothing. A reader has to read both.
- A reader reads one tag at a time, so keep the nail away from cards.
- Thick phone cases and curved nails make reads worse.
- Reportedly fails under plain polish and needs a gel or acrylic topcoat (unverified). Acetone destroys it.
- Writing replaces the Jakcom profile URL.

## Identify our chip in 2 minutes

1. On Android, open NFC Tools, go to Read, and hold the nail flat near the camera.
2. Expect NXP NTAG213, technologies NfcA, MifareUltralight and Ndef, a 7-byte serial like `04:xx:...`, 144 bytes of memory, "Writable: yes".
3. Use NXP TagInfo for the exact IC. Check "Password protected" and "Locked" before writing.
4. If it lights up but reads nothing, it's an LED-only nail. If it neither lights nor reads, it may be 125 kHz.
5. Write a test URL, then touch an iPhone XS or later to it: Safari should open.

## Sources

- Manual: https://www.manualslib.com/manual/3659839/Jakcom-N3.html
- Teardown: https://shkspr.mobi/blog/2019/01/augmenting-the-human-hand-smart-nails/
- Chip forum thread: https://forum.dangerousthings.com/t/chinese-fingernail-nfc-implants/3535
- NTAG213 datasheet: https://nxp.com/docs/en/data-sheet/NTAG213_215_216.pdf
- Web NFC: https://developer.chrome.com/docs/capabilities/nfc
