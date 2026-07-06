import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "rr_admin_session";
function signature() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return "";
  return createHmac("sha256", secret).update("realest-reset-admin").digest("hex");
}
export async function isAdmin() {
  const actual = (await cookies()).get(COOKIE)?.value ?? "";
  const expected = signature();
  if (!actual || !expected || actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}
export async function createSession() {
  (await cookies()).set(COOKIE, signature(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 60 * 60 * 12, path: "/" });
}
export async function clearSession() { (await cookies()).delete(COOKIE); }
