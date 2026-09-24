import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { EventBus, type ExperienceEvents } from "../../src/core/EventBus";

describe("EventBus", () => {
  it("delivers only the matching typed event and unsubscribes", () => {
    const bus = new EventBus<ExperienceEvents>();
    const listener = vi.fn<(payload: ExperienceEvents["zone:enter"]) => void>();
    const unsubscribe = bus.on("zone:enter", listener);

    expectTypeOf(listener).parameter(0).toEqualTypeOf<{ zoneId: string }>();
    bus.emit("zone:enter", { zoneId: "arrival" });
    bus.emit("project:open", { projectId: "sample" });
    expect(listener).toHaveBeenCalledExactlyOnceWith({ zoneId: "arrival" });

    unsubscribe();
    unsubscribe();
    bus.emit("zone:enter", { zoneId: "vault" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("allows a listener to remove itself during dispatch", () => {
    const bus = new EventBus<ExperienceEvents>();
    const listener = vi.fn();
    const unsubscribe = bus.on("theme:change", () => {
      unsubscribe();
      listener();
    });

    bus.emit("theme:change", { theme: "day" });
    bus.emit("theme:change", { theme: "night" });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
