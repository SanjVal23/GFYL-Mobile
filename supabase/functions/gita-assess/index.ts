// Gita Warriors — POST /gita-assess
//
// Server-side proxy to Gemini's native audio understanding. Grades a
// recitation by having Gemini listen to the recording directly and judge it
// against the actual Sanskrit reference words.
//
// Previously this called Azure Pronunciation Assessment, but Azure has no
// Sanskrit locale — hi-IN (Hindi) was used as the closest proxy, and it
// fundamentally mis-transcribes Sanskrit phonemes it was never trained on.
// In practice that produced near-zero scores regardless of how correct the
// recitation actually was (confirmed live: consistent "retry" scores on
// verifiably correct recitation). Gemini judges the audio directly against
// the given reference words instead of forcing it through a mismatched
// speech-to-text pipeline, so there's no locale ceiling.
//
// Response shape is unchanged from the Azure version (AzurePronunciationResult
// in types/index.ts) so every downstream consumer — bucketAccuracy,
// distributeWordScoresToTiles, the coach prompt, attempt history — needed no
// changes.
//
// Deploy: supabase functions deploy gita-assess
// Secrets: supabase secrets set GEMINI_API_KEY=...

import { corsHeaders } from '../_shared/cors.ts';

interface AssessRequestBody {
  audioBase64: string;
  mimeType?: string;
  // Full Sanskrit words for a whole-shloka attempt, or single syllables for a
  // one-pada practice attempt — the client decides the granularity, this
  // function just scores whatever list it's given, in order.
  words: string[];
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    speechDetected: { type: 'BOOLEAN' },
    accuracyScore: { type: 'INTEGER' },
    fluencyScore: { type: 'INTEGER' },
    completenessScore: { type: 'INTEGER' },
    pronunciationScore: { type: 'INTEGER' },
    words: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          word: { type: 'STRING' },
          accuracyScore: { type: 'INTEGER' },
          errorType: { type: 'STRING', enum: ['None', 'Omission', 'Mispronunciation'] },
        },
        required: ['word', 'accuracyScore', 'errorType'],
      },
    },
  },
  required: [
    'speechDetected',
    'accuracyScore',
    'fluencyScore',
    'completenessScore',
    'pronunciationScore',
    'words',
  ],
};

function buildPrompt(units: string[]): string {
  return `You are an expert, encouraging judge of Sanskrit pronunciation. There is no dedicated Sanskrit speech-recognition model, so you are listening to the attached audio recording directly and judging it by ear.

The student was asked to say these Sanskrit sound-units, in this exact order (each may be a full word, or a single syllable fragment of a longer word — judge each purely as a sound to pronounce, not as a standalone dictionary word):
${units.map((w, i) => `${i + 1}. ${w}`).join('\n')}

For EACH of the ${units.length} sound-units above, in order, judge how closely the recording matches correct Sanskrit pronunciation of that specific sound. Focus on whether the core consonants, vowels, and retroflex/aspirated sounds (ṇ, ṣ, ṭ, dh, bh, etc.) are recognizable — not studio-perfect diction. This is a student learning Sanskrit, not a professional reciter, so be generous with natural pacing and minor accent variation. Only score a unit low if it is genuinely missing or clearly mispronounced.

If you cannot hear any speech at all in the recording (silence, noise only, or an unrelated sound), set "speechDetected" to false, set every unit's accuracyScore to 0 and errorType to "Omission", and set the overall scores to 0.

Respond ONLY with JSON, no markdown, exactly this shape:
{
  "speechDetected": <boolean>,
  "accuracyScore": <integer 0-100, overall pronunciation accuracy across all units>,
  "fluencyScore": <integer 0-100, smoothness and rhythm of the recitation>,
  "completenessScore": <integer 0-100, whether all units were attempted, not skipped>,
  "pronunciationScore": <integer 0-100, overall composite score>,
  "words": [
    { "word": "<unit exactly as given above>", "accuracyScore": <integer 0-100>, "errorType": "<None|Omission|Mispronunciation>" }
  ]
}
The "words" array must have exactly ${units.length} entries, in the same order as the sound-units listed above, with "word" copied exactly as given.`;
}

// Gemini's inline audio input recognizes standard container/codec mime types
// (audio/wav, audio/mp3, audio/aac, audio/ogg, audio/flac) — the recorder
// reports 'audio/mp4' for its AAC/M4A capture, which isn't itself one of
// those, but the underlying codec is AAC, so declare it as such here.
function toGeminiAudioMimeType(mimeType: string | undefined): string {
  if (!mimeType) return 'audio/aac';
  if (mimeType === 'audio/mp4' || mimeType === 'audio/m4a' || mimeType === 'audio/x-m4a') return 'audio/aac';
  return mimeType;
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

    const body = (await req.json()) as AssessRequestBody;
    if (!body.audioBase64 || !body.words || body.words.length === 0) {
      return new Response(
        JSON.stringify({ error: 'bad_request', message: 'audioBase64 and a non-empty words array are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const words = body.words;

    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: buildPrompt(words) },
                { inlineData: { mimeType: toGeminiAudioMimeType(body.mimeType), data: body.audioBase64 } },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            // Judging fixed reference words against audio is plain
            // classification, not a task that benefits from extended
            // reasoning — disabling it cut ~80% of token usage in testing
            // with no drop in output quality.
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('gita-assess: Gemini call failed', geminiRes.status, errText);
      return new Response(
        JSON.stringify({ error: 'assessment_failed', message: 'Coach unavailable — try again.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiJson = await geminiRes.json();
    const text = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error('gita-assess: empty Gemini response', JSON.stringify(geminiJson));
      throw new Error('Empty Gemini response');
    }

    const parsed = JSON.parse(text) as {
      speechDetected: boolean;
      accuracyScore: number;
      fluencyScore: number;
      completenessScore: number;
      pronunciationScore: number;
      words: { word: string; accuracyScore: number; errorType: string }[];
    };

    if (!parsed.speechDetected) {
      return new Response(
        JSON.stringify({ error: 'no_speech', message: "We didn't hear anything — check your microphone." }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = {
      accuracyScore: parsed.accuracyScore,
      fluencyScore: parsed.fluencyScore,
      completenessScore: parsed.completenessScore,
      pronunciationScore: parsed.pronunciationScore,
      words: parsed.words,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('gita-assess error', error);
    return new Response(
      JSON.stringify({ error: 'assessment_failed', message: 'Coach unavailable — try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
