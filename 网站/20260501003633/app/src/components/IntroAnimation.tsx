import { useRef, useEffect, useCallback } from 'react'
import { animate as animeAnimate } from 'animejs'

interface IntroAnimationProps {
  onComplete: () => void
  onExitStart?: () => void
}

// 品牌色系：暖橙、蓝、绿
const BRAND_COLORS = ['#d97757', '#6a9bcc', '#788c5d']

// easeOutQuart 缓动
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

export default function IntroAnimation({ onComplete, onExitStart }: IntroAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{
    rafId: number
    startTime: number | null
    exited: boolean
    exitTimer: ReturnType<typeof setTimeout> | null
    listeners: (() => void)[]
  }>({ rafId: 0, startTime: null, exited: false, exitTimer: null, listeners: [] })

  const drawFrame = useCallback((time: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width / (window.devicePixelRatio || 1)
    const h = canvas.height / (window.devicePixelRatio || 1)
    const cx = w / 2
    const cy = h / 2
    const baseR = Math.min(w, h) * 0.32

    // 背景 - 暖暗色调径向渐变
    ctx.clearRect(0, 0, w, h)
    const bgGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.8)
    bgGradient.addColorStop(0, '#151210')
    bgGradient.addColorStop(0.5, '#0e0c0a')
    bgGradient.addColorStop(1, '#0a0908')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, w, h)

    const t = time * 0.001

    // 计算 alpha 的辅助函数（使用 easeOutQuart 缓动）
    const getAlpha = (start: number, duration: number) => {
      if (time <= start) return 0
      const progress = Math.min(1, (time - start) / duration)
      return easeOutQuart(progress)
    }

    // 文字关联脉冲（当 title 入场后，弧段微微闪烁/增强）
    const textPulse = time > 1400 ? Math.sin((time - 1400) * 0.005) * 0.3 + 0.7 : 1

    // ── 1. 内层刻度环（细短线条）──
    const tickAlpha = getAlpha(0, 900)
    if (tickAlpha > 0) {
      const tickCount = 180
      const tickR = baseR * 0.68
      for (let i = 0; i < tickCount; i++) {
        if (i / tickCount > tickAlpha) break
        const angle = (i / tickCount) * Math.PI * 2 + t * 0.15
        const inner = tickR - 5
        const outer = tickR
        // 品牌色暖橙
        ctx.strokeStyle = `rgba(217,119,87,${tickAlpha * 0.6})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner)
        ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer)
        ctx.stroke()
      }
    }

    // ── 2. 内外暗色环 ──
    const ringAlpha = getAlpha(200, 800)
    if (ringAlpha > 0) {
      // 内环
      ctx.strokeStyle = `rgba(120,100,90,${ringAlpha * 0.25})`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(cx, cy, baseR * 0.62, 0, Math.PI * 2)
      ctx.stroke()
      // 外环
      ctx.strokeStyle = `rgba(120,100,90,${ringAlpha * 0.25})`
      ctx.beginPath()
      ctx.arc(cx, cy, baseR * 1.05, 0, Math.PI * 2)
      ctx.stroke()
      // 中间虚线环
      ctx.setLineDash([5, 5])
      ctx.strokeStyle = `rgba(120,100,90,${ringAlpha * 0.2})`
      ctx.beginPath()
      ctx.arc(cx, cy, baseR * 0.88, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // ── 3. 品牌色弧段（3 色环绕）──
    const segAlpha = getAlpha(650, 900)
    if (segAlpha > 0) {
      for (let i = 0; i < 5; i++) {
        const startAngle = (i / 5) * Math.PI * 2 + t * 0.1
        const endAngle = startAngle + (Math.PI * 2) / 5 * 0.7
        const r = baseR * 0.85
        const color = BRAND_COLORS[i % 3]

        // 文字关联时增强发光与主亮度
        const glowIntensity = time > 1400 ? 25 + textPulse * 15 : 25
        const mainAlpha = time > 1400 ? 0.85 + textPulse * 0.15 : 0.85

        // 发光
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = 12
        ctx.globalAlpha = segAlpha * 0.15
        ctx.shadowColor = color
        ctx.shadowBlur = glowIntensity
        ctx.beginPath()
        ctx.arc(cx, cy, r, startAngle, endAngle)
        ctx.stroke()
        ctx.restore()

        // 主线
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = 3.5
        ctx.globalAlpha = segAlpha * mainAlpha
        ctx.beginPath()
        ctx.arc(cx, cy, r, startAngle, endAngle)
        ctx.stroke()
        ctx.restore()
      }
    }

    // ── 4. 旋转扫描弧 ──
    const sweepAlpha = getAlpha(350, 800)
    if (sweepAlpha > 0) {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(t * 0.25)
      const grad = ctx.createLinearGradient(-baseR, -baseR, baseR, baseR)
      grad.addColorStop(0, `rgba(217,119,87,${sweepAlpha * 0.15})`)
      grad.addColorStop(0.5, `rgba(106,155,204,${sweepAlpha * 0.1})`)
      grad.addColorStop(1, `rgba(217,119,87,${sweepAlpha * 0.15})`)
      ctx.strokeStyle = grad
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(0, 0, baseR * 0.75, -0.6, 0.6)
      ctx.stroke()
      ctx.restore()
    }

    // ── 5. 中心点阵矩阵 ──
    const dotAlpha = getAlpha(850, 1000)
    if (dotAlpha > 0) {
      const gridSize = 15
      const cellSize = baseR * 0.05
      const offsetX = -((gridSize - 1) * cellSize) / 2
      const offsetY = -((gridSize - 1) * cellSize) / 2
      for (let gx = 0; gx < gridSize; gx++) {
        for (let gy = 0; gy < gridSize; gy++) {
          const dist = Math.abs(gx - (gridSize - 1) / 2) + Math.abs(gy - (gridSize - 1) / 2)
          if (dist > (time - 850) / 80 * 5) continue
          const wave = Math.sin(time * 0.003 + dist * 0.5 - t * 1.5)
          const size = 1.2 + Math.max(0, wave) * 1.5
          // 品牌色混合
          const colorIndex = (gx + gy) % 3
          const baseColor = BRAND_COLORS[colorIndex]
          const r = parseInt(baseColor.slice(1, 3), 16)
          const g = parseInt(baseColor.slice(3, 5), 16)
          const b = parseInt(baseColor.slice(5, 7), 16)
          ctx.fillStyle = `rgba(${r},${g},${b},${dotAlpha * 0.65})`
          ctx.beginPath()
          ctx.arc(cx + offsetX + gx * cellSize, cy + offsetY + gy * cellSize, size, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // ── 6. 中心波形横线（菱形波包）──
    const waveAlpha = getAlpha(1050, 1000)
    if (waveAlpha > 0) {
      const waveCount = 41
      const waveR = baseR * 0.38
      for (let i = 0; i < waveCount; i++) {
        const norm = (i / (waveCount - 1)) * 2 - 1
        const dist = Math.abs(norm)
        const height = Math.max(0, 1 - dist * dist) * waveR * 0.5
        const yOffset = Math.sin(time * 0.005 + i * 0.25 + t) * height
        const px = cx + norm * waveR
        const py = cy + yOffset
        const s = 2 + (1 - dist) * 2.5
        // 品牌色交替
        const colorIndex = i % 3
        const baseColor = BRAND_COLORS[colorIndex]
        const r = parseInt(baseColor.slice(1, 3), 16)
        const g = parseInt(baseColor.slice(3, 5), 16)
        const b = parseInt(baseColor.slice(5, 7), 16)
        ctx.fillStyle = `rgba(${r},${g},${b},${waveAlpha * (0.5 + (1 - dist) * 0.5)})`
        ctx.beginPath()
        ctx.arc(px, py, s, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // ── 7. 中心小圆 ──
    const centerAlpha = getAlpha(500, 700)
    if (centerAlpha > 0) {
      ctx.fillStyle = `rgba(217,119,87,${centerAlpha * 0.8})`
      ctx.beginPath()
      ctx.arc(cx, cy, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const s = stateRef.current

    // Resize & DPR
    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)
    s.listeners.push(() => window.removeEventListener('resize', resize))

    // 动画循环
    const animate = (timestamp: number) => {
      if (s.startTime === null) s.startTime = timestamp
      const time = timestamp - s.startTime
      drawFrame(time)
      s.rafId = requestAnimationFrame(animate)
    }
    s.rafId = requestAnimationFrame(animate)

    // 5 秒自动退出
    s.exitTimer = setTimeout(() => {
      triggerExit()
    }, 5000)

    // 退出逻辑
    let exiting = false
    const triggerExit = () => {
      if (exiting || s.exited) return
      exiting = true
      s.exited = true
      onExitStart?.()
      const container = containerRef.current
      const canvasEl = canvasRef.current
      const title = document.querySelector('.intro-title') as HTMLElement | null
      const subtitle = document.querySelector('.intro-subtitle') as HTMLElement | null
      const hint = document.querySelector('.intro-hint') as HTMLElement | null

      if (container) {
        // 添加底部阴影，增强"幕布是实体"的感觉
        container.style.boxShadow = '0 10px 40px rgba(0,0,0,0.1)'

        // 第一阶段：内部收敛（0.5s）
        // Canvas 元素群 scale 1→0.96, opacity 1→0.2
        if (canvasEl) {
          animeAnimate(canvasEl, {
            scale: [1, 0.96],
            opacity: [1, 0.2],
            duration: 500,
            easing: 'linear',
          })
        }

        // 文字"网课小助手"和副标题 opacity 1→0
        const textEls = [title, subtitle, hint].filter(Boolean) as HTMLElement[]
        textEls.forEach((el) => {
          animeAnimate(el, {
            opacity: [1, 0],
            duration: 500,
            easing: 'linear',
          })
        })

        // 500ms 后停止 canvas 动画
        setTimeout(() => {
          cancelAnimationFrame(s.rafId)
        }, 500)

        // 第二阶段：整体幕布升起（1.2s）
        // 整个容器 translateY: 0→-100%, opacity: 1→0
        animeAnimate(container, {
          translateY: ['0%', '-100%'],
          opacity: [1, 0],
          duration: 1200,
          easing: 'cubicBezier(0.22, 1, 0.36, 1)',
          delay: 500,
        })

        // 退场动画完成后通知 App（phase1 0.5s + phase2 delay 0.5s + phase2 duration 1.2s = 2.2s）
        setTimeout(() => {
          onComplete()
        }, 2200)
      } else {
        onComplete()
      }
    }

    // 点击/按键跳过
    const handleClick = () => triggerExit()
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') triggerExit()
    }
    document.addEventListener('click', handleClick)
    document.addEventListener('keydown', handleKey)
    s.listeners.push(() => document.removeEventListener('click', handleClick))
    s.listeners.push(() => document.removeEventListener('keydown', handleKey))

    // ── 文字动画 ──
    const runTextAnim = () => {
      const title = document.querySelector('.intro-title') as HTMLElement | null
      const subtitle = document.querySelector('.intro-subtitle') as HTMLElement | null
      const hint = document.querySelector('.intro-hint') as HTMLElement | null

      if (title) {
        animeAnimate(title, {
          opacity: [0, 1],
          translateX: [-60, 0],
          duration: 900,
          ease: 'easeOutQuart',
          delay: 1400,
        })
      }
      if (subtitle) {
        animeAnimate(subtitle, {
          opacity: [0, 1],
          translateX: [-40, 0],
          duration: 800,
          ease: 'easeOutQuart',
          delay: 1700,
        })
      }
      if (hint) {
        animeAnimate(hint, {
          opacity: [0, 0.5],
          duration: 600,
          ease: 'inOutQuad',
          delay: 2200,
        })
      }
    }

    // 确保 anime.js 可用后执行
    const timer = setTimeout(runTextAnim, 50)

    return () => {
      clearTimeout(timer)
      if (s.exitTimer) clearTimeout(s.exitTimer)
      cancelAnimationFrame(s.rafId)
      s.listeners.forEach((fn) => fn())
    }
  }, [drawFrame, onComplete, onExitStart])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #151210 0%, #0e0c0a 50%, #0a0908 100%)',
        cursor: 'pointer',
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />
      <div
        className="absolute inset-0 flex flex-col items-start justify-center px-8 md:px-16"
        style={{ pointerEvents: 'none' }}
      >
        <h1
          className="intro-title"
          style={{
            fontFamily: '"Bodoni Moda", serif',
            fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            opacity: 0,
            transform: 'translateX(-60px)',
          }}
        >
          <span style={{ color: '#d97757' }}>网课</span>小助手
        </h1>
        <p
          className="intro-subtitle"
          style={{
            fontFamily: '"Jost", sans-serif',
            fontSize: 'clamp(0.85rem, 1.3vw, 1.1rem)',
            color: '#aaa',
            marginTop: '1rem',
            letterSpacing: '0.06em',
            opacity: 0,
            transform: 'translateX(-40px)',
          }}
        >
          飘飘友情提供 · 智能网课助手
        </p>
        <p
          className="intro-hint"
          style={{
            fontFamily: '"Jost", sans-serif',
            fontSize: '0.75rem',
            color: '#666',
            marginTop: '2.5rem',
            letterSpacing: '0.08em',
            opacity: 0,
          }}
        >
          点击任意位置跳过
        </p>
      </div>
    </div>
  )
}
