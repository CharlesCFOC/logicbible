/* Navigation module: delegated wiring also covers React-rendered buttons. */

function navigateFromFallback(id) {
  if (typeof window.appNavigate === "function") {
    window.appNavigate(id);
    return;
  }

  const target = document.getElementById(id);
  if (!target) return;
  document.querySelectorAll("[data-screen]").forEach((screen) => {
    screen.classList.toggle("is-active", screen === target);
  });
  document.querySelectorAll("[data-nav]").forEach((navButton) => {
    navButton.classList.toggle("is-active", navButton.dataset.nav === id);
  });
}

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : event.target?.parentElement;
  if (!target) return;

  const homeLibraryTab = target.closest("[data-home-library-tab]");
  if (homeLibraryTab) {
    event.__primaryTabHandled = true;
    if (typeof window.homeLibraryBridge?.selectTab === "function") {
      window.homeLibraryBridge.selectTab(homeLibraryTab.dataset.homeLibraryTab);
    } else {
      window.renderHomeLibraryTab?.(homeLibraryTab.dataset.homeLibraryTab);
    }
    return;
  }

  const profileTab = target.closest("[data-profile-tab]");
  if (profileTab) {
    event.__primaryTabHandled = true;
    if (typeof window.profileBridge?.selectTab === "function") {
      window.profileBridge.selectTab(profileTab.dataset.profileTab);
    } else {
      const tab = profileTab.dataset.profileTab;
      document.querySelectorAll("[data-profile-section]").forEach((section) => {
        section.hidden = section.dataset.profileSection !== tab;
      });
    }
    return;
  }

  const button = target.closest("[data-nav]");
  if (!button) return;
  navigateFromFallback(button.dataset.nav);
}, true);
