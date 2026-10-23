import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/newsreader/wght.css";
import "@fontsource-variable/newsreader/wght-italic.css";
import "@fontsource-variable/instrument-sans/wght.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./styles/tokens.css";
import "./styles/app.css";
import App from "./App";
import { FireTvPage } from "./FireTvPage";

const params = new URLSearchParams(window.location.search);
const fireTv = params.get("mode") === "firetv";

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <StrictMode>{fireTv ? <FireTvPage /> : <App />}</StrictMode>
);
