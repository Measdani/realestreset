const crypto = require("crypto");

const cookieName = "rr_admin_session";
const sessionSeconds = 60 * 60 * 12;

const toBase64Url = (value) =>
  value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

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

const verifySession = (req) => {
  if (!process.env.ADMIN_TOKEN) return false;

  const value = parseCookies(req)[cookieName];
  const [expiresAt, signature] = String(value || "").split(".");
  if (!expiresAt || !signature || Number(expiresAt) <= Date.now()) return false;

  return safeEqual(signature, signValue(expiresAt));
};

const sessionCookie = () => {
  const expiresAt = Date.now() + sessionSeconds * 1000;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${cookieName}=${encodeURIComponent(`${expiresAt}.${signValue(expiresAt)}`)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionSeconds}${secure}`;
};

const clearCookie = () =>
  `${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (!process.env.ADMIN_TOKEN) {
    return res.status(501).json({ error: "Admin password is not configured. Add ADMIN_TOKEN in Vercel." });
  }

  if (req.method === "GET") {
    return verifySession(req)
      ? res.status(200).json({ authenticated: true })
      : res.status(401).json({ error: "Admin password required" });
  }

  if (req.method === "POST") {
    const body = getBody(req);
    const password = String(body?.password || "");

    if (!safeEqual(password, process.env.ADMIN_TOKEN)) {
      return res.status(401).json({ error: "Incorrect admin password" });
    }

    res.setHeader("Set-Cookie", sessionCookie());
    return res.status(200).json({ authenticated: true });
  }

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", clearCookie());
    return res.status(200).json({ authenticated: false });
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
};
