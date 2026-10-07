import axios from "axios";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const successResponse = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

export const errorResponse = (error: string): ApiResponse<null> => ({
  success: false,
  error,
});

// Call OpenAI or Gemini API for AI responses
export const callLLM = async (prompt: string, context: string): Promise<string> => {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!openaiKey && !geminiKey) {
      return "I couldn't generate an answer. Please configure an AI API key (GEMINI_API_KEY or OPENAI_API_KEY) in your environment.";
    }

    const instruction = `Context from uploaded documents:\n\n${context}\n\nUser question: ${prompt}\n\nBased ONLY on the context provided above, answer the question. If the answer is not found in the context, respond with \"Answer not found in the uploaded documents.\"`;

    if (openaiKey) {
      const resp = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You answer questions strictly using provided context. Do not hallucinate." },
            { role: "user", content: instruction },
          ],
          max_tokens: 800,
        },
        { headers: { Authorization: `Bearer ${openaiKey}` } }
      );

      const text = resp.data?.choices?.[0]?.message?.content;
      if (text) return text;
    }

    if (geminiKey) {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: instruction,
                },
              ],
            },
          ],
        }
      );

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return response.data.candidates[0].content.parts[0].text;
      }
    }

    return "Could not generate a response. Please try again.";
  } catch (err) {
    console.error("LLM API error:", err);
    return "Error generating response from AI. Please check your API configuration.";
  }
};
