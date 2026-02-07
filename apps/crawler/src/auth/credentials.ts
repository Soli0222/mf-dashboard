import { TOTP } from "otpauth";
import { debug } from "../logger.js";

export interface Credentials {
  username: string;
  password: string;
}

/**
 * 環境変数から認証情報を取得する
 */
export function getCredentials(): Credentials {
  const username = process.env.MF_USERNAME;
  const password = process.env.MF_PASSWORD;

  if (!username || !password) {
    throw new Error("MF_USERNAME and MF_PASSWORD are required");
  }

  debug("認証情報を環境変数から取得しました");
  return { username, password };
}

/**
 * 環境変数の TOTP シークレットから OTP を生成する
 */
export function getOTP(): string {
  const secret = process.env.MF_TOTP_SECRET;

  if (!secret) {
    throw new Error("MF_TOTP_SECRET is required");
  }

  debug("TOTP を生成しています...");
  const totp = new TOTP({
    secret,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });

  return totp.generate();
}
