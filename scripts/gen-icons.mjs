import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const src = path.join(__dirname, 'icon-source.svg')
const outDir = path.join(root, 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const sizes = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
]

for (const { file, size } of sizes) {
  await sharp(src, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, file))
  console.log('wrote', file)
}

// Maskable icon: same art on a full-bleed background with extra safe-area padding
const maskableSize = 512
const padded = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${maskableSize}" height="${maskableSize}">
    <rect width="100%" height="100%" fill="#0f9d58"/>
  </svg>`
)
await sharp(padded)
  .composite([
    {
      input: await sharp(src, { density: 384 }).resize(320, 320).toBuffer(),
      top: 96,
      left: 96,
    },
  ])
  .png()
  .toFile(path.join(outDir, 'icon-maskable-512.png'))
console.log('wrote icon-maskable-512.png')

// Favicon (simple png-based, referenced as .ico substitute via png favicon)
await sharp(src, { density: 384 }).resize(64, 64).png().toFile(path.join(root, 'public', 'favicon.png'))
console.log('wrote favicon.png')
