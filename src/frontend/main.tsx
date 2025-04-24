import { render } from "preact";
import { StrictMode } from "preact/compat";
import "remixicon/fonts/remixicon.css";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root");
if (root) {
	render(
		<StrictMode>
			<App />
		</StrictMode>,
		root,
	);
}
