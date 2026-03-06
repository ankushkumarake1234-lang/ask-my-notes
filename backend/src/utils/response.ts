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
    const groqKey = process.env.GROQ_API_KEY;

    if (!openaiKey && !geminiKey && !groqKey) {
      return "I couldn't generate an answer. Please configure an AI API key (GROQ_API_KEY, GEMINI_API_KEY or OPENAI_API_KEY) in your environment.";
    }

    const instruction = `Context from uploaded documents:\n\n${context}\n\nUser question: ${prompt}\n\nBased ONLY on the context provided above, answer the question in YOUR OWN WORDS. Do NOT copy text verbatim from the documents. Instead:\n1. Understand the information from the context\n2. Rephrase it naturally and clearly as if explaining to someone at a ${level.toUpperCase()} difficulty level.\n3. Provide a concise, accurate answer without directly quoting the source\n4. If the answer is not found in the context, respond with "Answer not found in the uploaded documents."`;

    if (groqKey) {
      const resp = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You answer questions strictly using provided context. Do not hallucinate." },
            { role: "user", content: instruction },
          ],
          max_tokens: 2000,
        },
        { headers: { Authorization: `Bearer ${groqKey}` } }
      );

      const text = resp.data?.choices?.[0]?.message?.content;
      if (text) return text;
    }

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
      const modelsToTry = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash", "gemini-2.5-flash-lite"];
      let lastError: any;

      for (const model of modelsToTry) {
        try {
          const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              contents: [
                {
                  parts: [{ text: instruction }],
                },
              ],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 8000,
              },
            }
          );

          const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        } catch (err: any) {
          lastError = err;
          if (err?.response?.status === 429) {
            console.warn(`[callLLM] Rate limit hit on ${model}, falling back to next model...`);
            continue;
          }
          // If not a rate limit, break and throw
          throw err;
        }
      }
      // If all models hit 429
      throw lastError;
    }

    return "Could not generate a response. Please try again.";
  } catch (err: any) {
    if (err?.response?.status === 429) {
      return "The AI API rate limit has been exceeded across all fallback models. Please wait 1 minute and try asking again.";
    }
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
  const groqKey = process.env.GROQ_API_KEY;

  console.log("MCQ Generation - API Keys check:");
  console.log("  Groq key present:", !!groqKey);
  console.log("  OpenAI key present:", !!openaiKey);
  console.log("  Gemini key present:", !!geminiKey);

  if (!openaiKey && !geminiKey && !groqKey) {
    console.error("No API keys configured. Set GROQ_API_KEY, GEMINI_API_KEY or OPENAI_API_KEY in backend/.env");
    throw new Error("No AI API key configured. Please set GROQ_API_KEY in your environment.");
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
    if (groqKey) {
      try {
        console.log("Using Groq for MCQ generation...");
        const resp = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: "You are an exam question generator. Return only valid JSON." },
              { role: "user", content: prompt },
            ],
            max_tokens: 4000,
            temperature: 0.5,
          },
          { headers: { Authorization: `Bearer ${groqKey}` } }
        );

        const raw = resp.data?.choices?.[0]?.message?.content || "[]";
        console.log("Groq response received, parsing JSON...");
        const cleaned = raw.trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "");
        return JSON.parse(cleaned);
      } catch (err: any) {
        if (err?.response?.status === 429 && (openaiKey || geminiKey)) {
          console.warn("Groq rate limit exceeded, falling back...");
        } else {
          try {
            const raw = err.response?.data?.choices?.[0]?.message?.content || "[]";
            const match = raw.match(/\[[\s\S]*\]/);
            if (match) return JSON.parse(match[0]);
          } catch (e) { }
          throw err;
        }
      }
    }

    if (openaiKey) {
      try {
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
      } catch (err: any) {
        if (err?.response?.status === 429 && geminiKey) {
          console.warn("OpenAI rate limit exceeded, falling back to Gemini...");
          // Continue to Gemini block below
        } else {
          throw err;
        }
      }
    }

    if (geminiKey) {
      const modelsToTry = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash", "gemini-2.5-flash-lite"];
      let lastError: any;

      for (const model of modelsToTry) {
        try {
          console.log(`Using Gemini (${model}) for MCQ generation...`);
          const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 8000,
                responseMimeType: "application/json",
              },
            }
          );

          const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

          try {
            const cleaned = raw.trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "");
            return JSON.parse(cleaned);
          } catch (e) {
            const match = raw.match(/\[[\s\S]*\]/);
            if (match) {
              return JSON.parse(match[0]);
            }
            throw e;
          }
        } catch (err: any) {
          lastError = err;
          if (err?.response?.status === 429) {
            console.warn(`[MCQ] Rate limit hit on ${model}, falling back to next model...`);
            continue;
          }
          throw err;
        }
      }
      throw lastError;
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
