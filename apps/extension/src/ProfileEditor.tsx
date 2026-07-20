import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  candidateProfileSchema,
  type CandidateProfile,
  type EvidenceRecord,
} from "@applyproof/shared-types";

import type { ParsedResume } from "./resumeTextParser";

type ProfileEditorProps = {
  profile: CandidateProfile | null;
  onCancel: () => void;
  onSave: (profile: CandidateProfile) => Promise<void>;
};

type ProfileDraft = {
  headline: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  portfolio: string;
  school: string;
  degree: string;
  graduationDate: string;
  startDate: string;
  relocation: "" | "yes" | "no";
  workAuthorization: "" | CandidateProfile["workAuthorization"]["canada"];
  genderIdentity: "" | CandidateProfile["demographics"]["genderIdentity"];
  evidenceText: string;
};

function draftFrom(profile: CandidateProfile | null): ProfileDraft {
  return {
    headline: profile?.headline ?? "",
    firstName: profile?.identity.firstName ?? "",
    lastName: profile?.identity.lastName ?? "",
    email: profile?.identity.email ?? "",
    phone: profile?.identity.phone ?? "",
    location: profile?.identity.location ?? "",
    portfolio: profile?.links.portfolio ?? "",
    school: profile?.education.school ?? "",
    degree: profile?.education.degree ?? "",
    graduationDate: profile?.education.graduationDate ?? "",
    startDate: profile?.availability.startDate ?? "",
    relocation: profile?.availability.relocation ?? "",
    workAuthorization: profile?.workAuthorization.canada ?? "",
    genderIdentity: profile?.demographics.genderIdentity ?? "",
    evidenceText:
      profile?.evidence.map((record) => record.text).join("\n") ?? "",
  };
}

function evidenceFrom(
  evidenceText: string,
  existing: EvidenceRecord[],
): EvidenceRecord[] {
  return evidenceText
    .split("\n")
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text, index) =>
      existing.find((record) => record.text === text)
        ? (existing.find((record) => record.text === text) as EvidenceRecord)
        : {
            id: `profile-evidence-${index + 1}`,
            category: "profile" as const,
            text,
            source: "My Profile",
          },
    );
}

function profileFromDraft(
  draft: ProfileDraft,
  existing: CandidateProfile | null,
) {
  return candidateProfileSchema.parse({
    id: "my-profile",
    displayName: `${draft.firstName.trim()} ${draft.lastName.trim()}`.trim(),
    headline: draft.headline.trim(),
    identity: {
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      location: draft.location.trim(),
    },
    links: { portfolio: draft.portfolio.trim() },
    education: {
      school: draft.school.trim(),
      degree: draft.degree.trim(),
      graduationDate: draft.graduationDate,
    },
    availability: {
      startDate: draft.startDate,
      relocation: draft.relocation,
    },
    workAuthorization: { canada: draft.workAuthorization },
    demographics: { genderIdentity: draft.genderIdentity },
    evidence: evidenceFrom(draft.evidenceText, existing?.evidence ?? []),
  });
}

function mergeResume(draft: ProfileDraft, resume: ParsedResume): ProfileDraft {
  const importedEvidence = resume.evidence.filter(
    (line) => !draft.evidenceText.split("\n").includes(line),
  );
  return {
    ...draft,
    firstName: resume.firstName ?? draft.firstName,
    lastName: resume.lastName ?? draft.lastName,
    headline: resume.headline ?? draft.headline,
    email: resume.email ?? draft.email,
    phone: resume.phone ?? draft.phone,
    location: resume.location ?? draft.location,
    portfolio: resume.portfolio ?? draft.portfolio,
    school: resume.school ?? draft.school,
    degree: resume.degree ?? draft.degree,
    graduationDate: resume.graduationDate ?? draft.graduationDate,
    evidenceText: [draft.evidenceText.trim(), ...importedEvidence]
      .filter(Boolean)
      .join("\n"),
  };
}

