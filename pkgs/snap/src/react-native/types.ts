import type { Spec } from "@json-render/core";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SnapPage = {
  version: string;
  theme?: { accent?: string };
  effects?: string[];
  ui: Spec;
};

export type SnapActionHandlers = {
  submit: (target: string, inputs: Record<string, JsonValue>) => void;
  open_url: (target: string) => void;
  open_snap: (target: string) => void;
  open_mini_app: (target: string) => void;
  view_cast: (params: { hash: string }) => void;
  view_profile: (params: { fid: number }) => void;
  compose_cast: (params: {
    text?: string;
    channelKey?: string;
    embeds?: string[];
  }) => void;
  view_token: (params: { token: string }) => void;
  send_token: (params: {
    token: string;
    amount?: string;
    recipientFid?: number;
    recipientAddress?: string;
  }) => void;
  swap_token: (params: { sellToken?: string; buyToken?: string }) => void;
};
