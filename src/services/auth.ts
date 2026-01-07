import type { AuthSession } from "../types/auth";
import { execSql, querySql } from "./db/client";

export type AuthErrorCode = "EMAIL_NOT_FOUND" | "INVALID_PASSWORD" | "EMAIL_ALREADY_USED";

export class AuthError extends Error {
  code: AuthErrorCode;
  constructor(code: AuthErrorCode) {
    super(code);
    this.code = code;
  }
}

export async function getSession(): Promise<AuthSession | null> {
  const rows = await querySql<any>("SELECT * FROM session WHERE id = 1");
  const r = rows[0];
  if (!r) return null;

  return {
    isLoggedIn: !!r.is_logged_in,
    email: r.email || "",
    loggedInAt: r.logged_in_at || "",
  };
}

export async function register(name: string, email: string, password: string): Promise<void> {
  const n = name.trim();
  const e = email.trim().toLowerCase();

  const rows = await querySql<any>("SELECT id FROM users WHERE email = ? LIMIT 1", [e]);
  if (rows[0]) throw new AuthError("EMAIL_ALREADY_USED");

  await execSql("INSERT INTO users (fullName, email, password, created_at) VALUES (?,?,?,?)", [
    n,
    e,
    password,
    new Date().toISOString(),
  ]);
}

export async function login(email: string, password: string): Promise<void> {
  const e = email.trim().toLowerCase();

  const rows = await querySql<any>("SELECT * FROM users WHERE email = ? LIMIT 1", [e]);
  const user = rows[0];

  if (!user) throw new AuthError("EMAIL_NOT_FOUND");
  if (user.password !== password) throw new AuthError("INVALID_PASSWORD");

  await execSql("UPDATE session SET is_logged_in = 1, email = ?, logged_in_at = ? WHERE id = 1", [
    e,
    new Date().toISOString(),
  ]);
}

export async function logout(): Promise<void> {
  await execSql("UPDATE session SET is_logged_in = 0, email = '', logged_in_at = '' WHERE id = 1");
}
