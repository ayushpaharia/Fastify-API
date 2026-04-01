import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import jwksRsa from "jwks-rsa";

const jwksClient = jwksRsa({
  jwksUri: `https://${process.env.CLERK_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

function verifyToken(token: string): Promise<jwt.JwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded as jwt.JwtPayload);
    });
  });
}

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
    userClaims?: jwt.JwtPayload;
  }
}

export async function registerAuth(app: FastifyInstance) {
  // Decorate request with auth fields
  app.decorateRequest("userId", undefined);
  app.decorateRequest("userClaims", undefined);

  // Global hook: extract JWT if present (non-blocking)
  app.addHook("onRequest", async (req: FastifyRequest) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return;

    try {
      const token = authHeader.slice(7);
      const claims = await verifyToken(token);
      req.userId = claims.sub;
      req.userClaims = claims;
    } catch {
      // Invalid token — continue as anonymous
    }
  });
}

// Route-level guard: returns 401 if not authenticated
export function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!req.userId) {
    reply.status(401).send({ error: "Authentication required" });
    return;
  }
}
