import { Request, Response } from "express";
import { registerUser, validateUser } from "../services/user_service";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";

export async function register(req: Request, res: Response) {
  try {
    const user = await registerUser(req.body);
    return res.status(201).json({ user });
  } catch (e: any) {
    if (e.message === "EMAIL_TAKEN") {
      return res.status(409).json({ error: "Email already in use" });
    }
    return res.status(500).json({ error: "Server error" });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  const user = await validateUser(email, password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const accessToken  = signAccessToken({ sub: user.id, email: user.email, usertype: user.usertype });
  const refreshToken = signRefreshToken({ sub: user.id });

  return res.json({ user, tokens: { accessToken, refreshToken } });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) return res.status(400).json({ error: "Missing refreshToken" });

  try {
    const payload = verifyRefreshToken(refreshToken) as any;
    const accessToken = signAccessToken({ sub: payload.sub });
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
}

export async function me(req: Request, res: Response) {
  const user = (req as any).user;
  return res.json({ user });
}
