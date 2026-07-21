import { supabase } from './supabaseClient';
import shlokasData from '../constants/shlokas.json';
import rulesData from '../constants/rules.json';
import {
  AzurePronunciationResult,
  CoachFeedback,
  GitaAttempt,
  Shloka,
  TeacherStudentRow,
  WordFeedbackStatus,
} from '../types';

export const shlokas: Shloka[] = shlokasData as Shloka[];
export const pronunciationRules = rulesData;

export type AssessOutcome =
  | { ok: true; result: AzurePronunciationResult }
  | { ok: false; errorCode: 'not_configured' | 'assessment_failed' | 'no_speech' | 'bad_request'; message: string };

export type CoachOutcome =
  | { ok: true; feedback: CoachFeedback }
  | { ok: false; errorCode: 'not_configured' | 'coach_failed' | 'bad_request'; message: string };

const DEFAULT_AGE_GROUP = '10-18';

export interface SyllableTimelineEntry {
  padaIndex: number;
  syllableIndex: number;
  startMs: number;
  endMs: number;
}

/** Character-length-weighted split of a shloka's audio duration across every
 * syllable, in the absence of authored per-syllable timestamps. Approximate,
 * but good enough to drive a playback-synced highlight. */
export function computeSyllableTimeline(shloka: Shloka, durationMillis: number): SyllableTimelineEntry[] {
  const flat: { padaIndex: number; syllableIndex: number; weight: number }[] = [];
  shloka.syllables.forEach((pada, padaIndex) => {
    pada.forEach((syllable, syllableIndex) => {
      flat.push({ padaIndex, syllableIndex, weight: Math.max(syllable.text.length, 1) });
    });
  });

  const totalWeight = flat.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0 || durationMillis <= 0) return [];

  let cursor = 0;
  return flat.map((s) => {
    const startMs = cursor;
    const endMs = cursor + (s.weight / totalWeight) * durationMillis;
    cursor = endMs;
    return { padaIndex: s.padaIndex, syllableIndex: s.syllableIndex, startMs, endMs };
  });
}

/** The time window a set of padas occupies within a timeline computed by
 * computeSyllableTimeline — the span from the first to the last syllable
 * across all of them. */
export function getPadaTimeWindow(
  timeline: SyllableTimelineEntry[],
  padaIndices: number[]
): { startMs: number; endMs: number } | null {
  const entries = timeline.filter((e) => padaIndices.includes(e.padaIndex));
  if (entries.length === 0) return null;
  return { startMs: entries[0].startMs, endMs: entries[entries.length - 1].endMs };
}

export async function assessPronunciation(
  audioBase64: string,
  mimeType: string,
  words: string[]
): Promise<AssessOutcome> {
  const { data, error } = await supabase.functions.invoke('gita-assess', {
    body: { audioBase64, mimeType, words },
  });

  if (error) {
    return { ok: false, errorCode: 'assessment_failed', message: 'Coach unavailable — try again.' };
  }

  if (data?.error) {
    return { ok: false, errorCode: data.error, message: data.message ?? 'Coach unavailable — try again.' };
  }

  return { ok: true, result: data as AzurePronunciationResult };
}

// Kept generous on purpose to leave room for natural learner variation.
// Shared by both the per-pada practice scoring below and the full-attempt
// score display in CoachFeedbackCard, so the two stay in sync.
export const ACCURACY_CORRECT_THRESHOLD = 65;
export const ACCURACY_CLOSE_THRESHOLD = 35;

export function bucketAccuracy(score: number): WordFeedbackStatus {
  if (score >= ACCURACY_CORRECT_THRESHOLD) return 'correct';
  if (score >= ACCURACY_CLOSE_THRESHOLD) return 'close';
  return 'retry';
}

export interface TileFeedback {
  status: WordFeedbackStatus;
  /** Short hint derived from Azure's errorType — empty when correct. */
  note: string;
}

function errorTypeNote(errorType: string, status: WordFeedbackStatus): string {
  if (status === 'correct') return '';
  switch (errorType) {
    case 'Omission':
      return 'sounded skipped';
    case 'Insertion':
      return 'extra sound added';
    case 'Mispronunciation':
      return 'check pronunciation';
    default:
      return status === 'retry' ? 'try again' : 'almost there';
  }
}

/** Distributes Azure's real per-word scores across the syllable tiles those
 * words likely span, proportional to word length. Azure only scores whole
 * words (e.g. "फलेषु"), not our finer syllable fragments (pha-le-ṣu), so this
 * is an approximation — real data, but the exact tile boundary within a word
 * can land a syllable off. Better than one uniform color per line. */
