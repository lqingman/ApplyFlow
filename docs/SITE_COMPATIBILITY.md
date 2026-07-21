# Site compatibility

ApplyProof supports sites only after repeatable compatibility testing. It does not claim universal ATS support, and a form that happens to work is not automatically an advertised integration.

## Supported-site matrix

| Environment                    | Status                           | Last manual test | Evidence and current boundary                                                                                                                                                                                                                                                               |
| ------------------------------ | -------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Northstar Labs local demo      | Supported                        | 2026-07-20       | Complete scan, deterministic fill, resume attachment, inline drafting, existing-value protection, and no-submit regression coverage                                                                                                                                                         |
| Ordinary semantic HTML fixture | Compatibility baseline only      | 2026-07-20       | Regression tests cover opaque IDs, labels, names, input types, `autocomplete`, options, limited surrounding question text, and client-rendered later steps                                                                                                                                  |
| Workable                       | Builder-tested pilot             | 2026-07-20       | The builder completed a real-site manual application test. The result establishes hands-on compatibility evidence, but a named Workable regression fixture and a documented repeatable capability checklist are still pending                                                               |
| BambooHR                       | Builder-tested pilot             | 2026-07-20       | The builder manually tested split address fields, custom country/state menus, masked availability dates, resume handling, Canadian authorization and sponsorship, and reCAPTCHA exclusion. Regression tests cover Fabric selects, date formatting, nested radio groups, and bot fields      |
| Greenhouse                     | Builder-tested pilot             | 2026-07-20       | The builder manually tested profile fields, resume handling, same-page company/JD extraction, grounded motivation drafting, commute mapping, Canadian work authorization, custom ARIA comboboxes, and supported voluntary answers. Targeted regression fixtures cover these custom controls |
| Workday                        | Planned pilot                    | Not yet tested   | The builder intends to test Workday next. Multi-step navigation, site-owned widgets, repeated sections, and iframe boundaries must be documented during the pilot                                                                                                                           |
| Lever                          | Not yet tested                   | Not yet tested   | No end-to-end site pilot completed                                                                                                                                                                                                                                                          |
| Other application or ATS sites | Not supported unless listed here | Not yet tested   | Compatibility has not been established                                                                                                                                                                                                                                                      |

The ordinary HTML fixture is engineering evidence for common browser primitives, not a claim that a named third-party site works.

`Builder-tested pilot` records a successful hands-on test by the project builder. It is intentionally separate from `Supported`: a named ATS moves to Supported only after the repeatable evidence in the pilot exit criteria is complete.

## Pilot log maintenance

For each newly tested ATS, update the matrix with:

1. the ATS and public application surface;
2. the manual test date;
3. which capabilities were exercised, such as profile fields, custom selects, resume upload, open-answer drafting, multi-step behavior, and no-submit behavior;
4. any manual fallback or known failure; and
5. the regression fixture or test added for site-specific behavior.

Planned future pilots currently include Workday. Add other ATS platforms as they are tested rather than treating ordinary semantic compatibility as proof of site-level support.

## Capability matrix

| Capability                                                      | Current behavior                                                                                                           |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Text, email, phone, URL, date, textarea, and native select      | Scanned; high-confidence profile mappings can fill after a user action                                                     |
| Native radio and checkbox groups                                | Scanned and filled when a verified mapping and matching option exist                                                       |
| Accessible ARIA textbox, combobox, listbox, radio, and checkbox | Scanned; filling complex site-specific widgets is only partially supported                                                 |
| Opaque generated IDs                                            | Classification also uses labels, names, `autocomplete`, input types, options, and limited question-container text          |
| Client-rendered or multi-step fields                            | A later user-initiated scan discovers the current step; ApplyProof never clicks Next or Continue                           |
| Cover-letter textareas                                          | Uses bounded page JD context and saved-resume evidence; asks for pasted JD when extraction is unavailable                  |
| Existing values                                                 | Preserved; generated open answers change only after explicit regeneration                                                  |
| Resume upload                                                   | Ordinary same-document file inputs are supported after an explicit user action; custom uploaders may require manual upload |
| Same-origin and cross-origin iframes                            | Not scanned in the current pilot                                                                                           |
| Site-owned shadow DOM                                           | Not scanned in the current pilot                                                                                           |
| Navigation and final submission                                 | Never performed by ApplyProof                                                                                              |

## Access model

The extension uses Chrome's `activeTab` and `scripting` permissions. Clicking the toolbar action grants temporary access to that tab and explicitly opens its side panel; the automatic side-panel action behavior is disabled because it does not grant `activeTab` access. ApplyProof injects its page helper only after that user gesture and Scan & Autofill. It has no persistent permission for online job sites and no `<all_urls>` permission. Persistent host access is limited to the two local development origins.

Normalized field metadata may include the field label, ID, name, input type, `autocomplete`, available option labels, and up to 500 characters of text from a recognized question container. The scan may also include company, role, and up to 12,000 characters from `JobPosting` structured data or an explicit job-description container. Denied sensitive fields are excluded, including their values. The scanner does not collect full-page HTML.

## Pilot exit criteria

A named site can move to Supported only after a repeatable fixture and browser test demonstrate:

1. useful labels and high-confidence semantic classification;
2. deterministic fill without overwriting existing values;
3. safe handling of relevant native and custom controls;
4. inline drafting and live character-limit behavior where applicable;
5. an explicit resume-upload outcome or documented manual fallback;
6. multi-step behavior that leaves navigation to the user; and
7. no automatic Continue, Next, or Submit action.
