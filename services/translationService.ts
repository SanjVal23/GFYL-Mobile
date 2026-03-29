import { config } from '../config';

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  if (!text || targetLanguage === 'English') return text;

  const systemInstruction = `You are a translation engine. Translate the user's text into ${targetLanguage}. Return ONLY the translated text with no extra commentary.`;

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'text/plain',
        },
      }),
    }
  );

  const data = await response.json();
  const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return translated || text;
};
