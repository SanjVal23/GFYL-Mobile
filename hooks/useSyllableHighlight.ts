import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { Shloka } from '../types';
import { computeSyllableTimeline, getPadaTimeWindow, SyllableTimelineEntry } from '../services/gitaCoachService';

export type PlaybackSpeed = 1 | 0.75 | 0.5;

export interface ActiveSyllable {
  padaIndex: number;
  syllableIndex: number;
}

/** Drives reference-audio playback for a shloka and tracks which syllable
 * tile is "active" right now, so the pronunciation guide can highlight in
 * sync as the recording plays. Shared by the freeform coach screen (full
 * playback) and the practice screen (per-pada segment playback). */
export function useSyllableHighlight(shloka: Shloka, audioSource: number | null) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const timelineRef = useRef<SyllableTimelineEntry[]>([]);
  const segmentEndRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeedState] = useState<PlaybackSpeed>(1);
  const [activeSyllable, setActiveSyllable] = useState<ActiveSyllable | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  useEffect(() => {
    soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
    segmentEndRef.current = null;
    timelineRef.current = [];
    setIsPlaying(false);
    setActiveSyllable(null);
  }, [shloka.id]);

  const findActiveSyllable = useCallback((positionMillis: number): ActiveSyllable | null => {
    const entry = timelineRef.current.find((e) => positionMillis >= e.startMs && positionMillis < e.endMs);
    return entry ? { padaIndex: entry.padaIndex, syllableIndex: entry.syllableIndex } : null;
  }, []);

  const ensureLoaded = useCallback(async (): Promise<Audio.Sound | null> => {
    if (!audioSource) return null;
    if (soundRef.current) return soundRef.current;

    const { sound, status } = await Audio.Sound.createAsync(audioSource, {
      shouldPlay: false,
      rate: speed,
      shouldCorrectPitch: true,
    });
    soundRef.current = sound;
    await sound.setProgressUpdateIntervalAsync(100);

    if (status.isLoaded && status.durationMillis) {
      timelineRef.current = computeSyllableTimeline(shloka, status.durationMillis);
    }

    sound.setOnPlaybackStatusUpdate((s) => {
      if (!s.isLoaded) return;

      setActiveSyllable(findActiveSyllable(s.positionMillis));

      if (segmentEndRef.current != null && s.positionMillis >= segmentEndRef.current) {
        segmentEndRef.current = null;
        sound.pauseAsync().catch(() => {});
        setIsPlaying(false);
        return;
      }

      if (s.didJustFinish) {
        setIsPlaying(false);
        setActiveSyllable(null);
      }
    });

    return sound;
  }, [audioSource, shloka, speed, findActiveSyllable]);

  const play = useCallback(async () => {
    const sound = await ensureLoaded();
    if (!sound) return;
    segmentEndRef.current = null;
    await sound.setPositionAsync(0);
    await sound.playAsync();
    setIsPlaying(true);
  }, [ensureLoaded]);

  const playSegment = useCallback(
    async (padaIndices: number[]) => {
      const sound = await ensureLoaded();
      if (!sound) return;
      const window = getPadaTimeWindow(timelineRef.current, padaIndices);
      if (!window) return;
      segmentEndRef.current = window.endMs;
      await sound.setPositionAsync(window.startMs);
      await sound.playAsync();
      setIsPlaying(true);
    },
    [ensureLoaded]
  );

  /** Plays just one syllable tile's slice of the reference audio — tap-to-hear
   * on a tile, or on a tile the coach flagged as missed/wrong so the student
   * can hear what it should have sounded like. Uses the same approximate,
   * character-length-weighted timeline as playSegment, so very short
   * syllables get a correspondingly short (sometimes clipped) slice. */
  const playSyllable = useCallback(
    async (padaIndex: number, syllableIndex: number) => {
      const sound = await ensureLoaded();
      if (!sound) return;
      const entry = timelineRef.current.find(
        (e) => e.padaIndex === padaIndex && e.syllableIndex === syllableIndex
      );
      if (!entry) return;
      segmentEndRef.current = entry.endMs;
      await sound.setPositionAsync(entry.startMs);
      await sound.playAsync();
      setIsPlaying(true);
    },
    [ensureLoaded]
  );

  const pause = useCallback(async () => {
    await soundRef.current?.pauseAsync().catch(() => {});
    setIsPlaying(false);
  }, []);

  const setSpeed = useCallback(
    async (next: PlaybackSpeed) => {
      setSpeedState(next);
      if (soundRef.current && isPlaying) {
        await soundRef.current.setRateAsync(next, true);
      }
    },
    [isPlaying]
  );

  return { isPlaying, activeSyllable, speed, play, playSegment, playSyllable, pause, setSpeed };
}
