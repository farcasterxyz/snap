import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapHandlerResult } from "@farcaster/snap";

const BASE_CHAIN_ID = "0x2105";
const TEST_RECIPIENT = "0x0000000000000000000000000000000000000001";
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_BALANCE_OF_ZERO_ADDRESS =
  "0x70a082310000000000000000000000000000000000000000000000000000000000000000";

const app = new Hono();

registerSnapHandler(app, async () => transactionActionsPage());

export default app;

function transactionActionsPage(): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "teal" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["title", "desc", "info", "buttons"],
        },
        title: {
          type: "text",
          props: {
            content: "Transaction Actions",
            size: "md",
            weight: "bold",
          },
        },
        desc: {
          type: "text",
          props: {
            content:
              "Use these buttons to test Snap EVM transaction client actions. Hosts should simulate or handle the wallet request without a snap POST round trip.",
            size: "sm",
          },
        },
        info: {
          type: "item_group",
          props: { border: true, separator: true },
          children: ["chain", "recipient", "calls"],
        },
        chain: {
          type: "item",
          props: { title: "Network", description: "Base mainnet" },
          children: ["chain_badge"],
        },
        chain_badge: {
          type: "badge",
          props: { label: BASE_CHAIN_ID, color: "teal" },
        },
        recipient: {
          type: "item",
          props: {
            title: "Single transaction",
            description: `Send 0 ETH to ${TEST_RECIPIENT.slice(0, 10)}...`,
          },
        },
        calls: {
          type: "item",
          props: {
            title: "Batch calls",
            description: "0 ETH transfer plus USDC balanceOf(address(0))",
          },
        },
        buttons: {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["send_transaction", "send_calls"],
        },
        send_transaction: {
          type: "button",
          props: {
            label: "Send tx",
            variant: "primary",
            icon: "wallet",
          },
          on: {
            press: {
              action: "send_transaction",
              params: {
                chainId: BASE_CHAIN_ID,
                to: TEST_RECIPIENT,
                value: "0x0",
                data: "0x",
              },
            },
          },
        },
        send_calls: {
          type: "button",
          props: {
            label: "Send calls",
            variant: "primary",
            icon: "refresh-cw",
          },
          on: {
            press: {
              action: "send_calls",
              params: {
                version: "1.0",
                chainId: BASE_CHAIN_ID,
                atomicRequired: false,
                calls: [
                  {
                    to: TEST_RECIPIENT,
                    value: "0x0",
                    data: "0x",
                  },
                  {
                    to: USDC_BASE,
                    value: "0x0",
                    data: USDC_BALANCE_OF_ZERO_ADDRESS,
                  },
                ],
              },
            },
          },
        },
      },
    },
  };
}
