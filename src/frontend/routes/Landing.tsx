import { useEffect } from "preact/hooks";
import { Link } from "wouter";
import { useNameQuery, useTimeQuery } from "../hooks/queries/useOpenQuery";
import { useProtectedQuery } from "../hooks/queries/useProtectedQuery";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useSignIn } from "../hooks/use-sign-in";
import { useThemes } from "../hooks/use-themes";
import { useInMemoryZustand, useZustand } from "../hooks/use-zustand";

const Landing = () => {
	const { count, increase } = useZustand();
	const { jwt, secureContextFid } = useInMemoryZustand();
	const { contextName, contextFid, openUrl, viewProfile } = useFrameSDK();
	const { error, signIn, signOut } = useSignIn();
	const { name } = useThemes();

	const nameQuery = useNameQuery();
	const timeQuery = useTimeQuery();
	const protectedQuery = useProtectedQuery(jwt);

	useEffect(() => {
		const doSignIn = async () => {
			await signIn();
		};
		!jwt && contextFid && doSignIn();
	}, [contextFid, jwt, signIn]);

	return (
		<div className="flex flex-col text-center gap-4" data-theme={name}>
			<article className="prose dark:prose-invert">
				<div className="p-4">
					<Link href="/uses">
						<div className="text-2xl font-bold">SPA Mini App Starter</div>
					</Link>
					this Mini App belongs to{" "}
					<button
						type="button"
						className="btn btn-link"
						onClick={() => viewProfile(6546)}
					>
						@artlu (FID: 6546)
					</button>
				</div>

				{contextFid ? (
					<div className="p-4 text-sm">
						GM,
						<button
							type="button"
							className="btn btn-link"
							onClick={() => viewProfile(contextFid)}
						>
							{contextName}
						</button>
						<br />
						{jwt ? (
							<button
								type="button"
								className="btn btn-secondary"
								onClick={signOut}
							>
								<i className="ri-logout-box-line" />
								Sign Out FID {secureContextFid}
							</button>
						) : error ? (
							<div className="text-error text-sm">
								<pre>{JSON.stringify(error, null, 2)}</pre>
							</div>
						) : null}
						<br />
						with seamless signin
					</div>
				) : null}

				<div className="p-4">
					✓ share state across routes
					<br /> don't persist or reveal to server
					<br />
					<button
						className="btn btn-primary btn-soft"
						type="button"
						onClick={() => increase()}
						aria-label="increment"
					>
						<i className="ri-heart-add-line" />
						increment: {count}
					</button>
					<p className="text-sm italic">
						Edit <code>src/frontend/App.tsx</code> to see HMR ⚡️
					</p>
				</div>

				<div className="p-4">
					✓ expose backend information
					<br />
					<button
						className="btn btn-info btn-soft btn-wide"
						type="button"
						onClick={() => nameQuery.refetch()}
						aria-label="get name"
					>
						<span className={nameQuery.isLoading ? "animate-spin" : ""}>
							<i className="ri-refresh-line" />
						</span>
						{nameQuery.data?.name || "Loading..."}
					</button>
					<p className="text-sm italic">
						Edit <code>wrangler.jsonc</code> to change the deployed value
					</p>
				</div>

				<div className="p-4">
					✓ require authentication
					<br />
					<button
						className="btn btn-warning btn-soft btn-wide"
						type="button"
						onClick={() => protectedQuery.refetch()}
						aria-label="get secret"
					>
						{protectedQuery.isError
							? "not signed in!"
							: protectedQuery.data
								? `FID ${secureContextFid}: ${protectedQuery.data.secret}`
								: "Loading..."}
						<span className={protectedQuery.isLoading ? "animate-spin" : ""}>
							<i className="ri-refresh-line" />
						</span>
					</button>
					<p className="text-sm italic">
						Edit <code>.dev.vars</code> to change the secret
						<br />
						<br />
						go to <Link href="/uses">/uses</Link> to retry after logging out,
						<br />
						or use browser to{" "}
						<code>
							<span
								onClick={() =>
									openUrl("https://spa-mini-app-starter.artlu.workers.dev")
								}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										openUrl("https://spa-mini-app-starter.artlu.workers.dev");
									}
								}}
							>
								view this page
							</span>
						</code>
					</p>
				</div>

				<div className="p-4">
					✓ delightful data fetching by TanStack Query
					<br />
					<div className="btn btn-outline btn-wide">
						{timeQuery.data?.time || "Loading..."}
					</div>
					<p className="text-sm italic">
						polls the server every <code>5 seconds</code>.
					</p>
				</div>
			</article>
		</div>
	);
};

export default Landing;
