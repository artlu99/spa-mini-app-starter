import { Hono } from "hono";
import { jwt } from "hono/jwt";

const protectedApp = new Hono<{ Bindings: Cloudflare.Env }>().basePath("/");

export const protectedRoutes = protectedApp
	.use("*", (c, next) =>
		jwt({ secret: c.env.JWT_SECRET, alg: c.env.JWT_ALGORITHM })(c, next),
	)
	.get("/secret", (c) => {
		const payload = c.get("jwtPayload");
		if (!payload || !payload.fid || typeof payload.fid !== "number") {
			return c.json({ success: false, fid: null, secret: null });
		}
		return c.json({ success: true, fid: payload.fid, secret: c.env.SECRET });
	})
	.post("/signout", async (c) => {
		// consider adding the token to a blocklist
		// For now, just return success since the client will remove the token
		return c.json({ message: "Signed out successfully" });
	});

export type SecureAppType = typeof protectedRoutes;
