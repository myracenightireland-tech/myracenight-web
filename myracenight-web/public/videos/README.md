# 🎬 Test Videos Directory

This folder should contain your race videos for development testing.

## 📁 Expected Files

Place these files here:
- `race-1.mp4` - For Race 1: The Gold Cup
- `race-2.mp4` - For Race 2: Speed Derby
- `race-3.mp4` - For Race 3: Grand Stakes

## 🎥 Where to Get Test Videos

### Option 1: Free Stock Footage (Recommended for Testing)

**Pexels (No attribution required):**
1. Visit: https://www.pexels.com/search/videos/horse%20racing/
2. Download 3 different horse racing videos
3. Rename them to: `race-1.mp4`, `race-2.mp4`, `race-3.mp4`
4. Place in this folder

**Pixabay:**
- Visit: https://pixabay.com/videos/search/horse%20racing/
- Similar free videos available

### Option 2: Use Simulation Mode

Don't have videos yet? No problem! The RacePlayer works perfectly without videos:
- Just leave this folder empty
- The system will show a race simulation
- All features work normally
- Add videos later when ready

## 📋 Video Specifications

**Recommended:**
- Format: MP4 (H.264 codec)
- Resolution: 1280x720 (720p) or 1920x1080 (1080p)
- Duration: 2-5 minutes
- File size: Under 50MB each (for faster loading)

**Maximum:**
- File size: 100MB per file (GitHub limit)
- Duration: 10 minutes

## ⚠️ Important Notes

### These files are NOT committed to Git

The `.gitignore` file excludes all video files to prevent:
- Bloating the repository
- Slow clone/pull operations
- GitHub file size limit issues

### For Production

Don't use this folder for production! Instead:
1. Upload videos to a CDN (Cloudflare R2, AWS S3, etc.)
2. Use the CDN URLs in your Race records
3. Much faster delivery for users
4. No file size limits

See: `/docs/HOST_MODE_COMPLETE_GUIDE.md` for production setup

## 🧪 Testing Without Videos

To test the system immediately without downloading videos:

1. Leave this folder empty (or with just `.gitkeep`)
2. Create your races in the database (leave `videoUrl` empty)
3. Go to Host Mode and start a race
4. You'll see a race simulation with:
   - Green "Race Track Simulation" placeholder
   - Live position updates
   - Progress bars
   - Winner determination
   - All controls functional

## 🔗 Using Videos in Development

Once you have videos in this folder:

1. Your videos are accessible at:
   - `http://localhost:3000/videos/race-1.mp4`
   - `http://localhost:3000/videos/race-2.mp4`
   - `http://localhost:3000/videos/race-3.mp4`

2. Update your Race records with these URLs:
   ```sql
   UPDATE "Race" 
   SET "videoUrl" = '/videos/race-1.mp4'
   WHERE "raceNumber" = 1;
   ```

3. Or use the API:
   ```typescript
   await api.updateRace(raceId, {
     videoUrl: '/videos/race-1.mp4'
   });
   ```

## 📦 Team Setup

When other developers clone the repo:

1. This folder structure exists (thanks to `.gitkeep`)
2. They need to download their own test videos
3. Place videos in this folder
4. Videos work immediately in development

## 🚀 Production Checklist

Before going live:
- [ ] Upload all videos to CDN
- [ ] Update Race records with CDN URLs
- [ ] Test video playback from CDN
- [ ] Remove local videos from this folder
- [ ] Verify CDN has proper CORS headers

---

**Need help?** See `QUICK_START_GUIDE.md` in the project root!
