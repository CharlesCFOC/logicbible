/* Apologetics module: access gate initialization. */

function initApologeticsGate() {
  if (!apologeticsGateForm || !apologeticsGate) return;
  apologeticsGate.hidden = true;

  apologeticsGateForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (apologeticsGateInput?.value.trim() !== "158") {
      if (apologeticsGateFeedback) apologeticsGateFeedback.textContent = "Invalid access code.";
      apologeticsGateInput?.select();
      return;
    }
    sessionStorage.setItem(apologeticsGateSessionKey, "true");
    apologeticsGate.hidden = true;
    apologeticsGateInput.value = "";
    if (apologeticsGateFeedback) apologeticsGateFeedback.textContent = "";
  });
}

initApologeticsGate();
