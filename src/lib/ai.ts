import { createOpenRouter } from "@openrouter/ai-sdk-provider";

/**
 * Get an AI model instance. Supports per-partner model override.
 * @param modelId - Optional model ID override (e.g. "anthropic/claude-sonnet-4").
 *                  Pass null/undefined to use global default from AI_MODEL env.
 */
export function getModel(modelId?: string | null) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const openrouter = createOpenRouter({ apiKey });
  const resolvedModel =
    modelId || process.env.AI_MODEL || "anthropic/claude-sonnet-4";
  return openrouter(resolvedModel);
}
