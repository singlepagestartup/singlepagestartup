export interface IProvider {
  connect: () => Promise<void>;
  hashKey: (props: { prefix: string; key: string }) => Promise<string>;
  get: (props: { prefix: string; key: string }) => Promise<string | null>;
  set: (props: {
    prefix: string;
    key: string;
    value: string;
    options: { ttl: number };
  }) => Promise<string | undefined | null>;
  del: (props: { prefix: string; key: string }) => Promise<void>;
  flushall: () => Promise<void>;
  delByPrefix: (props: { prefix: string }) => Promise<void>;
}
