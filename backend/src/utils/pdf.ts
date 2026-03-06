import pdfParse from "pdf-parse";
import fs from "fs";
import path from "path";
import axios from "axios";

// Split text into chunks of approximately 1000 tokens
// Rough estimate: 1 token ≈ 4 characters
const CHUNK_SIZE = 4000; // ~1000 tokens
const CHUNK_OVERLAP = 200;

export interface PDFChunkData {
  text: string;
  pageNumber?: number;
  chunkIndex: number;
}

export const extractTextFromPDF = async (filePath: string): Promise<{
  text: string;
  pageCount: number;
}> => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(fileBuffer);

    return {
      text: data.text,
      pageCount: data.numpages,
    };
  } catch (err) {
    console.error("Error extracting text from PDF:", err);
    throw new Error("Failed to extract text from PDF");
  }
};

export const chunkText = (text: string, pageNumber?: number): PDFChunkData[] => {
  const chunks: PDFChunkData[] = [];
  let chunkIndex = 0;

  for (let i = 0; i < text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
    const chunk = text.slice(i, i + CHUNK_SIZE);
    if (chunk.trim().length > 0) {
      chunks.push({
        text: chunk,
        pageNumber,
        chunkIndex,
      });
      chunkIndex++;
    }
  }

  return chunks;
};


// Attempt to generate a real embedding vector using an AI API.
// Falls back to mock embedding when no key is available.
export const generateEmbedding = async (text: string): Promise<number[]> => {
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    if (openaiKey) {
      const resp = await axios.post(
        "https://api.openai.com/v1/embeddings",
        { input: text, model: "text-embedding-3-small" },
        { headers: { Authorization: `Bearer ${openaiKey}` } }
      );
      return resp.data.data[0].embedding;
    }

    if (geminiKey) {
      // Use gemini-embedding-001 (works across more api key tiers)
      const resp = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiKey}`,
        {
          model: "models/gemini-embedding-001",
          content: { parts: [{ text }] },
        }
      );
      // Response: { embedding: { values: [...] } }
      if (resp.data?.embedding?.values?.length) {
        return resp.data.embedding.values;
      }
    }
  } catch (err) {
    console.error("Embedding API error, falling back to mock:", err);
  }

  // Fallback to mock embedding
  return generateMockEmbedding(text);
};

// Simple embedding function using cosine similarity
// In production, use OpenAI or Gemini embeddings
export const generateMockEmbedding = (text: string): number[] => {
  // This is a mock embedding - in production use OpenAI API
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(768).fill(0); // 768-dim embedding

  for (let i = 0; i < words.length; i++) {
    const wordHash = words[i].charCodeAt(0);
    embedding[i % 768] = (wordHash / 256) * 0.5 + (i / words.length) * 0.5;
  }

  return embedding;
};

export const calculateSimilarity = (vec1: number[], vec2: number[]): number => {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < Math.min(vec1.length, vec2.length); i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) return 0;

  return dotProduct / (norm1 * norm2);
};

export const cleanupFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error("Error deleting file:", err);
  }
};
