import React, { useEffect, useState } from "react";

const profileTabs = [
  ["preferences", "Preference", ["M4 5h16", "M7 5v8", "M17 5v14", "M4 13h16", "M4 21h16"]],
  ["information", "Information", ["M4 5h16v15H4z", "M8 9h8", "M8 13h5", "M8 17h8"]],
  ["cloud", "Cloud account", ["M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19 10a4 4 0 0 1 0 8z"]],
];

function ProfileIcon({ paths }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths.map((path) => <path key={path} d={path} />)}
    </svg>
  );
}

export function ProfileTabs() {
  const [activeTab, setActiveTab] = useState(() => (
    document.querySelector("[data-profile-tab].is-active")?.dataset.profileTab || "preferences"
  ));

  useEffect(() => {
    const handleActiveTab = (event) => {
      if (event.detail?.tab) setActiveTab(event.detail.tab);
    };
    document.addEventListener("profile:tab-active", handleActiveTab);
    return () => document.removeEventListener("profile:tab-active", handleActiveTab);
  }, []);

  const selectTab = (tab, event) => {
    if (event?.nativeEvent?.__primaryTabHandled) return;
    setActiveTab(tab);
    if (typeof window.profileBridge?.selectTab === "function") {
      window.profileBridge.selectTab(tab);
      return;
    }
    document.dispatchEvent(new CustomEvent("profile:tab-change", { detail: { tab } }));
  };

  return profileTabs.map(([id, label, paths]) => (
    <button className={activeTab === id ? "is-active" : ""} key={id} type="button" data-profile-tab={id} onClick={(event) => selectTab(id, event)}>
      <ProfileIcon paths={paths} />
      <span>{label}</span>
    </button>
  ));
}

export function ProfileHero() {
  const bridge = window.profileBridge;
  const [state, setState] = useState(() => bridge.getHero());
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(state.coverImage);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const handleChange = () => {
      const next = bridge.getHero();
      setState(next);
      setDraft(next.coverImage);
    };
    document.addEventListener("profile:hero-change", handleChange);
    return () => document.removeEventListener("profile:hero-change", handleChange);
  }, [bridge]);

  const chooseCover = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setDraft(await bridge.prepareCover(file));
      setFeedback("Cover preview ready. Save to apply it.");
    } catch (error) {
      setFeedback(error.message || "Unable to read this image.");
    }
  };

  const save = (event) => {
    event.preventDefault();
    bridge.saveCover(draft);
    setEditorOpen(false);
    setFeedback("Style saved on this device.");
  };

  return (
    <>
      <img src={draft} alt="Profile background" data-profile-cover loading="lazy" decoding="async" />
      <button className="profile-style-button" type="button" onClick={() => setEditorOpen((current) => !current)} aria-expanded={editorOpen}><span>✎</span><span>Edit style</span></button>
      {editorOpen && <form className="profile-style-editor" onSubmit={save}>
        <label><span>Cover image</span><input type="file" accept="image/*" onChange={chooseCover} /></label>
        <div className="profile-style-actions"><button type="button" className="profile-style-reset" onClick={() => { setDraft(bridge.getHero().coverImage); setFeedback("Default cover restored. Save to apply it."); }}>Reset</button><button type="submit" className="profile-style-save">Save style</button></div>
        <p className="profile-style-feedback" role="status" aria-live="polite">{feedback}</p>
      </form>}
      <div className="profile-hero-overlay"><div><p className="eyebrow">Profile</p><h1 data-profile-name>{state.displayName}</h1><p data-profile-streak>{state.streakLabel}</p></div></div>
    </>
  );
}

const preferenceIcons = {
  image: ["M4 4h16v16H4z", "m4 16 4-4 3 3 3-4 6 6", "M9 8.5h.01"],
  type: ["M4 5h16", "M12 5v14", "M8 19h8"],
};

function PreferenceIcon({ name }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{preferenceIcons[name].map((path) => <path key={path} d={path} />)}</svg>;
}

