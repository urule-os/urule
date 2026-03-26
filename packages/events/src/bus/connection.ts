import { connect, type NatsConnection, type ConnectionOptions } from 'nats';
import { EventBus, type EventBusOptions } from './event-bus.js';

export interface ConnectOptions extends EventBusOptions {
  /** NATS server URL(s). Defaults to "localhost:4222" */
  servers?: string | string[];
}

/**
 * Create an EventBus connected to NATS.
 */
export async function createEventBus(options: ConnectOptions): Promise<EventBus> {
  const natsOptions: ConnectionOptions = {
    servers: options.servers ?? 'localhost:4222',
  };

  const conn: NatsConnection = await connect(natsOptions);
  const bus = new EventBus(conn, options);

  return bus;
}
