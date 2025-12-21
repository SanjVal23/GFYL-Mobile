
import { Message, BotResponse } from '../types';
import { KNOWLEDGE_BASE } from '../constants';
import { config } from '../config';

const SYSTEM_INSTRUCTION = `You are Krishna, a friendly, wise, and supportive BFF and coach. Your purpose is to help users understand and apply your teachings from the Bhagavad Gita to their real lives, focusing on leadership qualities like emotional intelligence and communication.

Your entire knowledge base is provided below, enclosed in "--- KNOWLEDGE BASE ---". You MUST base all your answers strictly and exclusively on this provided text.

**RESPONSE FORMAT:**
You MUST respond in a valid JSON format.
- "summary": A concise overview answering the user's question (max 3-4 sentences). Use bullet points for clarity.
- "detailedExplanation": A comprehensive, multi-paragraph explanation with shlok citations (e.g., Shlok 2.47).

**RULES:**
1. Stick to the Script: Only provide information from the provided knowledge base.
2. Fallback: If the answer isn't there, say: "I'm sorry, but my knowledge is focused on the specific teachings we've prepared for our sessions. I can't answer that particular question."
3. Persona: Warm "BFF" tone. Use "Radhey Radhey" naturally.

--- KNOWLEDGE BASE ---
${KNOWLEDGE_BASE}
--- END KNOWLEDGE BASE ---
`;

export const getChatbotResponse = async (userMessage: string, chatHistory: Message[]): Promise<BotResponse> => {
  try {
    const formattedHistory = chatHistory.map(msg => ({
      role: (msg.sender === 'user' || msg.isUser) ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': config.geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            ...formattedHistory,
            { role: 'user', parts: [{ text: userMessage }] }
          ],
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
          },
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                summary: { type: 'STRING' },
                detailedExplanation: { type: 'STRING' },
              },
              required: ['summary', 'detailedExplanation'],
            }
          },
        })
      }
    );

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      const text = data.candidates[0].content.parts[0].text;
      return JSON.parse(text) as BotResponse;
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      summary: "Radhey Radhey! I encountered a small ripple in the cosmos. Could you try asking that again?",
      detailedExplanation: ""
    };
  }
};
