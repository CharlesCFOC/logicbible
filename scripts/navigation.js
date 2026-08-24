/* Navigation module: wire the shared app navigation to the screen controller. */

document.querySelectorAll("[data-nav]").forEach((button) => {
  button.addEventListener("click", () => setScreen(button.dataset.nav));
});
