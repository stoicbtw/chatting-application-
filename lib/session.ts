import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";

// Multi-nest session: the cookie stores a signed list of profile IDs the
// device is logged into (one profile per nest). Lets a user stay logged into
// several nests at once and switch between them.

const COOKIE = "cw_session";
const SECRET = process.env.SESSION_SECRET || "dev-insecure-secret-change-me";

export function hashPasscode(passcode: string): string {
  return crypto.createHash("sha256").update(passcode + "::" + SECRET).digest("hex");
}

function sig(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex").slice(0, 24);
}

function sign(value: string): string {
  return `${value}.${sig(value)}`;
}

function unsign(signed: string | undefined): string | null {
  if (!signed) return null;
  const i = signed.lastIndexOf(".");
  if (i < 0) return null;
  const value = signed.slice(0, i);
  const got = signed.slice(i + 1);
  const want = sig(value);
  if (got.length !== want.length) return null;
  let ok = 0;
  for (let j = 0; j < got.length; j++) ok |= got.charCodeAt(j) ^ want.charCodeAt(j);
  return ok === 0 ? value : null;
}

async function readIds(): Promise<string[]> {
  const jar = await cookies();
  const raw = unsign(jar.get(COOKIE)?.value);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

async function writeIds(ids: string[]) {
  const jar = await cookies();
  const unique = [...new Set(ids)].slice(-20); // cap, keep most recent
  jar.set(COOKIE, sign(JSON.stringify(unique)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // a year — stay logged in
  });
}

export async function getSessionIds(): Promise<string[]> {
  return readIds();
}

export async function addSession(profileId: string) {
  const ids = await readIds();
  if (!ids.includes(profileId)) ids.push(profileId);
  await writeIds(ids);
}

export async function removeSession(profileId: string) {
  const ids = (await readIds()).filter((x) => x !== profileId);
  await writeIds(ids);
}

export async function clearAllSessions() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function hasSession(profileId: string): Promise<boolean> {
  return (await readIds()).includes(profileId);
}
