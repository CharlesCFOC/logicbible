// Legacy features/profile: loaded before script.js; declarations only.
// Shared state remains in script.js during the incremental React migration.

function savePreferences() {
  savedPreferences.accent = normalizeAccentKey(savedPreferences.accent);
  writeJson("brother.preferences", savedPreferences);
  syncPreferencesRecord();
}

function getProfileInitials(name) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) {
    return defaultProfile.avatarInitials;
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .slice(0, 3);
}

function saveProfile() {
  writeJson("brother.profile", savedProfile);
  return syncProfileRecord();
}

async function syncProfileRecord() {
  if (!supabaseClient || !supabaseUser) return false;
  const { error } = await supabaseClient.from("profiles").upsert({
    id: supabaseUser.id,
    email: supabaseUser.email || savedProfile.email || null,
    display_name: String(savedProfile.displayName || "").trim() || null,
    country: savedProfile.country || null,
    age: savedProfile.age ? Number(savedProfile.age) : null,
    bio: savedProfile.bio,
    streak: Number(readJson("brother.homeActivity", {}).streak || 0),
    updated_at: new Date().toISOString(),
  });
  if (error) {
    setAuthFeedback(`Profile sync failed: ${error.message}`, true);
    return false;
  }
  return true;
}

async function syncPreferencesRecord() {
  if (!supabaseClient || !supabaseUser) return;
  const { error } = await supabaseClient.from("user_preferences").upsert({
    user_id: supabaseUser.id,
    app_background: savedPreferences.background,
    text_size: savedPreferences.textSize,
    accent: savedPreferences.accent,
    updated_at: new Date().toISOString(),
  });
  if (error) setAuthFeedback(`Preferences sync failed: ${error.message}`, true);
}

function getEffectiveProfileName() {
  const savedName = String(savedProfile.displayName || "").trim();
  if (savedName) return savedName;
  const authName = String(supabaseUser?.user_metadata?.display_name || "").trim();
  if (authName) return authName;
  const emailName = String(supabaseUser?.email || savedProfile.email || "")
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim();
  return emailName || "It's time to sign in";
}

function getProfileStreakLabel() {
  const streak = Math.max(0, Number(readJson("brother.homeActivity", {}).streak || 0));
  return `${streak} ${streak === 1 ? "day" : "days"} in Scripture`;
}

function getProfileWelcome() {
  if (!supabaseUser) return "Please sign in.";
  const name = getEffectiveProfileName();
  return name === "It's time to sign in" ? "Welcome" : `Welcome ${name.split(/\s+/)[0]}`;
}

function applyProfile() {
  const displayName = getEffectiveProfileName();
  const streakLabel = getProfileStreakLabel();
  const authStatus = String(savedProfile.authStatus || defaultProfile.authStatus).trim() || defaultProfile.authStatus;
  const storageStatus = String(savedProfile.storageStatus || defaultProfile.storageStatus).trim() || defaultProfile.storageStatus;
  const accountId = String(savedProfile.accountId || defaultProfile.accountId).trim() || defaultProfile.accountId;
  const avatarInitials = String(savedProfile.avatarInitials || "").trim().toUpperCase() || getProfileInitials(displayName);

  savedProfile.displayName = displayName;
  savedProfile.country = String(savedProfile.country || "").trim();
  savedProfile.dateOfBirth = String(savedProfile.dateOfBirth || "").trim();
  savedProfile.streakLabel = streakLabel;
  savedProfile.authStatus = authStatus;
  savedProfile.storageStatus = storageStatus;
  savedProfile.accountId = accountId;
  savedProfile.avatarInitials = avatarInitials;

  if (profileCover) {
    profileCover.src = savedProfile.coverImage || defaultProfile.coverImage;
  }

  if (profileAvatar) {
    const profilePhoto = profileAvatar.querySelector("img");
    if (!profilePhoto) {
      profileAvatar.textContent = avatarInitials;
    }
  }
  if (profileName) {
    profileName.textContent = getProfileWelcome();
  }
  if (profileStreak) {
    profileStreak.textContent = streakLabel;
  }
  if (profileAuthStatus) {
    profileAuthStatus.textContent = authStatus;
  }
  if (profileStorageStatus) {
    profileStorageStatus.textContent = storageStatus;
  }
  if (profileAccountId) {
    profileAccountId.textContent = accountId;
  }

  if (profileForm) {
    const formData = new FormData(profileForm);
    if (formData.get("displayName") !== displayName) {
      profileForm.elements.displayName.value = displayName;
    }
    if (formData.get("country") !== (savedProfile.country || "")) {
      profileForm.elements.country.value = savedProfile.country || "";
    }
    if (formData.get("dateOfBirth") !== savedProfile.dateOfBirth) {
      profileForm.elements.dateOfBirth.value = savedProfile.dateOfBirth;
    }
  }
}

