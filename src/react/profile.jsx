import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  const [hero, setHero] = useState(() => bridge.getHero());
  const coverCarouselRef = useRef(null);

  useEffect(() => {
    const handleChange = () => setState(bridge.getPreferences());
    document.addEventListener("profile:preferences-change", handleChange);
    return () => document.removeEventListener("profile:preferences-change", handleChange);
  }, [bridge]);

  useEffect(() => {
    const handleChange = () => setHero(bridge.getHero());
    document.addEventListener("profile:hero-change", handleChange);
    return () => document.removeEventListener("profile:hero-change", handleChange);
  }, [bridge]);

  const scrollCoverCarousel = (direction) => {
    coverCarouselRef.current?.scrollBy({ left: direction * (coverCarouselRef.current.clientWidth * 0.82), behavior: "smooth" });
  };

  return (
    <>
      <div className="preference-heading">
        <h2 id="appearance-title">Preferences</h2>
      </div>
      <div className="preference-card">
        <div className="preference-cover-picker">
          <div className="preference-copy"><PreferenceIcon name="image" /><div><strong>Hero image</strong><p>Choose the image shown at the top of your profile.</p></div></div>
          <div className="profile-cover-carousel" role="region" aria-label="Hero image carousel">
            <button className="profile-cover-arrow" type="button" onClick={() => scrollCoverCarousel(-1)} aria-label="Previous hero images">‹</button>
            <div className="profile-cover-viewport" ref={coverCarouselRef}>
              <div className="profile-cover-grid" aria-label="Hero image choices">
                {(hero.coverOptions || []).map((option) => (
                  <button className={hero.coverImage === option.src ? "is-active" : ""} type="button" key={option.id} onClick={() => bridge.saveCover(option.src)} aria-label={`Use ${option.label} hero image`} aria-pressed={hero.coverImage === option.src}>
                    <img src={option.src} alt="" loading="lazy" decoding="async" />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button className="profile-cover-arrow" type="button" onClick={() => scrollCoverCarousel(1)} aria-label="Next hero images">›</button>
          </div>
        </div>
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

  useEffect(() => {
    const handleChange = () => setState(bridge.getInfo());
    document.addEventListener("profile:info-change", handleChange);
    return () => document.removeEventListener("profile:info-change", handleChange);
  }, [bridge]);

  const update = (field, value) => setState((current) => ({ ...current, [field]: value }));
  const save = (event) => {
    event.preventDefault();
    bridge.saveInfo(state);
  };

  return (
    <>
      <div className="preference-heading"><h2 id="profile-info-title">Informations</h2></div>
      <div className="profile-info-card">
        <form className="profile-info-form" onSubmit={save}>
          <label className="profile-field"><span>Name</span><input type="text" value={state.displayName} onChange={(event) => update("displayName", event.target.value)} maxLength="40" placeholder="Your name" /></label>
          <label className="profile-field"><span>Country</span><input type="text" value={state.country} onChange={(event) => update("country", event.target.value)} maxLength="60" placeholder="Canada" /></label>
          <label className="profile-field"><span>Date de naissance</span><input type="date" value={state.dateOfBirth} onChange={(event) => update("dateOfBirth", event.target.value)} /></label>
          <div className="profile-info-actions"><button type="submit" className="profile-save-button">Save information</button></div>
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const handleChange = () => setAuth(bridge.getAuth());
    document.addEventListener("profile:auth-change", handleChange);
    return () => document.removeEventListener("profile:auth-change", handleChange);
  }, [bridge]);

  useEffect(() => {
    if (!deleteOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !deleting) setDeleteOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [deleteOpen, deleting]);

  const submit = async (event) => {
    event.preventDefault();
    await bridge.submitAuth(mode, email.trim(), password, passwordConfirm);
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setDeleteError("");
    const deleted = await bridge.deleteAccount();
    if (!deleted) {
      setDeleteError(bridge.getAuth().feedback);
      setDeleting(false);
      return;
    }
    setDeleteOpen(false);
  };

  if (auth.connected) {
    return (
      <>
        <div className="preference-heading"><h2 id="profile-auth-title">Cloud account</h2><span>Connected</span></div>
        <div className="profile-auth-form">
          <div className="auth-connected-email"><span>Connected with</span><strong>{auth.email}</strong></div>
          <div className="profile-auth-actions">
            <button type="button" data-auth-action="sign-out" onClick={bridge.signOut}>Sign out</button>
            <button type="button" className="profile-delete-trigger" onClick={() => { setDeleteError(""); setDeleteOpen(true); }} aria-haspopup="dialog" aria-expanded={deleteOpen}>Delete my account</button>
          </div>
        </div>
        {deleteOpen && createPortal(
          <div className="profile-delete-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) setDeleteOpen(false); }}>
            <section className="profile-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="profile-delete-title" aria-describedby="profile-delete-description">
              <div className="profile-delete-dialog-icon" aria-hidden="true">!</div>
              <span className="profile-delete-dialog-eyebrow">ACCOUNT SECURITY</span>
              <h3 id="profile-delete-title">Delete your account?</h3>
              <p id="profile-delete-description">Your profile, preferences, prayer requests, saved items, and conversations will be permanently deleted. This cannot be undone.</p>
              {deleteError && <p className="profile-delete-error" role="alert">{deleteError}</p>}
              <div className="profile-delete-dialog-actions">
                <button type="button" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</button>
                <button type="button" className="profile-delete-confirm" onClick={deleteAccount} disabled={deleting}>{deleting ? "Deleting…" : "Delete permanently"}</button>
              </div>
            </section>
          </div>,
          document.querySelector(".phone-frame") || document.body,
        )}
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
