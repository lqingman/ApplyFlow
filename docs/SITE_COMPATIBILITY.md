# Site compatibility

ApplyFlow expands across application systems through repeatable pilots. Each tested site contributes reusable field patterns, routing logic, and regression coverage to the compatibility foundation.

## Supported-site matrix

| Environment                    | Status                    | Last manual test | Evidence and current boundary                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------ | ------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Northstar Labs local demo      | Supported                 | 2026-07-20       | Complete scan, deterministic fill, resume attachment, inline drafting, existing-value protection, and no-submit regression coverage                                                                                                                                                                                                                                                                                             |
| Ordinary semantic HTML fixture | Compatibility foundation  | 2026-07-20       | Regression tests cover opaque IDs, labels, names, input types, `autocomplete`, options, surrounding question text, and client-rendered later steps                                                                                                                                                                                                                                                                              |
| Workable                       | Builder-tested pilot      | 2026-07-20       | The builder completed a real-site manual application test. The result establishes hands-on compatibility evidence, but a named Workable regression fixture and a documented repeatable capability checklist are still pending                                                                                                                                                                                                   |
| BambooHR                       | Builder-tested pilot      | 2026-07-20       | The builder manually tested split address fields, custom country/state menus, masked availability dates, resume handling, Canadian authorization and sponsorship, and reCAPTCHA exclusion. Regression tests cover Fabric selects, date formatting, nested radio groups, and bot fields                                                                                                                                          |
| Greenhouse                     | Builder-tested pilot      | 2026-07-20       | Direct Greenhouse pages were manually tested for profile fields, resume handling, same-page company/JD extraction, grounded drafting, commute mapping, Canadian work authorization, custom ARIA comboboxes, and supported voluntary answers. Embedded `job-boards.greenhouse.io` applications now have automated permission, frame-routing, and fill coverage; the Airbnb embed still needs a post-build manual acceptance pass |
| Workday                        | Next pilot                | Not yet tested   | The Workday pilot will expand multi-step navigation, site-owned widgets, repeated sections, and frame-aware workflows                                                                                                                                                                                                                                                                                                           |
| Lever                          | Exploration queue         | Not yet tested   | Planned after the next pilot milestone                                                                                                                                                                                                                                                                                                                                                                                          |
| Other application or ATS sites | Semantic HTML exploration | Ongoing          | Common accessible controls can benefit from the existing compatibility foundation while named-platform coverage continues to grow                                                                                                                                                                                                                                                                                               |

The ordinary HTML fixture is engineering evidence for common browser primitives, not a claim that a named third-party site works.

`Builder-tested pilot` records a successful hands-on test by the project builder. A named ATS graduates to `Supported` when its reusable fixture and browser checklist are complete.

## Pilot log maintenance

For each newly tested ATS, update the matrix with:

1. the ATS and public application surface;
2. the manual test date;
3. which capabilities were exercised, such as profile fields, custom selects, resume upload, open-answer drafting, multi-step behavior, and no-submit behavior;
4. new platform behavior and the next improvement opportunity; and
5. the regression fixture or test added for site-specific behavior.

Workday is the next planned pilot. Additional platforms join the matrix as each exploration produces reusable compatibility improvements.

## Capability matrix

| Capability                                                      | Current behavior                                                                                                                                             |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Text, email, phone, URL, date, textarea, and native select      | Scanned; high-confidence profile mappings can fill after a user action                                                                                       |
| Native radio and checkbox groups                                | Scanned and filled when a verified mapping and matching option exist                                                                                         |
| Accessible ARIA textbox, combobox, listbox, radio, and checkbox | Scanned; each ATS pilot expands the library of site-specific widget interactions                                                                             |
| Opaque generated IDs                                            | Classification also uses labels, names, `autocomplete`, input types, options, and limited question-container text                                            |
| Client-rendered or multi-step fields                            | A later scan discovers the current step and prepares it for applicant review                                                                                 |
| Cover-letter textareas                                          | Uses bounded page JD context and saved-resume evidence; asks for pasted JD when extraction is unavailable                                                    |
| Existing values                                                 | Preserved; generated open answers change only after explicit regeneration                                                                                    |
| Resume upload                                                   | Ordinary same-document inputs join the autofill workflow; custom uploader coverage expands through platform pilots                                           |
| Embedded Greenhouse application iframe                          | Scanned only for `job-boards.greenhouse.io` after the user grants the declared optional host permission; fields and actions are routed to their source frame |
| Other same-origin and cross-origin iframes                      | Planned frame-routing expansion                                                                                                                              |
| Site-owned shadow DOM                                           | Planned component-discovery expansion                                                                                                                        |
| Navigation and final submission                                 | Prepared for applicant review and completion                                                                                                                 |

## Access model

The extension uses Chrome's `activeTab` and `scripting` permissions. Clicking the toolbar action grants temporary access to that tab and explicitly opens its side panel; the automatic side-panel action behavior is disabled because it does not grant `activeTab` access. ApplyFlow injects its page helper only after that user gesture and Scan & Autofill. It has no `<all_urls>` permission. Persistent required host access is limited to the two local development origins.

When the active page contains an iframe whose resolved host is exactly `job-boards.greenhouse.io`, ApplyFlow requests the manifest-declared optional permission `https://job-boards.greenhouse.io/*`. If the user declines, scanning stops with an explanation. If granted, ApplyFlow discovers only the top document and permitted Greenhouse frames, injects the page helper into those frame IDs, and routes each scanned field back to its source frame for focus, fill, resume attachment, and inline writing assistance. It does not request or inject into unrelated iframe origins such as reCAPTCHA. Job context from the top careers page is preferred and passed to the Greenhouse frame without collecting full-page HTML.

Normalized field metadata may include the field label, ID, name, input type, `autocomplete`, available option labels, and up to 500 characters of text from a recognized question container. The scan may also include company, role, and up to 12,000 characters from `JobPosting` structured data or an explicit job-description container. Denied sensitive fields are excluded, including their values. The scanner does not collect full-page HTML.

## Pilot graduation criteria

A named site moves to Supported when a repeatable fixture and browser test demonstrate:

1. useful labels and high-confidence semantic classification;
2. deterministic fill without overwriting existing values;
3. safe handling of relevant native and custom controls;
4. inline drafting and live character-limit behavior where applicable;
5. a clear resume-upload workflow;
6. useful multi-step behavior; and
7. a complete applicant review and submission handoff.
