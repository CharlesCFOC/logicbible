// Legacy features/apologetics: loaded before script.js; declarations only.
// Shared state remains in script.js during the incremental React migration.

function normalizeApologeticsProgress() {
  apologeticsProgressState.visitedTopicIds = [...new Set(apologeticsProgressState.visitedTopicIds || [])];
  apologeticsProgressState.completedTopicIds = [...new Set(apologeticsProgressState.completedTopicIds || [])];
  apologeticsProgressState.lastActiveDate = apologeticsProgressState.lastActiveDate || "";
  apologeticsProgressState.streak = Number(apologeticsProgressState.streak || 0);
}

function saveApologeticsProgress() {
  normalizeApologeticsProgress();
  writeJson(apologeticsProgressKey, apologeticsProgressState);
}

function saveApologeticsOverview() {
  writeJson("brother.apologeticsOverview", apologeticsOverviewState);
}

function touchApologeticsProgress() {
  normalizeApologeticsProgress();
  const todayKey = getTodayKey();
  if (apologeticsProgressState.lastActiveDate === todayKey) {
    return;
  }

  const previous = apologeticsProgressState.lastActiveDate ? new Date(`${apologeticsProgressState.lastActiveDate}T00:00:00`) : null;
  const today = new Date(`${todayKey}T00:00:00`);
  const dayDiff = previous ? Math.round((today - previous) / 86400000) : null;
  apologeticsProgressState.streak = dayDiff === 1
    ? Math.max(1, apologeticsProgressState.streak + 1)
    : 1;
  apologeticsProgressState.lastActiveDate = todayKey;
  saveApologeticsProgress();
}

function markApologeticsTopicVisited(topicId) {
  if (!topicId || apologeticsProgressState.visitedTopicIds.includes(topicId)) {
    return;
  }
  apologeticsProgressState.visitedTopicIds.push(topicId);
  saveApologeticsProgress();
}

function markApologeticsTopicCompleted(topicId) {
  if (!topicId || apologeticsProgressState.completedTopicIds.includes(topicId)) {
    return;
  }
  markApologeticsTopicVisited(topicId);
  apologeticsProgressState.completedTopicIds.push(topicId);
  saveApologeticsProgress();
}

function getApologeticsTrack() {
  return apologeticsTracksData.find((track) => track.id === apologeticsState.trackId) || apologeticsTracksData[0];
}

function getApologeticsTopics() {
  const track = getApologeticsTrack();
  const topics = track?.topics || [];
  return apologeticsState.category === "all"
    ? topics
    : topics.filter((topic) => topic.category === apologeticsState.category);
}

function getApologeticsTopic() {
  const track = getApologeticsTrack();
  return track?.topics.find((topic) => topic.id === apologeticsState.topicId) || track?.topics[0] || null;
}

function getAllApologeticsTopics() {
  return apologeticsTracksData.flatMap((track) => track.topics.map((topic) => ({ ...topic, trackId: track.id, trackTitle: track.title, trackLevel: track.level })));
}

function getTopicEstimatedMinutes(topic) {
  return topicDifficultyMinutes[topic.difficulty] || 8;
}

function getTopicXp(topic) {
  return topicDifficultyXp[topic.difficulty] || 80;
}

function getTrackEstimatedMinutes(track) {
  return track.topics.reduce((total, topic) => total + getTopicEstimatedMinutes(topic), 0);
}

function formatMinutes(minutes) {
  return `${minutes} min`;
}

function getTrackProgress(track) {
  const topicIds = track.topics.map((topic) => topic.id);
  const visitedCount = topicIds.filter((id) => apologeticsProgressState.visitedTopicIds.includes(id)).length;
  const completedCount = topicIds.filter((id) => apologeticsProgressState.completedTopicIds.includes(id)).length;
  const percent = Math.round((completedCount / track.topics.length) * 100) || 0;
  return {
    visitedCount,
    completedCount,
    percent,
    started: visitedCount > 0,
  };
}

