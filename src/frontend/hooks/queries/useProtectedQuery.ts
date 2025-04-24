import { useQuery } from "@tanstack/react-query";
import { hc } from "hono/client";
import type { SecureAppType } from "../../../backend/protected";

const secureApi = (jwt: string) =>
	hc<SecureAppType>("/api", {
		headers: {
			Authorization: `Bearer ${jwt}`,
		},
	});

export const useProtectedQuery = (jwt: string | null) => {
	return useQuery({
		queryKey: ["protected", jwt],
		queryFn: async () => {
			const res = await secureApi(jwt ?? "try-a-spoof-jwt-token").secret.$get();
			return res.json();
		},
		retry: 1,
	});
};
