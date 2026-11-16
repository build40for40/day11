# Day 11 research: speech, toy safety, connected-toy lessons, inclusive wording

Researched on 16 November 2026 (Europe/London), after the CHILDES access check, while the team was at lunch. Sources were opened this turn. Claims below are limited to what those pages and papers actually say. Filed in this repo under `docs/research/next-research.md` when the lunchtime research was merged to main on 16 November 2026. The prompt, harness, architecture and Superthread pages were updated to match the recommendations below.

This note is for the Aunty Bella launch: a screen-free Christmas voice agent on a StackChan robot, for children aged 3 to 7 in the UK. The current prompt already sends the list to "Mum", confirms back before some adds, and treats one-to-four item lists as valid. The gaps below are where that design should be tightened.

---

## 1. Speech differences: how well STT hears young children

### 1.1 Published word-error rates on children's speech

Current speech-to-text is still far less reliable on young children than on adults. The closest study to this product is a 2024 revisit of child–robot recordings from an English primary school: 11 children, mean age 4.9, doing both repeated short sentences and spontaneous picture-book speech.

On that set, OpenAI Whisper large-v3 had a **word error rate (WER) of 21.3%**. Only **36.8%** of utterances were recognised exactly; **60.3%** were usable if small grammatical differences were allowed. Microsoft Azure was 30.3% WER, Google Cloud Speech-to-Text 49.0%. Performance collapsed on very short utterances (repeated numbers) and on long, paused storytelling. Priming the model with expected words or a multiple-choice template almost eliminated errors in the constrained case. An external microphone also beat the microphone built into a NAO robot, because of motor and fan noise.