function getTrackFrameworkDetails(track) {
  const trackUi = apologeticsTrackUi[track.id];
  return trackUi?.frameworkDetails || [
    {
      title: "Understand the claim",
      explanation: "Clarify exactly what the other person is objecting to before you answer.",
      example: "Ask whether the issue is about Scripture, doctrine, history, or the person of Christ.",
      mistakes: "Responding too fast or answering the wrong objection.",
      tip: "Repeat the objection back in one sentence first.",
    },
    {
      title: "Find the objection",
      explanation: "Locate the core tension driving the disagreement.",
      example: "A debate about miracles often hides a prior rejection of the supernatural.",
      mistakes: "Treating every objection like the same kind of argument.",
      tip: "Name the category of the objection before you answer.",
    },
    {
      title: "Answer biblically",
      explanation: "Use a small set of clear passages and explain them with context.",
      example: "Use one key verse, one supporting verse, and one short explanation.",
      mistakes: "Dropping references without interpretation.",
      tip: "Aim for clarity before quantity.",
    },
    {
      title: "Respond clearly",
      explanation: "Keep your tone calm and your structure simple so the answer can land.",
      example: "Lead with your strongest point, then invite the other person to reflect.",
      mistakes: "Overloading the answer or sounding combative.",
      tip: "End with a thoughtful question rather than a speech.",
    },
  ];
}

function getOpenFrameworkIndex(trackId, itemCount) {
  const rawIndex = apologeticsOverviewState.trackFrameworkOpen[trackId];
  return typeof rawIndex === "number" && rawIndex >= 0 && rawIndex < itemCount ? rawIndex : 0;
}

function getTopicCompletionState(topicId) {
  if (apologeticsProgressState.completedTopicIds.includes(topicId)) {
    return "Completed";
  }
  if (apologeticsProgressState.visitedTopicIds.includes(topicId)) {
    return "In progress";
  }
  return "Ready";
}

function getApologeticsOverviewProgress() {
  const allTopics = getAllApologeticsTopics();
  const completedCount = allTopics.filter((topic) => apologeticsProgressState.completedTopicIds.includes(topic.id)).length;
  const overallPercent = Math.round((completedCount / allTopics.length) * 100) || 0;
  const xpEarned = allTopics
    .filter((topic) => apologeticsProgressState.completedTopicIds.includes(topic.id))
    .reduce((total, topic) => total + getTopicXp(topic), 0);

  return {
    overallPercent,
    completedCount,
    totalTopics: allTopics.length,
    streak: apologeticsProgressState.streak || 1,
    xpEarned,
  };
}

function getTodaysApologeticsChallenge() {
  const allTopics = getAllApologeticsTopics();
  const dayNumber = Number(getTodayKey().replaceAll("-", ""));
  const challenge = allTopics[dayNumber % allTopics.length];
  return challenge
    ? {
      ...challenge,
      durationMinutes: getTopicEstimatedMinutes(challenge),
      xpReward: getTopicXp(challenge),
    }
    : null;
}

function saveApologeticsState() {
  setLocalValue("brother.apologetics.track", apologeticsState.trackId);
  setLocalValue("brother.apologetics.category", apologeticsState.category);
  setLocalValue("brother.apologetics.topic", apologeticsState.topicId);
  setLocalValue("brother.apologetics.selectedTrackTopic", apologeticsState.selectedTrackTopicId || "");
}

function saveApologeticsChatState() {
  writeJson(apologeticsChatKey, apologeticsChatState.conversations);
}

function ensureApologeticsState() {
  const track = getApologeticsTrack();
  if (!track) {
    return;
  }

  const categories = new Set(track.topics.map((topic) => topic.category));
  if (apologeticsState.category !== "all" && !categories.has(apologeticsState.category)) {
    apologeticsState.category = "all";
  }

  const visibleTopics = getApologeticsTopics();
  if (!visibleTopics.some((topic) => topic.id === apologeticsState.topicId)) {
    apologeticsState.topicId = visibleTopics[0]?.id || track.topics[0]?.id || "";
  }
  if (!visibleTopics.some((topic) => topic.id === apologeticsState.selectedTrackTopicId)) {
    apologeticsState.selectedTrackTopicId = "";
  }

  saveApologeticsState();
}

function getApologeticsConversationKey() {
  const track = getApologeticsTrack();
  const topic = getApologeticsTopic();
  return track && topic ? `${track.id}:${topic.id}` : "";
}

