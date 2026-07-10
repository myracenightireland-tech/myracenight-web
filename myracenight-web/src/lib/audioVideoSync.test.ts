import { describe, it, expect } from 'vitest';
import { planAudioSeek } from './audioVideoSync';

describe('planAudioSeek', () => {
  it('re-seeks a full-length track to the video clock when drift exceeds the threshold', () => {
    // Backend now renders the track to the full race length, so 1:1 is correct
    expect(planAudioSeek(120, 118, 305)).toBe(120);
  });

  it('leaves the audio alone within the drift threshold', () => {
    expect(planAudioSeek(120, 119.9, 305)).toBeNull();
  });

  it('does NOT assume 1:1 length: never seeks past the end of a shorter track', () => {
    // Legacy 30s commentary against a 305s video: at 60s of video the old
    // code re-seeked past the end on every timeupdate. Now: leave it ended.
    expect(planAudioSeek(60, 30, 30)).toBeNull();
    expect(planAudioSeek(304, 29, 30)).toBeNull();
    // Right at the end guard boundary too
    expect(planAudioSeek(29.9, 5, 30)).toBeNull();
  });

  it('still seeks WITHIN a shorter track (e.g. user scrubbed backwards)', () => {
    expect(planAudioSeek(10, 25, 30)).toBe(10);
  });

  it('falls back to 1:1 while the duration is unknown', () => {
    expect(planAudioSeek(12, 0, undefined)).toBe(12);
    expect(planAudioSeek(12, 0, NaN)).toBe(12);
    expect(planAudioSeek(12, 0, 0)).toBe(12);
  });
});
