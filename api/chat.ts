import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// This is the serverless function that will be executed by Vercel
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  // The API key is securely accessed from environment variables on the server
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: "API key is not configured." });
  }

  // Initialize the AI client *inside the function*
  const ai = new GoogleGenAI({ apiKey });

  const { userMessage, chatHistory, systemInstruction } = request.body;
  
  // Map frontend sender roles to Gemini API roles for chat history
  const formattedHistory = chatHistory.map((message: { sender: 'user' | 'bot', text: string }) => ({
    role: message.sender === 'user' ? 'user' : 'model',
    parts: [{ text: message.text }],
  }));

  try {
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: formattedHistory,
        config: {
            systemInstruction: systemInstruction,
        },
    });
    
    const modelResponse = await chat.sendMessage({ message: userMessage });

    const text = modelResponse.text.trim();
    return response.status(200).json({ text });

  } catch (error) {
    console.error("Error from Gemini API:", error);
    return response.status(500).json({ error: "An error occurred while generating a response." });
  }
}
