import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { site } from '../src/config.ts';

const xml = (value) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[character],
  );

// Code-native artwork, exported as PNG for social platforms that do not use SVG.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="#f7f6f2"/>
<path d="M70 118h1060M70 551h1060" stroke="#d9dcd2"/>
<text x="70" y="88" font-family="Georgia,serif" font-size="34" fill="#262d28">${xml(site.title)}<tspan fill="#a0442b">.</tspan></text>
<text x="1130" y="86" text-anchor="end" font-family="sans-serif" font-size="24" fill="#62675e">${xml(site.author)}</text>
<text x="70" y="245" font-family="Georgia,serif" font-size="68" fill="#262d28">Thinking in systems.</text>
<text x="70" y="332" font-family="Georgia,serif" font-style="italic" font-size="68" fill="#a0442b">Learning by building.</text>
<text x="74" y="411" font-family="sans-serif" font-size="24" fill="#62675e">Software engineering, robotics, machine learning, and ideas.</text>
<text x="74" y="590" font-family="monospace" font-size="17" letter-spacing="2" fill="#62675e">${xml(site.author.toUpperCase())} / @${xml(site.username)}</text>
<g fill="none" stroke="#62675e" stroke-width="1.5"><circle cx="983" cy="255" r="83"/><circle cx="1045" cy="255" r="83"/><circle cx="1014" cy="307" r="83"/></g>
<circle cx="1014" cy="277" r="6" fill="#a0442b"/>
</svg>`;

await mkdir('public', { recursive: true });
await writeFile(
  'public/og.png',
  await sharp(Buffer.from(svg)).png().toBuffer(),
);
console.log('Generated public/og.png (1200 × 630).');
