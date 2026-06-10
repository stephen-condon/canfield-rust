// A lightweight, dependency-free canvas confetti burst for the win overlay.
// Ported in spirit from the Electron/Vue version's WinOverlay animation.

export interface ConfettiHandle {
  stop(): void
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  spin: number
  color: string
}

const COLORS = ['#f1d28a', '#d9b566', '#b0242c', '#1d7a44', '#f7f3e8', '#3a86ff']
const PARTICLE_COUNT = 160
const GRAVITY = 0.12
const DRIFT = 0.99

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
}

// Start a confetti animation on the given canvas. Returns a handle whose
// stop() ends the animation. Honors prefers-reduced-motion (no-op) and a
// missing 2D context (no-op), so callers never need to special-case those.
export function startConfetti(canvas: HTMLCanvasElement): ConfettiHandle {
  const ctx = canvas.getContext('2d')
  if (prefersReducedMotion() || !ctx) {
    return { stop: () => {} }
  }

  const width = (canvas.width = canvas.clientWidth || window.innerWidth || 800)
  const height = (canvas.height = canvas.clientHeight || window.innerHeight || 600)

  // Three bursts launched from across the top edge.
  const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * width,
    y: -Math.random() * height * 0.3,
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * 4 + 2,
    size: Math.random() * 6 + 4,
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }))

  let rafId = 0
  let frames = 0
  const MAX_FRAMES = 360 // ~6s at 60fps, then settle

  const tick = (): void => {
    ctx.clearRect(0, 0, width, height)
    frames++
    for (const p of particles) {
      p.vx *= DRIFT
      p.vy += GRAVITY
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.spin

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5)
      ctx.restore()
    }
    if (frames < MAX_FRAMES) {
      rafId = requestAnimationFrame(tick)
    } else {
      ctx.clearRect(0, 0, width, height)
    }
  }

  rafId = requestAnimationFrame(tick)
  return {
    stop: () => {
      cancelAnimationFrame(rafId)
      ctx.clearRect(0, 0, width, height)
    },
  }
}
