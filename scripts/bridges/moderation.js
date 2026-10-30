// Adapter used by React; installed at the original bootstrap point.
function installModerationBridge() {
window.moderationBridge = {
  getSnapshot() {
    return {
      unlocked: moderationAdminUnlocked,
      reports: moderationReports.map((report) => {
        const request = prayerState.requests.find((item) => item.id === report.requestId);
        return {
          ...report,
          requestTitle: request?.title || report.requestTitle || "Prayer request",
          requestText: request?.text || report.requestText || "This request is no longer available.",
          requestStatus: request?.status || report.requestStatus || "unknown",
        };
      }),
    };
  },
  unlock(code) {
    moderationAdminUnlocked = String(code || "") === "158";
    if (moderationAdminUnlocked) sessionStorage.setItem("brother.moderationAdminUnlocked", "true");
    return moderationAdminUnlocked;
  },
  lock() {
    moderationAdminUnlocked = false;
    sessionStorage.removeItem("brother.moderationAdminUnlocked");
    document.dispatchEvent(new CustomEvent("moderation:change"));
  },
  async refresh() {
    await loadModerationReports();
  },
  async resolve(reportId, action) {
    await resolveModerationReport(reportId, action);
  },
  open() {
    setScreen("admin");
  },
};
}
