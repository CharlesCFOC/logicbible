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
  // Profile styling is owned by React; the removed legacy form no longer exists.

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
