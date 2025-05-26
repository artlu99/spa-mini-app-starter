import { Hono } from "hono";
import { jwk } from "hono/jwk";
import type { HonoJsonWebKey } from "hono/utils/jwt/jws";
import { fetcher } from "itty-fetcher";

interface JWKS {
	keys: HonoJsonWebKey[];
}

const quickAuthServer = fetcher({ base: "https://auth.farcaster.xyz" });

const protectedApp = new Hono<{ Bindings: Cloudflare.Env }>().basePath("/");

export const protectedRoutes = protectedApp
	.use("*", async (c, next) => {
		let jwks: JWKS | null = null;
		const cached = await c.env.JWKS_CACHE.get("jwks_contents");

		if (cached) {
			jwks = JSON.parse(cached);
		} else {
			const jwks = await quickAuthServer.get<JWKS>("/.well-known/jwks.json");

			await c.env.JWKS_CACHE.put("jwks_contents", JSON.stringify(jwks), {
				expirationTtl: 30 * 24 * 60 * 60, // 30 days
			});
		}

		if (!jwks?.keys) {
			throw new Error("Failed to load JWKS");
		}

		const jwkMiddleware = jwk({ keys: jwks.keys });

		const result = await jwkMiddleware(c, next);
		return result;
	})
	.get("/secret", (c) => {
		return c.json({ success: true, secret: c.env.SECRET });
	})
	.post("/signout", async (c) => {
		// consider adding the token to a blocklist
		// For now, just return success since the client will remove the token
		return c.json({ message: "Signed out successfully" });
	});

export type SecureAppType = typeof protectedRoutes;
