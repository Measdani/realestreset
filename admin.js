const localKey = "rr_quote_submissions";
const tokenInput = document.querySelector("#adminToken");
const loadRemoteButton = document.querySelector("#loadRemote");
const loadLocalButton = document.querySelector("#loadLocal");
const refreshButton = document.querySelector("#refreshQuotes");
const exportButton = document.querySelector("#exportQuotes");
const typeFilter = document.querySelector("#typeFilter");
const statusFilter = document.querySelector("#statusFilter");
const listEl = document.querySelector("#quoteList");
const detailEl = document.querySelector("#quoteDetail");
const statusEl = document.querySelector("#adminStatus");

let submissions = [];
let selectedId = "";
let source = "local";

const setStatus = (message, tone = "") => {
  statusEl.textContent = message;
  statusEl.dataset.tone = tone;
};

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
      <strong>${submission.businessName || submission.fullName}</strong>
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
  return `<dt>${label}</dt><dd>${display}</dd>`;
};

const renderDetail = (submission) => {
  const isAudit = submission.projectType === "audit";
  detailEl.innerHTML = `
    <p class="section-kicker">${isAudit ? "Security & Logic Audit" : "MVP Build"}</p>
    <h2>${submission.businessName || "Untitled request"}</h2>
    <p>${submission.fullName} / <a href="mailto:${submission.email}">${submission.email}</a></p>
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
        <textarea id="adminNotes" rows="4">${submission.adminNotes || ""}</textarea>
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenInput.value}`,
        },
        body: JSON.stringify({ id, status, adminNotes }),
      });
      const data = await response.json().catch(() => ({}));
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
      headers: { Authorization: `Bearer ${tokenInput.value}` },
    });
    const data = await response.json().catch(() => ({}));
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

loadRemoteButton.addEventListener("click", loadRemote);
loadLocalButton.addEventListener("click", loadLocal);
refreshButton.addEventListener("click", () => (source === "remote" ? loadRemote() : loadLocal()));
exportButton.addEventListener("click", exportQuotes);
typeFilter.addEventListener("change", renderList);
statusFilter.addEventListener("change", renderList);

loadLocal();
