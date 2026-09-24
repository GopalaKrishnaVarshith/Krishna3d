import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/ui.css";
import { Experience } from "./core/Experience";

export const APP_TITLE = "Krishna Varshith — Regulatory Systems World";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Missing #app root");

document.title = APP_TITLE;
root.innerHTML =
  '<main id="experience" aria-label="Interactive 3D portfolio"></main><div id="ui" role="region" aria-label="Portfolio controls"></div>';

const world = root.querySelector<HTMLElement>("#experience");
if (world && typeof WebGLRenderingContext !== "undefined") {
  const experience = new Experience(world);
  experience.start();
  import.meta.hot?.dispose(() => experience.dispose());
}
