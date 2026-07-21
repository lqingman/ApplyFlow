# ApplyProof Demo Video Script

Target length: 2:40–2:55. Keep the working product on screen for most of the video. Cut loading, typing, and browser-extension setup time.

## 0:00–0:18 — Problem and promise

**Visual:** Northstar application beside the ApplyProof side panel. Briefly show a blank application.

**Narration:**

“Job applications repeat the same facts, while generic AI can produce polished answers that quietly exaggerate your experience. ApplyProof is an evidence-grounded application copilot. It helps candidates move faster without inventing who they are.”

## 0:18–0:42 — Local profile and evidence

**Visual:** Click **Load Maya demo data**, briefly scroll the editable profile, and show the saved resume area.

**Narration:**

“The extension keeps one editable profile locally. For this demo I use Maya Chen, a fictional new graduate. A user can also import a Word or text-based PDF resume. The original file stays in extension-owned local storage, and every extracted profile value can be reviewed before saving.”

## 0:42–1:22 — Scan and safe autofill

**Visual:** Click **Scan & Autofill**. Show identity, education, work authorization, optional demographic choice, accuracy checkbox, and attached resume. Pause briefly on the password fixture remaining blank.

**Narration:**

“One user action scans the application and fills verified facts deterministically. Work authorization and voluntary answers come only from explicit profile choices. Existing values are preserved, and sensitive fields such as this password are excluded. ApplyProof can attach the locally saved resume, but it never clicks Continue or Submit.”

## 1:22–1:58 — Grounded inline answers

**Visual:** Show generated answers in the application. Focus “Describe a relevant project,” enter a short instruction such as “Emphasize the accessibility work,” and click Regenerate. Show the character-limit label.

**Narration:**

“Blank open questions are drafted from selected resume evidence and inserted directly into the real application field, where the candidate remains the editor. I can ask it to emphasize a project and regenerate. The instruction guides the answer but cannot become evidence, and live character limits are enforced before insertion.”

## 1:58–2:19 — Technical boundary

**Visual:** Quick architecture slide or repository tree: extension → bounded field metadata/evidence → FastAPI → validated response. Show the compatibility matrix for one or two seconds.

**Narration:**

“ApplyProof separates deterministic facts from model-generated writing. The extension sends bounded field metadata and relevant evidence—not full-page HTML. A FastAPI service validates structured output, evidence references, and length. The local fixture is the reliable judging path; Workable, BambooHR, and Greenhouse are builder-tested pilots.”

## 2:19–2:42 — Codex and GPT-5.6

**Visual:** Show the build log, a representative Codex task, a failing test or browser diagnosis, and the passing test summary.

**Narration:**

“I built ApplyProof collaboratively with Codex using GPT-5.6. Codex helped turn the original plan into a vertical slice, implement the extension and API, and build 129 regression tests. GPT-5.6 was especially valuable for reasoning across browser permissions, accessibility, privacy, provider schemas, and real ATS failures. I made the final scope and safety decisions and manually validated the product.”

## 2:42–2:52 — Closing

**Visual:** Return to the completed application with the Submit button visible but untouched. Show the ApplyProof name and tagline.

**Narration:**

“ApplyProof helps applicants move faster without losing control of the truth. Evidence before eloquence—and the final submission always stays with the person.”

## Recording checklist

- Record at 1080p with readable browser zoom.
- Use a fresh Maya profile and fixture mode.
- Hide bookmarks, notifications, API keys, personal files, and unrelated tabs.
- Do not show a real applicant's personal data or a real application submission.
- Confirm the final edit is under three minutes.
- Upload to YouTube and verify the link in a signed-out/private window.
- Keep a local backup of the final MP4.
