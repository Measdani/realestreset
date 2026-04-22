const localKey = "rr_quote_submissions";
const loginSection = document.querySelector("#adminLogin");
const loginForm = document.querySelector("#adminLoginForm");
const passwordInput = document.querySelector("#adminPassword");
const privateSection = document.querySelector("#adminPrivate");
const navActions = document.querySelector("#adminNavActions");
const logoutButton = document.querySelector("#logoutAdmin");
const loadRemoteButton = document.querySelector("#loadRemote");
const loadLocalButton = document.querySelector("#loadLocal");
const refreshButton = document.querySelector("#refreshQuotes");
const exportButton = document.querySelector("#exportQuotes");
const typeFilter = document.querySelector("#typeFilter");
const statusFilter = document.querySelector("#statusFilter");
const listEl = document.querySelector("#quoteList");
const detailEl = document.querySelector("#quoteDetail");
const statusEl = document.querySelector("#adminStatus");
const authStatusEl = document.querySelector("#authStatus");

let submissions = [];
let selectedId = "";
let source = "remote";

const setStatus = (message, tone = "") => {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.tone = tone;
};

const setAuthStatus = (message, tone = "") => {
  if (!authStatusEl) return;
  authStatusEl.textContent = message;
  authStatusEl.dataset.tone = tone;
};

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : "Unknown";

const getLocal = () => JSON.parse(localStorage.getItem(localKey) || "[]");

const saveLocal = () => {
  localStorage.setItem(localKey, JSON.stringify(submissions));
};

const resetDetail = () => {
  detailEl.innerHTML = `
    <p class="section-kicker">Select a request</p>
    <h2>No request selected.</h2>
    <p>Choose a submission from the list to review details, update status, or add notes.</p>
  `;
};

const setUnlocked = (isUnlocked) => {
  loginSection.hidden = isUnlocked;
  privateSection.hidden = !isUnlocked;
  navActions.hidden = !isUnlocked;
};

const filteredSubmissions = () =>
  submissions.filter((submission) => {
    const typeMatches = typeFilter.value === "all" || submission.projectType === typeFilter.value;
    const statusMatches = statusFilter.value === "all" || submission.status === statusFilter.value;
    return typeMatches && statusMatches;
  });

const renderList = () => {
  const items = filteredSubmissions();
  listEl.innerHTML = "";

  if (!items.length) {
    listEl.innerHTML = '<p class="empty-state">No quote requests match this view.</p>';
    return;
  }

  items.forEach((submission) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `quote-row ${submission.id === selectedId ? "active" : ""}`;
    button.innerHTML = `
      <span>${submission.projectType === "audit" ? "Audit" : "MVP"}</span>
      <strong>${escapeHtml(submission.businessName || submission.fullName)}</strong>
      <small>${formatDate(submission.createdAt)} / ${submission.status || "new"}</small>
    `;
    button.addEventListener("click", () => {
      selectedId = submission.id;
      renderList();
      renderDetail(submission);
    });
    listEl.appendChild(button);
  });
};

const detailPair = (label, value) => {
  const display = Array.isArray(value) ? value.join(", ") : value;
  if (!display) return "";
  return `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(display)}</dd>`;
};

const renderDetail = (submission) => {
  const isAudit = submission.projectType === "audit";
  const email = String(submission.email || "");
  detailEl.innerHTML = `
    <p class="section-kicker">${isAudit ? "Security & Logic Audit" : "MVP Build"}</p>
    <h2>${escapeHtml(submission.businessName || "Untitled request")}</h2>
    <p>${escapeHtml(submission.fullName)} / <a href="mailto:${encodeURIComponent(email)}">${escapeHtml(email)}</a></p>
    <dl class="quote-detail-list">
      ${detailPair("Website", submission.website)}
      ${detailPair("Created", formatDate(submission.createdAt))}
      ${detailPair("Status", submission.status)}
      ${isAudit ? renderAuditDetails(submission) : renderMvpDetails(submission)}
    </dl>
    <div class="admin-update">
      <label>
        <span>Status</span>
        <select id="detailStatus">
          ${["new", "reviewing", "fit", "not-fit", "closed"]
            .map((status) => `<option value="${status}" ${submission.status === status ? "selected" : ""}>${status}</option>`)
            .join("")}
        </select>
      </label>
      <label>
        <span>Admin notes</span>
        <textarea id="adminNotes" rows="4">${escapeHtml(submission.adminNotes || "")}</textarea>
      </label>
      <button class="button primary" type="button" id="saveStatus">Save update</button>
    </div>
  `;

  document.querySelector("#saveStatus").addEventListener("click", () => updateSubmission(submission.id));
};