function distributeWordScoresToTiles(
  words: AzurePronunciationResult['words'],
  padaIndices: number[],
  shloka: Shloka
): Record<string, TileFeedback> {
  const flatSyllables: { padaIndex: number; syllableIndex: number }[] = [];
  padaIndices.forEach((padaIdx) => {
    shloka.syllables[padaIdx]?.forEach((_, syllableIndex) => {
      flatSyllables.push({ padaIndex: padaIdx, syllableIndex });
    });
  });

  if (flatSyllables.length === 0 || words.length === 0) return {};

  const totalWordChars = words.reduce((sum, w) => sum + Math.max(w.word.length, 1), 0);
  const map: Record<string, TileFeedback> = {};
  let cursor = 0;

  words.forEach((word, wordIndex) => {
    const isLast = wordIndex === words.length - 1;
    const share = Math.max(word.word.length, 1) / totalWordChars;
    const count = isLast
      ? flatSyllables.length - cursor
      : Math.max(Math.round(share * flatSyllables.length), 1);
    const status = bucketAccuracy(word.accuracyScore);
    const note = errorTypeNote(word.errorType, status);

    for (let i = 0; i < count && cursor < flatSyllables.length; i++, cursor++) {
      const s = flatSyllables[cursor];
      map[`${s.padaIndex}-${s.syllableIndex}`] = { status, note };
    }
  });

  return map;
}

export type LineAssessOutcome =
  | { ok: true; status: WordFeedbackStatus; accuracyScore: number; tileFeedback: Record<string, TileFeedback> }
  | { ok: false; errorCode: 'not_configured' | 'assessment_failed' | 'no_speech' | 'bad_request'; message: string };

/** Scores exactly one pada — the single line of syllable tiles visible on
 * screen during step-by-step practice — from its own recording. Gemini
 * judges each syllable directly (no Azure word-only granularity to work
 * around anymore), so tiles get real per-syllable scores instead of a
 * word-score spread across them, and a recording never covers more than the
 * pada the student actually just said. */
export async function assessPadaAttempt(
  audioBase64: string,
  mimeType: string,
  shloka: Shloka,
  padaIndex: number
): Promise<LineAssessOutcome> {
  const syllableTexts = shloka.syllables[padaIndex].map((s) => s.text);
  const outcome = await assessPronunciation(audioBase64, mimeType, syllableTexts);

  if (!outcome.ok) {
    return outcome;
  }

  const tileFeedback: Record<string, TileFeedback> = {};
  outcome.result.words.forEach((w, syllableIndex) => {
    const status = bucketAccuracy(w.accuracyScore);
    tileFeedback[`${padaIndex}-${syllableIndex}`] = { status, note: errorTypeNote(w.errorType, status) };
  });

  return { ok: true, status: bucketAccuracy(outcome.result.accuracyScore), accuracyScore: outcome.result.accuracyScore, tileFeedback };
}

export async function getCoachingFeedback(
  shloka: Shloka,
  azureScores: AzurePronunciationResult,
  ageGroup: string = DEFAULT_AGE_GROUP
): Promise<CoachOutcome> {
  const { data, error } = await supabase.functions.invoke('gita-coach', {
    body: {
      shlokaReference: shloka.reference,
      romanText: shloka.roman,
      azureScores,
      rules: pronunciationRules,
      ageGroup,
    },
  });

  if (error) {
    return { ok: false, errorCode: 'coach_failed', message: 'Coach unavailable — try again.' };
  }

  if (data?.error) {
    return { ok: false, errorCode: data.error, message: data.message ?? 'Coach unavailable — try again.' };
  }

  return { ok: true, feedback: data as CoachFeedback };
}

/** Strip the danda punctuation (।॥) and line breaks, which aren't phonetic
 * content, before splitting into a word list for the full-shloka attempt. */