function buildApologeticsSeedConversation(track, topic) {
  const openingClaim = topic?.opponentCase?.[0] || `I disagree with the Christian view on ${topic?.title || "this topic"}.`;
  return {
    muslim: [
      {
        role: "assistant",
        text: `Opening objection from ${track.title}: ${openingClaim} Respond to me as if we were in a real conversation.`,
      },
    ],
    coach: [
      {
        role: "assistant",
        text: `Base objection to answer: "${openingClaim}"\n\nBuild your reply in the "From Muslim" tab. I will evaluate your answer here for clarity, biblical strength, tone, and strategy.`,
      },
    ],
  };
}

function getApologeticsConversation() {
  const key = getApologeticsConversationKey();
  if (!key) {
    return { muslim: [], coach: [] };
  }

  if (!apologeticsChatState.conversations[key]) {
    const track = getApologeticsTrack();
    const topic = getApologeticsTopic();
    apologeticsChatState.conversations[key] = buildApologeticsSeedConversation(track, topic);
    saveApologeticsChatState();
  }

  return apologeticsChatState.conversations[key];
}

function resizeApologeticsChatInput() {
  if (!apologeticsChatInput) {
    return;
  }

  apologeticsChatInput.style.height = "auto";
  const nextHeight = Math.min(apologeticsChatInput.scrollHeight, 144);
  apologeticsChatInput.style.height = `${nextHeight}px`;
  apologeticsChatInput.style.overflowY = apologeticsChatInput.scrollHeight > nextHeight ? "auto" : "hidden";
}

function setApologeticsChatPending(isPending, key = getApologeticsConversationKey()) {
  if (!key) {
    return;
  }

  if (isPending) {
    apologeticsChatState.pendingKeys[key] = true;
  } else {
    delete apologeticsChatState.pendingKeys[key];
  }

  const currentKey = getApologeticsConversationKey();
  const currentPending = Boolean(currentKey && apologeticsChatState.pendingKeys[currentKey]);
  if (apologeticsChatInput) {
    apologeticsChatInput.disabled = currentPending;
  }
  apologeticsChatForm?.querySelector("button")?.toggleAttribute("disabled", currentPending);
}

function renderApologeticsChat() {
  if (!apologeticsChatTabs || !apologeticsChatThread) {
    return;
  }

  const conversation = getApologeticsConversation();
  const activeTab = apologeticsChatState.activeTab;
  setApologeticsChatPending(Boolean(apologeticsChatState.pendingKeys[getApologeticsConversationKey()]), getApologeticsConversationKey());

  apologeticsChatTabs.querySelectorAll("[data-apologetics-chat-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.apologeticsChatTab === activeTab);
  });

  const messages = conversation[activeTab] || [];
  if (!messages.length) {
    apologeticsChatThread.innerHTML = `
      <div class="apologetics-chat-empty">
        <strong>${activeTab === "muslim" ? "From Muslim" : "From Coach"}</strong>
        <p>${activeTab === "muslim"
    ? "Write your first answer and this tab will keep the conversation going like a real challenger."
    : "Write your first answer and this tab will critique your reasoning, references, and tone."}</p>
      </div>
    `;
    return;
  }

  apologeticsChatThread.innerHTML = messages.map((item) => {
    if (item.role === "user") {
      return `
        <article class="message user-message">
          <p>${escapeHtml(item.text)}</p>
        </article>
      `;
    }

    return `
      <article class="message ai-message">
        <div class="ai-message-stack">
          <div class="message-body${item.pending ? " shining-text" : " rich-text"}">${item.pending ? escapeHtml(item.text) : renderRichText(item.text)}</div>
        </div>
      </article>
    `;
  }).join("");

  apologeticsChatThread.scrollTop = apologeticsChatThread.scrollHeight;
}

