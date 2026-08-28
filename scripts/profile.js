/* Profile module: preference controls and profile editing. */

function initPreferences() {
  initLoopingBackgroundCarousel();

  backgroundOptionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      savedPreferences.background = button.dataset.backgroundOption;
      savePreferences();
      applyPreferences();
      centerBackgroundOption(savedPreferences.background);
    });
  });

  textSizeOptionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      savedPreferences.textSize = button.dataset.textSizeOption;
      savePreferences();
      applyPreferences();
    });
  });

  accentOptionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      savedPreferences.accent = button.dataset.accentOption;
      savePreferences();
      applyPreferences();
    });
  });

  applyPreferences();
  window.requestAnimationFrame(() => centerBackgroundOption(savedPreferences.background, "auto"));
}

function initProfile() {
  applyProfile();
  let profileCoverDraft = savedProfile.coverImage || defaultProfile.coverImage;

  profileStyleToggle?.addEventListener("click", () => {
    const willOpen = profileStyleEditor?.hidden !== false;
    if (profileStyleEditor) profileStyleEditor.hidden = !willOpen;
    profileStyleToggle.setAttribute("aria-expanded", String(willOpen));
    if (!willOpen) {
      profileCoverDraft = savedProfile.coverImage || defaultProfile.coverImage;
      if (profileCover) profileCover.src = profileCoverDraft;
      if (profileCoverInput) profileCoverInput.value = "";
    }
  });

  profileCoverInput?.addEventListener("change", async () => {
    const file = profileCoverInput.files?.[0];
    if (!file) return;
    try {
      profileCoverDraft = await compressProfileCover(file);
      if (profileCover) profileCover.src = profileCoverDraft;
      setProfileStyleFeedback("Cover preview ready. Save to apply it.");
    } catch (error) {
      setProfileStyleFeedback(error.message, true);
    }
  });

  profileCoverReset?.addEventListener("click", () => {
    profileCoverDraft = defaultProfile.coverImage;
    if (profileCover) profileCover.src = profileCoverDraft;
    if (profileCoverInput) profileCoverInput.value = "";
    setProfileStyleFeedback("Default cover restored. Save to apply it.");
  });

  profileStyleEditor?.addEventListener("submit", (event) => {
    event.preventDefault();
    savedProfile.coverImage = profileCoverDraft;
    saveProfile();
    applyProfile();
    setProfileStyleFeedback(supabaseUser ? "Style saved and synced." : "Style saved on this device.");
  });

  if (!profileForm) return;
  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const displayName = String(profileForm.elements.displayName.value || "").trim();
    const country = String(profileForm.elements.country.value || "").trim();
    const dateOfBirth = String(profileForm.elements.dateOfBirth.value || "").trim();
    savedProfile.displayName = displayName || defaultProfile.displayName;
    savedProfile.country = country;
    savedProfile.dateOfBirth = dateOfBirth;
    saveProfile();
    applyProfile();
  });
}

initProfile();
initPreferences();