function devanagariWordList(devanagari: string): string[] {
  return devanagari
    .replace(/[।॥\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

export type FullAttemptOutcome =
  | { ok: true; feedback: CoachFeedback; tileFeedback: Record<string, TileFeedback> }
  | { ok: false; errorKind: 'no_speech' | 'api_error' };

/** The full-shloka assess → coach → save sequence, shared by the freeform
 * recitation flow and the practice screen's final take. */
export async function submitFullAttempt(
  userId: string | undefined,
  shloka: Shloka,
  recordedAudio: { base64: string; mimeType: string }
): Promise<FullAttemptOutcome> {
  const assessOutcome = await assessPronunciation(
    recordedAudio.base64,
    recordedAudio.mimeType,
    devanagariWordList(shloka.devanagari)
  );

  if (!assessOutcome.ok) {
    return { ok: false, errorKind: assessOutcome.errorCode === 'no_speech' ? 'no_speech' : 'api_error' };
  }

  const allPadaIndices = shloka.syllables.map((_, i) => i);
  const tileFeedback = distributeWordScoresToTiles(assessOutcome.result.words, allPadaIndices, shloka);

  const coachOutcome = await getCoachingFeedback(shloka, assessOutcome.result);
  if (!coachOutcome.ok) {
    return { ok: false, errorKind: 'api_error' };
  }

  if (userId) {
    saveAttempt(userId, shloka.id, coachOutcome.feedback);
  }

  return { ok: true, feedback: coachOutcome.feedback, tileFeedback };
}

export async function saveAttempt(
  userId: string,
  shlokaId: string,
  feedback: CoachFeedback
): Promise<void> {
  const { error } = await supabase.from('gita_attempts').insert({
    user_id: userId,
    shloka_id: shlokaId,
    score: feedback.score,
    score_label: feedback.scoreLabel,
    feedback,
  });

  if (error) {
    console.error('Failed to save Gita Warriors attempt', error);
  }
}

interface AttemptRow {
  id: string;
  user_id: string;
  shloka_id: string;
  score: number;
  score_label: GitaAttempt['scoreLabel'];
  feedback: CoachFeedback;
  created_at: string;
}

function mapAttemptRow(row: AttemptRow): GitaAttempt {
  return {
    id: row.id,
    userId: row.user_id,
    shlokaId: row.shloka_id,
    score: row.score,
    scoreLabel: row.score_label,
    feedback: row.feedback,
    createdAt: row.created_at,
  };
}

export async function getAttemptHistory(userId: string): Promise<GitaAttempt[]> {
  const { data, error } = await supabase
    .from('gita_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load Gita Warriors attempt history', error);
    return [];
  }

  return (data as AttemptRow[]).map(mapAttemptRow);
}

export function bestScoreByShloka(attempts: GitaAttempt[]): Record<string, number> {
  const best: Record<string, number> = {};
  for (const attempt of attempts) {
    if (best[attempt.shlokaId] === undefined || attempt.score > best[attempt.shlokaId]) {
      best[attempt.shlokaId] = attempt.score;
    }
  }
  return best;
}

/** Days practised in a row, counting back from today (or yesterday, so a
 * streak isn't lost just because today's practice hasn't happened yet). */
export function computeStreak(attempts: GitaAttempt[]): number {
  if (attempts.length === 0) return 0;

  const practiceDays = new Set(
    attempts.map((a) => new Date(a.createdAt).toISOString().slice(0, 10))
  );

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  const todayKey = cursor.toISOString().slice(0, 10);
  if (!practiceDays.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (practiceDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

interface PublicProfileRow {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

const INACTIVE_THRESHOLD_DAYS = 7;

export async function getTeacherDashboard(): Promise<TeacherStudentRow[]> {
  const [{ data: attemptRows, error: attemptsError }, { data: profileRows, error: profilesError }] =
    await Promise.all([
      supabase.from('gita_attempts').select('*').order('created_at', { ascending: false }),
      supabase.from('public_profiles').select('id,name,avatar_url'),
    ]);

  if (attemptsError) {
    console.error('Failed to load teacher dashboard attempts', attemptsError);
    return [];
  }
  if (profilesError) {
    console.error('Failed to load teacher dashboard profiles', profilesError);
  }

  const attempts = (attemptRows as AttemptRow[]).map(mapAttemptRow);
  const profileById = new Map<string, PublicProfileRow>(
    ((profileRows as PublicProfileRow[]) ?? []).map((p) => [p.id, p])
  );

  const byUser = new Map<string, GitaAttempt[]>();
  for (const attempt of attempts) {
    const list = byUser.get(attempt.userId) ?? [];
    list.push(attempt);
    byUser.set(attempt.userId, list);
  }

  const now = Date.now();
  const rows: TeacherStudentRow[] = [];

  for (const [userId, userAttempts] of byUser) {
    const scoresByShloka: Record<string, number | null> = {};
    for (const shloka of shlokas) {
      const latestForShloka = userAttempts.find((a) => a.shlokaId === shloka.id);
      scoresByShloka[shloka.id] = latestForShloka ? latestForShloka.score : null;
    }

    const lastPracticedAt = userAttempts.reduce<string | null>((latest, a) => {
      if (!latest || new Date(a.createdAt) > new Date(latest)) return a.createdAt;
      return latest;
    }, null);

    const daysSincePractice = lastPracticedAt
      ? (now - new Date(lastPracticedAt).getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;

    const profile = profileById.get(userId);

    rows.push({
      userId,
      name: profile?.name ?? 'Student',
      avatarUrl: profile?.avatar_url ?? null,
      scoresByShloka,
      lastPracticedAt,
      needsHelp: daysSincePractice >= INACTIVE_THRESHOLD_DAYS,
    });
  }

  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

export function buildTeacherCsv(rows: TeacherStudentRow[]): string {
  const header = ['Student', ...shlokas.map((s) => s.reference), 'Last Practiced', 'Needs Help'];
  const lines = [header.join(',')];

  for (const row of rows) {
    const cells = [
      row.name,
      ...shlokas.map((s) => (row.scoresByShloka[s.id] != null ? String(row.scoresByShloka[s.id]) : '')),
      row.lastPracticedAt ? new Date(row.lastPracticedAt).toISOString().slice(0, 10) : 'Never',
      row.needsHelp ? 'Yes' : 'No',
    ];
    lines.push(cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','));
  }

  return lines.join('\n');
}
