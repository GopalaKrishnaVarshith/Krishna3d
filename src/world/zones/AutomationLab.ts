import { Group, Vector3 } from "three";
import { portfolioData } from "../../data/portfolioData";
import type { InteractiveTarget } from "../types";
import { makePalette, type DynamicWorldZone, type ZoneOptions, ZoneKit } from "./zoneKit";

export interface AutomationLabOptions extends ZoneOptions {
  onCapabilitySelect?: (id: string) => void;
}

/** Glazed workshop with visible routing machinery and four data-bound capability consoles. */
export function createAutomationLab(options: AutomationLabOptions = {}): DynamicWorldZone {
  const kit = new ZoneKit("Automation Lab architecture", -13, 0);
  const p = makePalette(kit);
  const interactives: InteractiveTarget[] = [];
  const travellingNodes: Group[] = [];
  const arms: Group[] = [];
  let reducedMotion = options.reducedMotion ?? false;
  let elapsed = 0;
  kit.lamp("workshop warm task lighting", 0xffd39a, 3.2, 0.12, 8, [0, 3.06, 0]);

  kit.bevel("lab pale plinth", [7.3, 0.27, 5.65], p.stone, [0, 0.11, 0], kit.group, 0.075);
  kit.bevel("lab dark workshop floor", [6.86, 0.055, 5.2], p.dark,
    [0, 0.28, 0], kit.group, 0.03);
  kit.bevel("lab east entry apron", [1.24, 0.105, 2.08], p.pale,
    [3.87, 0.065, 0], kit.group, 0.035);
  kit.beam("lab east entry brass edge", [3.3, 0.32, -1.06], [3.3, 0.32, 1.06], 0.025, p.brass);

  // A glazed pavilion reads through its interior from the campus map; no opaque solid roof.
  for (const side of [-1, 1]) {
    const z = side * 2.55;
    kit.box(`lab long glazed wall ${side}`, [6.62, 2.85, 0.035], p.glass,
      [0, 1.76, z]);
    kit.box(`lab lower brass sill ${side}`, [6.95, 0.09, 0.09], p.brass,
      [0, 0.39, z]);
    kit.box(`lab roof perimeter beam ${side}`, [7.18, 0.12, 0.16], p.brass,
      [0, 3.35, z]);
    for (let bay = -3; bay <= 3; bay += 1) {
      const x = bay * 1.05;
      kit.box(`lab mullion ${side} ${bay}`, [0.065, 3.02, 0.07], p.brass,
        [x, 1.81, z]);
    }
  }
  kit.box("lab west glazed wall", [0.035, 2.86, 5.2], p.glass,
    [-3.38, 1.76, 0]);
  for (const z of [-2.55, -1.27, 0, 1.27, 2.55]) {
    kit.box(`lab west wall mullion ${z}`, [0.07, 3.02, 0.065], p.brass,
      [-3.4, 1.81, z]);
  }
  for (const z of [-2.55, 2.55]) {
    kit.box(`lab east entry column ${z}`, [0.17, 3.32, 0.17], p.pale,
      [3.38, 1.76, z]);
  }
  kit.box("lab east lintel", [0.18, 0.21, 5.32], p.brass, [3.38, 3.31, 0]);
  for (const x of [-3.42, -1.75, 0, 1.75, 3.42]) {
    kit.box(`lab roof cross frame ${x}`, [0.11, 0.11, 5.36], p.brass,
      [x, 3.38, 0]);
  }
  for (const z of [-1.78, 1.78]) {
    kit.box(`lab overhead translucent canopy ${z}`, [6.95, 0.018, 1.3], p.glass,
      [0, 3.45, z]);
  }
  kit.box("lab ridge skylight rail", [6.95, 0.08, 0.1], p.tealLight,
    [0, 3.43, 0]);

  // Two parallel routing rails and a broad lit conveyor make the process legible at map distance.
  kit.bevel("lab conveyor base", [5.55, 0.21, 1.23], p.brass,
    [0, 0.54, 0], kit.group, 0.04);
  kit.bevel("lab moving process deck", [5.29, 0.075, 0.98], p.deep,
    [0, 0.686, 0], kit.group, 0.025);
  for (const side of [-1, 1]) {
    kit.box(`lab cyan routing rail ${side}`, [5.2, 0.026, 0.035], p.tealLight,
      [0, 0.735, side * 0.43]);
  }
  for (let station = 0; station < 6; station += 1) {
    const x = 2.2 - station * 0.88;
    kit.box(`workflow station stripe ${station + 1}`, [0.05, 0.018, 0.79],
      p.brass, [x, 0.733, 0]);
  }
  for (let index = 0; index < 4; index += 1) {
    const node = new Group();
    node.name = `travelling intake node ${index + 1}`;
    kit.group.add(node);
    kit.bevel(`intake node shell ${index + 1}`, [0.35, 0.28, 0.35], p.pale,
      [0, 0.86, 0], node, 0.035);
    kit.box(`intake node core ${index + 1}`, [0.25, 0.19, 0.025], p.tealLight,
      [0, 0.86, 0.19], node);
    node.position.set(2.4 - index * 4.9 / 4, 0, 0);
    travellingNodes.push(node);
  }

  // A forked gate sends a visible path to human review and then release.
  for (const z of [-0.48, 0.48]) {
    kit.box(`decision gate brass post ${z}`, [0.11, 1.7, 0.11], p.brass,
      [0.45, 1.53, z]);
    kit.box(`decision gate lit column ${z}`, [0.045, 1.35, 0.045], p.tealLight,
      [0.45, 1.5, z]);
  }
  kit.box("decision gate lintel", [0.22, 0.12, 1.18], p.brass,
    [0.45, 2.4, 0]);
  kit.sphere("decision gate active signal", 0.13, p.goldLight, [0.45, 2.56, 0]);
  kit.curve("human review branch", [[-0.1, 0.73, 0], [-0.53, 0.73, -0.6],
    [-1.04, 0.73, -1.16], [-2.2, 0.73, -1.16]], 0.035, p.tealLight);
  kit.curve("release branch", [[-0.1, 0.73, 0], [-0.65, 0.73, 0.48],
    [-1.2, 0.73, 0.85], [-2.2, 0.73, 0.85]], 0.035, p.goldLight);

  // Three articulated inspection arms attach to an overhead machine gantry.
  for (let index = 0; index < 3; index += 1) {
    const x = -1.8 + index * 1.7;
    const z = index === 1 ? -1.55 : 1.55;
    kit.cylinder(`arm turntable ${index + 1}`, 0.39, 0.45, 0.22, p.dark,
      [x, 0.49, z], 12);
    kit.torus(`arm turntable trim ${index + 1}`, 0.39, 0.022, p.brass,
      [x, 0.61, z]).rotation.x = -Math.PI / 2;
    const arm = new Group();
    arm.name = `inspection arm ${index + 1}`;
    arm.position.set(x, 0.61, z);
    kit.group.add(arm);
    kit.beam(`arm lower link ${index + 1}`, [0, 0.05, 0], [0.08, 0.78, 0], 0.115, p.pale, arm);
    kit.sphere(`arm elbow ${index + 1}`, 0.18, p.brass, [0.08, 0.78, 0], arm);
    kit.beam(`arm upper link ${index + 1}`, [0.08, 0.78, 0], [0.67, 1.18, -z * 0.23],
      0.09, p.pale, arm);
    kit.bevel(`arm inspection head ${index + 1}`, [0.36, 0.24, 0.36], p.dark,
      [0.73, 1.19, -z * 0.23], arm, 0.035);
    kit.cylinder(`arm scanner lens ${index + 1}`, 0.08, 0.08, 0.11, p.tealLight,
      [0.73, 1.02, -z * 0.23], 10, arm);
    arms.push(arm);
  }

  portfolioData.skillDomains.forEach((domain, index) => {
    const z = index < 2 ? -1.78 : 1.78;
    const x = index % 2 === 0 ? 1.63 : -1.57;
    const consoleGroup = new Group();
    consoleGroup.name = `${domain.title} console`;
    consoleGroup.position.set(x, 0, z);
    kit.group.add(consoleGroup);
    kit.cylinder(`${domain.id} console pedestal`, 0.38, 0.5, 0.7, p.dark,
      [0, 0.68, 0], 8, consoleGroup);
    const screen = kit.bevel(`${domain.id} console screen`, [0.75, 0.54, 0.06], p.deep,
      [0, 1.22, 0], consoleGroup, 0.04);
    screen.rotation.x = index < 2 ? 0.21 : -0.21;
    kit.box(`${domain.id} console glyph`, [0.51, 0.04, 0.035], p.tealLight,
      [0, 1.24, 0.047], consoleGroup);
    kit.sphere(`${domain.id} status LED`, 0.06, p.goldLight,
      [0.28, 1.44, 0.055], consoleGroup);
    consoleGroup.userData.capabilityId = domain.id;
    interactives.push({ id: `capability:${domain.id}`, object: consoleGroup,
      label: domain.title, activate: () => options.onCapabilitySelect?.(domain.id) });
  });
  kit.text("lab building title", ["AUTOMATION", "LAB"], 1.83, 0.65,
    [3.49, 2.6, 0]).rotation.y = Math.PI / 2;

  kit.optimizeDrawCalls();
  return {
    id: "automation-lab", group: kit.group,
    entryPoint: new Vector3(-9.55, 0, 0),
    cameraComposition: { position: new Vector3(-7.3, 5.0, 6.1),
      target: new Vector3(-13, 1.43, 0), durationMs: 1050 },
    interactiveObjects: interactives,
    setReducedMotion(value) { reducedMotion = value; },
    update(delta) {
      if (reducedMotion) return;
      elapsed += delta;
      travellingNodes.forEach((node, index) => {
        const progress = (elapsed * 0.3 + index / travellingNodes.length) % 1;
        node.position.set(2.4 - progress * 4.9, 0, 0);
        node.visible = progress < 0.91;
      });
      arms.forEach((arm, index) => {
        arm.rotation.y = Math.sin(elapsed * 0.85 + index * 1.7) * 0.26;
        arm.rotation.z = Math.sin(elapsed * 0.7 + index) * 0.065;
      });
    },
    dispose: () => kit.dispose(),
  };
}
