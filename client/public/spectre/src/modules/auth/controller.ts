import { Request, Response } from 'express';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-change-me';
const JWT_ISSUER = 'spectre-auth';
const secretKey = new TextEncoder().encode(JWT_SECRET);

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const createAccessToken = async (email: string): Promise<string> => {
  return await new SignJWT({ tokenType: 'access', email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(email)
    .setIssuer(JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secretKey);
};

const createRefreshToken = async (email: string): Promise<string> => {
  return await new SignJWT({ tokenType: 'refresh', email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(email)
    .setIssuer(JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
};

export const getLoginController = (_req: Request, res: Response): void => {
  res.json({
    endpoint: 'POST /api/auth/login',
    requiredFields: ['email', 'password'],
    acceptedAliasFields: ['passwor']
  });
};

export const postLoginController = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as { email?: unknown; password?: unknown; passwor?: unknown };
  const email = asNonEmptyString(body.email);
  const password = asNonEmptyString(body.password) ?? asNonEmptyString(body.passwor);

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const accessToken = await createAccessToken(email);
  const refreshToken = await createRefreshToken(email);

  res.json({
    tokenType: 'Bearer',
    accessToken,
    refreshToken
  });
};

export const getRefreshController = (_req: Request, res: Response): void => {
  res.json({
    endpoint: 'POST /api/auth/refresh',
    requiredFields: ['refreshToken']
  });
};

export const postRefreshController = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as { refreshToken?: unknown };
  const refreshToken = asNonEmptyString(body.refreshToken);

  if (!refreshToken) {
    res.status(400).json({ error: 'refreshToken is required' });
    return;
  }

  try {
    const verified = await jwtVerify(refreshToken, secretKey, { issuer: JWT_ISSUER });
    const tokenType = verified.payload.tokenType;
    const email = asNonEmptyString(verified.payload.sub);

    if (tokenType !== 'refresh' || !email) {
      res.status(401).json({ error: 'invalid refresh token' });
      return;
    }

    const nextAccessToken = await createAccessToken(email);
    const nextRefreshToken = await createRefreshToken(email);

    res.json({
      tokenType: 'Bearer',
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken
    });
  } catch {
    res.status(401).json({ error: 'invalid or expired refresh token' });
  }
};