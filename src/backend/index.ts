import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";
import { getNeynarUser } from "./lib/neynar";
import { protectedRoutes } from "./protected";

const app = new Hono<{ Bindings: Cloudflare.Env }>().basePath("/api");

const routes = app
	.post("/webhook", async (c) => {
		const body = await c.req.json();
		console.log(body);
		return c.json({ success: true });
	})
	.use(cors())
	.use(csrf())
	.use(secureHeaders())
	.get("/name", (c) => c.json({ name: c.env.NAME }))
	.get("/time", (c) => c.json({ time: new Date().toISOString() }))
	.get("/neynar-user/:fid", async (c) => {
		const { fid } = c.req.param();
		const user = await getNeynarUser(c.env, Number(fid));
		return c.json({ user });
	})
	.route("/", protectedRoutes);

export type AppType = typeof routes;

export default app;
