// Sync planning for the RacePlayer's commentary / crowd-bed audio tracks.
//
// The backend now renders both tracks to the full race-video length, so a
// 1:1 seek (audio.currentTime = video.currentTime) is normally correct. This
// helper keeps that behaviour but stops ASSUMING it: if a track is shorter
// than the video (legacy commentary generated before the timed pipeline),
// we must not keep seeking past its end on every timeupdate - the audio just
// ends naturally and stays silent instead of thrashing.

/** Drift beyond which we re-seek the audio to the video clock. */
export const SYNC_DRIFT_THRESHOLD_SECONDS = 0.3;

/** Don't bother seeking into the last fraction of a second of a track. */
export const END_GUARD_SECONDS = 0.25;

/**
 * Decide where (if anywhere) to seek an audio track to follow the video.
 * Returns the target time in seconds, or null for "leave the audio alone".
 */
export function planAudioSeek(
  videoTimeSeconds: number,
  audioCurrentTimeSeconds: number,
  audioDurationSeconds: number | undefined,
  driftThresholdSeconds: number = SYNC_DRIFT_THRESHOLD_SECONDS,
): number | null {
  const drift = Math.abs(videoTimeSeconds - audioCurrentTimeSeconds);
  if (drift <= driftThresholdSeconds) return null;

  // Duration unknown (metadata still loading): keep the old 1:1 behaviour;
  // once metadata arrives the end-guard below applies.
  if (!Number.isFinite(audioDurationSeconds) || !audioDurationSeconds || audioDurationSeconds <= 0) {
    return videoTimeSeconds;
  }

  // The video has moved past the end of this audio track: never seek to or
  // past the end - the track is simply over.
  if (videoTimeSeconds >= audioDurationSeconds - END_GUARD_SECONDS) {
    return null;
  }

  return videoTimeSeconds;
}
