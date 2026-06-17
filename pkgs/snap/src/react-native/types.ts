import type { Spec } from "@json-render/core";
import type { SnapRenderState } from "../render-state";

export type { SnapRenderState };

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

export type SnapSendTransactionParams = {
  chainId: string;
  to: string;
  data?: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
};

export type SnapSendCallsParams = {
  version?: "1.0";
  chainId: string;
  atomicRequired?: boolean;
  id?: string;
  calls: Array<{
    to?: string;
    data?: string;
    value?: string;
  }>;
};

export type SnapActionHandlers = {
  submit: (target: string, inputs: Record<string, JsonValue>) => void;
  open_url: (target: string) => void;
  open_snap: (target: string) => void;
  open_mini_app: (target: string) => void;
  view_cast: (params: { hash: string }) => void;
  view_profile: (params: { fid: number }) => void;
  view_channel: (params: { channelKey: string }) => void;
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
  send_transaction?: (params: SnapSendTransactionParams) => void;
  send_calls?: (params: SnapSendCallsParams) => void;
};
