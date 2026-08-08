import { EventEmitter } from 'events';

// Create a global event emitter for SSE
const globalForEventEmitter = global as unknown as { sseEmitter: EventEmitter };

export const sseEmitter =
  globalForEventEmitter.sseEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForEventEmitter.sseEmitter = sseEmitter;
}
