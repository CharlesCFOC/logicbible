window.churchBridge = {
  async sessionRequest(path, payload) {
    const response = await fetch(`/api/sessions/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "La commande de session a échoué.");
    return result;
  },
  async startOpenSession(accessCode, adminPassword) {
    return this.sessionRequest("start", { accessCode, adminPassword });
  },
  async controlOpenSession(accessCode, adminPassword, slides, index) {
    return this.sessionRequest("control", { accessCode, adminPassword, slides, index });
  },
  async startOpenSessionActivity(accessCode, adminPassword, activityIndex) {
    return this.sessionRequest("activity", { accessCode, adminPassword, activityIndex });
  },
  async endOpenSession(accessCode, adminPassword) {
    return this.sessionRequest("end", { accessCode, adminPassword });
  },
};
