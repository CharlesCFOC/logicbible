// Legacy core/account: loaded before script.js; declarations only.
// Shared state remains in script.js during the incremental React migration.

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  if (key === "brother.notes") {
    markPendingSync(key);
    return;
  }
  syncStateKey(key, value);
}

function setLocalValue(key, value) {
  localStorage.setItem(key, value);
  syncStateKey(key, value);
}

function removeLocalValue(key) {
  localStorage.removeItem(key);
  if (supabaseClient && supabaseUser && !isHydratingSupabase) {
    supabaseClient.from("user_app_state").delete().eq("user_id", supabaseUser.id).eq("state_key", key);
  }
}

function clearLocalAccountData() {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("brother.")) {
      localStorage.removeItem(key);
    }
  });
  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith("brother.")) {
      sessionStorage.removeItem(key);
    }
  });
}

function parseStoredValue(rawValue) {
  try {
    return JSON.parse(rawValue);
  } catch {
    return rawValue;
  }
}

function encodeLocalPayload(rawValue) {
  const raw = String(rawValue ?? "");
  try {
    return { __localState: true, raw: false, value: JSON.parse(raw) };
  } catch {
    return { __localState: true, raw: true, value: raw };
  }
}

function decodeRemotePayload(payload) {
  if (payload && payload.__localState === true) {
    return payload.raw ? String(payload.value ?? "") : JSON.stringify(payload.value);
  }
  return typeof payload === "string" ? payload : JSON.stringify(payload);
}

function getPendingSyncKeys() {
  return new Set(readJson(pendingSyncKey, []));
}

function markPendingSync(key) {
  const pendingKeys = getPendingSyncKeys();
  pendingKeys.add(key);
  localStorage.setItem(pendingSyncKey, JSON.stringify([...pendingKeys]));
}

function clearPendingSync(key) {
  const pendingKeys = getPendingSyncKeys();
  pendingKeys.delete(key);
  if (pendingKeys.size) {
    localStorage.setItem(pendingSyncKey, JSON.stringify([...pendingKeys]));
  } else {
    localStorage.removeItem(pendingSyncKey);
  }
}

