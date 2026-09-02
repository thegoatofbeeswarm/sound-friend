import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatRequestBody = { messages?: unknown; context?: unknown };

const SYSTEM = `You are the Audible hearing coach: a warm, plain-spoken guide inside a hearing-health app.

You help the user understand:
- their audiogram and what each threshold means in everyday terms
- their personal safe-listening ceiling versus the generic 85 dB phone warning
- their adaptive training progress: accuracy, difficulty reached, quietest sound identified
- current problems: frequencies that lag, ears that differ, overuse risk, noisy environments
- what their listening device (over-ear, on-ear, in-ear) changes about their real exposure

Rules:
- Ground every claim in the USER DATA block below. If a number is missing, say what test would produce it instead of guessing.
- Be concrete and short: a couple of sentences per point, markdown, no filler preamble.
- Point out concerning trends honestly, but never diagnose. Suggest an audiologist for anything clinical.
- Suggest a next action in the app (run a screening, train, check the risk page) when it genuinely helps.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, context } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3.7-flash"),
          system: `${SYSTEM}\n\nUSER DATA:\n${
            typeof context === "string" && context.trim()
              ? context
              : "No saved screenings or training sessions yet."
          }`,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});
