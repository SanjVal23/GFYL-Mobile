const readEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    console.warn(`[config] Missing environment variable: ${name}`);
    return '';
  }
  return value;
};

export const config = {
  geminiApiKey: readEnv('EXPO_PUBLIC_GEMINI_API_KEY'),
  supabaseUrl: readEnv('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
};
