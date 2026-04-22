const crypto = require("crypto");

const adminSessionCookie = "rr_admin_session";

const isRedisConfigured = () =>
  Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redisCommand = async (command) => {
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || "Redis request failed");
  }

  return data.result;
};

const createId = () => `quote_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const getRequiredFields = (type) =>
  type === "audit"
    ? ["fullName", "email", "businessName"]
    : ["fullName", "email", "businessName", "buildDescription", "businessContext", "problemToSolve"];

const validateSubmission = (submission) => {
  if (!submission || !["mvp", "audit"].includes(submission.projectType)) {
    return "Choose MVP Build or Security & Logic Audit.";
  }

  const missing = getRequiredFields(submission.projectType).find((field) => {
    const value = submission[field];
    return !value || (typeof value === "string" && !value.trim());
  });

  if (missing) {
    return "Please complete all required fields before submitting.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email)) {
    return "Enter a valid email address.";
  }

  return "";
};

const toBase64Url = (value) =>
  value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const signValue = (value) =>
  toBase64Url(crypto.createHmac("sha256", process.env.ADMIN_TOKEN).update(String(value)).digest("base64"));

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const decodeCookie = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const parseCookies = (req) =>
  String(req.headers.cookie || "")
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((cookies, cookie) => {
      const separator = cookie.indexOf("=");
      if (separator === -1) return cookies;
      cookies[cookie.slice(0, separator)] = decodeCookie(cookie.slice(separator + 1));
      return cookies;
    }, {});

const hasAdminSession = (req) => {
  if (!process.env.ADMIN_TOKEN) return false;

  const value = parseCookies(req)[adminSessionCookie];
  const [expiresAt, signature] = String(value || "").split(".");
  if (!expiresAt || !signature || Number(expiresAt) <= Date.now()) return false;

  return safeEqual(signature, signValue(expiresAt));
};

const requireAdmin = (req) => {
  const authorization = req.headers.authorization || "";
  const token = authorization.replace(/^Bearer\s+/i, "") || req.headers["x-admin-token"];
  const hasAdminToken = Boolean(process.env.ADMIN_TOKEN && token && safeEqual(token, process.env.ADMIN_TOKEN));
  return hasAdminToken || hasAdminSession(req);
};

const normalizeSubmission = (payload) => ({
  id: createId(),
  createdAt: new Date().toISOString(),
  status: "new",
  projectType: payload.projectType,
  fullName: String(payload.fullName || "").trim(),
  email: String(payload.email || "").trim(),
  businessName: String(payload.businessName || "").trim(),
  website: String(payload.website || "").trim(),
  buildType: payload.buildType || "",
  buildDescription: String(payload.buildDescription || "").trim(),
  businessContext: String(payload.businessContext || "").trim(),
  problemToSolve: String(payload.problemToSolve || "").trim(),
  platformUsers: payload.platformUsers || "",
  features: Array.isArray(payload.features) ? payload.features : [],
  migrationNeed: payload.migrationNeed || "",
  startTimeline: payload.startTimeline || "",
  investmentRange: payload.investmentRange || "",
  additionalNotes: String(payload.additionalNotes || "").trim(),
  reviewNeeds: Array.isArray(payload.reviewNeeds) ? payload.reviewNeeds : [],
  currentIssue: String(payload.currentIssue || "").trim(),
  currentPlatform: payload.currentPlatform || "",
  hasAccess: payload.hasAccess || "",
  auditOutcome: Array.isArray(payload.auditOutcome) ? payload.auditOutcome : [],
  auditTimeline: payload.auditTimeline || "",
});

const getBody = (req) => {
  if (typeof req.body === "object" && req.body !== null) {
    return req.body;
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch {
      return null;
    }
  }

  return {};
};

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (!isRedisConfigured()) {
    return res.status(501).json({
      error: "Quote storage is not configured. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
    });
  }

  try {
    if (req.method === "POST") {
      const payload = getBody(req);
      const submission = normalizeSubmission(payload || {});
      const validationError = validateSubmission(submission);

      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      await redisCommand(["SET", `quote:${submission.id}`, JSON.stringify(submission)]);
      await redisCommand(["LPUSH", "quotes:index", submission.id]);

      return res.status(201).json({ submission });
    }

    if (req.method === "GET") {
      if (!requireAdmin(req)) {
        return res.status(401).json({ error: "Admin password required" });
      }

      const ids = (await redisCommand(["LRANGE", "quotes:index", "0", "199"])) || [];
      if (!ids.length) {
        return res.status(200).json({ submissions: [] });
      }

      const records = await redisCommand(["MGET", ...ids.map((id) => `quote:${id}`)]);
      const submissions = records.filter(Boolean).map((record) => JSON.parse(record));

      return res.status(200).json({ submissions });
    }

    if (req.method === "PATCH") {
      if (!requireAdmin(req)) {
        return res.status(401).json({ error: "Admin password required" });
      }

      const payload = getBody(req);
      if (!payload?.id) {
        return res.status(400).json({ error: "Submission id required" });
      }

      const existing = await redisCommand(["GET", `quote:${payload.id}`]);
      if (!existing) {
        return res.status(404).json({ error: "Submission not found" });
      }

      const submission = JSON.parse(existing);
      const updated = {
        ...submission,
        status: payload.status || submission.status,
        adminNotes: String(payload.adminNotes || submission.adminNotes || "").trim(),
        updatedAt: new Date().toISOString(),
      };

      await redisCommand(["SET", `quote:${updated.id}`, JSON.stringify(updated)]);
      return res.status(200).json({ submission: updated });
    }

    res.setHeader("Allow", "GET, POST, PATCH");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Quote API error" });
  }
};
