import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatRequestBody = { messages?: unknown; context?: unknown };

const SYSTEM = `You are the Audiomaxxer hearing coach: a warm, plain-spoken guide inside a hearing-health app.

You help the user understand:
- their audiogram and what each threshold means in everyday terms
- screening quality, uncertainty, and what could make a retest more reliable
- their adaptive training progress: accuracy, difficulty reached, modes, streak, and XP
- current patterns: frequencies that lag, ears that differ, listening behaviour, and noisy environments
- what their named listening device and its calibration profile changes about interpretation

Rules:
- Ground every claim in the USER DATA block below. If a number is missing, say what test would produce it instead of guessing.
- Never present a hearing threshold as a medically validated safe-volume limit. Describe logged listening behaviour and general WHO-style dose guidance cautiously.
- Be concrete and short: a couple of sentences per point, markdown, no filler preamble.
- Point out concerning trends honestly, but never diagnose. Suggest an audiologist for anything clinical.
- Suggest one next action in the app (run a screening, train a specific mode, or check the risk page) when it genuinely helps.`;

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
