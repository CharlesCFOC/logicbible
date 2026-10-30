// Legacy features/prayer: loaded before script.js; declarations only.
// Shared state remains in script.js during the incremental React migration.

function countPrayerWords(value) {
  return String(value || "").trim() ? String(value).trim().split(/\s+/).length : 0;
}

function getPrayerModerationMessage(text) {
  const links = String(text || "").match(/https?:\/\/\S+/gi) || [];
  if (links.length > 1) return "Please remove extra links from your request.";
  if (/(.)\1{9,}/.test(String(text || ""))) return "Please check your request and remove repeated characters.";
  return "";
}

function getPrayerStatus(request) {
  return ["pending", "active", "archived", "answered", "rejected"].includes(request.status)
    ? request.status
    : "active";
}

function getPrayerPreview(text, wordLimit = 6) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  return words.length > wordLimit ? `${words.slice(0, wordLimit).join(" ")}...` : words.join(" ");
}

function stopPrayerPromptRotation() {
  window.clearInterval(prayerPromptTimer);
  window.clearTimeout(prayerPromptFadeTimer);
  prayerPromptTimer = null;
  prayerPromptFadeTimer = null;
  prayerRequestInput?.classList.remove("is-placeholder-fading");
}

function startPrayerPromptRotation() {
  if (!prayerRequestInput || prayerRequestInput.value.trim()) return;
  stopPrayerPromptRotation();
  prayerRequestInput.placeholder = prayerPrompts[prayerPromptIndex];
  prayerPromptTimer = window.setInterval(() => {
    if (prayerRequestInput.value.trim()) {
      stopPrayerPromptRotation();
      return;
    }
    prayerRequestInput.classList.add("is-placeholder-fading");
    prayerPromptFadeTimer = window.setTimeout(() => {
      prayerPromptIndex = (prayerPromptIndex + 1) % prayerPrompts.length;
      prayerRequestInput.placeholder = prayerPrompts[prayerPromptIndex];
      prayerRequestInput.classList.remove("is-placeholder-fading");
    }, 260);
  }, 2200);
}

function setPrayerCategory(value) {
  if (prayerCategory) prayerCategory.value = value;
  prayerCategoryOptions.forEach((option) => {
    option.classList.toggle("is-active", option.dataset.prayerCategoryOption === value);
  });
  prayerCategoryOptions
    .find((option) => option.dataset.prayerCategoryOption === value)
    ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
}

function showPrayerSentState() {
  if (!prayerSubmitButton || !prayerSubmitLabel) return;
  window.clearTimeout(prayerSubmitResetTimer);
  prayerSubmitButton.classList.add("is-sent");
  prayerSubmitLabel.textContent = "Sent";
  prayerSubmitResetTimer = window.setTimeout(() => {
    prayerSubmitButton.classList.remove("is-sent");
    prayerSubmitLabel.textContent = "Send prayer request";
  }, 1800);
}

function savePrayerRequests() {
  writeJson("brother.prayerRequests", prayerState.requests);
  updateHomePrayerCount();
}

async function loadPrayerFromSupabase() {
  if (!supabaseClient) {
    return;
  }

  // The prayer wall is public. Visitors can read active requests before they
  // sign in; authentication is only required for posting, praying, reporting,
  // and moderation actions.
  if (supabaseUser) {
    const { data: moderatorRow, error: moderatorError } = await supabaseClient
      .from("app_moderators")
      .select("user_id")
      .eq("user_id", supabaseUser.id)
      .maybeSingle();
    prayerModerator = !moderatorError && Boolean(moderatorRow);
  } else {
    prayerModerator = false;
  }

  const { data: requests, error } = await supabaseClient
    .from("prayer_requests")
    .select("id,author_id,title,content,prayer_count,status,category,urgent,created_at");
  if (error) {
    console.warn("Prayer requests could not be loaded:", error.message);
    return;
  }
  updateHomePrayerCount();

  if (!requests?.length) {
    prayerState.requests = [];
    renderPrayerPage();
    return;
  }

  const { data: ownInteractions = [] } = supabaseUser
    ? await supabaseClient
      .from("prayer_interactions")
      .select("request_id")
      .eq("user_id", supabaseUser.id)
    : { data: [] };
  const prayedIds = new Set(ownInteractions.map((item) => item.request_id));
  prayerState.requests = (requests || []).map((request) => ({
    id: request.id,
    ownerId: request.author_id,
    title: request.title || "Prayer request",
    text: request.content,
    prayerCount: request.prayer_count || 0,
    prayedBy: prayedIds.has(request.id) && supabaseUser ? [supabaseUser.id] : [],
    createdAt: request.created_at,
    status: request.status === "pending" ? "active" : (request.status || "active"),
    category: request.category || "general",
    urgent: Boolean(request.urgent),
  }));
  renderPrayerPage();
}

