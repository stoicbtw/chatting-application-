import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE = "cw_session";
const SECRET = process.env.SESSION_SECRET || "dev-insecure-secret-change-me";

// hash a passcode for storage / comparison
export function hashPasscode(passcode: string): string {
  return crypto
    .createHash("sha256")
    .update(passcode + "::" + SECRET)
    .digest("hex");
}

function sign(value: string): string {
  const sig = crypto.createHmac("sha256", SECRET).update(value).digest("hex").slice(0, 24);
  return `${value}.${sig}`;
}

function unsign(signed: string): string | null {
  const i = signed.lastIndexOf(".");
  if (i < 0) return null;
  const value = signed.slice(0, i);
  const sig = signed.slice(i + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("hex").slice(0, 24);
  // constant-time-ish compare
  if (sig.length !== expected.length) return null;
  let ok = 0;
  for (let j = 0; j < sig.length; j++) ok |= sig.charCodeAt(j) ^ expected.charCodeAt(j);
  return ok === 0 ? value : null;
}

export async function setSession(profileId: string) {
  const jar = await cookies();
  jar.set(COOKIE, sign(profileId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // a year — it's your private space
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  return unsign(raw);
}
