import { Link, useRoute } from "wouter";
import { Logos } from "../components/Logos";
import SpringTransition from "../components/effects/SpringTransition";
import { useProtectedQuery } from "../hooks/queries/useProtectedQuery";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useSignIn } from "../hooks/use-sign-in";
import { useThemes } from "../hooks/use-themes";
import { useInMemoryZustand, useZustand } from "../hooks/use-zustand";

const Uses = () => {
	const [isMatch] = useRoute("/uses");
	const { count, increase, reset } = useZustand();
	const { contextFid, openUrl } = useFrameSDK();
	const { jwt, secureContextFid } = useInMemoryZustand();
	const { error, signOut } = useSignIn();
	const { name } = useThemes();

	const protectedQuery = useProtectedQuery(jwt);

	return (
		<div className="min-h-screen w-full" data-theme={name}>
			<SpringTransition isActive={isMatch}>
				<article className="prose dark:prose-invert">
					<Logos />
					<div className="p-4">
						✓ sharing state across routes
						<br />
						<div className="join">
							<button
								className="btn btn-primary btn-soft join-item"
								type="button"
								onClick={() => increase()}
								aria-label="increment"
							>
								<i className="ri-heart-add-line" />
								increment: {count}
							</button>
							<button
								className="btn btn-error btn-soft join-item"
								type="button"
								onClick={() => reset()}
								aria-label="reset"
							>
								reset
								<i className="ri-close-circle-line" />
							</button>
						</div>
					</div>

					<div className="p-4">
						✓ same authenticated API as home page
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
						<p className="text-sm italic">no seamless signin on this route</p>
					</div>
				</article>

				<footer className="p-4">
					<div className="flex ">
						<div className="flex-1">
							<Link href="/">
								<button className="btn btn-warning btn-soft" type="button">
									<i className="ri-arrow-left-long-line" />
									Back
								</button>
							</Link>
						</div>
						<div className="flex-1">
							{contextFid ? (
								<div className="p-4 text-xs">
									{jwt ? (
										<button
											type="button"
											className="btn btn-secondary"
											onClick={signOut}
										>
											<i className="ri-logout-box-line" />
											logout
										</button>
									) : error ? (
										<div className="text-error text-sm">
											<pre>{JSON.stringify(error, null, 2)}</pre>
										</div>
									) : null}
								</div>
							) : null}
						</div>
						<div className="flex-1">
							<button
								type="button"
								className="btn btn-ghost"
								onClick={() => {
									openUrl("https://github.com/artlu99/spa-mini-app-starter");
								}}
							>
								FOSS MIT Licensed
								<i className="ri-github-line" />
							</button>
						</div>
					</div>
				</footer>

				<article className="prose dark:prose-invert">
					<div className=" font-bold italic">DX batteries included:</div>
					<div className="">TypeScript + Biome + TailwindCSS v4</div>
					<div className="">DaisyUI + Framer Motion + Remix Icon</div>
					<div className="">Wouter + Zustand + TanStack Query</div>
					<div className="">Zod + Hono Stack (end-to-end type safety)</div>
					<div className="">SIWF + webhooks</div>
					<div className=" font-bold italic">External dependencies:</div>
					<div className="">Neynar cached w/ Momento</div>
				</article>
			</SpringTransition>
		</div>
	);
};

export default Uses;
