import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { sign } from "hono/jwt";
import { secureHeaders } from "hono/secure-headers";
import invariant from "tiny-invariant";
import { getAddress, verifyMessage } from "viem";
import { z } from "zod";
import { getNeynarUser } from "./lib/neynar";
import { protectedRoutes } from "./protected";

const LOCAL_DEBUGGING = import.meta.env.DEV;

const app = new Hono<{ Bindings: Cloudflare.Env }>().basePath("/api");

const routes = app
	.post("/webhook", async (c) => {
		const body = await c.req.json();
		console.log(body);
		return c.json({ success: true });
	})
	.post(
		"/local-sign-in",
		zValidator(
			"json",
			z.object({
				fid: z.number(),
			}),
		),
		async (c) => {
			const { fid } = c.req.valid("json");
			if (!LOCAL_DEBUGGING) {
				return c.json(
					{ error: "Local sign in is only available in development mode" },
					401,
				);
			}
			const token = await sign(
				{
					sub: "farcaster_user",
					iat: Math.floor(Date.now() / 1000),
					exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 1 day
					fid,
				},
				c.env.JWT_SECRET ?? "secret", // should never be the word 'secret'
				c.env.JWT_ALGORITHM,
			);
			return c.json({ success: true, token, secureFid: fid });
		},
	)
	.post(
		"/sign-in",
		zValidator(
			"json",
			z.object({
				signature: z
					.string()
					.regex(/^0x[a-fA-F0-9]+$/)
					.transform((val) => val as `0x${string}`),
				message: z.string(),
				fid: z.number(),
				referrerFid: z.number().nullable(),
			}),
		),
		async (c) => {
			const { signature, message, fid } = c.req.valid("json");
			invariant(c.env.JWT_SECRET, "JWT_SECRET is not set");
			invariant(c.env.JWT_ALGORITHM, "JWT_ALGORITHM is not set");

			const user = await getNeynarUser(c.env, fid);
			if (!user) {
				return c.json({ error: `User not found: ${fid}` }, 404);
			}
			const custodyAddress = getAddress(user.custody_address);
			const verifiedAddresses =
				user.verified_addresses.eth_addresses.map(getAddress);
			const allAddresses = [custodyAddress, ...verifiedAddresses.reverse()];

			// Create verification promises
			const verificationPromises = allAddresses.map((address) =>
				verifyMessage({ address, message, signature }),
			);

			// single shared promise for all-complete case
			const allCompletePromise = Promise.all(verificationPromises).then(
				(results) => results.some((r) => r === true),
			);

			// false results wait for all others
			const racingPromises = verificationPromises.map((promise) =>
				promise.then((result) => {
					if (result === true) return true;
					return allCompletePromise;
				}),
			);

			const isVerified = await Promise.race(racingPromises);
			if (!isVerified) {
				return c.json({ error: "Invalid signature" }, 401);
			}

			const token = await sign(
				{
					sub: "farcaster_user",
					iat: Math.floor(Date.now() / 1000),
					exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 1 day
					fid,
				},
				c.env.JWT_SECRET ?? "secret", // should never be the word 'secret'
				c.env.JWT_ALGORITHM,
			);
			return c.json({ success: true, token, secureFid: fid });
		},
	)
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