const renderMvpDetails = (submission) => `
  ${detailPair("Build type", submission.buildType)}
  ${detailPair("Description", submission.buildDescription)}
  ${detailPair("Business", submission.businessContext)}
  ${detailPair("Problem", submission.problemToSolve)}
  ${detailPair("Users", submission.platformUsers)}
  ${detailPair("Features", submission.features)}
  ${detailPair("Migration", submission.migrationNeed)}
  ${detailPair("Start", submission.startTimeline)}
  ${detailPair("Investment", submission.investmentRange)}
  ${detailPair("Notes", submission.additionalNotes)}
`;

const renderAuditDetails = (submission) => `
  ${detailPair("Review needs", submission.reviewNeeds)}
  ${detailPair("Current issue", submission.currentIssue)}
  ${detailPair("Platform", submission.currentPlatform)}
  ${detailPair("Admin access", submission.hasAccess)}
  ${detailPair("Desired outcome", submission.auditOutcome)}
  ${detailPair("Timeline", submission.auditTimeline)}
`;

const updateSubmission = async (id) => {
  const status = document.querySelector("#detailStatus").value;
  const adminNotes = document.querySelector("#adminNotes").value;
  const index = submissions.findIndex((submission) => submission.id === id);
  if (index === -1) return;

  const updated = { ...submissions[index], status, adminNotes, updatedAt: new Date().toISOString() };

  if (source === "remote") {
    try {
      const response = await fetch("/api/quotes", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, adminNotes }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        lockDashboard("Session expired. Enter the admin password again.");
        return;
      }
      if (!response.ok) throw new Error(data.error || "Unable to update remote request");
      submissions[index] = data.submission;
      setStatus("Remote request updated.", "success");
    } catch (error) {
      setStatus(error.message, "error");
      return;
    }
  } else {
    submissions[index] = updated;
    saveLocal();
    setStatus("Local request updated.", "success");
  }

  renderList();
  renderDetail(submissions[index]);
};

const loadLocal = () => {
  source = "local";
  submissions = getLocal();
  selectedId = "";
  setStatus("Loaded local test submissions.");
  renderList();
};

const loadRemote = async () => {
  source = "remote";
  setStatus("Loading remote submissions...");
  try {
    const response = await fetch("/api/quotes", {
      credentials: "same-origin",
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      lockDashboard("Session expired. Enter the admin password again.");
      return;
    }
    if (!response.ok) throw new Error(data.error || "Unable to load submissions");
    submissions = data.submissions || [];
    selectedId = "";
    setStatus(`Loaded ${submissions.length} remote submissions.`, "success");
    renderList();
  } catch (error) {
    setStatus(error.message, "error");
  }
};

const exportQuotes = () => {
  const blob = new Blob([JSON.stringify(filteredSubmissions(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "realest-reset-quotes.json";
  link.click();
  URL.revokeObjectURL(url);
};

const lockDashboard = (message = "") => {
  submissions = [];
  selectedId = "";
  setUnlocked(false);
  listEl.innerHTML = "";
  resetDetail();
  setStatus("");
  setAuthStatus(message, message ? "error" : "");
  passwordInput.focus();
};

const loginAdmin = async (event) => {
  event.preventDefault();
  setAuthStatus("Checking password...");

  try {
    const response = await fetch("/api/admin-login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: passwordInput.value }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Unable to sign in");
    }

    passwordInput.value = "";
    setAuthStatus("");
    setUnlocked(true);
    loadRemote();
  } catch (error) {
    setAuthStatus(error.message, "error");
  }
};

const logoutAdmin = async () => {
  await fetch("/api/admin-login", {
    method: "DELETE",
    credentials: "same-origin",
  }).catch(() => {});
  lockDashboard("Signed out.");
};

const checkSession = async () => {
  setAuthStatus("Checking admin session...");

  try {
    const response = await fetch("/api/admin-login", {
      credentials: "same-origin",
    });

    if (!response.ok) {
      lockDashboard("");
      return;
    }

    setAuthStatus("");
    setUnlocked(true);
    loadRemote();
  } catch {
    lockDashboard("Enter the admin password to continue.");
  }
};

loginForm.addEventListener("submit", loginAdmin);
logoutButton.addEventListener("click", logoutAdmin);
loadRemoteButton.addEventListener("click", loadRemote);
loadLocalButton.addEventListener("click", loadLocal);
refreshButton.addEventListener("click", () => (source === "remote" ? loadRemote() : loadLocal()));
exportButton.addEventListener("click", exportQuotes);
typeFilter.addEventListener("change", renderList);
statusFilter.addEventListener("change", renderList);

checkSession();
