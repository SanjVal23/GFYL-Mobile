import { useCallback, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { File } from 'expo-file-system';

export type MicErrorKind = 'permission_denied' | 'record_failed';

// Cross-platform AAC/M4A preset — reliable on both iOS and Android via
// expo-av's MediaRecorder-backed Android implementation, which does not
// support raw WAV/PCM capture. See the codec note in
// supabase/functions/gita-assess/index.ts.
const RECORDING_OPTIONS: Audio.RecordingOptions = Audio.RecordingOptionsPresets.HIGH_QUALITY;
const RECORDING_MIME_TYPE = 'audio/mp4';

export function useShlokaRecorder() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const start = useCallback(async (): Promise<
    { ok: true } | { ok: false; kind: MicErrorKind }
  > => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        return { ok: false, kind: 'permission_denied' };
      }

      // expo-av only allows one prepared Recording object at a time. A stale
      // instance can survive a JS reload (Fast Refresh doesn't tear down the
      // native side), so defensively clear it before preparing a new one —
      // otherwise createAsync throws "Only one Recording object can be
      // prepared at a given time."
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {
          // already unloaded — nothing to clean up
        }
        recordingRef.current = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
      recordingRef.current = recording;
      setIsRecording(true);
      return { ok: true };
    } catch (error) {
      console.error('Failed to start recording', error);
      return { ok: false, kind: 'record_failed' };
    }
  }, []);

  const stop = useCallback(async (): Promise<{ base64: string; mimeType: string } | null> => {
    const recording = recordingRef.current;
    setIsRecording(false);
    if (!recording) return null;

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      recordingRef.current = null;

      const uri = recording.getURI();
      if (!uri) return null;

      const file = new File(uri);
      const base64 = await file.base64();
      return { base64, mimeType: RECORDING_MIME_TYPE };
    } catch (error) {
      console.error('Failed to stop/read recording', error);
      recordingRef.current = null;
      return null;
    }
  }, []);

  const cancel = useCallback(async () => {
    const recording = recordingRef.current;
    setIsRecording(false);
    recordingRef.current = null;
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch {
        // already unloaded — nothing to clean up
      }
    }
  }, []);

  return { isRecording, start, stop, cancel };
}
