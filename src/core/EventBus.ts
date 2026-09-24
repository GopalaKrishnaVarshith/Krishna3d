export interface ExperienceEvents {
  "zone:enter": { zoneId: string };
  "project:open": { projectId: string };
  "theme:change": { theme: "night" | "day" };
  "quality:change": { tier: "high" | "balanced" | "low" };
}

type Listener<Payload> = (payload: Payload) => void;
type AnyListener = (...args: never[]) => void;

export class EventBus<Events extends object> {
  private readonly subscriptions = new Map<keyof Events, Set<AnyListener>>();

  on<Key extends keyof Events>(
    event: Key,
    listener: Listener<Events[Key]>,
  ): () => void {
    let listeners = this.subscriptions.get(event);
    if (!listeners) {
      listeners = new Set();
      this.subscriptions.set(event, listeners);
    }
    listeners.add(listener);
    return () => this.off(event, listener);
  }

  off<Key extends keyof Events>(event: Key, listener: Listener<Events[Key]>): void {
    const listeners = this.subscriptions.get(event);
    listeners?.delete(listener);
    if (listeners?.size === 0) this.subscriptions.delete(event);
  }

  emit<Key extends keyof Events>(event: Key, payload: Events[Key]): void {
    const listeners = this.subscriptions.get(event);
    if (!listeners) return;
    for (const listener of [...listeners]) {
      (listener as Listener<Events[Key]>)(payload);
    }
  }

  clear(): void {
    this.subscriptions.clear();
  }
}