async function createPrayerRequest(title, text, category, urgent, backgroundIndex) {
  if (!supabaseClient || !supabaseUser) {
    return false;
  }
  const { data, error } = await supabaseClient.from("prayer_requests").insert({
    author_id: supabaseUser.id,
    title,
    content: text,
    category,
    urgent,
    status: "active",
    terms_accepted_at: new Date().toISOString(),
  }).select("id").single();
  if (error) {
    prayerFeedback.textContent = error.message;
    return false;
  }
  if (data?.id) {
    prayerBackgroundAssignments[data.id] = backgroundIndex;
    writeJson("brother.prayerBackgrounds", prayerBackgroundAssignments);
  }
  await loadPrayerFromSupabase();
  return true;
}

function renderPrayerPage() {
  if (!prayerList) {
    return;
  }

  if (prayerRequestPanel) prayerRequestPanel.hidden = prayerState.pageTab !== "request";
  prayerList.hidden = false;
  const isMyWall = prayerState.pageTab === "request";
  if (prayerBoardLabel) prayerBoardLabel.textContent = isMyWall ? "MyPrayers Wall" : "Prayer board";
  if (prayerBoardContent) prayerBoardContent.hidden = isMyWall && !prayerState.myWallExpanded;
  if (prayerBoardToggle) {
    prayerBoardToggle.setAttribute("aria-expanded", String(!isMyWall || prayerState.myWallExpanded));
    prayerBoardToggle.classList.toggle("is-collapsed", isMyWall && !prayerState.myWallExpanded);
  }
  document.querySelectorAll("[data-prayer-page-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.prayerPageTab === prayerState.pageTab);
  });

  const requests = prayerState.requests
    .filter((request) => {
      if (prayerState.pageTab === "request") {
        const isOwnRequest = supabaseClient
          ? request.ownerId === supabaseUser?.id
          : true;
        if (!isOwnRequest) return false;
      }
      if (prayerState.pageTab === "board") {
        return prayerState.filter === "all" || (request.category || "general") === prayerState.filter;
      }
      return true;
    })
    .sort((a, b) => {
      if (prayerState.filter === "recent" || prayerState.sort === "recent") {
        return String(b.createdAt).localeCompare(String(a.createdAt));
      }
      const difference = prayerState.sort === "least"
        ? a.prayerCount - b.prayerCount
        : b.prayerCount - a.prayerCount;
      return difference || String(b.createdAt).localeCompare(String(a.createdAt));
    });

  const emptyMessage = prayerState.pageTab === "request"
    ? "You have not posted any prayer requests yet."
    : "No prayer requests have been posted yet.";
  prayerList.innerHTML = requests.length
    ? requests.map((request) => {
        const currentPrayerUserId = supabaseUser?.id || prayerUserId;
        const hasPrayed = request.prayedBy?.includes(currentPrayerUserId);
        const isNewlyPrayed = hasPrayed && request.prayerCount === 1;
        const expanded = Boolean(request.expanded);
        const prayerBackgroundIndex = getPrayerBackgroundIndex(request);
        return `
          <article class="prayer-card${expanded ? " is-expanded" : ""}${request.urgent ? " is-urgent" : ""}${isNewlyPrayed ? " is-prayed" : ""}" style="--prayer-card-image: url('${prayerCardBackgrounds[prayerBackgroundIndex]?.src || prayerCardBackgrounds[0].src}')">
            <button type="button" class="prayer-card-toggle" data-prayer-toggle data-prayer-id="${escapeAttr(request.id)}" aria-expanded="${expanded}">
              <span>
                <strong class="prayer-card-title">${escapeHtml(request.title || "Prayer request")}</strong>
                <p>${escapeHtml(expanded ? request.text : getPrayerPreview(request.text))}</p>
              </span>
              <i data-lucide="chevron-down"></i>
            </button>
            <div class="prayer-card-meta">
              <div class="prayer-card-actions">
                <button type="button" class="prayer-action${hasPrayed ? " is-prayed" : ""}" data-prayer-action="pray" data-prayer-id="${escapeAttr(request.id)}" aria-label="${hasPrayed ? "Prayer count" : "I prayed"}">
                  <i data-lucide="heart"></i>
                  <span>${request.prayerCount}</span>
                </button>
              </div>
            </div>
          </article>
        `;
      }).join("")
    : `<p class="prayer-empty">${emptyMessage}</p>`;
  const sortSelect = document.querySelector("[data-prayer-sort]");
  if (sortSelect) {
    sortSelect.value = prayerState.sort;
  }
  document.querySelectorAll("[data-prayer-filter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.prayerFilter === prayerState.filter);
  });
  refreshIcons();
  emitPrayerStateChange();
}

