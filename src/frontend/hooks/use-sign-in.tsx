import { sdk } from "@farcaster/frame-sdk";
import { hc } from "hono/client";
import { useCallback, useState } from "react";
import type { AppType } from "../../backend";
import { useFrameSDK } from "./use-frame-sdk";
import { useInMemoryZustand } from "./use-zustand";
import { jwtVerify } from "jose";
import { jwks } from "../routes/constants";

export const api = hc<AppType>("/").api;

const LOCAL_DEBUGGING = import.meta.env.DEV;

export const useSignIn = () => {
	const { contextFid } = useFrameSDK();
	const { setJwt, setSecureContextFid } = useInMemoryZustand();
	const [error, setError] = useState<string | null>(null);

	const signOut = useCallback(() => {
		setJwt(null);
		setSecureContextFid(null);
	}, [setJwt, setSecureContextFid]);

	const signIn = useCallback(async () => {
		try {
			setError(null);

			if (!LOCAL_DEBUGGING) {
				if (!contextFid) {
					throw new Error(
						"No FID found. Please make sure you're logged into Fartcaster.",
					);
				}
			}

			const { token } = !LOCAL_DEBUGGING
				? await sdk.experimental.quickAuth()
				: { token: "0x123" };

			setJwt(token ?? null);
			// verify the jwt on client side
			if (token) {
				const { payload } = await jwtVerify(token, jwks.keys[0]);
				setSecureContextFid(payload?.sub ? Number(payload.sub) : null);
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? JSON.stringify(err.message, null, 2)
					: "Sign in failed (general)";
			setError(errorMessage);
			setJwt(null);
			throw err;
		}
	}, [contextFid, setJwt, setSecureContextFid]);

	return {
		signIn,
		signOut,
		error,
	};
};
