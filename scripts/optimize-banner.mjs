import sharp from 'sharp';
import path from 'path';

const inputPath = 'public/images/banner-winston-and-harry-maletas.png';
const desktopPath = 'public/images/banner-winston-and-harry-maletas-desktop.webp';
const mobilePath = 'public/images/banner-winston-and-harry-maletas-mobile.webp';

async function main() {
  console.log("Optimizing banner image using sharp...");
  
  // 1. Desktop: resize to width 1920 and convert to WebP
  await sharp(inputPath)
    .resize(1920)
    .webp({ quality: 85 })
    .toFile(desktopPath);
  console.log("Desktop banner generated successfully!");

  // 2. Mobile: vertical crop (640x960) from the center
  await sharp(inputPath)
    .resize(640, 960, {
      fit: 'cover',
      position: 'center'
    })
    .webp({ quality: 85 })
    .toFile(mobilePath);
  console.log("Mobile banner generated successfully!");
}

main().catch(err => {
  console.error("Error optimizing banner:", err);
  process.exit(1);
});