function emitPrayerStateChange() {
  document.dispatchEvent(new CustomEvent("prayer:state-change"));
}

function setPrayerBridgeFeedback(message) {
  prayerBridgeFeedback = message;
  if (prayerFeedback) prayerFeedback.textContent = message;
  emitPrayerStateChange();
}

async function reportPrayerRequest(requestId, reason, details = "") {
  const report = {
    id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    requestId,
    reason,
    details: String(details || "").trim().slice(0, 500),
    status: "open",
    createdAt: new Date().toISOString(),
    remote: false,
  };
  moderationReports = [report, ...moderationReports].slice(0, 300);
  localStorage.setItem(moderationReportsKey, JSON.stringify(moderationReports));
  document.dispatchEvent(new CustomEvent("moderation:change"));

  if (!supabaseClient || !supabaseUser) return report;
  const { data, error } = await supabaseClient.from("prayer_reports").insert({
    request_id: requestId,
    reporter_id: supabaseUser.id,
    reason,
    details: report.details,
  }).select("id, status, created_at").single();
  if (error) {
    console.warn("Prayer report could not be synced:", error.message);
    return report;
  }
  report.id = data.id;
  report.status = data.status || "open";
  report.createdAt = data.created_at || report.createdAt;
  report.remote = true;
  localStorage.setItem(moderationReportsKey, JSON.stringify(moderationReports));
  document.dispatchEvent(new CustomEvent("moderation:change"));
  return report;
}

async function loadModerationReports() {
  if (!supabaseClient || !supabaseUser || !prayerModerator) {
    document.dispatchEvent(new CustomEvent("moderation:change"));
    return;
  }
  const { data, error } = await supabaseClient
    .from("prayer_reports")
    .select("id,request_id,reason,details,status,created_at,prayer_requests(title,content,status)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) {
    console.warn("Prayer reports could not be loaded:", error.message);
    return;
  }
  moderationReports = (data || []).map((report) => ({
    id: report.id,
    requestId: report.request_id,
    reason: report.reason,
    details: report.details || "",
    status: report.status || "open",
    createdAt: report.created_at,
    remote: true,
    requestTitle: report.prayer_requests?.title || "Prayer request",
    requestText: report.prayer_requests?.content || "",
    requestStatus: report.prayer_requests?.status || "active",
  }));
  localStorage.setItem(moderationReportsKey, JSON.stringify(moderationReports));
  document.dispatchEvent(new CustomEvent("moderation:change"));
}

async function resolveModerationReport(reportId, action) {
  const report = moderationReports.find((item) => item.id === reportId);
  if (!report) throw new Error("This report no longer exists.");
  const request = prayerState.requests.find((item) => item.id === report.requestId);

  if (action === "hide" && request) {
    if (supabaseClient && supabaseUser && prayerModerator) {
      await moderatePrayerRequest(request.id, "archived");
    } else {
      request.status = "archived";
      savePrayerRequests();
    }
  }

  report.status = action === "hide" ? "resolved" : "reviewed";
  if (report.remote && supabaseClient && supabaseUser && prayerModerator) {
    const { error } = await supabaseClient.from("prayer_reports").update({ status: report.status }).eq("id", report.id);
    if (error) throw new Error(error.message || "This report could not be updated.");
  }
  localStorage.setItem(moderationReportsKey, JSON.stringify(moderationReports));
  renderPrayerPage();
  document.dispatchEvent(new CustomEvent("moderation:change"));
}

async function blockPrayerAuthor(authorId) {
  if (!supabaseClient || !supabaseUser) {
    throw new Error("Sign in to block a user.");
  }
  if (!authorId || authorId === supabaseUser.id) return;
  const { error } = await supabaseClient.from("blocked_users").upsert({
    blocker_id: supabaseUser.id,
    blocked_user_id: authorId,
  }, { onConflict: "blocker_id,blocked_user_id" });
  if (error) throw new Error(error.message || "This user could not be blocked.");
  await loadPrayerFromSupabase();
}

async function moderatePrayerRequest(requestId, nextStatus) {
  if (!supabaseClient || !supabaseUser) throw new Error("Sign in before moderating requests.");
  const { error } = await supabaseClient.rpc("moderate_prayer_request", {
    request_uuid: requestId,
    next_status: nextStatus,
  });
  if (error) throw new Error(error.message || "This request could not be reviewed.");
  await loadPrayerFromSupabase();
}