function setActivePreference(buttons, activeValue, dataKey) {
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset[dataKey] === activeValue);
  });
}

function applyPreferences() {
  savedPreferences.accent = normalizeAccentKey(savedPreferences.accent);
  const accent = accentOptions[savedPreferences.accent] || accentOptions[defaultPreferences.accent];
  const textSize = textSizeOptions[savedPreferences.textSize] || textSizeOptions[defaultPreferences.textSize];
  const textSizePx = Number.parseFloat(textSize);
  const responsiveTextSize = Number.isFinite(textSizePx)
    ? `clamp(${textSizePx}px, calc(${textSizePx * 0.8}px + ${textSizePx * 0.0625}cqw), ${textSizePx * 1.08}px)`
    : textSize;
  savedPreferences.background = "black";
  const background = "black";
  savedPreferences.background = background;

  appShell.dataset.appBackground = background;
  appShell.style.setProperty("--gold", accent.value);
  appShell.style.setProperty("--gold-soft", accent.soft);
  appShell.style.setProperty("--beige", accent.soft);
  appShell.style.setProperty("--accent-contrast", accent.contrast);
  appShell.style.setProperty("--reader-text-size", responsiveTextSize);
  appShell.style.setProperty("--chat-text-size", responsiveTextSize);
  appShell.querySelector(".phone-frame")?.style.setProperty("--reader-text-size", responsiveTextSize);
  appShell.querySelector(".phone-frame")?.style.setProperty("--chat-text-size", responsiveTextSize);

  setActivePreference(backgroundOptionButtons, savedPreferences.background, "backgroundOption");
  setActivePreference(textSizeOptionButtons, savedPreferences.textSize, "textSizeOption");
  setActivePreference(accentOptionButtons, savedPreferences.accent, "accentOption");
}

function centerBackgroundOption(value, behavior = "smooth") {
  const button = backgroundOptionsTrack?.querySelector(`[data-background-option="${CSS.escape(value)}"]`);
  button?.scrollIntoView({ behavior, block: "nearest", inline: "center" });
}

function initLoopingBackgroundCarousel() {
  if (!backgroundOptionsTrack) {
    return;
  }

  let isLooping = false;
  backgroundOptionsTrack.addEventListener("scroll", () => {
    if (isLooping) {
      return;
    }

    const maxScroll = backgroundOptionsTrack.scrollWidth - backgroundOptionsTrack.clientWidth;
    if (maxScroll <= 0) {
      return;
    }

    if (backgroundOptionsTrack.scrollLeft <= 1) {
      isLooping = true;
      backgroundOptionsTrack.scrollLeft = maxScroll - 2;
      window.requestAnimationFrame(() => {
        isLooping = false;
      });
    } else if (backgroundOptionsTrack.scrollLeft >= maxScroll - 1) {
      isLooping = true;
      backgroundOptionsTrack.scrollLeft = 2;
      window.requestAnimationFrame(() => {
        isLooping = false;
      });
    }
  });
}
