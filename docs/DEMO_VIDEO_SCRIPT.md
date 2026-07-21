# ApplyFlow Demo Video Script

Target length: 2:40–2:55. Keep the working product on screen for most of the video. Cut loading, typing, and browser-extension setup time.

## 0:00–0:18 — Problem and promise

**Visual:** Northstar application beside the ApplyFlow side panel. Briefly show a blank application.

**Narration:**

“Job applications make candidates enter the same information again and again, then switch to a separate AI tool for every written question. ApplyFlow brings autofill and AI writing into the application page, so you can complete the repetitive work much faster without losing control of the final answer.”

## 0:18–0:42 — Local profile and evidence

**Visual:** Click **Load Maya demo data**, briefly scroll the editable profile, and show the saved resume area.

**Narration:**

“The extension keeps one editable profile locally. For this demo I use Maya Chen, a fictional new graduate. A user can also import a Word or text-based PDF resume. The original file stays in extension-owned local storage, and every extracted profile value can be reviewed before saving.”

## 0:42–1:22 — One-click scan and autofill

**Visual:** Click **Scan & Autofill**. Show identity, education, work authorization, optional demographic choice, accuracy checkbox, and attached resume. Pause briefly on the password fixture remaining blank.

**Narration:**

“With one click, ApplyFlow scans the current application and fills contact details, education, availability, work authorization, and other saved choices together. It can also attach the saved resume. Existing answers are preserved, sensitive fields such as this password are skipped, and the candidate still controls Continue and Submit.”

## 1:22–1:58 — AI answers inside the application

**Visual:** Show generated answers in the application. Focus “Describe a relevant project,” enter a short instruction such as “Emphasize the accessibility work,” and click Regenerate. Show the character-limit label.

**Narration:**

“ApplyFlow also uses AI to draft blank written answers directly inside the application, so I do not need to copy each question into a separate chat. It uses the profile and resume as context, and I can ask it to emphasize a project and regenerate in place. The result stays editable and automatically respects the field's character limit.”

## 1:58–2:19 — Technical boundary

**Visual:** Quick architecture slide or repository tree: extension → bounded field metadata/evidence → FastAPI → validated response. Show the compatibility matrix for one or two seconds.

**Narration:**

“Under the hood, ApplyFlow uses deterministic autofill for known facts and AI for questions that need writing. The extension sends only the relevant field context, profile, and resume evidence to a FastAPI service, which validates the structured response and length. The local demo is the reliable judging path; Workable, BambooHR, and Greenhouse are builder-tested pilots.”

## 2:19–2:42 — Codex and GPT-5.6

**Visual:** Show the build log, a representative Codex task, a failing test or browser diagnosis, and the passing test summary.

**Narration:**

“I built ApplyFlow collaboratively with Codex using GPT-5.6. Codex helped turn the original plan into a vertical slice, implement the extension and API, and build 129 regression tests. GPT-5.6 was especially valuable for reasoning across browser permissions, accessibility, privacy, provider schemas, and real ATS failures. I made the final scope and safety decisions and manually validated the product.”

## 2:42–2:52 — Closing

**Visual:** Return to the completed application with the Submit button visible but untouched. Show the ApplyFlow name and tagline.

**Narration:**

“ApplyFlow makes job applications faster and less repetitive by bringing profile autofill and AI writing into one workflow. The candidate reviews the result, and the final submission always stays with the person.”

## Recording checklist

- Record at 1080p with readable browser zoom.
- Use a fresh Maya profile and fixture mode.
- Hide bookmarks, notifications, API keys, personal files, and unrelated tabs.
- Do not show a real applicant's personal data or a real application submission.
- Confirm the final edit is under three minutes.
- Upload to YouTube and verify the link in a signed-out/private window.
- Keep a local backup of the final MP4.
