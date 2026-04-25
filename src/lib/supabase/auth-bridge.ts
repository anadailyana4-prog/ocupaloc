import type { EmailOtpType } from "@supabase/supabase-js";

export type AuthBridgeAction =
  | { kind: "code"; code: string }
  | { kind: "otp"; tokenHash: string; otpType: EmailOtpType | "recovery" }
  | { kind: "session"; accessToken: string; refreshToken: string }
  | { kind: "none" };

export function getSafeNext(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return "/dashboard";
  return raw;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "auth_bridge_failed";
}

export function getAuthBridgeAction(current: URL): AuthBridgeAction {
  const hashParams = new URLSearchParams(current.hash.startsWith("#") ? current.hash.slice(1) : current.hash);
  const code = current.searchParams.get("code");
  const tokenHash = current.searchParams.get("token_hash") ?? hashParams.get("token_hash");
  const otpType = (current.searchParams.get("type") ?? hashParams.get("type")) as string | null;
  const accessToken = hashParams.get("access_token") ?? current.searchParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token") ?? current.searchParams.get("refresh_token");

  if (code) {
    return { kind: "code", code };
  }

  if (tokenHash && otpType && (otpType === "signup" || otpType === "recovery" || otpType === "magiclink" || otpType === "invite")) {
    return { kind: "otp", tokenHash, otpType: otpType as EmailOtpType | "recovery" };
  }

  if (accessToken && refreshToken) {
    return { kind: "session", accessToken, refreshToken };
  }

  return { kind: "none" };
}