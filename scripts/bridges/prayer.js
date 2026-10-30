// Adapter used by React; installed at the original bootstrap point.
function installPrayerBridge() {
window.prayerBridge = {
  async intercessionVotes(payload) {
    const session = supabaseClient ? await supabaseClient.auth.getSession() : null;
    const token = session?.data?.session?.access_token;
    const response = await fetch(apiUrl("/api/prayer/intercession-votes"), {
      method: payload ? "POST" : "GET",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(payload ? { "Content-Type": "application/json" } : {}) },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.error || "Voting is unavailable. Please try again."), { status: response.status });
    return data;
  },
  async intercessionSessions(payload) {
    const session = supabaseClient ? await supabaseClient.auth.getSession() : null;
    const token = session?.data?.session?.access_token;
    const response = await fetch(apiUrl("/api/prayer/intercession-sessions"), {
      method: payload ? "POST" : "GET",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(payload ? { "Content-Type": "application/json" } : {}) },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.error || "Prayer stats are unavailable. Please try again."), { status: response.status });
    return data;
  },
  async intercessionReminders(payload) {
    const session = supabaseClient ? await supabaseClient.auth.getSession() : null;
    const token = session?.data?.session?.access_token;
    const response = await fetch(apiUrl("/api/prayer/intercession-reminders"), {
      method: payload ? "PUT" : "GET",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(payload ? { "Content-Type": "application/json" } : {}) },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.error || "Session reminders are unavailable. Please try again."), { status: response.status });
    return data;
  },
  getSelectableBackgroundOptions() {
    return profileCoverOptions.map((option) => ({
      ...option,
      index: prayerCardBackgrounds.findIndex((background) => background.src === option.src),
    }));
  },
  getBackgroundOptions() {
    return prayerCardBackgrounds.map((option) => ({ ...option }));
  },
  getSnapshot() {
    const currentPrayerUserId = supabaseUser?.id || prayerUserId;
    const sortPrayerRequests = (requests) => requests.sort((a, b) => {
      if (prayerState.sort === "recent") return String(b.createdAt).localeCompare(String(a.createdAt));
      const difference = prayerState.sort === "least" ? a.prayerCount - b.prayerCount : b.prayerCount - a.prayerCount;
      return difference || String(b.createdAt).localeCompare(String(a.createdAt));
    });
    const formatPrayerRequests = (requests) => requests.map((request) => ({
      ...request,
      preview: getPrayerPreview(request.text),
      hasPrayed: request.prayedBy?.includes(currentPrayerUserId),
      isNewlyPrayed: request.prayedBy?.includes(currentPrayerUserId) && request.prayerCount === 1,
      backgroundIndex: getPrayerBackgroundIndex(request),
    }));
    const eligibleRequests = prayerState.requests
      .filter((request) => {
        if (prayerState.pageTab === "request") {
          const isOwnRequest = supabaseClient ? request.ownerId === supabaseUser?.id : true;
          if (!isOwnRequest) return false;
        }
        if (prayerState.pageTab === "board" && getPrayerStatus(request) !== "active") return false;
        return true;
      });
    const requests = formatPrayerRequests(sortPrayerRequests(
      prayerState.pageTab === "board"
        ? eligibleRequests.filter((request) => prayerState.filter === "all" || (request.category || "general") === prayerState.filter)
        : eligibleRequests.slice(),
    ));
    const spotlightRequests = formatPrayerRequests(sortPrayerRequests(eligibleRequests.slice()));
    return {
      currentUserId: currentPrayerUserId,
      pageTab: prayerState.pageTab,
      filter: prayerState.filter,
      sort: prayerState.sort,
      myWallExpanded: prayerState.myWallExpanded,
      requestCategory: prayerCategory?.value || "general",
      backgroundIndex: selectedPrayerBackgroundIndex,
      feedback: prayerBridgeFeedback || prayerFeedback?.textContent || "",
      sent: prayerBridgeSent,
      isModerator: prayerModerator,
      moderationQueue: prayerModerator ? formatPrayerRequests(prayerState.requests.filter((request) => getPrayerStatus(request) === "pending")) : [],
      requests,
      spotlightRequests,
      ownRequests: formatPrayerRequests(prayerState.requests
        .filter((request) => supabaseClient ? Boolean(supabaseUser) && request.ownerId === supabaseUser.id : !request.ownerId || request.ownerId === prayerUserId)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))),
    };
  },
  setPageTab(tab) {
    const nextTab = ["board", "request", "online", "intercession"].includes(tab) ? tab : "board";
    const navigationRequest = new CustomEvent("prayer:before-page-tab-change", { cancelable: true, detail: { id: nextTab } });
    if (!window.dispatchEvent(navigationRequest)) return;
    prayerState.pageTab = nextTab;
    if (prayerState.pageTab === "request") startPrayerPromptRotation();
    else stopPrayerPromptRotation();
    renderPrayerPage();
  },
  setFilter(filter) {
    prayerState.filter = ["all", "general", "family", "health", "work", "faith", "other"].includes(filter) ? filter : "all";
    renderPrayerPage();
  },
  setSort(sort) {
    prayerState.sort = ["most", "least", "recent"].includes(sort) ? sort : "most";
    renderPrayerPage();
  },
  toggle(requestId) {
    const request = prayerState.requests.find((item) => item.id === requestId);
    if (!request) return;
    request.expanded = !request.expanded;
    renderPrayerPage();
  },
  async share(requestId) {
    const request = prayerState.requests.find((item) => item.id === requestId);
    if (!request) return;
    const shareText = `${request.title || "Prayer request"}\n\n${request.text}`;
    try {
      if (navigator.share) await navigator.share({ title: "Prayer request", text: shareText });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setPrayerBridgeFeedback("Prayer request copied to your clipboard.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") setPrayerBridgeFeedback("This request could not be shared.");
    }
  },
  async pray(requestId) {
    const request = prayerState.requests.find((item) => item.id === requestId);
    if (!request) return;
    if (supabaseClient && !supabaseUser) {
      setPrayerBridgeFeedback("Sign in to record your prayer.");
      return;
    }
    const userId = supabaseUser?.id || prayerUserId;
    const wasPrayed = (request.prayedBy || []).includes(userId);
    let pending = pendingPrayerToggles.get(requestId);
    const alreadySyncing = Boolean(pending);
    if (!pending) {
      pending = { confirmed: wasPrayed, desired: wasPrayed, count: request.prayerCount || 0 };
      pendingPrayerToggles.set(requestId, pending);
    }
    pending.desired = !pending.desired;
    const applyState = () => {
      const current = prayerState.requests.find((item) => item.id === requestId);
      if (!current) return;
      const others = (current.prayedBy || []).filter((id) => id !== userId);
      current.prayedBy = pending.desired ? [...others, userId] : others;
      current.prayerCount = Math.max(0, pending.count + Number(pending.desired) - Number(pending.confirmed));
      renderPrayerPage();
    };
    applyState();
    if (alreadySyncing) return;
    try {
      if (supabaseClient && supabaseUser) {
        // A second click updates the desired state while the first RPC finishes.
        while (pending.desired !== pending.confirmed) {
          const target = pending.desired;
          let { data, error } = await supabaseClient.rpc(target ? "pray_for_request" : "unpray_for_request", { request_uuid: requestId });
          if (!target && error?.code === "PGRST202") {
            const { data: sessionData } = await supabaseClient.auth.getSession();
            const response = await fetch(apiUrl("/api/prayer/cancel"), {
              method: "POST",
              headers: { "content-type": "application/json", authorization: `Bearer ${sessionData?.session?.access_token || ""}` },
              body: JSON.stringify({ requestId }),
            });
            const payload = await response.json();
            error = response.ok ? null : new Error(payload.error || "Your prayer could not be cancelled.");
            data = payload.count;
          }
          if (error) throw error;
          pending.count = typeof data === "number" ? data : Math.max(0, pending.count + (target ? 1 : -1));
          pending.confirmed = target;
          applyState();
        }
      }
      savePrayerRequests();
    } catch (error) {
      pending.desired = pending.confirmed;
      applyState();
      setPrayerBridgeFeedback(error.message || "Your prayer could not be updated.");
    } finally {
      pendingPrayerToggles.delete(requestId);
    }
  },
  setCategory(category) {
    setPrayerCategory(category);
    emitPrayerStateChange();
  },
  async submit(title, text, category, backgroundIndex, acceptedTerms = false) {
    const cleanTitle = String(title || "").trim();
    const cleanText = String(text || "").trim();
    const wordCount = countPrayerWords(cleanText);
    const moderationMessage = getPrayerModerationMessage(cleanText);
    if (!cleanTitle || !cleanText || wordCount > 300) {
      setPrayerBridgeFeedback(wordCount > 300 ? "Please keep your request under 300 words." : (!cleanTitle ? "Add a title to your prayer request." : "Write a prayer request first."));
      return false;
    }
    if (moderationMessage) {
      setPrayerBridgeFeedback(moderationMessage);
      return false;
    }
    if (containsPersonalContactInfo(`${cleanTitle}\n${cleanText}`)) {
      setPrayerBridgeFeedback("For everyone’s safety, remove email addresses and phone numbers before posting.");
      return false;
    }
    if (!acceptedTerms) {
      setPrayerBridgeFeedback("Accept the community rules before sending a request.");
      return false;
    }
    if (supabaseClient && !supabaseUser) {
      setPrayerBridgeFeedback("Sign in to share a prayer request with the community.");
      return false;
    }
    if (supabaseClient && supabaseUser) {
      const created = await createPrayerRequest(cleanTitle, cleanText, category, false, backgroundIndex);
      if (!created) return false;
    } else {
      prayerState.requests.unshift({
        id: `prayer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ownerId: prayerUserId,
        title: cleanTitle,
        text: cleanText,
        prayerCount: 0,
        prayedBy: [],
        createdAt: new Date().toISOString(),
        category,
        urgent: false,
        backgroundIndex,
        status: "active",
      });
      savePrayerRequests();
    }
    setPrayerCategory("general");
    selectedPrayerBackgroundIndex = 0;
    prayerState.pageTab = "request";
    prayerState.myWallExpanded = true;
    prayerState.filter = "all";
    prayerBridgeFeedback = "Your prayer request has been shared with the community.";
    prayerBridgeSent = true;
    window.setTimeout(() => {
      prayerBridgeSent = false;
      emitPrayerStateChange();
    }, 1800);
    renderPrayerPage();
    return true;
  },
  async report(requestId, reason, details) {
    const report = await reportPrayerRequest(requestId, reason, details);
    setPrayerBridgeFeedback(report.remote ? "Thank you. Your report was sent to the moderation team." : "Thank you. Your report is saved for review on this device.");
    emitPrayerStateChange();
  },
  async block(authorId) {
    await blockPrayerAuthor(authorId);
    setPrayerBridgeFeedback("This user’s prayer requests are now hidden on this device.");
    emitPrayerStateChange();
  },
  async moderate(requestId, nextStatus) {
    await moderatePrayerRequest(requestId, nextStatus);
    setPrayerBridgeFeedback(nextStatus === "active" ? "Prayer request approved." : "Prayer request removed from the public wall.");
    emitPrayerStateChange();
  },
};
}
