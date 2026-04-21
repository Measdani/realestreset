const form = document.querySelector("#quoteForm");
const statusEl = document.querySelector("#quoteStatus");
const successEl = document.querySelector("#formSuccess");
const successTitle = document.querySelector("#successTitle");
const successMessage = document.querySelector("#successMessage");
const paths = document.querySelectorAll(".form-path");
const typeInputs = document.querySelectorAll('input[name="projectType"]');
const localKey = "rr_quote_submissions";

const setStatus = (message, tone = "") => {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.tone = tone;
};

const getSelectedType = () =>
  document.querySelector('input[name="projectType"]:checked')?.value || "mvp";

const updatePath = () => {
  const selectedType = getSelectedType();

  paths.forEach((path) => {
    const isActive = path.dataset.path === selectedType;
    path.hidden = !isActive;
    path.querySelectorAll("[data-required-for]").forEach((field) => {
      field.required = isActive && field.dataset.requiredFor === selectedType;
    });
  });
};

const getValues = (name) =>
  Array.from(form.querySelectorAll(`[name="${name}"]:checked`)).map((input) => input.value);

const getValue = (name) => {
  const field = form.elements[name];
  if (!field) return "";
  if (field instanceof RadioNodeList) {
    return field.value || "";
  }
  return field.value || "";
};

const buildPayload = () => ({
  projectType: getSelectedType(),
  fullName: getValue("fullName").trim(),
  email: getValue("email").trim(),
  businessName: getValue("businessName").trim(),
  website: getValue("website").trim(),
  buildType: getValue("buildType"),
  buildDescription: getValue("buildDescription").trim(),
  businessContext: getValue("businessContext").trim(),
  problemToSolve: getValue("problemToSolve").trim(),
  platformUsers: getValue("platformUsers"),
  features: getValues("features"),
  migrationNeed: getValue("migrationNeed"),
  startTimeline: getValue("startTimeline"),
  investmentRange: getValue("investmentRange"),
  additionalNotes: getValue("additionalNotes").trim(),
  reviewNeeds: getValues("reviewNeeds"),
  currentIssue: getValue("currentIssue").trim(),
  currentPlatform: getValue("currentPlatform"),
  hasAccess: getValue("hasAccess"),
  auditOutcome: getValues("auditOutcome"),
  auditTimeline: getValue("auditTimeline"),
});

const saveLocal = (submission) => {
  const existing = JSON.parse(localStorage.getItem(localKey) || "[]");
  localStorage.setItem(localKey, JSON.stringify([submission, ...existing]));
};

const showSuccess = (projectType) => {
  form.hidden = true;
  successEl.hidden = false;

  if (projectType === "audit") {
    successTitle.textContent = "Thanks for submitting your audit request.";
    successMessage.textContent = "I'll confirm details and send your audit link to get started.";
  } else {
    successTitle.textContent = "Thanks for submitting your request.";
    successMessage.textContent =
      "I review all MVP inquiries within 24-48 hours. If it's a fit, I'll send next steps and a scoped plan.";
  }
};

const submitQuote = async (event) => {
  event.preventDefault();
  setStatus("Submitting request...");

  const payload = buildPayload();
  const fallbackSubmission = {
    ...payload,
    id: `local_${Date.now()}`,
    status: "new",
    createdAt: new Date().toISOString(),
  };

  try {
    const response = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Quote API unavailable");
    }

    saveLocal(data.submission || fallbackSubmission);
    showSuccess(payload.projectType);
  } catch (error) {
    saveLocal(fallbackSubmission);
    setStatus("Saved locally for testing. Connect storage before relying on production submissions.", "warn");
    showSuccess(payload.projectType);
  }
};

typeInputs.forEach((input) => input.addEventListener("change", updatePath));

if (form) {
  updatePath();
  form.addEventListener("submit", submitQuote);
}
