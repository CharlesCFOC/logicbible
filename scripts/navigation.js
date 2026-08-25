/* Navigation module: delegated wiring also covers React-rendered buttons. */

document.addEventListener("click", (event) => {
  const homeLibraryTab = event.target.closest("[data-home-library-tab]");
  if (homeLibraryTab) {
    event.__primaryTabHandled = true;
    window.homeLibraryBridge?.selectTab(homeLibraryTab.dataset.homeLibraryTab);
    return;
  }

  const profileTab = event.target.closest("[data-profile-tab]");
  if (profileTab) {
    event.__primaryTabHandled = true;
    window.profileBridge?.selectTab(profileTab.dataset.profileTab);
    return;
  }

  const button = event.target.closest("[data-nav]");
  if (!button) return;
  setScreen(button.dataset.nav);
}, true);