Source: Janssens, Verhelst, Abbo, Ren, Pinto Bernal and Belpaeme, "Child Speech Recognition in Human-Robot Interaction: Problem Solved?", 2024, [arxiv.org/html/2404.17394v2](https://arxiv.org/html/2404.17394v2).

In more difficult conversational settings the numbers are worse. On child–adult autism diagnostic sessions (children aged about 3.6 to 13), zero-shot **Whisper large-v3 had 55.78% WER on child speech versus 25.96% on the adult in the same conversations** — a 15–20 percentage-point gap that also appeared in the other foundation models tested. One- and two-word utterances had the highest error rates. Light fine-tuning cut child WER by about 8 points, but it remained high.

Source: Ashvin et al., "Evaluation of state-of-the-art ASR Models in Child-Adult Interactions", 2024, [arxiv.org/html/2409.16135v1](https://arxiv.org/html/2409.16135v1).

On naturalistic language samples from toddlers, an IEEE EMBC 2024 study reported that Whisper accurately captured **about 50% of words spoken by typically developing 2- to 3-year-olds, but only 14% for children with Down syndrome aged 2 to 5**. About 20% of words were missed in both groups. The authors concluded that a human still needs to be in the loop, especially for children with developmental delays.

Source: "Benchmarking Automatic Speech Recognition Technology for Natural Language Samples of Children With and Without Developmental Delays", IEEE EMBC 2024, [doi.org/10.1109/embc53108.2024.10782773](https://doi.org/10.1109/embc53108.2024.10782773).

Classroom preschool speech is harder still. A 2025 workshop paper on child–adult classroom audio reported a best result of **41.2% WER**, and higher error rates for children identified as at risk than for typically developing classmates.

Source: Lileikyte et al., "Enhancing Child-Adult Directed Speech: ASR for Progress Monitoring in Preschool Settings", WOCCI 2025, [isca-archive.org/wocci_2025/lileikyte25_wocci.pdf](https://www.isca-archive.org/wocci_2025/lileikyte25_wocci.pdf).

Fine-tuned models can look much better on older, clearer child speech. Kid-Whisper reports 8.61–9.11% WER on the MyST corpus after extra preprocessing, but MyST is mainly school-age science tutoring (roughly 8–11), not 3- to 7-year-olds chatting to a toy.

Source: Attia et al., "Kid-Whisper", AIES 2024, [doi.org/10.1609/aies.v7i1.31618](https://doi.org/10.1609/aies.v7i1.31618).

**What this means for Aunty Bella:** do not assume "modern realtime STT" will just work. On UK five-year-olds in a reasonably clean recording, the best widely tested model still mis-hears roughly one word in five, and more than a third of turns are not recognised correctly. Short, one-word answers — exactly what 3-year-olds often produce — are the worst case.

### 1.2 ElevenLabs Scribe, and OpenAI or Gemini realtime

ElevenLabs publishes strong official accuracy claims for **Scribe v3** ("27% fewer word errors than Scribe v2 on FLEURS") and **Scribe v3 Live** ("44% lower semantic WER than Scribe v2 Realtime on FLEURS"). English is in the "excellent (≤ 5% WER)" band on that adult, multilingual benchmark. Scribe also offers keyterm prompting, mixed-language transcription, turn prediction, and a "no verbatim" mode that strips fillers and false starts.

Source: ElevenLabs Speech to Text docs, [elevenlabs.io/docs/overview/capabilities/speech-to-text.md](https://elevenlabs.io/docs/overview/capabilities/speech-to-text.md).

**No published WER for Scribe, OpenAI Realtime, or Gemini Live on 3- to 7-year-old speech was found in this check.** Those products should be treated as unproven for this age group until the team runs its own tests on child audio.

An independent, small, non-peer-reviewed test of **adult** stammered speech (nine samples, updated March 2025) reported 98.7% average word accuracy for Scribe v1, ahead of AssemblyAI, Deepgram and Whisper. That is encouraging for disfluency in adults, but it is not evidence about children, and the sample is tiny.

Source: McDermott, "StutterGPT: Evaluating AI Speech Models with Stuttering", [jackrmcdermott.medium.com/stuttergpt-evaluating-ai-speech-models-with-stuttering-4b6524849233](https://jackrmcdermott.medium.com/stuttergpt-evaluating-ai-speech-models-with-stuttering-4b6524849233).

OpenAI's own realtime-transcription guide tells developers to test with "representative microphones, telephony audio, accents, background noise, code-switching, domain vocabulary, and long sessions", and to raise `audio.input.transcription.delay` when accuracy matters more than speed. It does not publish a child-speech figure.

Source: OpenAI, "Realtime transcription", [developers.openai.com/api/docs/guides/realtime-transcription](https://developers.openai.com/api/docs/guides/realtime-transcription).

### 1.3 Stammering and speech delay

STAMMA's advice for talking with a child who stammers is directly usable in the prompt: slow your own speech; use longer pauses; **ask one question at a time and give plenty of time to answer**; **do not interrupt or finish their sentences**; do not tell them to "slow down" or "take a deep breath"; listen to what they say, not how they say it; use short, simple sentences; use neutral language about stammering.

Source: STAMMA, "Talking With A Child Who Stammers", [stamma.org/get-help/parents/talking-child-who-stammers](https://stamma.org/get-help/parents/talking-child-who-stammers).

The EMBC 2024 result above is the clearest published warning on **speech delay / developmental difference**: word capture can fall from about half of words (typical toddlers) to 14% (young children with Down syndrome) on the same model. Aunty Bella will meet children with delayed or unclear speech in a 3-to-7 UK audience. The system should not need a clear, fluent sentence before it can help.

### 1.4 Regional UK accents and EAL

Off-the-shelf Whisper large-v3, tested on real public-service phone calls, had **33.6% WER on North-East Scotland data and 22.2% WER on South-East Scotland data**, versus **3.64% on a scripted British-Isles baseline**. Fine-tuning on the local accent cut those figures (to 24.0% and 17.3% on the matching test sets), and a model fine-tuned on one Scottish region also helped a little on the other.

Source: Torgbi, Clayman, Speight and Tayyar Madabushi, "Adapting Whisper for Regional Dialects…", 2025, [arxiv.org/html/2501.08502](https://arxiv.org/html/2501.08502).

Newcastle / Geordie English is repeatedly described as one of the harder UK dialects for ASR. In an Interspeech 2025 error analysis, Rev AI (set to English UK) averaged **31.95% WER** on the DECTE Tyneside corpus. Many errors tracked local features: glottalised consonants, monophthongs, and words such as *yous*, *wor*, *aye*, *nowt* and *divn't*, which the system often "corrected" into standard southern forms.

Sources: Serditova, Tang and Steffens, "Automatic Speech Recognition Biases in Newcastle English", Interspeech 2025, [isca-archive.org/interspeech_2025/serditova25_interspeech.pdf](https://www.isca-archive.org/interspeech_2025/serditova25_interspeech.pdf); Markl (2022), cited there, reports higher error rates for Northern England and Northern Ireland than for Southern British English.

**English as an additional language (EAL):** ASR is generally less accurate on non-native and child learner speech, especially spontaneous rather than read speech. Published figures vary by task and age (some classroom/read-speech results are in the mid-teens to around 30% WER) and are not a UK 3-to-7 conversational benchmark. The practical implication is the same as for regional accents: expect substitutions, code-switching, and missing short words, and do not require perfectly formed English before adding an item.

Indicative sources: INTERSPEECH 2020 ALTA shared task on non-native children's ASR, [doi.org/10.21437/interspeech.2020-2154](https://doi.org/10.21437/interspeech.2020-2154); "Automatic Speech Recognition of Non-Native Child Speech for Language Learning Applications", [arxiv.org/pdf/2306.16710](https://arxiv.org/pdf/2306.16710).

Scribe's official support for 90+ languages and mixed-language audio may help some EAL households, but that has not been measured on UK 3- to 7-year-olds.

### 1.5 Concrete mitigations for the prompt, harness and architecture

1. **Always confirm back before `add_to_wishlist`.** Keep and strengthen the existing mishearing rule: "A wooden train, is that right?" Never add from a raw one-word or low-confidence transcript. This is the single most important defence against 20–50% WER.
2. **Treat one-word and unclear answers as complete, usable turns**, not as failures. "Blocks." / "Yes." / "That one." should be enough, matching the CHILDES finding that typical 3-year-old turns are only two to three words.
3. **Prime the speech model** with the current either/or options, the child's name, and a short gift vocabulary (train, blocks, paints, doll, dinosaur, book…). Janssens et al. showed priming almost solved constrained child speech. ElevenLabs keyterm prompting is the natural hook if Scribe is in the stack; OpenAI realtime also supports domain vocabulary.
4. **Wait longer at the end of a turn** for stammering, thinking, and EAL pauses. Do not cut the child off. Do not finish their sentence. STAMMA: one question, plenty of time, no "slow down".
5. **Use either/or questions and offer a suggestion every turn**, so the recogniser is choosing between two short, primed words rather than transcribing an open monologue.
6. **If the transcript is garbage or confidence is low**, say "I didn't quite catch that — blocks or outside?" rather than guessing a gift. After two failures, offer a tap-card or "shall I pick a surprise one?"
7. **Prefer an external or well-isolated microphone** over one next to servos and fans (Janssens et al. on the NAO). StackChan's head movement will otherwise hurt recognition.
8. **Harness personas to add now:** a 3-year-old who answers in one word; a child who stammers (repetitions, blocks, long pauses); a child with delayed or very unclear speech; a Geordie or Scottish-accented child using *aye* / *nowt* / *yous*; an EAL child who mixes a home language with short English words; a quietly spoken or shy child. Score the system on whether it still confirms correctly and never invents a gift.
9. **Do not turn on Scribe's "no verbatim" mode for the live child chat** until it is tested: stripping disfluencies may help clean text, but it can also swallow a stammered "yes". Keep the raw transcript for the confirm-back step.
10. **Benchmark Scribe v3 Live, OpenAI realtime and Gemini Live on real 3- to 7-year-old UK speech** (with parental consent) before locking the vendor. Published adult FLEURS numbers are not a substitute.

---

## 2. Age-unsafe gift suggestions: UK rules and a "never suggest" list

Aunty Bella is not placing toys on the market, but she is recommending gifts for 3- to 7-year-olds in Great Britain. The legal standard for what is safe to sell is the right reference for what she should never suggest, especially for children who are only just three and may still mouth objects.

### 2.1 The law

The **Toys (Safety) Regulations 2011** apply in Great Britain to toys intended for children under 14. Toys, including the chemicals they contain, must not jeopardise safety or health when used as intended or in a foreseeable way, "bearing in mind the behaviour of children." The ability of the users, and of their supervisors, "must be taken into account. In particular, this applies to toys intended for use by children under 36 months." Warnings must be in English and preceded by "Warning" or "Warnings."

Source: Office for Product Safety and Standards / Department for Business and Trade, "Toys (Safety) Regulations 2011: Great Britain", updated 24 March 2025, [gov.uk/government/publications/toys-safety-regulations-2011/toys-safety-regulations-2011-great-britain](https://www.gov.uk/government/publications/toys-safety-regulations-2011/toys-safety-regulations-2011-great-britain).

Schedule 2, particular safety requirements, is explicit on choking and strangulation:

- Toys and their parts must not present a risk of strangulation, or of asphyxiation by blocking the airway.
- **"Toys, which are clearly intended for use by children under 36 months, and their component parts and any of their detachable parts must be of such dimensions as to prevent their being swallowed or inhaled."** The same rule applies to other toys intended to be put in the mouth.
- Toys in food need their own packaging, sized so it cannot be swallowed; toys firmly attached to a food product so that the food must be eaten to reach the toy are prohibited.
- A toy intended for children under 36 months must be designed so that it can be cleaned; a textile toy must be washable unless a mechanism would be damaged.

Source: The Toys (Safety) Regulations 2011, Schedule 2, [legislation.gov.uk/uksi/2011/1881/schedule/2](https://www.legislation.gov.uk/uksi/2011/1881/schedule/2).

Schedule 5 requires toys that might be dangerous for under-36-month-olds to carry **"Not suitable for children under 36 months"** or **"Not suitable for children under three years"** (or the official graphic), plus a brief indication of the hazard (for example small parts). Functional and chemical toys need adult supervision warnings; aquatic toys need "only to be used in water in which the child is within its depth and under adult supervision"; toys with long cords for cots must warn that they should be removed when the child can crawl.

Source: Schedule 5, [legislation.gov.uk/uksi/2011/1881/schedule/5](https://www.legislation.gov.uk/uksi/2011/1881/schedule/5).

### 2.2 Magnets

OPSS's product safety alert on **small, high-powered magnets** (issued 19 May 2021; published on GOV.UK 5 April 2022) warns of **serious injury or fatality if two or more magnets are swallowed**. The magnets can attract through intestinal walls. OPSS states that toys must be safe under the 2011 Regulations, that **the acceptable maximum magnetic flux index for toys is set in EN 71**, and that toys above that level are being removed from the market. Advice to consumers: keep high-powered magnet products away from children; treat vomiting or stomach pain as a possible ingestion; get immediate medical treatment if a magnet may have been swallowed.

Source: OPSS, "Product Safety Alert: Small, High-Powered Magnetic Products (PSA1)", [gov.uk/product-safety-alerts-reports-recalls/product-safety-alert-small-high-powered-magnetic-products-psa1](https://www.gov.uk/product-safety-alerts-reports-recalls/product-safety-alert-small-high-powered-magnetic-products-psa1).

OPSS is still running a 2025 "Small hazards, big harm" campaign aimed at parents and carers, focused on swallowing magnets and button batteries.

Source: [gov.uk/guidance/child-safety-small-hazards-big-harm](https://www.gov.uk/guidance/child-safety-small-hazards-big-harm).

### 2.3 Button batteries

RoSPA states that if a child swallows a button or coin battery, **saliva plus the battery's electrical current produces caustic soda that can burn through the throat or stomach**. It says the **Toy Safety Regulations require toys that use button batteries to have lockable battery compartments**, and advises against using toys that do not. Musical cards, flameless candles, remotes and many gadgets often do not have lockable compartments; spare and used batteries should be locked away. If swallowing is suspected, seek medical help immediately. Signs listed via Great Ormond Street include vomiting bright red blood, sudden cough or drooling, tummy or throat pain, and going off solid food.

Source: RoSPA, "Button battery safety advice", [rospa.com/home-safety/product-safety/button-batteries](https://www.rospa.com/home-safety/product-safety/button-batteries).

### 2.4 What UK accident-prevention charities add

The Child Accident Prevention Trust lists the most dangerous toy types as: toys with **accessible button batteries**; **super-strong magnets**; **water beads** (which can block the bowel if swallowed); toys with **long cords** that can strangle; toys with **small parts** that can choke a small child; and cheap electrical toys with exposed wires. Under-3s are at the biggest risk because they mouth objects and have smaller, softer airways.

Source: CAPT, "Toy safety", [capt.org.uk/toy-safety/](https://capt.org.uk/toy-safety/).

### 2.5 Short "never suggest" list for the prompt and a hard filter

Put this in the prompt **and** enforce it in the Worker before `add_to_wishlist` can succeed. If the child asks for one of these, be kind, do not promise it, and offer a safer alternative. Do not add it to the list.

**Never suggest, for any child on this product (and especially if they are under 4 or their age is unknown):**

1. Anything sold or commonly labelled **"not suitable for children under 36 months / under 3 years"** because of small parts, including toys with loose beads, tiny figures, or parts that come off when tugged.
2. **Loose or small high-powered magnets**, "buckyball"-style magnet sets, magnetic putty with loose magnets, or toys whose magnets can come out.
3. **Toys or novelties with accessible button or coin batteries**, or any toy whose battery compartment is not lockable (including musical greetings cards, cheap electronic novelties, and lights with a slide-off battery cover).
4. **Water beads** and similar swellable beads.
5. **Toys with long cords, ties or loops** that could go around a young child's neck (cot hangings, pull-cord toys, dressing-up clothes with long ties), and toys meant to be strung across a cot or pram.
6. **Toys inside food**, or surprises that have to be eaten to be reached.
7. **Chemistry sets, embedding kits and other chemical / "functional" toys** that the law says need direct adult supervision, and projectile toys that can injure.
8. **Cheap electrical toys, hoverboards or gadgets with exposed chargers or wires** flagged by CAPT as a fire risk, and any "toy" clearly aimed at adults (desk magnet sculptures, fake magnetic piercings).

**Safer defaults to suggest instead:** large wooden blocks, chunky vehicles, cloth or board books, washable soft toys from known brands, outdoor play (balls, buckets), arts materials marked for the child's age, pretend-play sets without tiny parts.

If the child's age in setup is under 4, tighten the filter further and prefer washable, large-part toys. The list that goes to the grown-up should never contain an item from the never-suggest list, even if the model tried to add it.

---

## 3. Kids' voice product precedents and launch checks

### 3.1 Hello Barbie

Hello Barbie (Mattel, with ToyTalk) was a Wi-Fi doll that recorded a child's speech and sent it to servers for a spoken reply. A 2016 technical analysis for the Norwegian Consumer Council found that recordings were uploaded over SSL to ToyTalk, and that the microphone was at least gated by a physical button. The same project's legal analysis criticised wide licences over children's voice data, vague retention, and weak consent. Privacy and security concerns dogged the product; production was later discontinued (widely reported as 2017, with the online service shutting down later).

Sources: Bouvet, technical analysis of Cayla, i-QUE and Hello Barbie, November 2016, [storage02.forbrukerradet.no/media/2016/12/2016-11-technical-analysis-of-the-dolls-bouvet.pdf](https://storage02.forbrukerradet.no/media/2016/12/2016-11-technical-analysis-of-the-dolls-bouvet.pdf); Norwegian Consumer Council, "#Toyfail", December 2016, [storage02.forbrukerradet.no/media/2016/12/toyfail-report-desember2016.pdf](https://storage02.forbrukerradet.no/media/2016/12/toyfail-report-desember2016.pdf); background on later discontinuation, PIRG, [pirg.org/articles/barbie-movie-history-privacy-violations/](https://pirg.org/articles/barbie-movie-history-privacy-violations/).

**Lesson:** a physical press-to-talk button is necessary but not sufficient. Parents still need to know where the voice goes, how long it is kept, and that it will not be used to train unrelated systems or shared under a broad licence.

### 3.2 My Friend Cayla

Cayla could be reached over unsecured Bluetooth and used as a remote microphone and speaker, without needing to press a button on the doll. The Norwegian tests also found voice data being sent in ways not clearly described to parents, and unencrypted traffic to a weather service. In February 2017, **Germany's Federal Network Agency told parents to destroy the dolls**, treating the Bluetooth microphone as a concealed transmitting device illegal under German telecoms law. A connection within about 10 metres, even through walls, was reported.

Source: BBC News, "German parents told to destroy Cayla dolls over hacking fears", 17 February 2017, [bbc.com/news/world-europe-39002142](https://www.bbc.com/news/world-europe-39002142); NCC #Toyfail and Bouvet reports above.

**Lesson:** do not leave a microphone open to the local radio network. Pairing must need physical access (Aunty Bella's wand-plus-setup flow is closer to this than Cayla was). There must be a way to use the toy without a live connection.

### 3.3 CloudPets

CloudPets teddy bears let families send voice messages to the toy. In early 2017, security researchers found the backend MongoDB instance on the public internet, without a password. Troy Hunt reported **821,296 user records** and references to **2,182,337 voice recordings** (stored on an AWS S3 bucket), plus publicly exposed staging and test copies of the data. The database was later found ransomed. The company's later statements to the California Attorney General understated the scale and when they knew.

Source: Troy Hunt, "Data from connected CloudPets teddy bears leaked and ransomed, exposing kids' voice messages", [troyhunt.com/data-from-connected-cloudpets-teddy-bears-leaked-and-ransomed-exposing-kids-voice-messages/](https://www.troyhunt.com/data-from-connected-cloudpets-teddy-bears-leaked-and-ransomed-exposing-kids-voice-messages/).

**Lesson:** do not store children's voice "just in case". If you must store anything, it cannot sit in an open database, a public bucket, or a copy of production data on a test server. Default should be: no audio retained.

### 3.4 The Alexa kids FTC / DOJ case

On 31 May 2023, Amazon announced a settlement with the US Department of Justice of allegations brought by the FTC about Alexa customer data, including children's data. Amazon agreed a **$25 million civil penalty** and injunctive relief, while denying liability. The Department of Justice announced the action here: [justice.gov/archives/opa/pr/amazon-agrees-injunctive-relief-and-25-million-civil-penalty-alleged-violations-childrens](https://www.justice.gov/archives/opa/pr/amazon-agrees-injunctive-relief-and-25-million-civil-penalty-alleged-violations-childrens).

Amazon's own account of its (current and promised) child controls is useful as a checklist of what regulators focused on: **verifiable parental consent** before Amazon Kids on Alexa is enabled; a children's privacy disclosure covering retention and deletion; parental ability to **view, hear and delete** voice recordings and transcripts, or to not save them at all; a plan to **remove child profiles inactive for more than 18 months**; no interest-based ads in the Kids experience.

Sources: Amazon, "Amazon's response to our recent settlement…", 31 May 2023, [aboutamazon.com/news/policy-news-views/amazon-response-to-ftc-settlement-regarding-alexa](https://www.aboutamazon.com/news/policy-news-views/amazon-response-to-ftc-settlement-regarding-alexa); Amazon Kids, "approach to family privacy and safety", updated 4 January 2022, [aboutamazon.com/news/devices/amazon-kids-approach-to-family-privacy-and-safety](https://www.aboutamazon.com/news/devices/amazon-kids-approach-to-family-privacy-and-safety).

**Lesson for launch:** if a parent asks you to delete a child's data, delete the recordings **and** the transcripts, actually and promptly. Do not keep voice to "improve the service" unless that is clearly disclosed and consented. Do not retain inactive child profiles indefinitely.

### 3.5 ICO Children's code (Age Appropriate Design Code) — connected toys

The ICO code applies if the toy collects personal data and transmits it over a network. A talking teddy that records a child and sends the audio to servers to personalise replies is the code's own example. Key duties for a product like Aunty Bella:

- Be clear who is the controller, and do not outsource the "connected" bit and assume the duty disappears.
- Build **adequate security** against unauthorised access and against someone "taking over microphone capabilities".
- The **default service must be suitable for all children** who might use it (siblings, visitors). Offer profiles if regular users need tailoring.
- Give **clear privacy information at the point of purchase and at set-up**, including on the box or leaflet, and let people read the policy **before they buy**.
- Use **just-in-time** notices (for a screen-free toy, that means audio or the parent app/page).
- **Avoid passive collection.** Make it obvious when the device is recording (a light is the ICO's example). If there is a wake-word / listening mode, show that it is active, and **do not collect personal data in listening mode**.
- Provide a way to **switch collection or connection off on the device itself**, so it can be used as a non-connected toy where practicable.
- A DPIA is expected for services likely to be accessed by children (the ICO even publishes a connected-toy DPIA template).

Source: ICO, "14. Connected toys and devices", [ico.org.uk/…/14-connected-toys-and-devices/](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/14-connected-toys-and-devices/); DPIA template, [ico.org.uk/…/dpia-tools/connected-toy/](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/dpia-tools/connected-toy/).

The architecture already specifies a steady green ring while the mic is open, and push-to-talk on the head strip. Those should stay non-negotiable.

### 3.6 What Toniebox / tonies does (useful contrast)

tonies' UK/EU privacy notice (updated October 2026) says: **"we only collect personal information from adult users, and do not knowingly collect personal information from children under 13… Users may not upload audio of a child or other personal information that may identify a child without first obtaining the explicit consent of that child's parent or guardian."** Creative Tonie recordings are uploaded by the adult in the app, converted, and the original file is deleted after seven days. Toniebox 1 can be set up and used for core playback **without an account**; an account is required for Creative Tonies and the audio library. Toniebox 2 requires an account for setup. Usage/interaction data is collected from the box when it is online, and marketing use of that data needs extra consent.

Source: tonies Privacy Policy, [tonies.live/en-gb/privacy-policy](https://tonies.live/en-gb/privacy-policy).

**Lesson:** the adult, not the child, should be the account holder. Child audio should only leave the house with explicit parental consent. Core play should still work if the parent refuses a connected account (as far as a voice wishlist robot can — at minimum, a non-recording, non-cloud mode).

### 3.7 Must-do launch checks (8)

1. **Verifiable parental consent before any session that sends audio or a transcript off the device.** Privacy information must be readable before purchase and again at setup (ICO). Capture consent, the grown-up's email, and the child's first name on the setup page that already exists.
2. **Default: do not store the child's voice.** Process in memory (or with a provider's non-storage option on), then discard. If a demo recording is needed, that is a separate, explicit consent. Honour deletion of any remaining data, including transcripts, immediately and completely (Alexa case).
3. **Visible mic state and a physical off switch.** Keep the green ring while the mic is open. Keep press-to-talk. Add a clear way to use the robot with the connection and mic off (ICO "connection off").
4. **No open wireless microphone.** Pairing only through the wand + setup flow. No unauthenticated Bluetooth headset profile, no world-reachable mic, no debug interface on the public internet (Cayla, CloudPets).
5. **Lock down storage and third parties.** No public buckets, no production data on test servers, no broad licence to use a child's voice to train a general model or to share it with skill/vendor partners (CloudPets, Hello Barbie, Amazon Kids policy). Write this into the vendor contracts for OpenAI / Gemini / ElevenLabs.
6. **Complete a DPIA, and design the default for every child who might wander over**, not only the registered child (ICO). The existing "unknown wand gets a pre-recorded clip only" rule should stay.
7. **Delete or archive inactive child profiles on a published timetable** (Amazon's settlement-era figure was 18 months, with a parent opt-out to keep the profile). Do not keep wishlists and names for ever "just in case".
8. **Do not ship a gift suggestion that fails the never-suggest list**, and do not let a safety or "worrying disclosure" email include a transcript of what the child said — the current "short neutral note only" design is the right one (and should be tested).

---

## 4. Households that don't celebrate Christmas, or have no "Mum"

### 4.1 The problem in the current drafts

The prompt already has a good line at the top: "The list will be sent to their grown-up." It then repeatedly says the list is "on its way to **Mum**." Architecture diagrams, setup copy and emails are also Mum-shaped. "Is Santa real?" is answered with "That's a lovely question to ask your grown-up," which is the right instinct. The product is a Christmas helper, but many UK households will use it who do not celebrate Christmas, who have two dads, a single dad, a grandmother, a foster carer, or who simply do not call the main adult "Mum."

### 4.2 Inclusive wording — sourced practice

NHS and NICE public-facing guidance routinely says **"parents and carers"** rather than assuming a mother or father, and says information should "reflect any religious, ethnic, or cultural needs."

Source: NICE CG116, "Person-centred care", [nice.org.uk/guidance/cg116/ifp/chapter/Person-centred-care](https://www.nice.org.uk/guidance/cg116/ifp/chapter/Person-centred-care).

For December / winter school activities, the American Jewish Committee and Council on Education in the European Union advise schools not to treat Christmas as the default: use wording such as winter or end-of-year activities, and do not assume every family celebrates Christmas.

Source: "Guidance for K-12 Schools on Inclusive December Activities", [action.ajc.org/hubfs/NATIONAL/CEA/CEA-AJC-CEA-Guidance-for-K-12-on-Inclusive-December-Activities.pdf](https://action.ajc.org/hubfs/NATIONAL/CEA/CEA-AJC-CEA-Guidance-for-K-12-on-Inclusive-December-Activities.pdf).

Illinois Early Learning's advice for talking with young children about religious diversity is to be factual and inclusive ("some families celebrate…, our family…") rather than expecting one festival to stand for everyone.

Source: [illinoisearlylearning.org/tipsheets/talkabout-religion/](https://illinoisearlylearning.org/tipsheets/talkabout-religion/).

This is a Christmas-themed product, so it does not need to pretend it is a generic winter toy. It does need to avoid forcing Santa, Christmas, or "Mum" onto a family that has said otherwise, and it needs a graceful default when the family has not been asked yet.

### 4.3 Recommendation: configurable grown-up name, plus a holiday mode

**On the parent setup page, capture:**

- **Grown-up name (required).** A short label the robot will say, default **"your grown-up"**. The parent can type Mum, Dad, Mama, Ima, Grandad, Nanny, "your dads", "Foster Carer", a first name, or anything else (letters and spaces, length-capped, same sanitisation as the child's name). Inject that string into the prompt and into emails ("Your list is on its way to Dad").
- **How to talk about the list (required, default = Christmas).** Three options: **Christmas** ("things you would love for Christmas", Santa stays in the character); **Winter / festive wishlist** (no Santa, "a list of things you would love"); **Just a wishlist** (no Christmas, no Santa; Aunty Bella is simply a kindly helper making a list for the grown-up). The "Is Santa real?" line is only used in Christmas mode; in other modes, if the child asks, say "That's a lovely question to ask your grown-up" and move on, without bringing Santa in.
- Keep the character, voice and hardware the same. Do not invent a second persona on launch day.

**Prompt changes:** replace every spoken "Mum" with the configured label (or "your grown-up" if missing). Do not assume a mother, a two-parent house, or that Christmas is celebrated. Do not ask "What does Mum do at Christmas?" or "Have you been good for Santa?" as a warmth question. If holiday mode is not Christmas, do not promise that Santa will see the list.

**Architecture / schema:** add `grownup_label` and `holiday_mode` (`christmas` | `festive` | `wishlist`) on the kid or household row; pass them into the session SYSTEM block; use the label in emails and on the parent page.

**Harness:** add scenarios for a child with two dads, a grandma as carer, and a family that does not celebrate Christmas, and check that the robot never says "Mum" or "Santa will bring this" in those runs.

---

## 5. Changes to make, in one place

### Prompt

- Confirm every item back before adding.
- Accept one-word and unclear answers; one question at a time; do not interrupt or finish the child's sentence; wait.
- If the transcript is doubtful, offer a choice rather than guessing.
- Insert the **never-suggest** list, and never promise an unsafe item.
- Replace "Mum" with `{grownup_label}` (default "your grown-up").
- Honour `{holiday_mode}` so Christmas and Santa are not forced.
- Follow STAMMA-style language: no "slow down", no praising "saying it without a stammer".

### Harness

- Add personas: stammer, speech delay / very unclear speech, Geordie or Scottish English, EAL / mixed language, one-word 3-year-old, quiet/shy, two-dad household, non-Christmas household.
- Hard checks: no add without a confirm-back; no never-suggest item on the list; no "Mum" when the label is not Mum; no Santa promise in non-Christmas mode; no interruption of a long paused turn.
- Keep audio used for STT tests local, with parental consent, and off hosted models unless non-storage is on.

### Architecture

- Setup fields: `grownup_label`, `holiday_mode`, child's age (for the safety filter).
- Worker-side gift filter that can reject an `add_to_wishlist` call.
- STT priming with the current choices and a gift lexicon; longer end-of-turn silence.
- Default no audio retention; non-storage with any hosted STT/LLM; deletion that covers transcripts; mic light + connection-off.
- Vendor terms: no training on this audio.
- Finish the ICO DPIA before any real-child session (this was already flagged in the CHILDES / prompt-testing work).
