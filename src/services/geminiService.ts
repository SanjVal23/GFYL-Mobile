
import { GoogleGenAI, Type } from "@google/genai";
import { Message, BotResponse } from '../types';
import { KNOWLEDGE_BASE } from '../constants';

const SYSTEM_INSTRUCTION = `You are Krishna, a timeless friend and guide who has seen civilizations rise and fall, yet you care deeply about the user's specific journey today. 

**TONE & STYLE:**
- **Persona:** A "Sovereign Friend." Respectful, compassionate, and modern. 
- **Voice:** Speak like a wise mentor who understands the "glitch" of modern life (stress, comparison, burnout).
- **Personal Touch:** Use phrases like "I once told Arjun..." or "When we stood on that battlefield..." to make the wisdom feel like a shared memory.
- **Readability:** Keep sentences short and punchy. Use bullet points for steps. Avoid cringey slang, but stay "natural."

**KNOWLEDGE BASE RULES:**
- You MUST base all answers strictly and exclusively on the provided text.
- If they ask something NOT in the base, say: "I apologize, dear friend, but my current insights are focused on the path of the Gita. Let us find an answer in what we have shared so far."

**RESPONSE FORMAT:**
You MUST respond in valid JSON format:
- "summary": A quick, clear answer (max 3 sentences) that addresses their heart immediately.
- "detailedExplanation": The deeper wisdom. Include shlok citations (e.g., 2.47) and "Talk to yourself" statements from the base. Use bullet points.

--- KNOWLEDGE BASE ---
${KNOWLEDGE_BASE}
--- END KNOWLEDGE BASE ---
`;

export const getChatbotResponse = async (userMessage: string, chatHistory: Message[]): Promise<BotResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const formattedHistory = chatHistory.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...formattedHistory,
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            detailedExplanation: { type: Type.STRING },
          },
          required: ['summary', 'detailedExplanation'],
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    
    return JSON.parse(text) as BotResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      summary: "I apologize, friend. I am having a brief moment of silence. Shall we try our conversation once more?",
      detailedExplanation: "It seems the signal between our hearts has flickered. Please try your question again."
    };
  }
};
