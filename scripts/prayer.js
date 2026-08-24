/* Prayer module: request creation, filters, tabs and card actions. */

function initPrayerPage() {
  if (!prayerForm || !prayerList) {
    return;
  }

  prayerRequestInput?.addEventListener("input", () => {
    if (prayerRequestInput.value.trim()) stopPrayerPromptRotation();
    const count = countPrayerWords(prayerRequestInput.value);
    if (prayerWordCount) {
      prayerWordCount.textContent = `${count} / 300 words`;
      prayerWordCount.classList.toggle("is-over-limit", count > 300);
    }
  });

  prayerCategoryOptions.forEach((option) => {
    option.addEventListener("click", () => {
      setPrayerCategory(option.dataset.prayerCategoryOption || "general");
    });
  });

  prayerBackgroundOptions.forEach((option) => {
    option.addEventListener("click", () => {
      selectedPrayerBackgroundIndex = Number(option.dataset.prayerBackgroundOption) || 0;
      prayerBackgroundOptions.forEach((item) => {
        const isActive = item === option;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });
    });
  });

  prayerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = prayerRequestInput.value.trim();
    const wordCount = countPrayerWords(text);
    const category = prayerCategory?.value || "general";
    const urgent = Boolean(prayerUrgent?.checked);
    const moderationMessage = getPrayerModerationMessage(text);
    if (!text || wordCount > 300) {
      prayerFeedback.textContent = wordCount > 300 ? "Please keep your request under 300 words." : "Write a prayer request first.";
      return;
    }
    if (moderationMessage) {
      prayerFeedback.textContent = moderationMessage;
      return;
    }

    if (supabaseClient && !supabaseUser) {
      prayerFeedback.textContent = "Sign in to share a prayer request with the community.";
      return;
    }

    if (supabaseClient && supabaseUser) {
      const created = await createPrayerRequest(text, category, urgent, selectedPrayerBackgroundIndex);
      if (!created) return;
    } else {
      prayerState.requests.unshift({
        id: `prayer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ownerId: prayerUserId,
        text,
        prayerCount: 0,
        prayedBy: [],
        createdAt: new Date().toISOString(),
        category,
        urgent,
        backgroundIndex: selectedPrayerBackgroundIndex,
        status: "active",
      });
      savePrayerRequests();
    }
    prayerRequestInput.value = "";
    setPrayerCategory("general");
    selectedPrayerBackgroundIndex = 0;
    prayerBackgroundOptions.forEach((option, index) => {
      const isActive = index === selectedPrayerBackgroundIndex;
      option.classList.toggle("is-active", isActive);
      option.setAttribute("aria-pressed", String(isActive));
    });
    if (prayerUrgent) prayerUrgent.checked = false;
    prayerWordCount.textContent = "0 / 300 words";
    prayerFeedback.textContent = "Your request was shared anonymously.";
    showPrayerSentState();
    prayerState.pageTab = "request";
    prayerState.myWallExpanded = true;
    prayerState.tab = "all";
    startPrayerPromptRotation();
    renderPrayerPage();
  });

  document.querySelectorAll("[data-prayer-page-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      prayerState.pageTab = button.dataset.prayerPageTab;
      if (prayerState.pageTab === "request") {
        startPrayerPromptRotation();
      } else {
        stopPrayerPromptRotation();
      }
      if (prayerRequestPanel) prayerRequestPanel.hidden = prayerState.pageTab !== "request";
      prayerList.hidden = false;
      document.querySelectorAll("[data-prayer-page-tab]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      renderPrayerPage();
    });
  });

  prayerBoardToggle?.addEventListener("click", () => {
    if (prayerState.pageTab !== "request") return;
    prayerState.myWallExpanded = !prayerState.myWallExpanded;
    renderPrayerPage();
  });

  document.querySelector("[data-prayer-sort]")?.addEventListener("change", (event) => {
    prayerState.sort = event.target.value;
    renderPrayerPage();
  });

  document.querySelectorAll("[data-prayer-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      prayerState.filter = button.dataset.prayerFilter || "general";
      renderPrayerPage();
    });
  });

  prayerList.addEventListener("click", async (event) => {
    const toggle = event.target.closest("[data-prayer-toggle]");
    if (toggle) {
      const request = prayerState.requests.find((item) => item.id === toggle.dataset.prayerId);
      if (request) {
        request.expanded = !request.expanded;
        renderPrayerPage();
      }
      return;
    }
    const button = event.target.closest("[data-prayer-action]");
    if (!button) return;
    const request = prayerState.requests.find((item) => item.id === button.dataset.prayerId);
    if (!request) return;
    if (button.dataset.prayerAction === "share") {
      const shareText = `Prayer request: ${request.text}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: "Prayer request", text: shareText });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareText);
          if (prayerFeedback) prayerFeedback.textContent = "Prayer request copied to your clipboard.";
        }
      } catch (error) {
        if (error?.name !== "AbortError" && prayerFeedback) prayerFeedback.textContent = "This request could not be shared.";
      }
      return;
    }
    if (button.dataset.prayerAction !== "pray") return;
    if (supabaseClient && !supabaseUser) {
      prayerFeedback.textContent = "Sign in to record your prayer.";
      return;
    }
    if (supabaseClient && supabaseUser) {
      const { error } = await supabaseClient.rpc("pray_for_request", { request_uuid: request.id });
      if (error) {
        prayerFeedback.textContent = error.message;
        return;
      }
      await loadPrayerFromSupabase();
      return;
    }
    request.prayedBy ||= [];
    if (request.prayedBy.includes(prayerUserId)) return;
    request.prayedBy.push(prayerUserId);
    request.prayerCount += 1;
    savePrayerRequests();
    renderPrayerPage();
  });

  renderPrayerPage();
}

initPrayerPage();
