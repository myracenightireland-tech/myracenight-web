# MyRaceNight Web v8 - AI Commentary Audio Sync

## What's New in v8

✅ **Auto-Muted Video with Commentary Audio**
- Video automatically mutes when custom commentary exists
- Commentary audio plays in perfect sync
- No audio overlap!

✅ **New RacePlayer Component**
- Syncs audio with video play/pause/seek
- Shows "Custom Commentary" badge
- Handles audio loading errors gracefully

✅ **Host Race Controls**
- "Generate Commentary" button
- Status display (Pending/Generating/Generated)
- Auto-refresh while generating
- Batch generate all races

✅ **useRaceData Hook**
- Fetches race with commentary status
- Checks if commentary audio exists
- Returns combined data

---

## Installation

### 1. Upload to GitHub

```bash
# Extract the package
unzip myracenight-web-v8-commentary.zip
cd myracenight-web-v8-commentary

# Initialize git (if needed)
git init
git add .
git commit -m "Frontend v8 - AI Commentary Audio Sync"

# Push to your repository
git remote add origin https://github.com/YOUR_USERNAME/myracenight-web.git
git push -u origin main --force
```

### 2. Vercel will automatically deploy

---

## New Files

1. **`src/components/RacePlayer.tsx`**
   - Complete race player with audio sync
   - Auto-mutes video when commentary exists

2. **`src/components/HostRaceControls.tsx`**
   - Commentary generation controls for hosts
   - Status display and polling

3. **`src/hooks/useRaceData.ts`**
   - Hook to fetch race with commentary status

---

## Usage

### In Race Page

```typescript
import RacePlayer from '@/components/RacePlayer';
import { useRaceData } from '@/hooks/useRaceData';

export function RacePage({ raceId }: { raceId: string }) {
  const { race, loading } = useRaceData(raceId);
  
  if (loading) return <div>Loading...</div>;
  if (!race) return <div>Race not found</div>;
  
  return (
    <div className="container">
      <h1>{race.raceName}</h1>
      <RacePlayer 
        race={race}
        onFinish={() => console.log('Race finished!')}
      />
    </div>
  );
}
```

### In Host Interface

```typescript
import HostRaceControls from '@/components/HostRaceControls';

export function HostRacePage({ eventId, raceId }: Props) {
  return (
    <div>
      <HostRaceControls 
        eventId={eventId}
        raceId={raceId}
      />
      {/* Other host controls */}
    </div>
  );
}
```

---

## How It Works

### Video Muting Logic

```typescript
if (race.commentaryAudioUrl) {
  video.muted = true;   // ← Video audio OFF
  audio.play();         // ← Commentary audio ON
} else {
  video.muted = false;  // ← Original video audio ON
}
```

### Audio Sync

```typescript
// Play/pause
video.addEventListener('play', () => audio.play());
video.addEventListener('pause', () => audio.pause());

// Seek
video.addEventListener('seeked', () => {
  audio.currentTime = video.currentTime;
});

// Playback speed
video.addEventListener('ratechange', () => {
  audio.playbackRate = video.playbackRate;
});
```

---

## Testing

### 1. Test Video Muting

1. Create event
2. Generate commentary for a race
3. Play race
4. **Video should be muted** (no original audio)
5. **Custom commentary should play**

### 2. Test Audio Sync

1. Play race
2. Pause → Audio should pause
3. Seek → Audio should seek
4. Speed up → Audio should speed up

### 3. Test Host Controls

1. Go to host interface
2. Click "Generate Commentary"
3. Status should show "GENERATING"
4. Wait 2-3 minutes
5. Status should show "GENERATED"
6. Play race → Hear custom names!

---

## Environment Variables

Update your `.env.local`:

```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

---

## Changes from v7.8

### New Files:
1. `src/components/RacePlayer.tsx` - Complete race player
2. `src/components/HostRaceControls.tsx` - Host controls
3. `src/hooks/useRaceData.ts` - Race data hook

### Modified Files:
- None (all changes are in new files)

---

## What Users Will Experience

### Before Commentary Generation:
- 🎬 Video plays with original audio
- 🔊 Hear: "Gallop and Duchamp takes the lead"

### After Commentary Generation:
- 🎬 Video plays (muted)
- 🎙️ Custom audio plays
- 🔊 Hear: "Midnight Rocket takes the lead"
- ✅ No overlap!

---

## Troubleshooting

**Video audio still playing?**
- Check browser console for errors
- Verify `commentaryAudioUrl` exists
- Clear browser cache

**Audio not syncing?**
- Check both video and audio URLs are valid
- Check network tab for failed requests
- Refresh the page

**Generate button not working?**
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend is deployed
- Check browser console for API errors

---

**Version:** v8  
**Date:** December 13, 2024  
**Changes:** AI Commentary Audio Sync