async function requestApologeticsModeResponse(mode, requestId) {
  const track = getApologeticsTrack();
  const topic = getApologeticsTopic();
  const conversation = getApologeticsConversation();
  const history = (conversation[mode] || []).filter((item) => !item.pending).slice(-18);
  if (history.some((item) => containsPersonalContactInfo(item.text))) {
    throw new Error("For your safety, do not include an email address or phone number in AI messages.");
  }
  const response = await aiFetch(apiUrl("/api/ai/apologetics"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      mode,
      trackTitle: track?.title || "",
      topicTitle: topic?.title || "",
      topicSummary: topic?.summary || "",
      opponentCase: topic?.opponentCase || [],
      keyResponse: topic?.keyResponse || [],
      keyVerses: topic?.keyVerses || [],
      questionsToAsk: topic?.questionsToAsk || [],
      pitfalls: topic?.pitfalls || [],
      history,
      message: history.filter((item) => item.role === "user").slice(-1)[0]?.text || "",
      audience: "teen",
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Apologetics AI request failed.");
  }

  if (requestId !== apologeticsChatRequestId) {
    return;
  }

  const queue = conversation[mode] || [];
  const pendingIndex = queue.findIndex((item) => item.pending);
  if (pendingIndex >= 0) {
    queue[pendingIndex] = { role: "assistant", text: payload.text || "No response text returned." };
  } else {
    queue.push({ role: "assistant", text: payload.text || "No response text returned." });
  }
}

async function handleApologeticsChatSubmit(event) {
  event.preventDefault();
  const topic = getApologeticsTopic();
  const message = apologeticsChatInput?.value.trim();
  const conversationKey = getApologeticsConversationKey();
  if (!topic || !message || (conversationKey && apologeticsChatState.pendingKeys[conversationKey])) {
    return;
  }

  markApologeticsTopicCompleted(topic.id);
  const conversation = getApologeticsConversation();
  const pendingLabels = {
    muslim: "From Muslim is replying...",
    coach: "Coach is reviewing your answer...",
  };

  apologeticsChatInput.value = "";
  resizeApologeticsChatInput();
  setApologeticsChatPending(true, conversationKey);
  apologeticsChatRequestId += 1;
  const requestId = apologeticsChatRequestId;

  ["muslim", "coach"].forEach((mode) => {
    conversation[mode].push({ role: "user", text: message });
    conversation[mode].push({ role: "assistant", text: pendingLabels[mode], pending: true });
  });

  saveApologeticsChatState();
  renderApologeticsChat();

  try {
    await Promise.all([
      requestApologeticsModeResponse("muslim", requestId),
      requestApologeticsModeResponse("coach", requestId),
    ]);
    saveApologeticsChatState();
  } catch (error) {
    ["muslim", "coach"].forEach((mode) => {
      const queue = conversation[mode] || [];
      const pendingIndex = queue.findIndex((item) => item.pending);
      if (pendingIndex >= 0) {
        queue[pendingIndex] = { role: "assistant", text: error.message || "Apologetics AI is not available yet." };
      }
    });
    saveApologeticsChatState();
  } finally {
    if (requestId === apologeticsChatRequestId) {
      setApologeticsChatPending(false, conversationKey);
      renderApologeticsChat();
      apologeticsChatInput?.focus();
    }
  }
}

function launchApologeticsCoach(mode = "coach") {
  const track = getApologeticsTrack();
  const topic = getApologeticsTopic();
  if (!track || !topic) {
    return;
  }

  const prompts = {
    overview: `Create a practical apologetics training plan for conversations about ${track.title}. Prioritize the biggest objections, strongest biblical answers, common traps, and 5 memory verses.`,
    coach: `You are my apologetics coach. Topic: ${track.title} > ${topic.title}. Give me a concise training answer with: what they say, what I should say, key verses, questions to ask back, and traps to avoid.`,
    debate: `Roleplay a realistic debate with me. You act like a well-informed ${track.title} challenger on the topic "${topic.title}". Raise one objection at a time, wait for my reply, then critique my answer and continue.`,
    refine: `Improve my apologetics response on the topic ${track.title} > ${topic.title}. Give me a short answer, a stronger expanded answer, biblical support, and a more gracious tone.`,
  };

  setScreen("ai");
  document.dispatchEvent(new CustomEvent("ai:prefill", { detail: { prompt: prompts[mode] || prompts.coach } }));
}

async function copyApologeticsShortAnswer() {
  const topic = getApologeticsTopic();
  if (!topic?.shortAnswer) {
    return;
  }

  try {
    await navigator.clipboard.writeText(topic.shortAnswer);
    setFeedback("Short answer copied.");
  } catch {
    setFeedback("Copy is not available in this browser.");
  }
}

function renderApologeticsTracks() {
  if (!apologeticsTracks) {
    return;
  }

  apologeticsTracks.innerHTML = apologeticsTracksData.map((track) => {
    const progress = getTrackProgress(track);
    return `
      <button class="apologetics-track-card apologetics-track-card--${escapeAttr(track.id)}" data-apologetics-track="${escapeAttr(track.id)}">
        <span class="apologetics-track-card-top">
          <i data-lucide="${escapeAttr(track.icon)}"></i>
          <small>${escapeHtml(track.level)}</small>
        </span>
        <strong>${escapeHtml(track.title)}</strong>
        <p>${escapeHtml(track.description)}</p>
        <div class="apologetics-track-card-metrics">
          <span><strong>${track.topics.length}</strong><small>Topics</small></span>
          <span><strong>${formatMinutes(getTrackEstimatedMinutes(track))}</strong><small>Estimate</small></span>
          <span><strong>${progress.percent}%</strong><small>Progress</small></span>
        </div>
        <div class="apologetics-track-card-footer">
          <span class="apologetics-track-progress-bar"><span style="width:${progress.percent}%"></span></span>
          <span class="apologetics-track-card-cta">${progress.started ? "Continue" : "Start training"}</span>
        </div>
      </button>
    `;
  }).join("");
}

function renderApologeticsFeaturedTopics() {
  if (!apologeticsTopics) {
    return;
  }

  apologeticsTopics.innerHTML = apologeticsTracksData.map((track) => {
    const featuredTopics = track.topics.slice(0, 3);
    const isExpanded = apologeticsOverviewState.featuredOpenTrackId === track.id;
    return `
      <section class="apologetics-featured-group${isExpanded ? " is-expanded" : ""}" data-apologetics-featured-group="${escapeAttr(track.id)}">
        <button class="section-heading apologetics-featured-group-heading" type="button" data-apologetics-featured-toggle="${escapeAttr(track.id)}" aria-expanded="${isExpanded ? "true" : "false"}" aria-controls="apologetics-topic-dropdown-${escapeAttr(track.id)}">
          <span class="apologetics-featured-group-heading-copy">
            <small>${escapeHtml(track.level)} track</small>
            <h3>${escapeHtml(track.title)}</h3>
            <p>${escapeHtml(track.description)}</p>
          </span>
          <span class="apologetics-featured-group-heading-side">
            <span>${featuredTopics.length}</span>
            <span class="apologetics-featured-group-heading-state">${isExpanded ? "Close" : "Open"}</span>
            <i data-lucide="chevron-down"></i>
          </span>
        </button>
        <div class="apologetics-topic-dropdown" id="apologetics-topic-dropdown-${escapeAttr(track.id)}"${isExpanded ? "" : " hidden"}>
          <div class="apologetics-topic-dropdown-list">
          ${featuredTopics.map((topic) => `
            <button class="apologetics-topic-card apologetics-topic-card--carousel" type="button" data-apologetics-topic="${escapeAttr(topic.id)}" data-apologetics-track-jump="${escapeAttr(track.id)}">
              <span class="apologetics-topic-meta">
                <small>${escapeHtml(topic.category)}</small>
              </span>
              <strong>${escapeHtml(topic.title)}</strong>
              <p>${escapeHtml(topic.summary)}</p>
              <span class="apologetics-topic-meta-row">
                <small>${escapeHtml(topic.difficulty)}</small>
                <small>${formatMinutes(getTopicEstimatedMinutes(topic))}</small>
                <small>${getTopicCompletionState(topic.id)}</small>
              </span>
              <span class="apologetics-topic-open">Open topic</span>
            </button>
          `).join("")}
          </div>
        </div>
      </section>
    `;
  }).join("");
}

function renderApologeticsChallenge() {
  if (!apologeticsChallenge) {
    return;
  }

  const challenge = getTodaysApologeticsChallenge();
  if (!challenge) {
    apologeticsChallenge.innerHTML = "";
    return;
  }

  apologeticsChallenge.innerHTML = `
    <button class="apologetics-challenge-button" type="button" data-apologetics-topic="${escapeAttr(challenge.id)}" data-apologetics-track-jump="${escapeAttr(challenge.trackId)}">
      <span class="apologetics-challenge-top">
        <small>Featured objection</small>
        <strong>+${challenge.xpReward} XP</strong>
      </span>
      <h3>${escapeHtml(challenge.title)}</h3>
      <p>${escapeHtml(challenge.opponentCase[0] || challenge.summary)}</p>
      <div class="apologetics-challenge-meta">
        <span>${escapeHtml(challenge.trackTitle)}</span>
        <span>${formatMinutes(challenge.durationMinutes)}</span>
      </div>
    </button>
  `;
}

function renderApologeticsProgress() {
  if (!apologeticsProgress) {
    return;
  }

  const overview = getApologeticsOverviewProgress();
  apologeticsProgress.innerHTML = `
    <article class="apologetics-progress-card apologetics-progress-card--cyan">
      <small>Overall Completion</small>
      <strong>${overview.overallPercent}%</strong>
      <span>Across all apologetics tracks</span>
    </article>
    <article class="apologetics-progress-card apologetics-progress-card--green">
      <small>Topics Completed</small>
      <strong>${overview.completedCount}/${overview.totalTopics}</strong>
      <span>Finished lessons so far</span>
    </article>
    <article class="apologetics-progress-card apologetics-progress-card--violet">
      <small>Current Streak</small>
      <strong>${overview.streak}</strong>
      <span>Consecutive active days</span>
    </article>
    <article class="apologetics-progress-card apologetics-progress-card--amber">
      <small>XP Earned</small>
      <strong>${overview.xpEarned}</strong>
      <span>Training points collected</span>
    </article>
  `;
}

function renderApologeticsFilters() {
  if (!apologeticsFilters) {
    return;
  }

  const track = getApologeticsTrack();
  const categories = ["all", ...new Set((track?.topics || []).map((topic) => topic.category))];
  apologeticsFilters.innerHTML = categories.map((category) => `
    <button class="${category === apologeticsState.category ? "is-active" : ""}" data-apologetics-filter="${escapeAttr(category)}">
      ${escapeHtml(category === "all" ? "All" : category)}
    </button>
  `).join("");
}

function renderApologeticsTrackScreen() {
  const track = getApologeticsTrack();
  if (!track || !apologeticsTrackTitle || !apologeticsTrackHero || !apologeticsTrackTopics || !apologeticsTopicCount) {
    return;
  }

  const trackProgress = getTrackProgress(track);
  const selectedTopic = track.topics.find((topic) => topic.id === apologeticsState.selectedTrackTopicId);
  const trackUi = apologeticsTrackUi[track.id] || {
    summary: track.description,
  };
  const frameworkDetails = getTrackFrameworkDetails(track);
  const openFrameworkIndex = getOpenFrameworkIndex(track.id, frameworkDetails.length);
  const activeFramework = frameworkDetails[openFrameworkIndex];
  const topics = getApologeticsTopics();
  apologeticsTrackTitle.textContent = track.title;
  apologeticsTrackHero.className = `apologetics-hero apologetics-hero--track apologetics-hero--track-${track.id}`;
  apologeticsTrackHero.innerHTML = `
    <div class="apologetics-hero-copy">
      <span class="label">${escapeHtml(track.level)} track</span>
      <h2>${escapeHtml(track.title)}</h2>
      <p>${escapeHtml(trackUi.summary)}</p>
    </div>
    <div class="apologetics-hero-stats">
      <span><strong>${track.topics.length}</strong><small>topics</small></span>
      <span><strong>${formatMinutes(getTrackEstimatedMinutes(track))}</strong><small>estimate</small></span>
      <span><strong>${escapeHtml(track.level)}</strong><small>difficulty</small></span>
    </div>
    <div class="apologetics-track-hero-progress">
      <div class="apologetics-track-hero-progress-top">
        <strong>${trackProgress.percent}% complete</strong>
        <span>${trackProgress.completedCount}/${track.topics.length} topics</span>
      </div>
      <span class="apologetics-track-progress-bar"><span style="width:${trackProgress.percent}%"></span></span>
    </div>
  `;
  if (apologeticsTrackProgress) {
    apologeticsTrackProgress.innerHTML = `
      <div class="apologetics-track-progress-copy">
        <strong>Completed: ${trackProgress.completedCount} / ${track.topics.length} Topics</strong>
        <p>${trackProgress.started ? "You already have momentum on this path. Resume where you left off and keep compounding your answers." : "Start with one core objection and build confidence one topic at a time."}</p>
      </div>
      <span class="apologetics-track-progress-bar apologetics-track-progress-bar--large"><span style="width:${trackProgress.percent}%"></span></span>
    `;
  }
  if (apologeticsTrackQuick) {
    apologeticsTrackQuick.innerHTML = `
      <div class="apologetics-quick-head">
        <strong>Quick framework</strong>
      </div>
      <div class="apologetics-quick-steps">
        ${frameworkDetails.map((step, index) => `
          <button class="${index === openFrameworkIndex ? "is-active" : ""}" data-apologetics-framework-step="${index}">
            <small>${index + 1}</small>
            <span>${escapeHtml(step.title)}</span>
          </button>
        `).join("")}
      </div>
      <article class="apologetics-framework-detail">
        <h3>${escapeHtml(activeFramework.title)}</h3>
        <div class="apologetics-framework-grid">
          <section>
            <strong>Explanation</strong>
            <p>${escapeHtml(activeFramework.explanation)}</p>
          </section>
          <section>
            <strong>Practical Example</strong>
            <p>${escapeHtml(activeFramework.example)}</p>
          </section>
          <section>
            <strong>Common Mistakes</strong>
            <p>${escapeHtml(activeFramework.mistakes)}</p>
          </section>
          <section>
            <strong>Tip</strong>
            <p>${escapeHtml(activeFramework.tip)}</p>
          </section>
        </div>
      </article>
    `;
  }
  if (apologeticsTrackRewards) {
    const unlocked = trackProgress.percent >= 100;
    apologeticsTrackRewards.innerHTML = `
      <div class="apologetics-rewards-head">
        <strong>Rewards</strong>
        <span>${unlocked ? "Unlocked" : "Finish this track to unlock"}</span>
      </div>
      <div class="apologetics-rewards-grid">
        ${["Intermediate Track", "Advanced Debate Mode", "New AI Coach"].map((reward) => `
          <span class="${unlocked ? "is-unlocked" : ""}">
            <small>${unlocked ? "Ready" : "Locked"}</small>
            <strong>${escapeHtml(reward)}</strong>
          </span>
        `).join("")}
      </div>
    `;
  }
  if (apologeticsSelectionLine) {
    apologeticsSelectionLine.textContent = selectedTopic
      ? `Selected topic: ${selectedTopic.title}`
      : `Choose a topic to keep building this ${track.level.toLowerCase()} learning path.`;
    apologeticsSelectionLine.classList.toggle("is-active", Boolean(selectedTopic));
  }
  apologeticsTopicCount.textContent = String(topics.length);
  apologeticsTrackTopics.innerHTML = topics.map((topic) => {
    const completionState = getTopicCompletionState(topic.id);
    const isSelected = topic.id === apologeticsState.selectedTrackTopicId;
    return `
    <button class="apologetics-topic-card apologetics-topic-card--${escapeAttr(topic.category.toLowerCase())} ${isSelected ? "is-selected" : ""}" type="button" data-apologetics-topic="${escapeAttr(topic.id)}" aria-pressed="${isSelected ? "true" : "false"}">
      <span class="apologetics-topic-meta">
        <small>${escapeHtml(topic.category)}</small>
        <span class="apologetics-topic-status ${completionState === "Completed" ? "is-completed" : completionState === "In progress" ? "is-progress" : ""}">${escapeHtml(completionState)}</span>
      </span>
      <strong>${escapeHtml(topic.title)}</strong>
      <p>${escapeHtml(topic.summary)}</p>
      <span class="apologetics-topic-meta-row">
        <small>${escapeHtml(topic.difficulty)}</small>
        <small>${formatMinutes(getTopicEstimatedMinutes(topic))}</small>
        <small>${topic.keyVerses.length} verses</small>
      </span>
      <span class="apologetics-topic-plus" aria-hidden="true">
        <i data-lucide="${isSelected ? "minus" : "plus"}"></i>
      </span>
    </button>
  `;
  }).join("");
  renderApologeticsBeginButton();
}

function renderApologeticsBeginButton() {
  if (!apologeticsBeginButton) {
    return;
  }

  if (appShell?.dataset.activeScreen !== "apologetics-track") {
    apologeticsBeginButton.hidden = true;
    return;
  }

  const track = getApologeticsTrack();
  const trackProgress = track ? getTrackProgress(track) : { started: false };
  const fallbackTopicId = apologeticsState.selectedTrackTopicId || apologeticsState.topicId || getApologeticsTopics()[0]?.id || "";
  apologeticsBeginButton.hidden = false;
  const buttonLabel = trackProgress.started ? "Resume where you left off" : "Continue Learning";
  apologeticsBeginButton.textContent = buttonLabel;
  apologeticsBeginButton.dataset.label = buttonLabel;
  apologeticsBeginButton.classList.toggle("is-disabled", !fallbackTopicId);
  apologeticsBeginButton.setAttribute("aria-disabled", fallbackTopicId ? "false" : "true");
}

function renderApologeticsTopicScreen() {
  const track = getApologeticsTrack();
  const topic = getApologeticsTopic();
  if (!track || !topic || !apologeticsDetail || !apologeticsTopicBreadcrumb || !apologeticsTopicTitle) {
    if (apologeticsDetail) {
      apologeticsDetail.innerHTML = '<p class="saved-empty">No topic available yet.</p>';
    }
    return;
  }

  markApologeticsTopicVisited(topic.id);
  apologeticsTopicBreadcrumb.textContent = track.title;
  apologeticsTopicTitle.textContent = topic.title;
  apologeticsTopicTabs?.querySelectorAll("[data-apologetics-topic-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.apologeticsTopicTab === apologeticsChatState.activeTopicView);
  });
  apologeticsDetail.hidden = apologeticsChatState.activeTopicView !== "introduction";
  const chatPanel = document.querySelector(".apologetics-chat-panel");
  if (chatPanel) {
    chatPanel.hidden = apologeticsChatState.activeTopicView !== "chat";
  }
  apologeticsDetail.innerHTML = `
    <div class="apologetics-intro-header">
      <span class="apologetics-intro-kicker">${escapeHtml(topic.category)}</span>
      <h2>${escapeHtml(topic.title)}</h2>
      <p class="apologetics-summary">${escapeHtml(topic.summary)}</p>
    </div>
    <div class="apologetics-intro-flow">
      <article class="apologetics-intro-block">
        <strong>The objection</strong>
        <p>${escapeHtml(topic.opponentCase[0] || topic.summary)}</p>
        <ul class="apologetics-bullet-list">
          ${topic.opponentCase.slice(1).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </article>
      <article class="apologetics-intro-block">
        <strong>The short answer</strong>
        <p>${escapeHtml(topic.shortAnswer)}</p>
      </article>
      <article class="apologetics-intro-block">
        <strong>How to respond clearly</strong>
        <ul class="apologetics-bullet-list">
          ${topic.keyResponse.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </article>
      <article class="apologetics-intro-block">
        <strong>Key verses</strong>
        <div class="apologetics-verse-tags">
          ${topic.keyVerses.map((verse) => `<span>${escapeHtml(verse.replaceAll(".", " "))}</span>`).join("")}
        </div>
      </article>
      <article class="apologetics-intro-block">
        <strong>Questions to ask back</strong>
        <ul class="apologetics-bullet-list">
          ${topic.questionsToAsk.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </article>
      <article class="apologetics-intro-block">
        <strong>What to avoid</strong>
        <ul class="apologetics-bullet-list">
          ${topic.pitfalls.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </article>
      <article class="apologetics-intro-block">
        <strong>Expanded explanation</strong>
        <p>${escapeHtml(topic.longAnswer)}</p>
      </article>
    </div>
  `;
  renderApologeticsChat();
}

function renderApologetics() {
  touchApologeticsProgress();
  ensureApologeticsState();
  renderApologeticsChallenge();
  renderApologeticsProgress();
  renderApologeticsTracks();
  renderApologeticsFeaturedTopics();
  renderApologeticsFilters();
  renderApologeticsTrackScreen();
  renderApologeticsTopicScreen();
  refreshIcons();
}
