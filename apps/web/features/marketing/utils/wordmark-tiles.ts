// Turns a word into a grid of tiles for the footer wordmark: draw it once
// on an offscreen canvas, keep every cell the letters cover.

export type Tile = {
  /** Home position, CSS pixels. */
  homeX: number
  homeY: number
  x: number
  y: number
  vx: number
  vy: number
  scale: number
  /** 0 at rest, 1 fully lit by the pointer or the wave. */
  glow: number
  /** 0 at the top of the word, 1 at the bottom: picks the gradient colour. */
  depth: number
}

type LayoutInput = {
  text: string
  /** Canvas width in CSS pixels. */
  width: number
  cell: number
  /** A CSS font-family list, e.g. the --font-feather variable. */
  fontFamily: string
}

/** Share of the word's height that stays visible; the rest is cropped. */
const VISIBLE_SHARE = 0.86

/**
 * Fits the word to the width, crops its bottom a little and samples it on
 * a `cell` grid: every cell over the letters becomes a tile.
 */
export function layoutWordmark({ text, width, cell, fontFamily }: LayoutInput) {
  const probe = document.createElement("canvas").getContext("2d")
  if (!probe) return { tiles: [], height: 0 }
  probe.font = `700 100px ${fontFamily}`
  const fontSize = (100 * width * 0.96) / probe.measureText(text).width
  probe.font = `700 ${fontSize}px ${fontFamily}`
  const ascent = probe.measureText(text).actualBoundingBoxAscent

  const top = cell
  const height = Math.round(top + ascent * VISIBLE_SHARE)
  const canvas = document.createElement("canvas")
  canvas.width = Math.ceil(width)
  canvas.height = height
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) return { tiles: [], height }
  context.font = `700 ${fontSize}px ${fontFamily}`
  context.textAlign = "center"
  context.textBaseline = "alphabetic"
  context.fillText(text, width / 2, top + ascent)

  const { data } = context.getImageData(0, 0, canvas.width, height)
  const tiles: Tile[] = []
  for (let y = cell / 2; y < height; y += cell) {
    for (let x = cell / 2; x < width; x += cell) {
      const alpha = data[(Math.floor(y) * canvas.width + Math.floor(x)) * 4 + 3]
      if (alpha === undefined || alpha <= 127) continue
      tiles.push({
        homeX: x,
        homeY: y,
        x,
        y,
        vx: 0,
        vy: 0,
        scale: 1,
        glow: 0,
        depth: y / height,
      })
    }
  }
  return { tiles, height }
}

export type Rgb = [number, number, number]

/** "#2d8cff" → [45, 140, 255]; black when the value isn't a hex colour. */
export function parseHex(value: string): Rgb {
  const match = /^#([0-9a-f]{6})$/i.exec(value.trim())
  if (!match?.[1]) return [0, 0, 0]
  const hex = Number.parseInt(match[1], 16)
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255]
}

export function mixRgb(from: Rgb, to: Rgb, amount: number): Rgb {
  return [
    from[0] + (to[0] - from[0]) * amount,
    from[1] + (to[1] - from[1]) * amount,
    from[2] + (to[2] - from[2]) * amount,
  ]
}

export function rgbString([r, g, b]: Rgb, alpha = 1): string {
  return `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)} / ${alpha})`
}

const GENERIC_FAMILIES = new Set([
  "serif",
  "sans-serif",
  "system-ui",
  "monospace",
])

/**
 * Makes a CSS font-family list safe for canvas and `document.fonts`: names
 * like Baloo 2 must be quoted there, or the whole font string is rejected.
 */
export function quoteFamilies(list: string): string {
  return list
    .split(",")
    .map((family) => family.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean)
    .map((family) => (GENERIC_FAMILIES.has(family) ? family : `"${family}"`))
    .join(", ")
}
