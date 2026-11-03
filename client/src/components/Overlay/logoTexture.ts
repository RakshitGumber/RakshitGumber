import { Assets, Sprite, Texture } from 'pixi.js'

const RING =
  'M 50 7.51 L 52.78 7.63 L 55.57 7.67 L 58.34 8.09 L 60.99 8.99 L 63.58 9.98 L 66.25 10.76 L 68.91 11.66 L 71.35 13.03 L 73.58 14.71 L 75.93 16.21 L 78.07 17.99 L 79.91 20.09 L 81.72 22.18 L 83.65 24.18 L 85.59 26.22 L 86.95 28.67 L 88.03 31.25 L 89.27 33.73 L 90.33 36.31 L 90.86 39.05 L 91.39 41.77 L 92.11 44.46 L 92.66 47.2 L 92.68 50 L 92.29 52.77 L 92.08 55.54 L 91.76 58.31 L 90.89 60.96 L 90.13 63.62 L 89.32 66.29 L 88.36 68.92 L 86.93 71.32 L 85.23 73.54 L 83.55 75.74 L 81.97 78.04 L 80.09 80.09 L 77.91 81.82 L 75.96 83.83 L 73.81 85.64 L 71.24 86.78 L 68.66 87.84 L 66.2 89.12 L 63.71 90.38 L 61.03 91.15 L 58.3 91.73 L 55.57 92.31 L 52.79 92.59 L 50 92.41 L 47.24 92.17 L 44.48 91.97 L 41.68 91.84 L 38.95 91.23 L 36.36 90.19 L 33.7 89.35 L 31.12 88.29 L 28.75 86.8 L 26.53 85.12 L 24.22 83.6 L 21.83 82.12 L 19.87 80.13 L 18.05 78.02 L 16.34 75.83 L 14.66 73.61 L 13.29 71.2 L 12.16 68.66 L 10.7 66.28 L 9.45 63.76 L 8.7 61.07 L 8.48 58.26 L 7.96 55.53 L 7.53 52.78 L 7.6 50 L 7.79 47.23 L 7.8 44.44 L 8.09 41.66 L 8.77 38.95 L 9.98 36.42 L 10.94 33.82 L 11.86 31.19 L 13.15 28.72 L 14.81 26.49 L 16.2 24.07 L 17.86 21.81 L 19.86 19.86 L 22.1 18.18 L 24.29 16.49 L 26.34 14.59 L 28.68 13.08 L 31.23 11.94 L 33.7 10.65 L 36.26 9.51 L 39 8.93 L 41.78 8.67 L 44.49 8.12 L 47.21 7.46 Z'

