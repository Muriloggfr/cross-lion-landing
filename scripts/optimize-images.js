const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function getImageFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getImageFiles(fullPath));
    } else if (/\.(jpg|jpeg|png)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

async function optimizeImages() {
  const imgDir = path.join(__dirname, '..', 'img');
  const files = await getImageFiles(imgDir);

  console.log(`Found ${files.length} images to optimize`);

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    const baseName = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    const webpPath = path.join(dir, baseName + '.webp');

    try {
      const meta = await sharp(filePath).metadata();
      const { width, height } = meta;

      // Determine if this is an avatar/thumbnail image
      const isAvatar = /avatar|person|aluno|coach/i.test(baseName) ||
                       /\d{15,}/.test(baseName); // Instagram-style filenames
      const maxWidth = isAvatar ? 200 : 1200;

      let pipeline = sharp(filePath);
      if (width > maxWidth) {
        pipeline = pipeline.resize(maxWidth, null, { withoutEnlargement: true });
      }

      await pipeline.webp({ quality: 80 }).toFile(webpPath);

      const origSize = fs.statSync(filePath).size;
      const webpSize = fs.statSync(webpPath).size;
      const saving = Math.round((1 - webpSize/origSize) * 100);

      console.log(`${path.basename(filePath)} (${width}x${height}) → ${path.basename(webpPath)} [${saving}% smaller]`);
    } catch (err) {
      console.error(`Error processing ${filePath}: ${err.message}`);
    }
  }
}

optimizeImages().then(() => console.log('Done!')).catch(console.error);
