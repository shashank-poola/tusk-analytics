"use client"

import { useEffect, useRef } from "react"

import {
  layoutWordmark,
  mixRgb,
  parseHex,
  quoteFamilies,
  type Rgb,
  rgbString,
  type Tile,
} from "@/features/marketing/utils/wordmark-tiles"

type FooterWordmarkProps = {
  text?: string
  /** Grid cell on desktop, CSS pixels; phones use 10. */
  cellSize?: number
  /** Tile corner radius, CSS pixels. */
  radius?: number
}

const REACH = 140 // pointer influence, px
const PUSH = 3.2 // push strength at the pointer
const PULL = 0.07 // spring back toward home
const DAMPING = 0.8
const WAVE_EVERY_MS = 6000
const WAVE_MS = 1800
const WAVE_WIDTH = 90
const WAVE_LIFT = 7

/**
 * A giant "tusk" made of rounded blue tiles, cropped at the bottom of the
 * footer. Tiles shy away from the pointer (or a finger) and spring back;
 * when nobody touches it, a slow wave runs through now and then. The loop
 * only runs while the wordmark is on screen and something is moving, and
 * with reduced motion the wordmark is drawn once and stays still.
 */
export function FooterWordmark({
  text = "tusk",
  cellSize = 14,
  radius = 3,
}: FooterWordmarkProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!wrapper || !canvas || !context) return

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    const root = getComputedStyle(document.documentElement)
    // The brand blues from the tokens: lighter at the top, Deep Water below.
    const accent = parseHex(root.getPropertyValue("--accent"))
    const deep = parseHex(root.getPropertyValue("--deep-water"))
    const white: Rgb = [255, 255, 255]
    const top = mixRgb(accent, white, 0.3)
    const lit = mixRgb(accent, white, 0.55)
    const fontFamily = quoteFamilies(root.getPropertyValue("--font-feather"))

    let tiles: Tile[] = []
    let width = 0
    let height = 0
    let cell = cellSize
    let pointer: { x: number; y: number } | null = null
    let glowAlpha = 0
    let waveStart = -Infinity
    let inView = false
    let frame = 0
    let stopped = false

    function build() {
      width = wrapper?.clientWidth ?? 0
      if (!canvas || !context || width === 0) return
      cell = width < 640 ? 10 : cellSize
      const layout = layoutWordmark({ text, width, cell, fontFamily })
      tiles = layout.tiles
      height = layout.height
      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      canvas.style.height = `${height}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      draw()
    }

    function step(now: number) {
      const waveX =
        -WAVE_WIDTH + ((now - waveStart) / WAVE_MS) * (width + 2 * WAVE_WIDTH)
      const waving = now - waveStart < WAVE_MS
      let moving = false
      for (const tile of tiles) {
        let lift = 0
        let glow = 0
        if (waving) {
          const near = Math.max(
            0,
            1 - Math.abs(tile.homeX - waveX) / WAVE_WIDTH
          )
          lift = WAVE_LIFT * near * near
          glow = near * 0.6
        }
        let ax = (tile.homeX - tile.x) * PULL
        let ay = (tile.homeY - lift - tile.y) * PULL
        if (pointer) {
          const dx = tile.x - pointer.x
          const dy = tile.y - pointer.y
          const distance = Math.hypot(dx, dy) || 1
          if (distance < REACH) {
            const force = 1 - distance / REACH
            ax += (dx / distance) * force * PUSH
            ay += (dy / distance) * force * PUSH
            glow = Math.max(glow, force)
          }
        }
        tile.vx = (tile.vx + ax) * DAMPING
        tile.vy = (tile.vy + ay) * DAMPING
        tile.x += tile.vx
        tile.y += tile.vy
        tile.scale += (1 + glow * 0.35 - tile.scale) * 0.2
        tile.glow += (glow - tile.glow) * 0.2
        if (
          Math.abs(tile.vx) + Math.abs(tile.vy) > 0.02 ||
          Math.abs(tile.x - tile.homeX) + Math.abs(tile.y - tile.homeY) > 0.1 ||
          tile.glow > 0.01
        ) {
          moving = true
        }
      }
      glowAlpha += ((pointer ? 1 : 0) - glowAlpha) * 0.15
      return moving || waving || glowAlpha > 0.01
    }

    function draw() {
      if (!context) return
      context.clearRect(0, 0, width, height)
      if (pointer && glowAlpha > 0.01) {
        const halo = context.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          REACH
        )
        halo.addColorStop(0, rgbString(accent, 0.25 * glowAlpha))
        halo.addColorStop(1, rgbString(accent, 0))
        context.fillStyle = halo
        context.fillRect(0, 0, width, height)
      }
      const size = cell * 0.8
      for (const tile of tiles) {
        const base = mixRgb(top, deep, tile.depth)
        context.fillStyle = rgbString(mixRgb(base, lit, tile.glow))
        const side = size * tile.scale
        context.beginPath()
        context.roundRect(
          tile.x - side / 2,
          tile.y - side / 2,
          side,
          side,
          radius
        )
        context.fill()
      }
    }

    function loop(now: number) {
      if (stopped) return
      const busy = step(now)
      draw()
      frame = busy && inView ? requestAnimationFrame(loop) : 0
    }

    function wake() {
      if (reduced || !inView || frame) return
      frame = requestAnimationFrame(loop)
    }

    function pointAt(clientX: number, clientY: number) {
      const rect = canvas?.getBoundingClientRect()
      if (!rect) return
      pointer = { x: clientX - rect.left, y: clientY - rect.top }
      wake()
    }
    const onPointerMove = (event: PointerEvent) =>
      pointAt(event.clientX, event.clientY)
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (touch) pointAt(touch.clientX, touch.clientY)
    }
    const release = () => {
      pointer = null
      wake()
    }

    let resizeTimer = 0
    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        if (wrapper.clientWidth !== width) build()
      }, 150)
    }

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? false
      if (inView) wake()
    })
    const waves = window.setInterval(() => {
      if (pointer || !inView) return
      waveStart = performance.now()
      wake()
    }, WAVE_EVERY_MS)

    void document.fonts
      .load(`700 100px ${fontFamily}`)
      .catch((error: unknown) => {
        // Draw anyway: the fallback font still makes a readable wordmark.
        console.error("Footer wordmark: Feather Bold didn't load", error)
      })
      .then(() => document.fonts.ready)
      .then(() => {
        if (stopped) return
        build()
        observer.observe(wrapper)
      })
    window.addEventListener("resize", onResize)
    if (!reduced) {
      canvas.addEventListener("pointermove", onPointerMove)
      canvas.addEventListener("pointerleave", release)
      canvas.addEventListener("touchmove", onTouchMove, { passive: true })
      canvas.addEventListener("touchend", release)
    }

    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      window.clearInterval(waves)
      window.clearTimeout(resizeTimer)
      observer.disconnect()
      window.removeEventListener("resize", onResize)
      canvas.removeEventListener("pointermove", onPointerMove)
      canvas.removeEventListener("pointerleave", release)
      canvas.removeEventListener("touchmove", onTouchMove)
      canvas.removeEventListener("touchend", release)
    }
  }, [text, cellSize, radius])

  return (
    <div ref={wrapperRef} className="relative w-full">
      <span className="sr-only">
        {text.charAt(0).toUpperCase() + text.slice(1)}
      </span>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block w-full touch-pan-y"
        // Roughly the drawn height, so the page doesn't jump when it draws.
        style={{ height: "min(24vw, 20rem)" }}
      />
    </div>
  )
}