const FACE =
  'M 50 2.51 L 52.07 2.58 L 54.15 2.55 L 56.21 2.83 L 58.24 3.28 L 60.23 3.87 L 62.28 4.18 L 64.32 4.58 L 66.27 5.29 L 68.19 6.1 L 70.1 6.9 L 71.95 7.84 L 73.7 8.95 L 75.39 10.14 L 77.25 11.08 L 79.02 12.18 L 80.58 13.56 L 82.04 15.03 L 83.59 16.41 L 85.02 17.91 L 86.34 19.5 L 87.57 21.17 L 88.92 22.75 L 90.26 24.35 L 91.26 26.18 L 92.04 28.11 L 92.94 29.98 L 93.91 31.81 L 94.6 33.77 L 95.16 35.76 L 95.89 37.7 L 96.54 39.68 L 96.86 41.74 L 96.96 43.82 L 97.19 45.87 L 97.51 47.93 L 97.53 50 L 97.45 52.07 L 97.42 54.15 L 97.23 56.22 L 96.76 58.25 L 96.19 60.24 L 95.8 62.27 L 95.39 64.31 L 94.68 66.26 L 93.85 68.16 L 93.15 70.12 L 92.23 71.99 L 91.17 73.77 L 89.88 75.4 L 88.8 77.17 L 87.79 79 L 86.49 80.62 L 84.98 82.05 L 83.64 83.64 L 82.15 85.09 L 80.46 86.31 L 78.8 87.53 L 77.17 88.8 L 75.63 90.24 L 73.83 91.28 L 71.93 92.13 L 70.05 92.99 L 68.2 93.93 L 66.23 94.58 L 64.22 95.11 L 62.3 95.89 L 60.33 96.61 L 58.27 96.88 L 56.19 97.03 L 54.13 97.25 L 52.07 97.49 L 50 97.41 L 47.94 97.28 L 45.86 97.34 L 43.78 97.28 L 41.74 96.84 L 39.74 96.29 L 37.75 95.73 L 35.72 95.3 L 33.77 94.6 L 31.87 93.77 L 29.9 93.1 L 27.96 92.33 L 26.2 91.21 L 24.55 89.96 L 22.85 88.78 L 21.04 87.75 L 19.41 86.46 L 17.95 84.98 L 16.36 83.64 L 14.89 82.17 L 13.59 80.55 L 12.43 78.83 L 11.2 77.16 L 9.84 75.58 L 8.77 73.8 L 7.85 71.94 L 6.88 70.11 L 5.99 68.23 L 5.36 66.25 L 4.9 64.22 L 4.23 62.26 L 3.47 60.32 L 3.14 58.26 L 2.87 56.2 L 2.69 54.14 L 2.53 52.07 L 2.53 50 L 2.74 47.94 L 2.75 45.87 L 2.72 43.78 L 3.09 41.73 L 3.67 39.73 L 4.16 37.72 L 4.65 35.7 L 5.43 33.78 L 6.3 31.9 L 6.96 29.93 L 7.72 27.99 L 8.79 26.2 L 10.04 24.54 L 11.22 22.85 L 12.3 21.07 L 13.59 19.45 L 15.06 17.98 L 16.37 16.37 L 17.75 14.8 L 19.36 13.48 L 21.16 12.41 L 22.86 11.24 L 24.48 9.93 L 26.21 8.79 L 28.09 7.91 L 29.9 6.9 L 31.74 5.92 L 33.73 5.3 L 35.75 4.81 L 37.75 4.29 L 39.7 3.55 L 41.74 3.14 L 43.8 2.91 L 45.86 2.67 L 47.92 2.37 Z'

function logoSvg(size: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" overflow="visible">
  <defs>
    <linearGradient id="shiny-black" x1="0%" y1="0%" x2="40%" y2="100%">
      <stop offset="0%" stop-color="#3A3A3A"/>
      <stop offset="45%" stop-color="#0A0A0A"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
    <clipPath id="face"><path d="${FACE}"/></clipPath>
  </defs>
  <path d="${FACE}" fill="#D01E14"/>
  <g clip-path="url(#face)" pointer-events="none">
    <ellipse cx="40" cy="34" rx="16" ry="12" fill="#9A120C" opacity="0.14"/>
    <ellipse cx="60" cy="60" rx="14" ry="11" fill="#C41E14" opacity="0.12"/>
    <circle cx="34" cy="42" r="0.5" fill="#E6D9C4" opacity="0.4"/>
    <circle cx="70" cy="48" r="0.35" fill="#E6D9C4" opacity="0.3"/>
    <circle cx="48" cy="28" r="0.4" fill="#E6D9C4" opacity="0.28"/>
    <circle cx="56" cy="72" r="0.4" fill="#E6D9C4" opacity="0.35"/>
  </g>
  <path d="${RING}" fill="none" stroke="#0A0A0A" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
  <text x="50" y="50" text-anchor="middle" dominant-baseline="central" fill="url(#shiny-black)"
    font-family="Archivo Black, Impact, sans-serif" font-size="44" letter-spacing="-3.5"
    transform="translate(50 50) scale(1 1.4) translate(-50 -50)">RG</text>
</svg>`
}

export async function createLogoSprite(displaySize = 160) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const px = Math.round(displaySize * dpr)
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg(px))}`
  const texture = await Assets.load<Texture>({ alias: `logo@${px}`, src: url })
  const sprite = new Sprite(texture)
  sprite.width = displaySize
  sprite.height = displaySize
  sprite.anchor.set(0.5)
  sprite.eventMode = 'none'
  return sprite
}
