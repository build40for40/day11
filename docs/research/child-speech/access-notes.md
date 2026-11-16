# Access probe notes (16 November 2026, Europe/London)

Exact observations. Nothing here is inferred beyond the HTTP responses and page text.

## Banner and catalog pages (open, no login)

- `https://childes.talkbank.org/` redirects to `https://talkbank.org/childes/` (HTTP 200). Page text includes: “This repository is under review for potential modification in compliance with Administration directives.” Last-Modified: Wed, 04 Nov 2026 00:18:36 GMT.
- Collection indexes still load (HTTP 200): `https://talkbank.org/childes/access/Eng-UK/` and `.../Eng-NA/`. Corpus documentation pages (e.g. Fletcher, Wells, Brown, HSLLD) also load.
- Data access policy page `https://talkbank.org/childes/access.html` (HTTP 200) states three levels: (1) open web pages, no registration; (2) transcript and media data require TalkBank registration (email + password + confirmation email); (3) controlled access only for GlobalTales transcripts and some videos, not for ordinary Eng-UK / Eng-NA transcripts.

## Direct .zip / .cha downloads

- Legacy zip URLs return **404**, including:
  - `https://childes.talkbank.org/access/Eng-UK/Fletcher.zip`
  - `https://childes.talkbank.org/data/Eng-UK/Fletcher.zip`
  - `https://childes.talkbank.org/access/Eng-UK/0-Eng-UK-MOR.zip`
  - `https://childes.talkbank.org/data/Eng-UK/0-Eng-UK.zip`
  - `https://childes.talkbank.org/data/Eng-NA/Brown.zip`
  - `https://talkbank.org/childes/data-xml/` (also 404; this is the old NLTK download path)
- Current data host `https://talkbank.org/data/...` returns HTTP 200 with a 319-byte HTML login shell (`initAuthModals` from `https://sla2.talkbank.org:443/authUI/authModals.js`) for:
  - `/data/`, `/data/childes/`, `/data/childes/Eng-UK/Fletcher.zip`, `/data/childes/Eng-UK/Fletcher/3/bncar.cha`
- `https://media.talkbank.org/` returns the same login shell.
- Conclusion: the files are not deleted at the new path, but they are **login-gated**. Unauthenticated requests do not receive a zip or a .cha file.

## TalkBank Browser

- `https://sla.talkbank.org/TBB/childes/Eng-UK/Fletcher/` returns HTTP 200, but it is a JavaScript app (`TalkBank Browser`).
- The app checks `https://sla2.talkbank.org/sessionHasAuth` with `{"rootName":"data", "path": ...}` before loading a transcript. Unauthenticated response: `{"auth":false,"noAuthType":"notLoggedIn","notAuthzMsg":""}`.
- `getCHAT` (needed for the actual CHAT text) returns `{"respMsg":"auth","success":false,"authStatus":{"loggedIn":false,"authorized":false}}`.

## TalkBank API (sla2)

- These work **without login** on `https://sla2.talkbank.org/` (HTTPS port 443):
  - `POST /getTranscriptSummary` — file lists, PIDs, languages, design/activity/group types. Fletcher: 72 files in folders 3 / 5 / 7 (24 each). Brown: 214 files.
  - `POST /getParticipantSummary` — speaker metadata (role, age, sex). For Fletcher, word/utterance/MLU fields were null in this response.
  - `POST /getPathTrees` — path tree for TalkBank.
  - `POST /isLoggedIn` — `{"loggedIn":false,"authorized":false}`
- `POST /getCHAT` requires login (see above).
- Official TBDBpy still documents utterance/token routes on `https://sla2.talkbank.org:1515/` (`getUtteranceSummary`, `getTokenSummary`, etc.). From this environment:
  - port 1515 failed TLS (`unexpected eof while reading`)
  - the same route names on port 443 returned `Cannot POST /getUtteranceSummary` (HTTP 404)
- No TalkBank account was created for this check.

## childes-db

- `https://childes-db.stanford.edu/` redirects to `https://langcog.github.io/childes-db-website/`.
- Current release is **2026.1**, hosted on Redivis as public dataset `datapages.childes_db` (qualified reference `datapages.childes_db:b6q6:v1_4`, URL https://stanford.redivis.com/datasets/b6q6-14tmdjgw8?v=1.4). `publicAccessLevel` is `"data"`. The site states no Redivis account is required to read public data.
- Anonymous REST access that **worked**:
  - `GET https://redivis.com/api/v1/datasets/datapages.childes_db:b6q6:v1_4`
  - `GET .../tables` (10 tables, including `transcript`, `transcript_by_speaker`, `utterance`)
  - `GET .../tables/{table}/variables`
  - `GET .../tables/{table}/rows` (full `transcript`: 56,578 rows, 18.6 MB; full `transcript_by_speaker`: 148,103 rows, 64.1 MB)
- Anonymous SQL **did not work**: `POST https://redivis.com/api/v1/queries` returned HTTP 401 (`No credentials were provided`). The rows endpoint also ignored filter/offset parameters, so a filtered slice of the 24,221,955-row / ~9.3 GB `utterance` table could not be requested. A full download of that table was not attempted.
- The older public MySQL server listed in `https://langcog.github.io/childes-db-website/childes-db.json` (host `52.37.132.215`, default version still labelled `2021.1`) refused TCP connections on port 3306. That route is not usable from here.

## Licence source

TalkBank ground rules were read from `https://talkbank.org/0share/rules.html` (HTTP 200) on this date. `https://talkbank.org/share/rules.html` is 404; the live path is `/0share/rules.html`.
