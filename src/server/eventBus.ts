import { EventEmitter } from "node:events";
import type { SseEvent } from "../shared/types";

class CareEventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(40);
  }

  publish(type: SseEvent["type"], data: unknown): SseEvent {
    const event: SseEvent = {
      type,
      at: new Date().toISOString(),
      data
    };
    this.emitter.emit("event", event);
    return event;
  }

  subscribe(listener: (event: SseEvent) => void): () => void {
    this.emitter.on("event", listener);
    return () => this.emitter.off("event", listener);
  }
}

export const careEvents = new CareEventBus();