export function ProfilePreferences() {
  const bridge = window.profileBridge;
  const [state, setState] = useState(() => bridge.getPreferences());

  useEffect(() => {
    const handleChange = () => setState(bridge.getPreferences());
    document.addEventListener("profile:preferences-change", handleChange);
    return () => document.removeEventListener("profile:preferences-change", handleChange);
  }, [bridge]);

  return (
    <>
      <div className="preference-heading">
        <h2 id="appearance-title">Preferences</h2>
        <span>Contrast</span>
      </div>
      <div className="preference-card">
        <div className="preference-copy"><PreferenceIcon name="image" /><div><strong>Background</strong><p>Use the clean white reading mode.</p></div></div>
        <div className="segmented-control">
          <button className={state.background === "paper" ? "is-active" : ""} type="button" onClick={() => bridge.setPreference("background", "paper")}>Light</button>
        </div>
      </div>
      <div className="preference-card">
        <div className="preference-copy"><PreferenceIcon name="type" /><div><strong>Text size</strong><p>Adjust the Scripture reading size.</p></div></div>
        <div className="segmented-control" data-text-size-options>
          {[["xs", "A−", "Extra small text"], ["small", "A", "Small text"], ["medium", "A", "Medium text"], ["large", "A", "Large text"], ["xl", "A+", "Extra large text"]].map(([id, label, ariaLabel]) => (
            <button className={state.textSize === id ? "is-active" : ""} type="button" key={id} onClick={() => bridge.setPreference("textSize", id)} aria-label={ariaLabel}>{label}</button>
          ))}
        </div>
        <div className="text-size-preview"><span>Preview</span><p><sup>1</sup> In the beginning was the Word.</p></div>
      </div>
    </>
  );
}

export function ProfileInformation() {
  const bridge = window.profileBridge;
  const [state, setState] = useState(() => bridge.getInfo());
  const [feedback, setFeedback] = useState("These details stay on this device until Supabase auth is connected.");

  useEffect(() => {
    const handleChange = () => setState(bridge.getInfo());
    document.addEventListener("profile:info-change", handleChange);
    return () => document.removeEventListener("profile:info-change", handleChange);
  }, [bridge]);

  const update = (field, value) => setState((current) => ({ ...current, [field]: value }));
  const save = (event) => {
    event.preventDefault();
    bridge.saveInfo(state);
    setFeedback("Information saved locally. It will be ready to sync once Supabase auth is connected.");
  };

  return (
    <>
      <div className="preference-heading"><h2 id="profile-info-title">Informations</h2><span>Identity</span></div>
      <div className="profile-info-card">
        <form className="profile-info-form" onSubmit={save}>
          <label className="profile-field"><span>Name</span><input type="text" value={state.displayName} onChange={(event) => update("displayName", event.target.value)} maxLength="40" placeholder="Your name" /></label>
          <label className="profile-field"><span>Country</span><input type="text" value={state.country} onChange={(event) => update("country", event.target.value)} maxLength="60" placeholder="Canada" /></label>
          <label className="profile-field"><span>Date de naissance</span><input type="date" value={state.dateOfBirth} onChange={(event) => update("dateOfBirth", event.target.value)} /></label>
          <div className="profile-info-actions"><button type="submit" className="profile-save-button">Save information</button><p>{feedback}</p></div>
        </form>
      </div>
    </>
  );
}

export function ProfileCloudAccount() {
  const bridge = window.profileBridge;
  const [auth, setAuth] = useState(() => bridge.getAuth());
  const [mode, setMode] = useState("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const handleChange = () => setAuth(bridge.getAuth());
    document.addEventListener("profile:auth-change", handleChange);
    return () => document.removeEventListener("profile:auth-change", handleChange);
  }, [bridge]);

  const submit = async (event) => {
    event.preventDefault();
    await bridge.submitAuth(mode, email.trim(), password, passwordConfirm);
  };

  if (auth.connected) {
    return (
      <>
        <div className="preference-heading"><h2 id="profile-auth-title">Cloud account</h2><span>Connected</span></div>
        <div className="profile-auth-form"><div className="auth-connected-email"><span>Connected with</span><strong>{auth.email}</strong></div><div className="profile-auth-actions"><button type="button" onClick={bridge.signOut}>Sign out</button></div><p data-state="success">{auth.feedback}</p></div>
      </>
    );
  }

  return (
    <>
      <div className="preference-heading"><h2 id="profile-auth-title">Cloud account</h2><span>Not connected</span></div>
      <form className="profile-auth-form" onSubmit={submit}>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" autoComplete="email" required />
        <div className="auth-password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength="6" required /><button type="button" className="auth-password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>◉</button></div>
        {mode === "sign-up" && <div className="auth-password-field"><input type={showPassword ? "text" : "password"} value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} placeholder="Confirm password" autoComplete="new-password" minLength="6" required /></div>}
        <div className="profile-auth-actions">
          <button type={mode === "sign-in" ? "submit" : "button"} className={mode === "sign-up" ? "is-secondary" : "is-primary"} onClick={() => mode === "sign-up" && setMode("sign-in")}>Sign in</button>
          <button type={mode === "sign-up" ? "submit" : "button"} className={mode === "sign-up" ? "is-primary" : "is-secondary"} onClick={() => mode === "sign-in" && setMode("sign-up")}>Create account</button>
        </div>
        <button type="button" className="auth-forgot-button" onClick={() => bridge.forgotPassword(email.trim())}>Forgot password?</button>
        <p data-state={auth.feedback.includes("not configured") ? "error" : ""}>{auth.feedback}</p>
      </form>
    </>
  );
}
