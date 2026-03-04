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
export const callLLM = async (prompt: string, context: string, level: string = "medium"): Promise<string> => {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!openaiKey && !geminiKey) {
      return "I couldn't generate an answer. Please configure an AI API key (GEMINI_API_KEY or OPENAI_API_KEY) in your environment.";
    }

    const instruction = `Context from uploaded documents:\n\n${context}\n\nUser question: ${prompt}\n\nBased ONLY on the context provided above, answer the question in YOUR OWN WORDS. Do NOT copy text verbatim from the documents. Instead:\n1. Understand the information from the context\n2. Rephrase it naturally and clearly as if explaining to someone at a ${level.toUpperCase()} difficulty level.\n3. Provide a concise, accurate answer without directly quoting the source\n4. If the answer is not found in the context, respond with "Answer not found in the uploaded documents."`;

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
      // Use gemini-2.5-flash (quota is still available here)
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          contents: [
            {
              parts: [{ text: instruction }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 800,
          },
        }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    }

    return "Could not generate a response. Please try again.";
  } catch (err: any) {
    console.error("LLM API error:", err?.response?.data || err.message);
    return "Error generating response from AI. Please check your API configuration.";
  }
};

export interface MCQQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

// Generate MCQ questions from PDF context using AI
export const generateMCQFromContext = async (
  context: string,
  count: number = 5,
  level: string = "medium"
): Promise<MCQQuestion[]> => {
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  console.log("MCQ Generation - API Keys check:");
  console.log("  OpenAI key present:", !!openaiKey);
  console.log("  Gemini key present:", !!geminiKey);

  if (!openaiKey && !geminiKey) {
    console.error("No API keys configured. Set GEMINI_API_KEY or OPENAI_API_KEY in backend/.env");
    throw new Error("No AI API key configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in your environment.");
  }

  const prompt = `Based on the following study material, generate exactly ${count} multiple choice questions (MCQs) of ${level.toUpperCase()} difficulty to test knowledge.

Study material:
${context.substring(0, 6000)}

Return ONLY a valid JSON array with this exact structure (no extra text, no markdown code fences):
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Brief explanation of why this is correct."
  }
]

Rules:
- "correct" is the 0-based index of the correct option (0=A, 1=B, 2=C, 3=D)
- All 4 options must be plausible
- Questions must be directly based on the provided study material
- Return only the JSON array, nothing else`;

  try {
    if (openaiKey) {
      console.log("Using OpenAI for MCQ generation...");
      const resp = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an exam question generator. Return only valid JSON." },
            { role: "user", content: prompt },
          ],
          max_tokens: 2000,
          temperature: 0.5,
        },
        { headers: { Authorization: `Bearer ${openaiKey}` } }
      );

      const raw = resp.data?.choices?.[0]?.message?.content || "[]";
      console.log("OpenAI response received, parsing JSON...");
      const cleaned = raw.trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "");
      return JSON.parse(cleaned);
    }

    if (geminiKey) {
      console.log("Using Gemini for MCQ generation...");
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 2000,
            responseMimeType: "application/json",
          },
        }
      );

      const raw =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      console.log("Gemini response received, raw text:", raw.substring(0, 200));

      // Strip markdown code fences if present and try parsing
      try {
        const cleaned = raw.trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "");
        return JSON.parse(cleaned);
      } catch (e) {
        // Deep fallback: forcibly extract from the first [ to the last ]
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) {
          return JSON.parse(match[0]);
        }
        throw e;
      }
    }
  } catch (err: any) {
    console.error("MCQ generation error:", err?.response?.data || err.message);
    if (err?.response?.status === 400) {
      throw new Error("Invalid API key or request. Please check your GEMINI_API_KEY.");
    }
    if (err?.response?.status === 429) {
      throw new Error("API rate limit exceeded. Please try again later.");
    }
    if (err instanceof SyntaxError) {
      throw new Error("Failed to parse AI response. Please try again.");
    }
    throw new Error(err.message || "Failed to generate questions.");
  }

  return [];
};
