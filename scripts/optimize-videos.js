const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const videoDir = path.join(__dirname, '..', 'video');
const outDir = path.join(videoDir, 'optimized');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function getVideoFiles(dir) {
  return fs.readdirSync(dir)
    .filter(f => /\.(mp4|mov|webm)$/i.test(f))
    .map(f => path.join(dir, f));
}

async function optimizeVideos() {
  const videos = getVideoFiles(videoDir);
  console.log(`Found ${videos.length} videos`);

  for (const video of videos) {
    const name = path.basename(video, path.extname(video));
    const mp4Out = path.join(outDir, name + '.mp4');
    const webmOut = path.join(outDir, name + '.webm');
    const posterOut = path.join(outDir, name + '-poster.jpg');

    console.log(`Processing: ${path.basename(video)}`);

    try {
      // H.264 MP4 with max 720p
      execSync(`ffmpeg -i "${video}" -vf "scale=trunc(iw/2)*2:min(720\\,trunc(ih/2)*2)" -c:v libx264 -crf 28 -preset fast -an -y "${mp4Out}" 2>/dev/null`, { stdio: 'pipe' });
      console.log(`  → ${path.basename(mp4Out)}`);
    } catch (e) { console.error(`  MP4 failed: ${e.message}`); }

    try {
      // VP9 WebM
      execSync(`ffmpeg -i "${video}" -vf "scale=trunc(iw/2)*2:min(720\\,trunc(ih/2)*2)" -c:v libvpx-vp9 -crf 35 -b:v 0 -an -y "${webmOut}" 2>/dev/null`, { stdio: 'pipe' });
      console.log(`  → ${path.basename(webmOut)}`);
    } catch (e) { console.error(`  WebM failed: ${e.message}`); }

    try {
      // Poster at 0.5s
      execSync(`ffmpeg -i "${video}" -ss 0.5 -vframes 1 -q:v 3 -y "${posterOut}" 2>/dev/null`, { stdio: 'pipe' });
      console.log(`  → ${path.basename(posterOut)}`);
    } catch (e) { console.error(`  Poster failed: ${e.message}`); }
  }

  console.log('Done!');
}

optimizeVideos();
