import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const avatar = 'src/assets/portfolio/avatar.png';
await mkdir('public/portfolio-icons', { recursive: true });
for (const size of [32, 180, 192, 512]) {
  const name = size === 180 ? 'apple-touch-icon' : `icon-${size}`;
  await sharp(avatar)
    .resize(size, size)
    .png({ palette: true, quality: 95, effort: 10 })
    .toFile(`public/portfolio-icons/${name}.png`);
}
// Preserve the legacy social-image URL with a smaller version of the same image.
await sharp(avatar)
  .resize({ width: 1200, withoutEnlargement: true })
  .png({ palette: true, quality: 95, effort: 10 })
  .toFile('public/senku.png');
console.log(
  'Generated portfolio favicon, touch/manifest icons and social avatar.',
);
