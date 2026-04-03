import { z } from "zod";
import { CLIENT_ACTION } from "./constants";

const viewCastClientActionSchema = z
  .object({
    type: z.literal(CLIENT_ACTION.view_cast),
    hash: z.string().min(1),
  })
  .strict();

const viewProfileClientActionSchema = z
  .object({
    type: z.literal(CLIENT_ACTION.view_profile),
    fid: z.number().int().nonnegative(),
  })
  .strict();

const composeCastClientActionSchema = z
  .object({
    type: z.literal(CLIENT_ACTION.compose_cast),
    text: z.string().optional(),
    embeds: z
      .array(z.string())
      .max(2, { message: "compose_cast embeds: max 2 URLs" })
      .optional(),
    parent: z
      .object({
        type: z.literal("cast"),
        hash: z.string().min(1),
      })
      .strict()
      .optional(),
    channelKey: z.string().optional(),
  })
  .strict();

const viewTokenClientActionSchema = z
  .object({
    type: z.literal(CLIENT_ACTION.view_token),
    /** CAIP-19 asset ID (e.g. "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") */
    token: z.string().min(1),
  })
  .strict();

const sendTokenClientActionSchema = z
  .object({
    type: z.literal(CLIENT_ACTION.send_token),
    /** CAIP-19 asset ID */
    token: z.string().optional(),
    /** Amount in raw token units (e.g. "1000000" for 1 USDC) */
    amount: z.string().optional(),
    recipientFid: z.number().int().nonnegative().optional(),
    recipientAddress: z.string().optional(),
  })
  .strict();

const swapTokenClientActionSchema = z
  .object({
    type: z.literal(CLIENT_ACTION.swap_token),
    /** CAIP-19 asset ID to sell */
    sellToken: z.string().optional(),
    /** CAIP-19 asset ID to buy */
    buyToken: z.string().optional(),
    /** Amount in raw token units */
    sellAmount: z.string().optional(),
  })
  .strict();

export const clientActionSchema = z.discriminatedUnion("type", [
  viewCastClientActionSchema,
  viewProfileClientActionSchema,
  composeCastClientActionSchema,
  viewTokenClientActionSchema,
  sendTokenClientActionSchema,
  swapTokenClientActionSchema,
]);

export type ClientAction = z.infer<typeof clientActionSchema>;
