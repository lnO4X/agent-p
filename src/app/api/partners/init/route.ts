import { NextRequest } from "next/server";
import { streamText, convertToModelMessages } from "ai";
import { getModel } from "@/lib/ai";
import { getAuthFromCookie } from "@/lib/auth";
import { INIT_AGENT_PROMPT } from "@/lib/partner-prompts";
import { logger } from "@/lib/logger";

// POST /api/partners/init — Partner creation mini-chat (streaming)
export async function POST(request: NextRequest) {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const model = await getModel();
  if (!model) {
    return Response.json({ success: false, error: "AI model not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages: clientMessages } = body as { messages?: unknown };

  if (
    !clientMessages ||
    !Array.isArray(clientMessages) ||
    clientMessages.length === 0
  ) {
    return Response.json({ success: false, error: "Messages required" }, { status: 400 });
  }

  const recentMessages = clientMessages.slice(-10);
  let modelMessages;
  try {
    modelMessages = await convertToModelMessages(
      recentMessages as Parameters<typeof convertToModelMessages>[0]
    );
  } catch (err) {
    logger.error("partners.init", "convertToModelMessages error", err);
    return Response.json({ success: false, error: "Failed to process messages" }, { status: 400 });
  }

  const result = streamText({
    model,
    system: INIT_AGENT_PROMPT,
    messages: modelMessages,
    maxOutputTokens: 1000,
  });

  return result.toUIMessageStreamResponse();
}
