const stages = [
  {
    name: "Profile",
    description: "Choose the candidate information ApplyProof may use.",
    state: "Ready in Phase 3",
  },
  {
    name: "Analyze",
    description:
      "Detect application fields without collecting unrelated page content.",
    state: "Ready in Phase 2",
  },
  {
    name: "Review",
    description: "Inspect grounded drafts, evidence, confidence, and warnings.",
    state: "Ready in Phase 4",
  },
  {
    name: "Audit",
    description:
      "Check required fields and unsupported claims before you submit.",
    state: "Ready in Phase 5",
  },
] as const;

export function App() {
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

      <section className="intro" aria-labelledby="foundation-heading">
        <span className="status-dot" aria-hidden="true" />
        <div>
          <p className="eyebrow">Demo foundation</p>
          <h2 id="foundation-heading">Your application copilot is ready.</h2>
          <p>
            The Phase 1 shell is connected. Scanning, safe fills, and evidence
            review arrive in the next milestones.
          </p>
        </div>
      </section>

      <nav aria-label="ApplyProof workflow">
        <ol className="stage-list">
          {stages.map((stage, index) => (
            <li className="stage-card" key={stage.name}>
              <span className="stage-number">{index + 1}</span>
              <div>
                <div className="stage-heading">
                  <h3>{stage.name}</h3>
                  <span>{stage.state}</span>
                </div>
                <p>{stage.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </nav>

      <footer>
        <span>Local demo mode</span>
        <span>No application data sent</span>
      </footer>
    </main>
  );
}
