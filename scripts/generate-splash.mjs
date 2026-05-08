#!/usr/bin/env node
/**
 * Genera apple-touch-startup-image (splash screens) para iOS desde el icono master.
 *
 * Uso:
 *   node scripts/generate-splash.mjs
 *
 * Requiere `sharp` (viene con Next.js).
 */

import sharp from "sharp"
import { mkdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, "..")
const PUBLIC_DIR = resolve(ROOT, "public")
const SPLASH_DIR = resolve(PUBLIC_DIR, "splash")
const MASTER = resolve(PUBLIC_DIR, "icon-master-1024x1024.png")

const BACKGROUND = "#0a0e1a"
const ICON_RATIO = 0.28

const DEVICES = [
  { w: 1290, h: 2796, name: "iPhone 15/16 Pro Max" },
  { w: 1179, h: 2556, name: "iPhone 15/16 Pro" },
  { w: 1284, h: 2778, name: "iPhone 12-14 Pro Max" },
  { w: 1170, h: 2532, name: "iPhone 12-14" },
  { w: 1125, h: 2436, name: "iPhone X/XS/11 Pro" },
  { w: 1242, h: 2688, name: "iPhone XS Max/11 Pro Max" },
  { w: 828, h: 1792, name: "iPhone XR/11" },
  { w: 1242, h: 2208, name: "iPhone 6+/7+/8+" },
  { w: 750, h: 1334, name: "iPhone 6/7/8/SE 2-3" },
  { w: 2048, h: 2732, name: 'iPad Pro 12.9"' },
  { w: 1668, h: 2388, name: 'iPad Pro 11"' },
  { w: 1640, h: 2360, name: "iPad Air 4-5" },
  { w: 1668, h: 2224, name: 'iPad Pro 10.5"' },
  { w: 1620, h: 2160, name: 'iPad 10.2"' },
  { w: 1536, h: 2048, name: 'iPad mini/9.7"' },
]

async function generate(width, height, iconBuffer) {
  const iconSize = Math.round(Math.min(width, height) * ICON_RATIO)
  const resizedIcon = await sharp(iconBuffer)
    .resize(iconSize, iconSize, { fit: "contain" })
    .toBuffer()

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: resizedIcon, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer()
}

async function main() {
  await mkdir(SPLASH_DIR, { recursive: true })
  const iconBuffer = await sharp(MASTER).png().toBuffer()

  for (const device of DEVICES) {
    const portrait = await generate(device.w, device.h, iconBuffer)
    const landscape = await generate(device.h, device.w, iconBuffer)

    const portraitPath = resolve(SPLASH_DIR, `splash-${device.w}x${device.h}.png`)
    const landscapePath = resolve(SPLASH_DIR, `splash-${device.h}x${device.w}.png`)

    await sharp(portrait).toFile(portraitPath)
    await sharp(landscape).toFile(landscapePath)

    console.log(`✓ ${device.name} → ${device.w}x${device.h} + ${device.h}x${device.w}`)
  }

  console.log(`\nListo. ${DEVICES.length * 2} archivos generados en /public/splash/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
