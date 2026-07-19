import { useState } from "react";
import { mayaProfile } from "@applyproof/sample-data";
import type { FillResult, NormalizedField } from "@applyproof/shared-types";

import { planAutofill, type FieldDecision } from "./autofill";
import { fillActivePage, focusField, scanActivePage } from "./browser";

type WorkflowStatus = "idle" | "working" | "complete" | "error";

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "ApplyProof could not complete the workflow. Try again.";
}

function applyFillResults(decisions: FieldDecision[], results: FillResult[]) {
  const byField = new Map(results.map((result) => [result.fieldId, result]));
  return decisions.map((decision): FieldDecision => {
    if (decision.action !== "fill") return decision;
    const result = byField.get(decision.field.id);
    if (result?.status === "filled") return decision;
    return {
      ...decision,
      action: "review",
      reason:
        result?.status === "skipped_existing"
          ? "Existing value was preserved. Review it before replacing."
          : "ApplyProof could not safely fill this field. Please complete it manually.",
    };
  });
}

export function App() {
  const [profileSelected, setProfileSelected] = useState(false);
  const [fields, setFields] = useState<NormalizedField[]>([]);
  const [decisions, setDecisions] = useState<FieldDecision[]>([]);
  const [blockedCount, setBlockedCount] = useState(0);
  const [status, setStatus] = useState<WorkflowStatus>("idle");
  const [message, setMessage] = useState(
    "Choose a trusted profile before scanning this application.",
  );

  const reviewItems = decisions.filter((item) => item.action === "review");
  const filledCount = decisions.filter((item) => item.action === "fill").length;
  const skippedCount = decisions.filter(
    (item) => item.action === "skip",
  ).length;

  function selectProfile() {
    setProfileSelected(true);
    setMessage("Maya's verified profile is ready for safe autofill.");
  }

  function clearProfile() {
    setProfileSelected(false);
    setFields([]);
    setDecisions([]);
    setBlockedCount(0);
    setStatus("idle");
    setMessage("Choose a trusted profile before scanning this application.");
  }

  async function handleAutofill() {
    if (!profileSelected) return;
    setStatus("working");
    setMessage("Scanning fields and applying verified profile data…");
    try {
      const scan = await scanActivePage();
      const plan = planAutofill(mayaProfile, scan.fields);
      const results = await fillActivePage(plan.fills);
      const completed = applyFillResults(plan.decisions, results);
      setFields(scan.fields);
      setBlockedCount(scan.blockedCount);
      setDecisions(completed);
      setStatus("complete");
      const filled = completed.filter((item) => item.action === "fill").length;
      const review = completed.filter(
        (item) => item.action === "review",
      ).length;
      setMessage(
        `Filled ${filled} verified fields. ${review} ${review === 1 ? "item needs" : "items need"} your attention.`,
      );
    } catch (error) {
      setStatus("error");
      setMessage(errorMessage(error));
    }
  }

  async function handleFocus(field: NormalizedField) {
    try {
      await focusField(field.id);
    } catch (error) {
      setStatus("error");
      setMessage(errorMessage(error));
    }
  }

  return (
    <main className="panel-shell">
      <header className="brand">
        <span className="brand-mark" aria-hidden="true">
          AP
        </span>
        <div>
          <p className="eyebrow">Evidence-first autofill</p>
          <h1>ApplyProof</h1>
        </div>
      </header>

      <section
        className={`profile-card ${profileSelected ? "is-selected" : ""}`}
        aria-labelledby="profile-heading"
      >
        <div className="profile-heading">
          <span className="avatar" aria-hidden="true">
            MC
          </span>
          <div>
            <p className="eyebrow">1 · Trusted profile</p>
            <h2 id="profile-heading">{mayaProfile.displayName}</h2>
            <p>{mayaProfile.headline}</p>
          </div>
          {profileSelected && <span className="selected-badge">Selected</span>}
        </div>

        {profileSelected ? (
          <>
            <div className="profile-facts">
              <span>{mayaProfile.identity.email}</span>
              <span>{mayaProfile.education.degree}</span>
              <span>{mayaProfile.evidence.length} evidence records</span>
            </div>
            <details className="profile-details">
              <summary>Inspect profile evidence</summary>
              <ul>
                {mayaProfile.evidence.map((record) => (
                  <li key={record.id}>{record.text}</li>
                ))}
              </ul>
            </details>
            <button
              className="text-button"
              type="button"
              onClick={clearProfile}
            >
              Change profile
            </button>
          </>
        ) : (
          <button
            className="secondary-button"
            type="button"
            onClick={selectProfile}
          >
            Use Maya demo profile
          </button>
        )}
      </section>

      <section className="scan-hero" aria-labelledby="autofill-heading">
        <div className="scan-heading">
          <span className="stage-number">2</span>
          <div>
            <p className="eyebrow">Application</p>
            <h2 id="autofill-heading">Scan &amp; Autofill</h2>
          </div>
        </div>
        <p className="scan-copy">
          Fill direct profile matches, preserve existing answers, and route
          sensitive decisions to review.
        </p>
        <button
          className="primary-button"
          type="button"
          onClick={handleAutofill}
          disabled={!profileSelected || status === "working"}
        >
          {status === "working"
            ? "Scanning & filling…"
            : status === "complete"
              ? "Run again"
              : "Scan & Autofill"}
        </button>
        <p
          className={`scan-status ${status === "error" ? "is-error" : ""}`}
          role="status"
        >
          <span aria-hidden="true">{status === "error" ? "!" : "✓"}</span>
          {message}
        </p>
      </section>

      {status === "complete" && (
        <>
          <section className="results" aria-labelledby="results-heading">
            <div className="inventory-heading">
              <div>
                <p className="eyebrow">Outcome</p>
                <h2 id="results-heading">Autofill summary</h2>
              </div>
              <span className="privacy-pill">User initiated</span>
            </div>
            <div className="result-grid">
              <div className="result-stat is-filled">
                <strong>{filledCount}</strong>
                <span>Safely filled</span>
              </div>
              <div className="result-stat is-review">
                <strong>{reviewItems.length}</strong>
                <span>Need review</span>
              </div>
              <div className="result-stat">
                <strong>{skippedCount}</strong>
                <span>Skipped</span>
              </div>
              <div className="result-stat is-blocked">
                <strong>{blockedCount}</strong>
                <span>Blocked</span>
              </div>
            </div>
          </section>

          <section className="review-queue" aria-labelledby="review-heading">
            <div className="inventory-heading">
              <div>
                <p className="eyebrow">3 · Your attention</p>
                <h2 id="review-heading">Review queue</h2>
              </div>
              <span className="review-count">{reviewItems.length}</span>
            </div>
            {reviewItems.length ? (
              <ol className="review-list">
                {reviewItems.map((item) => (
                  <li key={item.field.id}>
                    <button
                      type="button"
                      onClick={() => handleFocus(item.field)}
                    >
                      <span>
                        <strong>{item.field.label}</strong>
                        <em>Needs review</em>
                        <small>{item.reason}</small>
                      </span>
                      <span aria-hidden="true">↗</span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="empty-state">Nothing needs review.</p>
            )}
          </section>

          <details className="inventory-details">
            <summary>View all {fields.length} detected safe fields</summary>
            <ol className="field-list">
              {fields.map((field) => (
                <li className="field-card" key={`${field.kind}-${field.id}`}>
                  <button type="button" onClick={() => handleFocus(field)}>
                    <span className="field-card-heading">
                      <strong>{field.label}</strong>
                      <span aria-hidden="true">↗</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </details>
        </>
      )}

      <footer>
        <span>Local demo mode</span>
        <span>No automatic submission</span>
      </footer>
    </main>
  );
}
