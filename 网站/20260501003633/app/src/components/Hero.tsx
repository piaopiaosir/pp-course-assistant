import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Sparkles } from 'lucide-react'

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

interface StatsData {
  totalQueries: number
  todayQueries: number
  hourlyRate: number
}

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    // 延迟一帧，确保 DOM 挂载完毕，避免 useScroll 读取 null ref
    const timer = requestAnimationFrame(() => {
      if (ref.current) setReady(true)
    })
    return () => cancelAnimationFrame(timer)
  }, [])

  useEffect(() => {
    // 通过 SSE 实时接收统计数据（后端每5秒轮询数据库并推送）
    const es = new EventSource('/api/proxy/stats-stream')
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data) setStats(data)
      } catch (_) {
        // 忽略解析错误
      }
    }
    es.onerror = () => {
      // SSE 断开后浏览器会自动重连，无需处理
    }
    return () => es.close()
  }, [])

  const { scrollYProgress } = useScroll({
    target: ready && ref.current ? ref : undefined,
    offset: ['start start', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[600px] md:h-[600px] bg-brand-blue/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] md:w-[500px] md:h-[500px] bg-brand-orange/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[550px] sm:h-[550px] md:w-[800px] md:h-[800px] bg-brand-green/5 rounded-full blur-3xl" />
      </div>

      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#141413 1px, transparent 1px), linear-gradient(90deg, #141413 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        style={{ y, opacity }}
        className="section-container relative z-10 text-center py-16 sm:py-20 md:py-32"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-light-gray/50 border border-brand-light-gray mb-8"
        >
          <Sparkles className="w-4 h-4 text-brand-orange" />
          <span className="text-sm font-body font-medium text-brand-dark/60">
            飘飘友情提供 · 智能网课助手
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading text-3xl xs:text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold leading-[1.05] tracking-tight mb-4 md:mb-6"
        >
          <span className="gradient-text">网课小助手</span>
          <br />
          <span className="text-brand-dark">飘飘友情提供</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl font-body text-brand-dark/50 leading-relaxed mb-8 md:mb-10 px-4 sm:px-0"
        >
          考试 · 视频 · 章节测验，一键自动化完成
          <br className="hidden sm:block" />
          智能答题，高效播放，安全可靠，让网课不再烦恼
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col xs:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <button
            onClick={() => scrollToSection('features')}
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 font-body font-medium text-brand-dark/60 hover:text-brand-dark border border-brand-light-gray rounded-full hover:border-brand-dark/20 transition-all duration-300 cursor-pointer text-sm sm:text-base"
          >
            了解更多
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-12 sm:mt-16 md:mt-20 flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-16"
        >
          {[ 
            { value: stats ? stats.totalQueries.toLocaleString() : '—', label: '总查询次数' },
            { value: stats ? stats.todayQueries.toLocaleString() : '—', label: '今日查询次数' },
            { value: stats ? `${stats.hourlyRate}/h` : '—', label: '近一小时查询速率' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-heading text-3xl md:text-4xl font-semibold text-brand-dark">
                {stat.value}
              </div>
              <div className="text-sm font-body text-brand-dark/40 mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-5 h-8 rounded-full border-2 border-brand-dark/15 flex items-start justify-center p-1"
        >
          <div className="w-1 h-2 rounded-full bg-brand-orange/60" />
        </motion.div>
      </motion.div>
    </section>
  )
}
