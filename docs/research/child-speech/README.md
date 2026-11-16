**Licence and citations.** This folder holds aggregate statistics and catalog metadata only, from CHILDES via childes-db 2026.1. TalkBank data are **CC BY-NC-SA 4.0**. It does not contain original CHAT transcripts or child utterance text. Cite the corpora in [citations.md](citations.md) and acknowledge CHILDES grant **NICHD HD082736**. Do not upload these files to a hosted model, and do not train on them.

# CHILDES Eng-UK and Eng-NA access check, and what 3-, 5- and 7-year-olds sound like in the numbers

Checked on **16 November 2026 (Europe/London)**. This note records what actually loaded or failed, the licence as published today, and mean-length-of-utterance (MLU-w) statistics computed locally from childes-db 2026.1. Original CHAT (`.cha`) transcripts were **not** downloaded, because those files are now behind a TalkBank login.

## 1. Access status (UK and US are the same)

Eng-UK (Fletcher, Wells, Thomas, Manchester, and the rest of the collection) and Eng-NA (Brown, MacWhinney, Gleason, HSLLD, and the rest) sit on the same TalkBank system. Access is identical for both regions.

The home page at [childes.talkbank.org](https://childes.talkbank.org/) still shows the banner: *“This repository is under review for potential modification in compliance with Administration directives.”* The catalog is not offline. Collection indexes, corpus documentation pages, and DOIs all loaded (HTTP 200). The change that blocks a no-account download is the login wall on the data itself, not a missing catalog.

| Route | What happened today, without a TalkBank or Redivis login |
| --- | --- |
| Catalog / documentation pages | Work. Eng-UK and Eng-NA indexes and corpus pages (Fletcher, Wells, Thomas, Manchester, Brown, Gleason, HSLLD, MacWhinney) all loaded. |
| TalkBank Browser (`sla.talkbank.org/TBB/...`) | The app shell loads, but a session check returns `notLoggedIn`, and `getCHAT` refuses the transcript text. |
| Direct `.zip` / `.cha` downloads | **Legacy URLs 404**, including `childes.talkbank.org/access/Eng-UK/0-Eng-UK-MOR.zip`, `.../data/Eng-UK/Fletcher.zip`, `.../data/Eng-NA/Brown.zip`, and the old XML tree `talkbank.org/childes/data-xml/` (this last path is what NLTK used). **Current URLs under `talkbank.org/data/...` return a 319-byte login page**, not a file. The same login shell is served for `media.talkbank.org`. The data are gated, not deleted. |
| TalkBank API on `sla2.talkbank.org` (port 443) | **Metadata works without login**: `getTranscriptSummary` and `getParticipantSummary` returned file lists and speaker ages (Fletcher: 72 files, 24 each at ages 3, 5 and 7; Brown: 214 files). **Transcript text does not**: `getCHAT` returns `auth` / `loggedIn: false`. Official TBDBpy utterance routes (`getUtteranceSummary` on port 1515) were not usable from this environment (TLS failure on :1515; 404 for those route names on port 443). |
| childes-db (current official derived database) | **Works without a Redivis account for table downloads.** Release **2026.1** (Redivis `v1.4`, dataset [datapages.childes_db](https://stanford.redivis.com/datasets/b6q6-14tmdjgw8?v=1.4), DOI [10.57761/9yv6-c595](https://doi.org/10.57761/9yv6-c595)). This check downloaded the `transcript` table (56,578 rows) and `transcript_by_speaker` table (148,103 rows), which include per-transcript MLU-w. The `utterance` table (24.2 million rows, about 9.3 GB) is listed as public, but anonymous SQL queries return HTTP 401, and the rows endpoint does not accept a corpus filter, so a small utterance extract could not be requested. The older public MySQL host in `childes-db.json` (`52.37.132.215:3306`, still labelled 2021.1) refused connections. |

**Bottom line:** you can still see that the Eng-UK and Eng-NA corpora exist, and you can still get summary statistics from childes-db. You cannot fetch the original `.cha` files, or utterance text, until someone registers a free TalkBank account (email and password, then confirm the email) and signs in. The official policy page, [Data Access Levels](https://talkbank.org/childes/access.html), already says transcript and media data need that registration. Ordinary Eng-UK / Eng-NA transcripts are not in the tighter “controlled access” tier (that is GlobalTales, plus some videos).

No TalkBank account was created for this check, so the login-gated download was not completed.

## 2. Licence and ground rules

Read from the live page [talkbank.org/0share/rules.html](https://talkbank.org/0share/rules.html) on 16 November 2026:

- **Copyright:** unless a corpus page says otherwise, TalkBank data are under **Creative Commons CC BY-NC-SA 4.0**. That licence **precludes putting the data into commercial products, including large language models such as ChatGPT**. Registered commercial users may use the data to develop algorithms, but “the data themselves cannot be included in models.”
- **Web processing / hosted LLMs:** “Users cannot upload TalkBank data to web-based processing systems unless those systems include assurance that they will not keep the data.” The page names OpenAI, Anthropic, Google and Rev-AI, and says the user must turn on the provider’s **non-storage / do-not-train** option (OpenAI: turn off “improve the model for everyone”; Anthropic: turn off “Help improve Claude”; Google: turn off Gemini Apps Activity).
- **Citation:** any use must cite the specific corpus references and acknowledge CHILDES grant **NICHD HD082736**. See [citations.md](citations.md).
- **Redistribution:** media cannot be redistributed on the web without case-by-case permission from the contributor.
- **Ethics / Certificate of Confidentiality:** downloaded identifiable data “can only be stored on a local device for analysis and cannot be circulated further.” Follow the TalkBank Code of Ethics.
- childes-db is a parse of CHILDES and carries the same TalkBank rules. If you use it, cite Sanchez et al. (2019) and the database version (`2026.1` here), plus CHILDES and each corpus.

For the Aunty Bella harness this means: keep any CHILDES-derived material local; do not upload transcripts or raw child utterances into a hosted LLM unless non-storage is on; do not train or fine-tune a model on the data; cite the corpora if results are published or committed in a way that reports the analysis.

## 3. What is in this folder

- `README.md` — this file.
- [access-notes.md](access-notes.md) — exact URLs and HTTP results.
- [citations.md](citations.md) — database and corpus citations.
- [mlu-stats.json](mlu-stats.json) — the full stats dump used below.
- [selected-transcripts.json](selected-transcripts.json) — five UK and five US transcripts chosen as mid-MLU examples at ages 3, 5 and 7 (filenames, PIDs, ages, MLU-w). These are catalog records, not the `.cha` text.

The original CHAT files themselves are **not** here. A later run with a TalkBank login should download only those ten files (or a similarly small set) into this folder and keep the originals plus their citation info.

## 4. How the numbers were computed

Analysis was done locally with Python on the childes-db 2026.1 `transcript_by_speaker` table, joined to `transcript` for corpus name, filename and PID.

- Speakers: `Target_Child` only.
- Collections: the main CHILDES collections, `Eng-UK` (collection_id 10) and `Eng-NA` (collection_id 9). Smaller later add-ons with the same collection names (ids 27 and 28) were left out of these tables.
- Age is stored in days in childes-db. Fletcher files labelled `3/` have age 1095.75 days, which matches 3;0, so years are `days / 365.25`.
- Age bands: **3** = 2.5–3.5 years, **5** = 4.5–5.5, **7** = 6.5–7.5.
- Measure: **MLU-w**, mean length of the child’s utterances in words, already computed by childes-db for each transcript. This is the closest official stand-in for “how long a typical child turn is.” It is **not** the share of one-word answers, and it does not count fillers, `xxx`/`yyy`, incomplete utterances, repetitions, or how children answer questions. Those need utterance text, which was not available.

**Focus corpora** are the ones named in the brief, plus close conversational matches: UK — Fletcher, Wells, Thomas, Manchester; US — Brown, MacWhinney, Gleason, HSLLD. (MacWhinney has almost no files in the 6.5–7.5 band in this release; US age 7 in the focus set is almost entirely HSLLD.)

A few caveats, all visible in the counts: UK age 7 is **only Fletcher** (24 interview transcripts, 23 children). Thomas at age 5 is **one child**. Brown at ages 3 and 5 is **two children** (Adam and Sarah). “All corpora” figures mix very different tasks (free play, interview, storytelling, book reading), which is why the US ranges are wide. Fletcher is the best single analogue for Aunty Bella, because it is a British adult–child interview with 24 different children at each of 3, 5 and 7.

## 5. MLU-w by age: UK vs US

### Focus corpora (best comparison set)

| Age band | Region | Transcripts | Children | Mean MLU-w | Median MLU-w | 25th–75th percentile | Range | Median child utterances / transcript |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- | ---: |
| 3 (2.5–3.5y) | UK | 488 | 70 | 2.52 | 2.50 | 2.18–2.83 | 1.16–4.07 | 541 |
| 3 (2.5–3.5y) | US | 213 | 58 | 2.93 | 2.74 | 2.35–3.52 | 0.55–6.56 | 212 |
| 5 (4.5–5.5y) | UK | 68 | 41 | 3.28 | 3.14 | 2.86–3.63 | 1.80–5.11 | 449 |
| 5 (4.5–5.5y) | US | 347 | 79 | 3.26 | 3.13 | 2.45–3.82 | 0.50–10.80 | 88 |
| 7 (6.5–7.5y) | UK | 24 | 23 | 4.27 | 4.33 | 3.95–4.72 | 2.86–5.55 | 320 |
| 7 (6.5–7.5y) | US | 133 | 60 | 3.71 | 3.18 | 2.57–4.32 | 1.31–11.55 | 74 |

UK and US medians are very close at 3 and 5 (about **2.5–2.7 words** at 3; about **3.1 words** at 5). At 7 the UK figure is higher (**4.3**), but it comes only from Fletcher interviews; the US figure is pulled down by HSLLD, which is a different study and task mix. Do not read the UK–US age-7 gap as a dialect difference.

### Fletcher only (British interview; closest to Aunty Bella)

| Age | Transcripts | Children | Mean MLU-w | Median | 25th–75th | Range |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| 3 | 24 | 24 | 2.82 | 2.78 | 2.55–3.17 | 1.22–4.07 |
| 5 | 24 | 24 | 3.69 | 3.80 | 3.19–4.26 | 1.80–5.11 |
| 7 | 24 | 23 | 4.27 | 4.33 | 3.95–4.72 | 2.86–5.55 |

In this interview setting, typical child turns are about **3 words at age 3**, **4 words at age 5**, and **4–4.5 words at age 7**. Even the talkative end of the age-3 group (75th percentile 3.17, max 4.07) is not producing long sentences. Age 7 is still short-turn talk, not a fluent adult conversation.

Home recordings at the same ages run a little shorter than Fletcher: Wells age 3 median 2.68, Manchester age 3 median 2.61, Thomas age 3 median 2.33 (one densely sampled boy). A toy / robot chat will probably sit between home play and a formal interview, not above Fletcher.

### All primary Eng-UK / Eng-NA corpora (heterogeneous tasks)

| Age band | Region | Transcripts | Children | Mean MLU-w | Median MLU-w | 25th–75th percentile | Range |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| 3 | UK | 1085 | 83 | 2.97 | 2.71 | 2.33–3.47 | 1.16–6.12 |
| 3 | US | 1526 | 359 | 3.45 | 3.06 | 2.32–4.25 | 0.52–11.60 |
| 5 | UK | 70 | 43 | 3.28 | 3.14 | 2.85–3.65 | 1.80–5.11 |
| 5 | US | 620 | 129 | 3.58 | 3.31 | 2.54–4.31 | 0.50–10.80 |
| 7 | UK | 24 | 23 | 4.27 | 4.33 | 3.95–4.72 | 2.86–5.55 |
| 7 | US | 279 | 108 | 4.64 | 3.99 | 2.87–6.29 | 1.31–11.93 |

The US “all corpora” means are higher and the ranges are much wider, because they include tasks that can produce either very short or unusually long child utterances. Use the focus / Fletcher tables for persona design.

## 6. Excerpts (not available in this run)

The brief asked for 4–6 short, attributed excerpts of a 3-, 5- and 7-year-old answering an adult question, and for rates of one-word answers, fillers, unclear (`xxx`/`yyy`) speech, incomplete utterances, repetitions, and typical responses (yes/no, “I don’t know,” topic shifts, no response).

Those measures need the utterance text. It was not downloaded, because:

1. TalkBank `.cha` files and `getCHAT` require a login.
2. childes-db’s `utterance` table could not be filtered without a Redivis-authenticated SQL query, and a full 9 GB pull was not appropriate for a small sample.

No excerpts are invented here. Once a TalkBank account is available, pull the ten files listed in [selected-transcripts.json](selected-transcripts.json) and compute those rates locally, still without pasting whole transcripts into a hosted LLM.

Selected catalog records (mid-MLU examples, not extremes):

**UK**

- Age 3, Fletcher interview: `Eng-UK/Fletcher/3/raemio.cha` (Emily, 3;0, MLU-w 2.77, 406 child utterances). PID `11312/c-00019127-1`.
- Age 3, Thomas home: `Eng-UK/Thomas/030113.cha` (Thomas, 3;1, MLU-w 2.49, 663 utterances). PID `11312/c-00018471-1`.
- Age 5, Fletcher interview: `Eng-UK/Fletcher/5/cpric.cha` (Richard, 4;11, MLU-w 3.90, 321 utterances). PID `11312/c-00019144-1`.
- Age 5, Wells naturalistic: `Eng-UK/Wells/Jason/050019.cha` (Jason, 5;0, MLU-w 3.05, 364 utterances). PID `11312/c-00020226-1`.
- Age 7, Fletcher interview: `Eng-UK/Fletcher/7/bimak.cha` (Mark_K, 7;1, MLU-w 4.43, 387 utterances). PID `11312/c-00019171-1`.

**US**

- Age 3, Brown: `Eng-NA/Brown/Adam/021113.cha` (Adam, 2;11, MLU-w 2.51, 979 utterances). PID `11312/c-00015649-1`.
- Age 5, Brown: `Eng-NA/Brown/Sarah/050025.cha` (Sarah, 5;0, MLU-w 3.48, 254 utterances). PID `11312/c-00015843-1`.
- Age 5, Gleason dinner: `Eng-NA/Gleason/Dinner/frank.cha` (Frank, 5;2, MLU-w 3.26, 125 utterances). PID `11312/c-00016111-1`.
- Age 5, HSLLD: `Eng-NA/HSLLD/HV2/TP/maytp2.cha` (HSLLD_may, 4;10, MLU-w 3.07, 165 utterances). PID `11312/c-00035304-1`.
- Age 7, HSLLD: `Eng-NA/HSLLD/HV5/MT/paumt5.cha` (HSLLD_pau, 7;2, MLU-w 3.29, 104 utterances). PID `11312/c-00035827-1`.

## 7. Recommendations for the simulated-kid personas

These are grounded in the MLU-w distributions above. They should be revisited once utterance text is in hand.

1. **Age 3 (UK-first):** write the default 3-year-old so that a typical turn is **2 to 3 words** (Fletcher median 2.78; focus-UK median 2.50; IQR about 2.2–3.2). Many turns will be shorter than the mean, because MLU is an average. Do not give this persona fluent 8–12 word answers. After a two-option question, a one-word choice (“blocks.” / “outside.”) should be common and treated as a complete, usable reply.
2. **Age 5:** typical turn about **3 to 4 words** (focus median ~3.1; Fletcher interview median 3.80). Slightly more able to add a reason or a preference, still not a paragraph. Keep one idea per turn on Aunty Bella’s side, because the child’s turn will often be short.
3. **Age 7:** typical turn about **4 to 5 words** in a British interview (Fletcher median 4.33, IQR 3.95–4.72). This is still compact speech. A 7-year-old can do a short clause, not a monologue. Do not jump to “almost adult” just because the child is at the top of the 3–7 range.
4. **Leave room for quiet and talkative children.** Even in the tidy Fletcher sample, age-3 MLU-w runs from 1.22 to 4.07, and age-7 from 2.86 to 5.55. Personas should include a shy/low-MLU 3-year-old, a typical child, and a chatty child, rather than one average speaker per age.
5. **Prefer suggestions and either/or questions**, especially at 3. A child whose average turn is under three words will stall on “What do you like?” much faster than on “Blocks or outside?” That supports the “always suggest / two strikes on ‘I don’t know’” rule already in the testing plan.
6. **UK vs US:** at 3 and 5, conversational MLU is similar enough that one persona set can serve both, with optional US variants later. Calibrate the default (UK, interview-like) on **Fletcher + Wells**. Use Thomas and Manchester as a check that home speech can be even shorter. Treat HSLLD as a useful US age-5/7 source, but not as a drop-in match for a British Christmas interview.
7. **Do not lean on single-child corpora for “typical 5-year-old” behaviour.** Thomas age 5 is one child; Brown age 5 is two children. Use them as additional voices, not as the norm.
8. **Unclear speech, fillers, “I don’t know,” and topic jumps** almost certainly belong in the personas, but their **rates were not measured in this run**. Until the `.cha` samples are downloaded, implement those quirks conservatively (some `xxx`-style unintelligible turns, some no-answers, some topic shifts) and mark them as placeholders to be calibrated.
9. **Legal / harness practice:** keep CHILDES-derived transcripts and any excerpts on the local machine; do not upload them to a hosted model without non-storage; do not fine-tune on them; cite the corpora if the eval write-up is shared. Hand-written quirks remain the safe default until a TalkBank login is used.

## 8. What to do next

1. Register a free TalkBank account (green Login on [talkbank.org/childes](https://talkbank.org/childes/)), then download only the ten `.cha` files listed above, or the corresponding small corpus zips if the account unlocks `talkbank.org/data/`.
2. Compute, locally, the missing rates: one-word answers, fillers, `xxx`/`yyy`, incomplete utterances, repetitions, and replies to adult questions.
3. Optionally, if a Redivis account or API token is available, run a filtered SQL query on childes-db 2026.1 `utterance` for the same files, which would give a larger but still bounded sample without a 9 GB download.
4. Re-run the persona recommendations against those utterance-level numbers before any real-child session.
