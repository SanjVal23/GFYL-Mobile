// Gita Warriors — POST /gita-coach
//
// Server-side proxy to Gemini. Turns Azure's raw phoneme/word scores into
// warm, plain-English coaching feedback using the Appendix A prompt template
// from the Gita Warriors developer handoff. Keeps GEMINI_API_KEY off the
// device — the app only ever calls this function via supabase.functions.invoke.
//
// Deploy: supabase functions deploy gita-coach
// Secrets: supabase secrets set GEMINI_API_KEY=...

import { corsHeaders } from '../_shared/cors.ts';

interface CoachRequestBody {
  shlokaReference: string;
  romanText: string;
  azureScores: unknown;
  rules: unknown;
  ageGroup?: string;
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    score: { type: 'INTEGER' },
    scoreLabel: { type: 'STRING', enum: ['Excellent', 'Good Job', 'Keep Going'] },
    title: { type: 'STRING' },
    summary: { type: 'STRING' },
    strength: { type: 'STRING' },
    improve: { type: 'STRING' },
    tip: { type: 'STRING' },
    wordFeedback: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          word: { type: 'STRING' },
          status: { type: 'STRING', enum: ['correct', 'close', 'retry'] },
          note: { type: 'STRING' },
        },
        required: ['word', 'status', 'note'],
      },
    },
  },
  required: ['score', 'scoreLabel', 'title', 'summary', 'strength', 'improve', 'tip', 'wordFeedback'],
};

function buildPrompt(body: CoachRequestBody): string {
  return `You are a kind, encouraging pronunciation coach for students aged ${body.ageGroup ?? '10-18'} learning Sanskrit shlokas from the Bhagavad Gita.

The student attempted:
Reference: ${body.shlokaReference}
Correct text: ${body.romanText}

Azure phoneme scores: ${JSON.stringify(body.azureScores)}
Pronunciation rules: ${JSON.stringify(body.rules)}

Respond ONLY with valid JSON. No preamble. No markdown. Exactly this format:
{
  "score": <integer 0-100>,
  "scoreLabel": "<Excellent | Good Job | Keep Going>",
  "title": "<one encouraging sentence, max 10 words>",
  "summary": "<one sentence on overall performance>",
  "strength": "<1-2 sentences: what they got right — name specific sounds>",
  "improve": "<1-2 sentences: single most important fix — be specific>",
  "tip": "<one memory trick for the hardest sound in this shloka>",
  "wordFeedback": [
    { "word": "<Sanskrit word>", "status": "<correct | close | retry>", "note": "<3-5 words>" }
  ]
}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: 'not_configured', message: 'Gemini credentials are not set on the server.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = (await req.json()) as CoachRequestBody;
    if (!body.shlokaReference || !body.romanText || !body.azureScores) {
      return new Response(
        JSON.stringify({ error: 'bad_request', message: 'shlokaReference, romanText and azureScores are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: buildPrompt(body) }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            // See gita-assess for why this is disabled: this is short-form
            // structured writing, not a reasoning task — cuts ~80% of token
            // usage with no drop in output quality.
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini coaching call failed', geminiRes.status, errText);
      return new Response(
        JSON.stringify({ error: 'coach_failed', message: 'Coach unavailable — try again.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiJson = await geminiRes.json();
    const text = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty Gemini response');
    }

    const feedback = JSON.parse(text);

    return new Response(JSON.stringify(feedback), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('gita-coach error', error);
    return new Response(
      JSON.stringify({ error: 'coach_failed', message: 'Coach unavailable — try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
