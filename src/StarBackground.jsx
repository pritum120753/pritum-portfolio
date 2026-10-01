import { useEffect, useRef } from "react"

export default function StarBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    let animationFrame
    let stars = []

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      stars = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.8 + 0.3,
        speed: Math.random() * 0.35 + 0.05,
        opacity: Math.random() * 0.7 + 0.2,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      stars.forEach((star) => {
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${star.opacity})`
        ctx.fill()

        star.y -= star.speed

        if (star.y < 0) {
          star.y = canvas.height
          star.x = Math.random() * canvas.width
        }
      })

      animationFrame = requestAnimationFrame(draw)
    }

    resizeCanvas()
    draw()

    window.addEventListener("resize", resizeCanvas)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  )
}