async function syncStateKey(key, value) {
  if (key === "brother.prayerRequests" || !supabaseClient || !supabaseUser || isHydratingSupabase || !key.startsWith("brother.")) {
    return;
  }

  const userId = supabaseUser.id;
  const rawValue = typeof value === "string" ? value : JSON.stringify(value);
  const { error } = await supabaseClient.from("user_app_state").upsert({
    user_id: userId,
    state_key: key,
    payload: encodeLocalPayload(rawValue),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,state_key" });

  if (error) {
    console.warn("Supabase state sync failed:", error.message);
    return false;
  }
  // A newer vibration choice must remain queued while an older write finishes.
  if ((key !== "brother.hapticsStrength" && !key.startsWith("brother.kidsAdventure.")) || (supabaseUser?.id === userId && localStorage.getItem(key) === rawValue)) {
    clearPendingSync(key);
  }
  return true;
}

let pendingSyncPromise = null;

async function syncPendingState() {
  if (!supabaseClient || !supabaseUser || isHydratingSupabase || !getPendingSyncKeys().size) {
    return;
  }
  if (pendingSyncPromise) {
    return pendingSyncPromise;
  }

  const userId = supabaseUser.id;
  pendingSyncPromise = (async () => {
    const pendingKeys = [...getPendingSyncKeys()];
    for (const key of pendingKeys) {
      if (key === "brother.notes") {
        await syncStateKey(key, readJson(key, {}));
      }
    }
    // Serialize story progress so a slower write cannot restore an earlier scene.
    while (supabaseUser?.id === userId && !isHydratingSupabase) {
      const key = [...getPendingSyncKeys()].find(item => item.startsWith("brother.kidsAdventure."));
      if (!key) break;
      const value = localStorage.getItem(key);
      if (value === null) { clearPendingSync(key); continue; }
      if (!(await syncStateKey(key, value))) break;
    }
    // Serialize vibration writes so rapid taps cannot save an older level last.
    while (supabaseUser?.id === userId && !isHydratingSupabase && getPendingSyncKeys().has("brother.hapticsStrength")) {
      const value = localStorage.getItem("brother.hapticsStrength");
      if (!value || !(await syncStateKey("brother.hapticsStrength", value))) break;
    }
  })().finally(() => {
    pendingSyncPromise = null;
  });

  return pendingSyncPromise;
}

function setAuthFeedback(message, isError = false) {
  profileAuthBridgeFeedback = message;
  if (!authFeedback) {
    document.dispatchEvent(new CustomEvent("profile:auth-change"));
    return;
  }
  authFeedback.textContent = message;
  authFeedback.dataset.state = isError ? "error" : "success";
  document.dispatchEvent(new CustomEvent("profile:auth-change"));
}

function updateAuthUi() {
  const connected = Boolean(supabaseUser);
  const authEmailInput = authForm?.elements.email;
  const authPasswordField = authForm?.elements.password?.closest(".auth-password-field");
  if (authModeLabel) {
    authModeLabel.textContent = connected ? "Connected" : "Not connected";
  }
  if (authEmailInput) authEmailInput.hidden = connected;
  if (authPasswordField) authPasswordField.hidden = connected;
  if (authConnectedEmail) authConnectedEmail.hidden = !connected;
  if (authConnectedEmailValue) authConnectedEmailValue.textContent = connected ? (supabaseUser.email || "") : "";
  if (authSignInButton) authSignInButton.hidden = connected;
  if (authSignUpButton) authSignUpButton.hidden = connected;
  if (authSignOutButton) authSignOutButton.hidden = !connected;
  if (profileAuthStatus) profileAuthStatus.textContent = connected ? "Supabase account" : "Local profile";
  if (profileStorageStatus) profileStorageStatus.textContent = connected ? "Synced" : "Local only";
  if (profileAccountId && connected) profileAccountId.textContent = supabaseUser.id;
  document.dispatchEvent(new CustomEvent("profile:auth-change"));
}

async function hydrateSupabaseState() {
  if (!supabaseClient || !supabaseUser) {
    return false;
  }

  // Keep the last text size chosen on this device when older cloud records load.
  const localPreferences = readJson("brother.preferences", {});
  const hasLocalTextSize = Object.hasOwn(textSizeOptions, localPreferences.textSize);
  isHydratingSupabase = true;
  try {
    const { data: rows, error } = await supabaseClient
      .from("user_app_state")
      .select("state_key,payload")
      .eq("user_id", supabaseUser.id);

    if (error) {
      throw error;
    }

    const localKeys = Object.keys(localStorage).filter((key) => key.startsWith("brother.") && !key.startsWith("brother.studyChat."));
    const localRows = new Map(localKeys.map((key) => [key, localStorage.getItem(key)]));
    const remoteRows = new Map((rows || []).map((row) => [row.state_key, row.payload]));
    const missingRows = [];

    const pendingKeys = getPendingSyncKeys();
    remoteRows.forEach((payload, key) => {
      if (key.startsWith("brother.studyChat.")) return;
      if (key === "brother.hapticsStrength") {
        const localStrength = localStorage.getItem(key);
        // Preserve levels already chosen on this device before cloud sync existed.
        if (["off", "1", "2", "3", "4", "5", "light", "medium", "strong"].includes(localStrength)
          && localStrength !== decodeRemotePayload(payload)) {
          markPendingSync(key);
          pendingKeys.add(key);
        }
      }
      if (!pendingKeys.has(key)) {
        localStorage.setItem(key, decodeRemotePayload(payload));
      }
    });

    localRows.forEach((payload, key) => {
      if (!remoteRows.has(key)) {
        missingRows.push({ user_id: supabaseUser.id, state_key: key, payload: encodeLocalPayload(payload) });
      }
    });

    if (missingRows.length) {
      const { error: uploadError } = await supabaseClient
        .from("user_app_state")
        .upsert(missingRows, { onConflict: "user_id,state_key" });
      if (uploadError) throw uploadError;
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("id,email,display_name,country,age,avatar_url,bio,streak")
      .eq("id", supabaseUser.id)
      .maybeSingle();
    if (profile) {
      const localProfile = readJson("brother.profile", {});
      writeLocalWithoutSync("brother.profile", {
        ...localProfile,
        email: profile.email || supabaseUser.email || "",
        displayName: profile.display_name || localProfile.displayName || supabaseUser.user_metadata?.display_name || "",
        country: profile.country || localProfile.country || "",
        dateOfBirth: localProfile.dateOfBirth || "",
        avatarInitials: localProfile.avatarInitials || getProfileInitials(profile.display_name),
        bio: profile.bio || localProfile.bio || "",
        accountId: profile.id,
        authStatus: "Supabase account",
        storageStatus: "Synced",
      });
    }

    const { data: preferences } = await supabaseClient
      .from("user_preferences")
      .select("app_background,text_size,accent")
      .eq("user_id", supabaseUser.id)
      .maybeSingle();
    if (preferences) {
      writeLocalWithoutSync("brother.preferences", {
        ...readJson("brother.preferences", {}),
        background: preferences.app_background || "paper",
        textSize: hasLocalTextSize ? savedPreferences.textSize : preferences.text_size || "medium",
        accent: preferences.accent || "taupe",
      });
    }

    const hydratedPreferences = readJson("brother.preferences", {});
    if (hasLocalTextSize) hydratedPreferences.textSize = savedPreferences.textSize;
    writeLocalWithoutSync("brother.preferences", hydratedPreferences);
    Object.assign(savedPreferences, hydratedPreferences);
    applyPreferences();
    document.dispatchEvent(new CustomEvent("profile:preferences-change"));
    return true;
  } finally {
    isHydratingSupabase = false;
    await syncPendingState();
  }
}

function writeLocalWithoutSync(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function handleSupabaseSession(session) {
  supabaseUser = session?.user || null;
  window.dispatchEvent(new CustomEvent("church:auth-change"));
  updateAuthUi();
  refreshHomeLibraryPanel();
  if (!supabaseUser) {
    await loadPrayerFromSupabase();
    return;
  }

  try {
    await syncPendingState();
    const hydrated = await hydrateSupabaseState();
    await loadPrayerFromSupabase();
    refreshHomeLibraryPanel();
    const marker = sessionStorage.getItem("brother.supabaseHydratedUser");
    if (hydrated && marker !== supabaseUser.id) {
      sessionStorage.setItem("brother.supabaseHydratedUser", supabaseUser.id);
      window.location.reload();
    }
  } catch (error) {
    setAuthFeedback(`Sync failed: ${error.message}`, true);
  }
}

async function initSupabase() {
  if (!window.supabase?.createClient) {
    setAuthFeedback("Supabase client could not be loaded.", true);
    return;
  }

  try {
    const response = await fetch(apiUrl("/api/supabase/config"));
    const config = await response.json();
    if (!config.configured) {
      updateAuthUi();
      return;
    }

    supabaseClient = window.supabase.createClient(config.url, config.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => handleSupabaseSession(session), 0);
    });
    const { data } = await supabaseClient.auth.getSession();
    await handleSupabaseSession(data.session);
  } catch (error) {
    setAuthFeedback(`Supabase unavailable: ${error.message}`, true);
  }
}
