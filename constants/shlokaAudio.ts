// Local audio registry for Gita Warriors — bundled directly into the app so
// playback works with zero backend setup. shlokas.json's audioUrl stays null;
// this map is additive and can be swapped for remote (Supabase Storage) URLs
// later without touching the JSON schema. Metro requires require() to see a
// static string literal, so this can't be built dynamically from the JSON id.
export const shlokaAudioAssets: Partial<Record<string, number>> = {
  'bg-2-47': require('../assets/audio/bg-2-47.mp3'),
};
