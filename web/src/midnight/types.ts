// Shared types only — no Midnight / WASM imports.
export type Wallet = {
  name: string;
  icon?: string;
  rdns: string;
  dev?: boolean;
  connect(n: string): Promise<any>;
};

export type Verdict =
  | { ok: true; typeId: bigint; block: number; hash: string }
  | { ok: false; reason: string; typeId?: bigint };

// Type-only reference preserves the lazy SDK boundary without erasing its API.
export type { Session } from './cloaktix';
