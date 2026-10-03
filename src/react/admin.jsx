import React, { useEffect, useState } from "react";

const reportLabels = {
  "personal-information": "Private information",
  bullying: "Bullying or harassment",
  "sexual-content": "Sexual content",
  violence: "Violence or threats",
  spam: "Spam",
  other: "Other",
};

function formatDate(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Just now" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function AdminPage() {
  const bridge = window.moderationBridge;
  const [state, setState] = useState(() => bridge.getSnapshot());
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState("");

  useEffect(() => {
    const update = () => setState(bridge.getSnapshot());
    document.addEventListener("moderation:change", update);
    return () => document.removeEventListener("moderation:change", update);
  }, [bridge]);

  useEffect(() => {
    if (state.unlocked) bridge.refresh();
  }, [bridge, state.unlocked]);

  const unlock = (event) => {
    event.preventDefault();
    if (!bridge.unlock(code)) {
      setError("Incorrect code.");
      setCode("");
      return;
    }
    setError("");
    setState(bridge.getSnapshot());
  };

  const resolve = async (reportId, action) => {
    setWorkingId(reportId);
    try {
      await bridge.resolve(reportId, action);
    } catch (nextError) {
      setError(nextError.message || "This report could not be updated.");
    } finally {
      setWorkingId("");
    }
  };

  if (!state.unlocked) {
    return <main className="admin-lock-screen">
      <button type="button" className="admin-back" onClick={() => window.appNavigate?.("profile")}>← Profile</button>
      <section className="admin-lock-card" aria-labelledby="admin-lock-title">
        <span>MODERATION</span>
        <h1 id="admin-lock-title">Admin access</h1>
        <p>Enter the admin code to review reports.</p>
        <form onSubmit={unlock}>
          <label><span>Admin code</span><input type="password" inputMode="numeric" autoComplete="off" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 3))} maxLength="3" required autoFocus /></label>
          {error && <p role="alert">{error}</p>}
          <button type="submit">Unlock</button>
        </form>
      </section>
    </main>;
  }

  const openReports = state.reports.filter((report) => report.status === "open");
  const reviewedReports = state.reports.filter((report) => report.status !== "open");
  const renderReport = (report) => <article className={`admin-report${report.status === "open" ? " is-open" : ""}`} key={report.id}>
    <header><span>{reportLabels[report.reason] || "Report"}</span><time>{formatDate(report.createdAt)}</time></header>
    <h2>{report.requestTitle}</h2>
    <p className="admin-report-request">{report.requestText}</p>
    {report.details && <p className="admin-report-details"><strong>Reporter note:</strong> {report.details}</p>}
    <footer>
      <small>{report.status === "open" ? "Needs review" : report.status === "resolved" ? "Content hidden" : "Reviewed"}</small>
      {report.status === "open" && <div><button type="button" onClick={() => resolve(report.id, "reviewed")} disabled={workingId === report.id}>Keep</button><button type="button" className="admin-hide-button" onClick={() => resolve(report.id, "hide")} disabled={workingId === report.id}>{workingId === report.id ? "Saving…" : "Hide content"}</button></div>}
    </footer>
  </article>;

  return <main className="admin-screen-content">
    <header className="admin-page-header"><button type="button" onClick={() => window.appNavigate?.("profile")}>←</button><div><span>MODERATION</span><h1>Admin review</h1></div><button type="button" className="admin-lock-button" onClick={() => { bridge.lock(); setState(bridge.getSnapshot()); }}>Lock</button></header>
    <section className="admin-summary"><strong>{openReports.length}</strong><span>open report{openReports.length === 1 ? "" : "s"}</span></section>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <section className="admin-report-section" aria-labelledby="admin-open-reports"><h2 id="admin-open-reports">Needs review</h2>{openReports.length ? openReports.map(renderReport) : <p className="admin-empty">No reports waiting for review.</p>}</section>
    {reviewedReports.length > 0 && <section className="admin-report-section" aria-labelledby="admin-reviewed-reports"><h2 id="admin-reviewed-reports">Recently handled</h2>{reviewedReports.map(renderReport)}</section>}
  </main>;
}