export function ProfileEditor({
  profile,
  onCancel,
  onSave,
}: ProfileEditorProps) {
  const [draft, setDraft] = useState(() => draftFrom(profile));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  function set<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave(profileFromDraft(draft, profile));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "My Profile could not be saved.",
      );
      setSaving(false);
    }
  }

  async function handleResumeImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setImportMessage("");
    setImporting(true);
    try {
      const { importResumeFile } = await import("./resumeImport");
      const resume = await importResumeFile(file);
      setDraft((current) => mergeResume(current, resume));
      const factCount = Object.entries(resume).filter(
        ([key, value]) => key !== "evidence" && Boolean(value),
      ).length;
      setImportMessage(
        `Imported ${factCount} profile fields and ${resume.evidence.length} evidence ${resume.evidence.length === 1 ? "item" : "items"} from ${file.name}. Review every field before saving.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "This resume could not be read.",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <form className="profile-editor" onSubmit={submit}>
      <div className="editor-heading">
        <div>
          <p className="eyebrow">My Profile</p>
          <h2>{profile ? "Edit profile" : "Create profile"}</h2>
        </div>
        <button className="text-button" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <fieldset className="resume-import">
        <legend>Import resume</legend>
        <p className="field-help">
          Extract a Word (.docx) or PDF (.pdf) resume locally. The file is not
          saved or uploaded.
        </p>
        <label className={`file-button ${importing ? "is-disabled" : ""}`}>
          {importing ? "Reading resume…" : "Choose Word or PDF resume"}
          <input
            type="file"
            accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={importing}
            onChange={(event) => void handleResumeImport(event)}
          />
        </label>
        {importMessage && (
          <p className="import-status" role="status">
            {importMessage}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend>Identity and contact</legend>
        <div className="field-grid two-columns">
          <label>
            First name
            <input
              required
              value={draft.firstName}
              onChange={(event) => set("firstName", event.target.value)}
            />
          </label>
          <label>
            Last name
            <input
              required
              value={draft.lastName}
              onChange={(event) => set("lastName", event.target.value)}
            />
          </label>
        </div>
        <label>
          Headline
          <input
            required
            value={draft.headline}
            onChange={(event) => set("headline", event.target.value)}
          />
        </label>
        <label>
          Email
          <input
            required
            type="email"
            value={draft.email}
            onChange={(event) => set("email", event.target.value)}
          />
        </label>
        <label>
          Phone
          <input
            required
            type="tel"
            value={draft.phone}
            onChange={(event) => set("phone", event.target.value)}
          />
        </label>
        <label>
          Location
          <input
            required
            value={draft.location}
            onChange={(event) => set("location", event.target.value)}
          />
        </label>
        <label>
          Portfolio or GitHub URL
          <input
            required
            type="url"
            value={draft.portfolio}
            onChange={(event) => set("portfolio", event.target.value)}
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Education and availability</legend>
        <label>
          School
          <input
            required
            value={draft.school}
            onChange={(event) => set("school", event.target.value)}
          />
        </label>
        <label>
          Degree
          <input
            required
            value={draft.degree}
            onChange={(event) => set("degree", event.target.value)}
          />
        </label>
        <div className="field-grid two-columns">
          <label>
            Graduation date
            <input
              required
              type="date"
              value={draft.graduationDate}
              onChange={(event) => set("graduationDate", event.target.value)}
            />
          </label>
          <label>
            Earliest start date
            <input
              required
              type="date"
              value={draft.startDate}
              onChange={(event) => set("startDate", event.target.value)}
            />
          </label>
        </div>
        <label>
          Open to relocation
          <select
            required
            value={draft.relocation}
            onChange={(event) =>
              set(
                "relocation",
                event.target.value as ProfileDraft["relocation"],
              )
            }
          >
            <option value="">Choose an answer</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>Explicit application choices</legend>
        <p className="field-help">
          ApplyProof saves these choices; it never infers them from your resume.
        </p>
        <label>
          Canadian work authorization
          <select
            required
            value={draft.workAuthorization}
            onChange={(event) =>
              set(
                "workAuthorization",
                event.target.value as ProfileDraft["workAuthorization"],
              )
            }
          >
            <option value="">Choose an answer</option>
            <option value="authorized">Authorized to work in Canada</option>
            <option value="requires_sponsorship">
              Require sponsorship now or in the future
            </option>
            <option value="decline">Prefer not to say</option>
          </select>
        </label>
        <label>
          Gender identity
          <select
            required
            value={draft.genderIdentity}
            onChange={(event) =>
              set(
                "genderIdentity",
                event.target.value as ProfileDraft["genderIdentity"],
              )
            }
          >
            <option value="">Choose an answer</option>
            <option value="woman">Woman</option>
            <option value="man">Man</option>
            <option value="nonbinary">Non-binary</option>
            <option value="decline">Prefer not to say</option>
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>Resume evidence</legend>
        <label>
          One verified fact per line
          <textarea
            rows={5}
            value={draft.evidenceText}
            onChange={(event) => set("evidenceText", event.target.value)}
          />
        </label>
      </fieldset>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="primary-button" type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save My Profile"}
      </button>
    </form>
  );
}
