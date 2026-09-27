import { Group, Vector3 } from "three";
import { portfolioData } from "../../data/portfolioData";
import type { CameraComposition, InteractiveTarget } from "../types";
import { makePalette, type DynamicWorldZone, type ZoneOptions, ZoneKit } from "./zoneKit";

export interface AutomationLabOptions extends ZoneOptions {
  onCapabilitySelect?: (id: string) => void;
}

export interface AutomationLabZone extends DynamicWorldZone {
  readonly workflowComposition: CameraComposition;
}

/** Glazed workshop with visible routing machinery and four data-bound capability consoles. */
export function createAutomationLab(options: AutomationLabOptions = {}): AutomationLabZone {
  const kit = new ZoneKit("Automation Lab architecture", -13, 0);
  kit.group.position.y = -0.295;
  const p = makePalette(kit);
  const floorMaterial = kit.material("lab illuminated graphite floor", 0x315366, 0xa9b9bb,
    { roughness: 0.64, metalness: 0.16 });
  const conveyorMaterial = kit.material("lab controlled routing deck", 0x1c6978, 0x5a99a3,
    { roughness: 0.4, metalness: 0.24 });
  const screenMaterial = kit.material("lab legible capability glass", 0x267e91, 0x6ba7b5,
    { roughness: 0.24, metalness: 0.18, emissive: 0x198ca3,
      nightEmission: 0.26, dayEmission: 0.08 });
  const interactives: InteractiveTarget[] = [];
  const travellingNodes: Group[] = [];
  const arms: Group[] = [];
  const processBeacons: Group[] = [];
  const stageLabels = ["INTAKE", "DECIDE", "REVIEW", "RELEASE"] as const;
  const capabilityLabels = ["WORKFLOW", "QUALITY", "ENGINEERING", "RESPONSIBLE AI"] as const;
  let reducedMotion = options.reducedMotion ?? false;
  let elapsed = 0;
  kit.lamp("workshop warm task lighting", 0xffd39a, 6.0, 0.2, 9, [0, 3.06, 0]);

  kit.bevel("lab pale plinth", [7.3, 0.27, 5.65], p.stone, [0, 0.11, 0], kit.group, 0.075);
  kit.bevel("lab dark workshop floor", [6.86, 0.055, 5.2], floorMaterial,
    [0, 0.28, 0], kit.group, 0.03);
  kit.bevel("lab east entry apron", [1.24, 0.105, 2.08], p.pale,
    [3.87, 0.2525, 0], kit.group, 0.035);
  kit.beam("lab east entry brass edge", [3.3, 0.32, -1.06], [3.3, 0.32, 1.06], 0.025, p.brass);

  // A glazed pavilion reads through its interior from the campus map; no opaque solid roof.
  for (const side of [-1, 1]) {
    const z = side * 2.55;
    kit.bevel(`lab masonry knee wall ${side}`, [6.75, 0.56, 0.16], p.pale,
      [0, 0.61, z], kit.group, 0.04);
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
  kit.bevel("lab west masonry service wall", [0.2, 0.73, 5.24], p.stone,
    [-3.39, 0.74, 0], kit.group, 0.04);
  for (const z of [-2.55, -1.27, 0, 1.27, 2.55]) {
    kit.box(`lab west wall mullion ${z}`, [0.07, 3.02, 0.065], p.brass,
      [-3.4, 1.81, z]);
  }
  for (const z of [-2.55, 2.55]) {
    kit.box(`lab east entry column ${z}`, [0.17, 3.32, 0.17], p.pale,
      [3.38, 1.76, z]);
  }
  kit.box("lab east lintel", [0.18, 0.21, 5.32], p.brass, [3.38, 3.31, 0]);
  kit.curve("lab east sculpted entry canopy", [[3.35, 2.82, -2.55],
    [3.68, 3.24, -1.42], [3.79, 3.46, 0], [3.68, 3.24, 1.42],
    [3.35, 2.82, 2.55]], 0.09, p.pale);
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
  kit.bevel("lab cantilevered rear service canopy", [7.3, 0.18, 1.34],
    p.dark, [0, 3.57, -1.87], kit.group, 0.05);
  kit.bevel("lab canopy brass fascia", [7.45, 0.045, 1.43],
    p.brass, [0, 3.49, -1.87], kit.group, 0.018);
  for (const x of [-2.25, 0, 2.25]) {
    kit.bevel(`lab raised glazed roof slit ${x}`, [0.86, 0.04, 0.61],
      p.glass, [x, 3.69, -1.87], kit.group, 0.015);
    kit.box(`lab roof slit brass spine ${x}`, [0.04, 0.035, 0.68],
      p.brass, [x, 3.72, -1.87]);
  }
  for (const z of [-2.31, 2.31])
    kit.box(`lab warm roof task strip ${z}`, [6.5, 0.035, 0.06],
      p.goldLight, [0, 3.26, z]);

  // A solid service spine gives the machines a readable backdrop from the
  // arrival bridge while the glazed south wall keeps the process visible.
  kit.bevel("lab rear limestone service spine", [6.57, 2.17, 0.11],
    p.pale, [0, 1.43, -2.48], kit.group, 0.035);
  kit.box("lab rear clerestory", [6.42, 0.58, 0.04],
    p.glass, [0, 2.82, -2.41]);
  kit.box("lab rear continuous datum", [6.39, 0.045, 0.08],
    p.brass, [0, 2.52, -2.38]);
  for (let index = 0; index < 4; index += 1) {
    const x = 2.55 - index * 1.69;
    kit.bevel(`lab workflow bay backplate ${index + 1}`,
      [1.29, 1.34, 0.08], p.dark,
      [x, 1.46, -2.38], kit.group, 0.035);
    kit.box(`lab workflow bay lit spine ${index + 1}`,
      [1.03, 0.055, 0.025], p.tealLight,
      [x, 2.02, -2.325]);
    for (let indicator = 0; indicator < 3; indicator += 1)
      kit.box(`lab workflow bay telemetry ${index + 1}-${indicator + 1}`,
        [0.13 + indicator * 0.08, 0.08, 0.025],
        indicator === 1 ? p.goldLight : p.tealLight,
        [x - 0.34 + indicator * 0.32, 1.42 + indicator * 0.12, -2.325]);
    kit.bevel(`lab workflow bay cabinet ${index + 1}`,
      [1.08, 0.31, 0.31], p.stone,
      [x, 0.59, -2.19], kit.group, 0.025);
  }

  // Two parallel routing rails and a broad lit conveyor make the process legible at map distance.
  kit.bevel("lab conveyor base", [5.55, 0.21, 1.23], p.brass,
    [0, 0.54, 0], kit.group, 0.04);
  kit.bevel("lab moving process deck", [5.29, 0.075, 0.98], conveyorMaterial,
    [0, 0.686, 0], kit.group, 0.025);
  for (const side of [-1, 1]) {
    kit.box(`lab cyan routing rail ${side}`, [5.2, 0.05, 0.075], p.tealLight,
      [0, 0.735, side * 0.43]);
  }
  kit.curve("lab elevated intake to release signal", [[2.58, 1.74, 0],
    [1.38, 1.93, 0], [0.45, 2.02, 0], [-0.68, 1.82, 0],
    [-1.68, 1.74, 0], [-2.55, 1.88, 0]], 0.045, p.tealLight);
  for (let station = 0; station < 6; station += 1) {
    const x = 2.2 - station * 0.88;
    kit.box(`workflow station stripe ${station + 1}`, [0.05, 0.018, 0.79],
      p.brass, [x, 0.733, 0]);
  }
  for (let index = 0; index < 4; index += 1) {
    const node = new Group();
    node.name = `travelling intake node ${index + 1}`;
    kit.group.add(node);
    kit.bevel(`intake node shell ${index + 1}`, [0.49, 0.38, 0.47], p.pale,
      [0, 0.9, 0], node, 0.05);
    kit.box(`intake node core ${index + 1}`, [0.32, 0.25, 0.035], p.tealLight,
      [0, 0.9, 0.25], node);
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
  kit.torus("decision gate visible orbital signal", 0.43, 0.045,
    p.goldLight, [0.45, 2.05, 0], kit.group, 32);
  kit.curve("human review branch", [[-0.1, 0.73, 0], [-0.53, 0.73, -0.6],
    [-1.04, 0.73, -1.16], [-2.2, 0.73, -1.16]], 0.035, p.tealLight);
  kit.curve("release branch", [[-0.1, 0.73, 0], [-0.65, 0.73, 0.48],
    [-1.2, 0.73, 0.85], [-2.2, 0.73, 0.85]], 0.035, p.goldLight);
  for (const side of [-1, 1]) {
    const z = side * 1.12;
    kit.bevel(`human review station ${side}`, [0.88, 0.16, 0.55], p.pale,
      [-1.4, 0.93, z], kit.group, 0.04);
    kit.bevel(`human review station luminous display ${side}`, [0.64, 0.48, 0.06],
      screenMaterial, [-1.45, 1.37, z + side * 0.23], kit.group, 0.04);
    kit.sphere(`human review station signal ${side}`, 0.085, p.goldLight,
      [-1.08, 1.63, z + side * 0.2]);
  }
  kit.cylinder("release verification tower", 0.28, 0.35, 1.55,
    p.pale, [-2.54, 1.46, 0], 12);
  kit.cylinder("release verification lens", 0.24, 0.24, 0.54,
    p.tealLight, [-2.54, 2.5, 0], 12);
  kit.torus("release verification crown", 0.31, 0.04,
    p.brass, [-2.54, 2.77, 0]).rotation.x = Math.PI / 2;
  stageLabels.forEach((label, index) => {
    const x = 2.55 - index * 1.69;
    for (const offset of [-0.5, 0.5])
      kit.beam(`workflow ${label.toLowerCase()} sign hanger ${offset}`,
        [x + offset, 3.42, 2.55], [x + offset, 3.16, 2.62], 0.026, p.brass);
    kit.text(`workflow ${label.toLowerCase()} stage label`, [`0${index + 1}  ${label}`],
      1.31, 0.34, [x, 3.0, 2.62], kit.group,
      { background: "#123644", foreground: "#eff8f1", accent: "#6ac6d0", fontSize: 83 });
  });
  for (const [index, x, material] of [
    [0, 2.2, p.tealLight], [1, 0.45, p.goldLight], [2, -1.95, p.tealLight],
  ] as const) {
    const beacon = new Group();
    beacon.name = ["intake", "decision", "release"][index] + " workflow beacon";
    beacon.position.set(x, 2.55, 0);
    kit.group.add(beacon);
    kit.torus(`workflow stage ${index + 1} upper ring`, 0.27, 0.035,
      material, [0, 0, 0], beacon, 24).rotation.x = Math.PI / 2;
    kit.cylinder(`workflow stage ${index + 1} hanging optic`, 0.09, 0.09,
      0.38, material, [0, -0.3, 0], 10, beacon);
    kit.beam(`workflow stage ${index + 1} ceiling tether`,
      [0, 0.28, 0], [0, 0.84, 0], 0.028, p.brass, beacon);
    processBeacons.push(beacon);
  }

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
  const heroArm = new Group();
  heroArm.name = "large visible workflow inspection arm";
  heroArm.position.set(2.37, 0.48, -1.15);
  kit.group.add(heroArm);
  kit.cylinder("hero arm sculpted turntable", 0.49, 0.54, 0.24,
    p.brass, [0, 0.09, 0], 12, heroArm);
  kit.beam("hero arm ivory lower link", [0, 0.21, 0], [-0.18, 1.45, 0.06],
    0.15, p.pale, heroArm);
  kit.sphere("hero arm brass elbow", 0.24, p.brass,
    [-0.18, 1.45, 0.06], heroArm);
  kit.beam("hero arm ivory upper link", [-0.18, 1.45, 0.06],
    [-1.08, 1.85, 0.78], 0.12, p.pale, heroArm);
  kit.bevel("hero arm lit review head", [0.49, 0.28, 0.43], p.dark,
    [-1.1, 1.84, 0.78], heroArm, 0.045);
  kit.cylinder("hero arm scanner lens", 0.13, 0.13, 0.09,
    p.tealLight, [-1.1, 1.64, 0.78], 12, heroArm);
  arms.push(heroArm);

  portfolioData.skillDomains.forEach((domain, index) => {
    const z = 2.95;
    const x = -2.45 + index * 1.63;
    const consoleGroup = new Group();
    consoleGroup.name = `${domain.title} console`;
    consoleGroup.position.set(x, 0, z);
    kit.group.add(consoleGroup);
    kit.cylinder(`${domain.id} console pedestal`, 0.38, 0.5, 0.7, p.dark,
      [0, 0.68, 0], 8, consoleGroup);
    const screen = kit.bevel(`${domain.id} console screen`, [1.05, 0.68, 0.075], screenMaterial,
      [0, 1.31, 0], consoleGroup, 0.05);
    screen.rotation.x = -0.09;
    kit.text(`${domain.id} capability name`, [`0${index + 1}`, capabilityLabels[index]],
      0.91, 0.56, [0, 1.31, 0.056], consoleGroup,
      { background: "#11465a", foreground: "#eef7ed", accent: "#c7a56c", fontSize: 87 });
    kit.sphere(`${domain.id} status LED`, 0.06, p.goldLight,
      [0.42, 1.64, 0.055], consoleGroup);
    consoleGroup.userData.capabilityId = domain.id;
    interactives.push({ id: `capability:${domain.id}`, object: consoleGroup,
      label: domain.title, activate: () => options.onCapabilitySelect?.(domain.id) });
  });
  kit.text("lab building title", ["AUTOMATION", "LAB"], 1.83, 0.65,
    [3.49, 2.6, 0]).rotation.y = Math.PI / 2;

  kit.optimizeDrawCalls();
  return {
    id: "automation-lab", group: kit.group,
    entryPoint: new Vector3(-13, 0, 0),
    cameraComposition: { position: new Vector3(-13, 7.6, 15.2),
      target: new Vector3(-13, 0.7, 0), durationMs: 1050, fov: 72 },
    workflowComposition: { position: new Vector3(-13, 4, 7.2),
      target: new Vector3(-13, 1.3, 0), durationMs: 700, fov: 60 },
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
      processBeacons.forEach((beacon, index) => {
        beacon.scale.setScalar(0.96 + 0.05 * Math.sin(elapsed * 1.4 - index * 0.8));
      });
    },
    dispose: () => kit.dispose(),
  };
}
