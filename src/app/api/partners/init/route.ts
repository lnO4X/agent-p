import { NextRequest } from "next/server";
import { streamText, convertToModelMessages } from "ai";
import { getModel } from "@/lib/ai";
import { getAuthFromCookie } from "@/lib/auth";
import { INIT_AGENT_PROMPT } from "@/lib/partner-prompts";

// POST /api/partners/init — Partner creation mini-chat (streaming)
export async function POST(request: NextRequest) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const model = getModel();
  if (!model) {
    return new Response("AI model not configured", { status: 503 });
  }

  const body = await request.json();
  const { messages: clientMessages } = body;

  if (
    !clientMessages ||
    !Array.isArray(clientMessages) ||
    clientMessages.length === 0
  ) {
    return new Response("Messages required", { status: 400 });
  }

  const recentMessages = clientMessages.slice(-10);
  const modelMessages = await convertToModelMessages(
    recentMessages as Parameters<typeof convertToModelMessages>[0]
  );

  const result = streamText({
    model,
    system: INIT_AGENT_PROMPT,
    messages: modelMessages,
    maxOutputTokens: 1000,
  });

  return result.toUIMessageStreamResponse();
}
