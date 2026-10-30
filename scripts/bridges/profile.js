// Adapter used by React; installed at the original bootstrap point.
function installProfileBridge() {
window.profileBridge = {
  selectTab(tab) {
    if (!["preferences", "information", "cloud", "prayers"].includes(tab)) return;
    setProfileTab(tab);
  },
  getHero() {
    const coverImage = savedProfile.coverImage || defaultProfile.coverImage;
    return {
      displayName: getEffectiveProfileName(),
      welcome: getProfileWelcome(),
      streakLabel: getProfileStreakLabel(),
      coverImage,
      coverOptions: profileCoverOptions,
    };
  },
  saveCover(coverImage) {
    savedProfile.coverImage = coverImage || defaultProfile.coverImage;
    saveProfile();
    applyProfile();
    document.dispatchEvent(new CustomEvent("profile:hero-change"));
  },
  getAuth() {
    return {
      connected: Boolean(supabaseUser),
      email: supabaseUser?.email || "",
      feedback: profileAuthBridgeFeedback || "Connect to sync your profile and app data across devices.",
    };
  },
  async submitAuth(mode, email, password, passwordConfirm) {
    if (!supabaseClient) {
      setAuthFeedback("Supabase is not configured yet.", true);
      return;
    }
    if (mode === "sign-up") {
      if (!passwordConfirm) {
        setAuthFeedback("Confirm your password to create the account.", true);
        return;
      }
      if (password !== passwordConfirm) {
        setAuthFeedback("Passwords do not match.", true);
        return;
      }
      const { error } = await supabaseClient.auth.signUp({ email, password });
      setAuthFeedback(error ? error.message : "Account created. Check your email if confirmation is enabled.", Boolean(error));
      return;
    }
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    setAuthFeedback(error ? error.message : "Signed in. Syncing your data...", Boolean(error));
  },
  async changePassword(password, confirmation) {
    if (!supabaseClient || !supabaseUser) return { error: "Sign in before changing your password." };
    if (password.length < 6) return { error: "Use at least 6 characters." };
    if (password !== confirmation) return { error: "The passwords do not match." };
    try {
      const { error } = await supabaseClient.auth.updateUser({ password });
      return { error: error?.message || "" };
    } catch {
      return { error: "Could not change your password. Please try again." };
    }
  },
  async forgotPassword(email) {
    if (!supabaseClient) {
      setAuthFeedback("Supabase is not configured yet.", true);
      return;
    }
    if (!email) {
      setAuthFeedback("Enter your email first to reset your password.", true);
      return;
    }
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}${window.location.pathname}` });
    setAuthFeedback(error ? error.message : "Password reset email sent. Check your inbox.", Boolean(error));
  },
  async deleteAccount() {
    if (!supabaseClient || !supabaseUser) {
      setAuthFeedback("Sign in before deleting your account.", true);
      return false;
    }

    const sessionResult = await supabaseClient.auth.getSession();
    const session = sessionResult.data?.session;
    if (!session?.access_token) {
      setAuthFeedback("Your session has expired. Sign in again before deleting your account.", true);
      return false;
    }

    try {
      const response = await fetch(apiUrl("/api/account/delete"), {
        method: "POST",
        headers: { authorization: `Bearer ${session.access_token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.deleted) {
        throw new Error(payload.error || "The account could not be deleted.");
      }

      await supabaseClient.auth.signOut().catch(() => {});
      clearLocalAccountData();
      supabaseUser = null;
      setAuthFeedback("Your account and synced data were permanently deleted.");
      updateAuthUi();
      window.setTimeout(() => window.location.reload(), 80);
      return true;
    } catch (error) {
      setAuthFeedback(error.message || "The account could not be deleted.", true);
      return false;
    }
  },
  async signOut() {
    await supabaseClient?.auth.signOut();
    sessionStorage.removeItem("brother.supabaseHydratedUser");
    setAuthFeedback("Signed out. The app is now local-only.");
  },
  getInfo() {
    return {
      displayName: savedProfile.displayName || "",
      country: savedProfile.country || "",
      dateOfBirth: savedProfile.dateOfBirth || "",
    };
  },
  async saveInfo(info) {
    savedProfile.displayName = String(info.displayName || "").trim() || defaultProfile.displayName;
    savedProfile.country = String(info.country || "").trim();
    savedProfile.dateOfBirth = String(info.dateOfBirth || "").trim();
    await saveProfile();
    applyProfile();
    document.dispatchEvent(new CustomEvent("profile:info-change"));
    document.dispatchEvent(new CustomEvent("profile:hero-change"));
  },
  getPreferences() {
    const savedHapticsStrength = localStorage.getItem("brother.hapticsStrength") || "1";
    return {
      background: savedPreferences.background,
      textSize: savedPreferences.textSize,
      accent: savedPreferences.accent,
      hapticsStrength: ({ light: "1", medium: "3", strong: "5" })[savedHapticsStrength] || savedHapticsStrength,
      textSizes: Object.keys(textSizeOptions),
      accents: Object.keys(accentOptions),
    };
  },
  setPreference(type, value) {
    if (type === "hapticsStrength") {
      if (["off", "1", "2", "3", "4", "5"].includes(value)) {
        localStorage.setItem("brother.hapticsStrength", value);
        markPendingSync("brother.hapticsStrength");
        syncPendingState().catch(error => console.warn("Vibration preference sync failed:", error.message));
        window.appButtonHaptic?.();
        document.dispatchEvent(new CustomEvent("profile:preferences-change"));
      }
      return;
    }
    if (type === "background") savedPreferences.background = value;
    if (type === "textSize" && textSizeOptions[value]) savedPreferences.textSize = value;
    if (type === "accent" && accentOptions[value]) savedPreferences.accent = value;
    savePreferences();
    applyPreferences();
    if (type === "background") centerBackgroundOption(savedPreferences.background);
    document.dispatchEvent(new CustomEvent("profile:preferences-change"));
  },
};
}
