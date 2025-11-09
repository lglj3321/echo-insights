import OpenAI from "openai";
import pRetry from "p-retry";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

// Helper function to check if error is rate limit or quota violation
function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

interface ClassificationResult {
  category: string;
  confidence: number;
  reasoning: string;
}

export async function classifyProject(
  description: string,
  customMetrics: { name: string; value: string }[],
  fileText?: string
): Promise<ClassificationResult> {
  const metricsText = customMetrics.length > 0
    ? customMetrics.map(m => `${m.name}: ${m.value}`).join(", ")
    : "No custom metrics provided";

  const fileContext = fileText 
    ? `\n\nFile Content:\n${fileText.substring(0, 2000)}` // Limit to first 2000 chars
    : "";

  const prompt = `You are a sustainability expert helping categorize food company sustainability projects.

Analyze this project and classify it into ONE of these categories:
- Packaging: Sustainable packaging materials, reducing packaging waste, recyclable packaging
- Energy: Renewable energy, energy efficiency, carbon reduction
- Sourcing: Local sourcing, sustainable suppliers, ethical sourcing
- Waste: Waste reduction, recycling programs, zero waste initiatives
- Water: Water conservation, water recycling, water efficiency
- Other: Projects that don't fit the above categories

Project Description: ${description}

Custom Metrics: ${metricsText}${fileContext}

Return a JSON object with:
- category: The most appropriate category from the list above
- confidence: A number from 0-100 indicating how confident you are
- reasoning: A brief explanation (1-2 sentences) of why you chose this category

Focus on the main theme of the project. If multiple categories apply, choose the primary one.`;

  try {
    const response = await pRetry(
      async () => {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            max_completion_tokens: 500,
          });
          
          const content = completion.choices[0]?.message?.content;
          if (!content) {
            throw new Error("No response from OpenAI");
          }
          
          return JSON.parse(content) as ClassificationResult;
        } catch (error: any) {
          if (isRateLimitError(error)) {
            throw error; // Rethrow to trigger p-retry
          }
          throw new pRetry.AbortError(error);
        }
      },
      {
        retries: 7,
        minTimeout: 2000,
        maxTimeout: 128000,
        factor: 2,
      }
    );

    return response;
  } catch (error) {
    console.error("OpenAI classification error:", error);
    throw error;
  }
}
