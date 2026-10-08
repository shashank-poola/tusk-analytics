"use client"

import { useEffect, useRef } from "react"

const PIECES = 140
const DURATION_MS = 2600
const GRAVITY = 0.32
const DRAG = 0.985
// The brand's chart series and Sunrise, read from the tokens.
const COLOR_TOKENS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4"]

type Piece = {
  x: number
  y: number
  vx: number
  vy: number
  spin: number
  angle: number
  size: number
  color: string
}

/**
 * One burst of confetti from the bottom of the screen, then gone. Drawn on
 * a full-screen canvas that never catches clicks. The caller skips it for
 * people who prefer reduced motion.
 */
export function ConfettiBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return

    const ratio = window.devicePixelRatio || 1
    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = width * ratio
    canvas.height = height * ratio
    context.scale(ratio, ratio)

    const root = getComputedStyle(document.documentElement)
    const colors = COLOR_TOKENS.map((token) =>
      root.getPropertyValue(token).trim()
    ).filter(Boolean)
    // Without the tokens there's nothing on-brand to draw.
    if (colors.length === 0) return
    const pieces: Piece[] = Array.from({ length: PIECES }, (_, index) => {
      // Two fountains, from the bottom left and right, aimed inward.
      const fromLeft = index % 2 === 0
      const angle =
        (fromLeft ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5) * 0.7
      const speed = 13 + Math.random() * 9
      return {
        x: fromLeft ? width * 0.1 : width * 0.9,
        y: height + 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        spin: (Math.random() - 0.5) * 0.3,
        angle: Math.random() * Math.PI,
        size: 6 + Math.random() * 6,
        color: colors[index % colors.length] ?? "",
      }
    })

    const start = performance.now()
    let frame = 0
    function draw(now: number) {
      if (!context) return
      const elapsed = now - start
      context.clearRect(0, 0, width, height)
      context.globalAlpha = Math.max(0, 1 - elapsed / DURATION_MS)
      for (const piece of pieces) {
        piece.vx *= DRAG
        piece.vy = piece.vy * DRAG + GRAVITY
        piece.x += piece.vx
        piece.y += piece.vy
        piece.angle += piece.spin
        context.save()
        context.translate(piece.x, piece.y)
        context.rotate(piece.angle)
        context.fillStyle = piece.color
        context.fillRect(
          -piece.size / 2,
          -piece.size / 4,
          piece.size,
          piece.size / 2
        )
        context.restore()
      }
      if (elapsed < DURATION_MS) frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 size-full"
    />
  )
}
