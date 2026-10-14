import { Capacitor } from "@capacitor/core";
import { LiveUpdate } from "@capawesome/capacitor-live-update";
import config from "../../mobile-update.config.json";

export async function startMobileUpdates() {
  if (Capacitor.getPlatform() !== "android") return;
  try {
    // Confirm startup before doing any network work, so offline launches work too.
    await LiveUpdate.ready();
  } catch (error) {
    console.warn("Mobile update initialization failed", error);
    return;
  }
  let checking = false;
  let lastCheck = 0;
  let retryDelay = 600_000;
  let notice;
  const showNotice = (message, action) => {
    notice ||= document.createElement("aside");
    notice.className = "mobile-update-notice";
    notice.replaceChildren();
    const text = document.createElement("span");
    text.setAttribute("role", "status");
    text.textContent = message;
    notice.append(text);
    if (action) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Apply";
      button.addEventListener("click", async () => {
        button.disabled = true;
        try { await LiveUpdate.reload(); }
        catch { button.disabled = false; text.textContent = "Close the app completely, then reopen it to apply the update."; }
      });
      notice.append(button);
    }
    if (!notice.isConnected) document.body.append(notice);
  };
  const check = async () => {
    if (checking || Date.now() - lastCheck < retryDelay) return;
    checking = true;
    lastCheck = Date.now();
    try {
      const response = await fetch(`${config.origin}/mobile-updates/latest.json?t=${Date.now()}`, {
        cache: "no-store", signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`Update manifest HTTP ${response.status}`);
      const latest = await response.json();
      const { versionName } = await LiveUpdate.getVersionName();
      if (latest.nativeVersion !== versionName || !/^[a-f0-9]{64}$/.test(latest.bundleId)
        || !/^[a-f0-9]{64}$/.test(latest.checksum)) return;
      const url = new URL(latest.url, config.origin);
      if (url.origin !== config.origin || url.pathname !== `/mobile-updates/${latest.bundleId}.zip`) return;
      const { bundleId } = await LiveUpdate.getCurrentBundle();
      const builtin = await fetch("mobile-version.json").then(r => r.json());
      if (latest.bundleId === (bundleId || builtin.bundleId)) return;
      const blocked = await LiveUpdate.getBlockedBundles();
      if (blocked.bundleIds.includes(latest.bundleId)) return;
      const downloaded = await LiveUpdate.getDownloadedBundles();
      if (!downloaded.bundleIds.includes(latest.bundleId)) {
        showNotice("Downloading the update… Keep the app open.");
        const listener = await LiveUpdate.addListener("downloadBundleProgress", event => {
          if (event.bundleId === latest.bundleId && Number.isFinite(event.progress)) showNotice(`Update: ${Math.max(0, Math.min(99, Math.round(event.progress * 100)))} % · downloading`);
        });
        try {
          await LiveUpdate.downloadBundle({ bundleId: latest.bundleId, url: url.href, checksum: latest.checksum });
        } finally { await listener.remove(); }
      }
      // Never interrupt a conversation or an unsaved prayer with a reload.
      await LiveUpdate.setNextBundle({ bundleId: latest.bundleId });
      retryDelay = 600_000;
      showNotice("Update ready. Apply will restart the app.", true);
    } catch (error) {
      console.warn("Mobile update unavailable; keeping the installed version", error);
      retryDelay = 60_000;
      if (notice?.isConnected) showNotice("Download interrupted. Retrying in one minute.");
    } finally {
      checking = false;
    }
  };
  void check();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void check();
  });
  window.addEventListener("online", () => { lastCheck = 0; void check(); });
  window.setInterval(() => {
    if (document.visibilityState === "visible") void check();
  }, 60_000);
}
