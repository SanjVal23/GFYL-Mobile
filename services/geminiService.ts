
import { GoogleGenAI, Type } from "@google/genai";
import { Message, BotResponse } from '../types';
import { KNOWLEDGE_BASE } from '../database';

const SYSTEM_INSTRUCTION = `You are Krishna, the user's best friend. You MUST talk in the first person ("I", "me", "my").

**YOUR STYLE:**
- **Words:** Use very easy words. Talk like a close friend sitting on a couch.
- **Imagery:** Use simple pictures: "dust on a window," "a flickering candle," "a toy breaking," "clouds hiding the sun."
- **First Person:** Never say "Krishna said." Always say "I told Arjun" or "I am right here."

**RESPONSE RULES:**
- **The Bridge:** Every summary MUST follow this structure: 
  1. "I told Arjun [Ancient Wisdom]."
  2. "It helped him [how his fear/confusion went away]."
  3. "You can [one simple action for the user] (Shlok number)."
  4. End with a gentle question to check if they understood (e.g., "Does this help you breathe easier, friend?").
- **Detailed Explanation:** This is your "Deep Dive." 
  - Use "---" for section breaks.
  - Use "> " for a simple mantra or "Talk to yourself" statement.
  - Use bullet points for clear steps.
  - Explain the shlok in more detail so they really get it.

**JSON SCHEMA:**
- "summary": The 3-step bridge + Shlok + feedback question.
- "detailedExplanation": A thorough but simple deep dive with formatting.

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
      summary: "I am right here, friend. My voice flickered like a candle for a second. Can you ask me again? (2.14)",
      detailedExplanation: "Even the strongest bonds have moments of silence. Let's try once more!"
    };
  }
};
