import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/ui.css";
import { Experience } from "./core/Experience";
import { portfolioData } from "./data/portfolioData";
import { UIController } from "./ui/UIController";

export const APP_TITLE = "Krishna Varshith — Regulatory Systems World";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Missing #app root");

document.title = APP_TITLE;
root.innerHTML =
  '<main id="experience" aria-label="Interactive 3D portfolio"></main><div id="ui" role="region" aria-label="Portfolio controls"></div>';

const world = root.querySelector<HTMLElement>("#experience")!;
const uiRoot = root.querySelector<HTMLElement>("#ui")!;
let experience: Experience | null = null;
let shuttingDown = false;

const ui = new UIController(uiRoot, {
  onNavigate: (id) => experience?.navigate(id),
  onThemeChange: (theme) => experience?.setTheme(theme),
  onReducedMotionChange: (reduced) => experience?.setReducedMotion(reduced),
  onSoundChange: (enabled) => experience?.setSound(enabled),
  onMove: (direction, pressed) => experience?.setMove(direction, pressed),
  onInteract: () => experience?.requestInteraction(),
  onBrowseProjects: () => experience?.openProject(portfolioData.projects[0].id),
  onBrowseExperience: () => experience?.openExperience(portfolioData.experience[0].id),
  onProjectSelect: (id) => experience?.openProject(id),
  onExperienceSelect: (id) => experience?.openExperience(id),
  onFallback: () => { experience?.dispose(); experience = null; },
});

function fail(reason: string): void {
  if (shuttingDown) return;
  experience?.dispose();
  experience = null;
  ui.showFallback(reason);
}

if (typeof WebGLRenderingContext === "undefined") {
  fail("3D graphics are unavailable on this device. The complete text portfolio is available below.");
} else {
  try {
    experience = new Experience(world);
    experience.setFatalHandler(fail);
    void experience.initialize(ui).catch(() => {
      fail("The 3D portfolio could not load. The complete text portfolio is available below.");
    });
  } catch {
    fail("3D graphics are unavailable on this device. The complete text portfolio is available below.");
  }
}

import.meta.hot?.dispose(() => {
  shuttingDown = true;
  experience?.dispose();
  ui.dispose();
});
