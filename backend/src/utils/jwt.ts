import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error("Missing JWT secrets. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.");
}

const accessSecret: Secret = process.env.JWT_ACCESS_SECRET as string;
const refreshSecret: Secret = process.env.JWT_REFRESH_SECRET as string;

export function signAccessToken(payload: Record<string, unknown>): string {
  const expires = (process.env.JWT_ACCESS_EXPIRES as string | undefined) || "15m";
  const options: SignOptions = { expiresIn: expires as unknown as SignOptions["expiresIn"] };
  return jwt.sign(payload, accessSecret, options);
}

export function signRefreshToken(payload: Record<string, unknown>): string {
  const expires = (process.env.JWT_REFRESH_EXPIRES as string | undefined) || "7d";
  const options: SignOptions = { expiresIn: expires as unknown as SignOptions["expiresIn"] };
  return jwt.sign(payload, refreshSecret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, accessSecret);
  if (typeof decoded === "string") throw new Error("Invalid token payload");
  return decoded as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, refreshSecret);
  if (typeof decoded === "string") throw new Error("Invalid token payload");
  return decoded as JwtPayload;
}
