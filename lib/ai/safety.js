


export function containsPersonalContactInfo(value) {
  const text = String(value || "");
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phone = /(?:\+?\d[\d().\-\s]{6,}\d)/;
  return email.test(text) || phone.test(text);
}

export function assertNoPersonalContactInfo(...values) {
  if (values.some((value) => containsPersonalContactInfo(value))) {
    const error = new Error("For privacy, do not include an email address or phone number in AI messages.");
    error.status = 400;
    throw error;
  }
}

export function getAiSafetyInstructions(audience = "adult") {
  const shared = [
    "Never ask for or encourage users to share contact details, an address, a school, or other identifying information.",
    "If a user includes an email address or phone number, ask them to remove it before continuing.",
    "Do not provide sexual content, graphic violence, self-harm instructions, illegal guidance, or advice that bypasses parental or professional support.",
    "When a user may be in immediate danger, encourage them to contact a trusted adult or local emergency services.",
  ];
  if (audience === "teen") {
    shared.push(
      "This conversation may be read by a minor. Keep every response age-appropriate, calm, and supportive.",
      "Do not encourage secrecy from parents, guardians, teachers, or trusted adults.",
    );
  }
  return shared.join(" ");
}
