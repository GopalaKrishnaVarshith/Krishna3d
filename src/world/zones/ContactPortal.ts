import { Group, Vector3 } from "three";
import { portfolioData } from "../../data/portfolioData";
import type { InteractiveTarget } from "../types";
import { makePalette, type DynamicWorldZone, type ZoneOptions, ZoneKit } from "./zoneKit";

export interface ContactPortalOptions extends ZoneOptions {
  onEmail?: (href: string) => void;
  onLinkedIn?: (href: string) => void;
}

export interface ContactPortalZone extends DynamicWorldZone {
  readonly links: { email: string; linkedin: string };
}

/** Luminous completion gateway with physical email and LinkedIn access points. */
export function createContactPortal(options: ContactPortalOptions = {}): ContactPortalZone {
  const kit = new ZoneKit("Contact Portal architecture", -10, 13);
  const p = makePalette(kit);
  const interactives: InteractiveTarget[] = [];
  const links = { email: `mailto:${portfolioData.profile.email}`,
    linkedin: portfolioData.profile.linkedin };
  let reducedMotion = options.reducedMotion ?? false;
  let elapsed = 0;
  kit.lamp("contact portal welcome pool", 0xffd6a5, 2.3, 0.1, 8, [0, 3.5, 0]);

  kit.cylinder("contact outer stone terrace", 3.42, 3.65, 0.25,
    p.stone, [0, 0.12, 0], 28);
  kit.cylinder("contact blue enamel floor", 2.97, 3.09, 0.06,
    p.deep, [0, 0.285, 0], 28);
  for (const radius of [1.12, 1.82, 2.66])
    kit.torus(`contact nested brass ground orbit ${radius}`, radius, 0.03,
      p.brass, [0, 0.325, 0]).rotation.x = -Math.PI / 2;
  kit.bevel("contact bridge reception tread", [1.75, 0.11, 0.66],
    p.pale, [2.98, 0.08, -2.45], kit.group, 0.035);

  const portal = new Group();
  portal.name = "completion gateway";
  portal.position.set(0, 2.05, 0.22);
  portal.rotation.y = 2.49;
  kit.group.add(portal);
  // Three independent annular layers and radial apertures create depth through the gateway.
  for (const [radius, tube, depth, material] of [
    [1.84, 0.19, -0.21, p.dark],
    [1.71, 0.067, -0.07, p.brass],
    [1.57, 0.06, 0.04, p.tealLight],
    [1.35, 0.023, 0.13, p.glass],
  ] as const) kit.torus("portal concentric sculpted ring", radius, tube,
    material, [0, 0, depth], portal, 80);
  const iris = new Group();
  iris.name = "portal responsive inner iris";
  iris.position.z = 0.12;
  portal.add(iris);
  for (let index = 0; index < 16; index += 1) {
    const angle = index * Math.PI / 8;
    const inner = 1.33;
    const outer = 1.58;
    kit.beam(`portal radial brass vane ${index + 1}`,
      [Math.cos(angle) * inner, Math.sin(angle) * inner, 0],
      [Math.cos(angle + 0.09) * outer, Math.sin(angle + 0.09) * outer, 0],
      0.025, p.brass, iris);
  }
  for (const side of [-1, 1]) {
    kit.cylinder(`portal structural pillar ${side}`, 0.24, 0.38, 1.62,
      p.pale, [side * 1.77, 0.98, -0.18], 10, portal);
    kit.cylinder(`portal pillar brass shoe ${side}`, 0.4, 0.43, 0.15,
      p.brass, [side * 1.77, 0.12, -0.18], 12, portal);
    kit.cylinder(`portal pillar gold beacon ${side}`, 0.14, 0.14, 0.34,
      p.goldLight, [side * 1.77, 1.92, -0.18], 10, portal);
  }
  kit.bevel("portal keystone", [0.42, 0.39, 0.33], p.brass,
    [0, 1.82, -0.18], portal, 0.05);
  kit.sphere("portal finishing light", 0.12, p.goldLight,
    [0, 2.13, -0.18], portal);
  kit.torus("portal receiving floor light", 1.42, 0.036,
    p.tealLight, [0, 0.37, 0.22]).rotation.x = -Math.PI / 2;

  // Two low interaction stations stand at the gateway threshold; the later HTML layer mirrors them.
  for (const [side, id, label] of [
    [-1, "email", "EMAIL"],
    [1, "linkedin", "LINKEDIN"],
  ] as const) {
    const station = new Group();
    station.name = `${label} contact station`;
    station.position.set(side * 2.35, 0, 1.2);
    station.rotation.y = side * -0.18;
    station.userData.action = id;
    kit.group.add(station);
    kit.cylinder(`${label} stone footing`, 0.47, 0.54, 0.18,
      p.stone, [0, 0.32, 0], 10, station);
    kit.cylinder(`${label} tapered console`, 0.29, 0.4, 0.85,
      p.dark, [0, 0.82, 0], 8, station);
    kit.cylinder(`${label} brass crown`, 0.34, 0.34, 0.08,
      p.brass, [0, 1.29, 0], 10, station);
    kit.sphere(`${label} control light`, 0.08, p.tealLight,
      [0, 1.41, 0], station);
    kit.text(`${label} contact action`, [label], 0.54, 0.23,
      [0, 0.94, 0.31], station, { fontSize: 96 });
    interactives.push({ id: `contact:${id}`, object: station,
      label: id === "email" ? "Email Krishna" : "Visit Krishna on LinkedIn",
      activate: () => {
        if (id === "email") {
          if (options.onEmail) options.onEmail(links.email);
          else if (typeof window !== "undefined") window.location.href = links.email;
        } else if (options.onLinkedIn) options.onLinkedIn(links.linkedin);
        else if (typeof window !== "undefined") window.open(links.linkedin, "_blank", "noopener,noreferrer");
      } });
  }
  kit.text("contact portal ground identity", ["LET'S CONNECT"],
    1.72, 0.38, [0, 0.72, 2.1]).rotation.y = Math.PI;

  kit.optimizeDrawCalls();
  return {
    id: "contact-portal", group: kit.group,
    entryPoint: new Vector3(-7.66, 0, 9.93),
    cameraComposition: { position: new Vector3(-5.8, 5.3, 7.6),
      target: new Vector3(-10, 2.1, 13.1), durationMs: 1100 },
    interactiveObjects: interactives,
    links,
    setReducedMotion(value) { reducedMotion = value; },
    update(delta) {
      if (reducedMotion) return;
      elapsed += delta;
      iris.rotation.z += delta * 0.035;
      iris.scale.setScalar(1 + Math.sin(elapsed * 0.9) * 0.013);
    },
    dispose: () => kit.dispose(),
  };
}
