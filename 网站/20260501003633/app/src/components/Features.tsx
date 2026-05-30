import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Brain,
  Zap,
  Shield,
  Layers,
  Monitor,
  Sparkles,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Brain,
    title: '智能答题',
    description: 'AI 驱动的精准答题系统，平均准确率 90%+，覆盖多种题型与场景。',
    color: 'brand-orange',
  },
  {
    icon: Zap,
    title: '高效播放',
    description: '自动处理视频与文档任务，智能模拟播放进度，后台静默运行不打扰。',
    color: 'brand-blue',
  },
  {
    icon: Layers,
    title: '全流程覆盖',
    description: '从进入课程到完成所有任务点，一键自动化，失败自动重试。',
    color: 'brand-green',
  },
  {
    icon: Shield,
    title: '安全优先',
    description: '本地运行，数据不上传。仅上传最少必要信息用于题目匹配，隐私有保障。',
    color: 'brand-orange',
  },
  {
    icon: Monitor,
    title: '单页面运行',
    description: '无需多标签页切换，一个页面完成所有操作，简洁高效。',
    color: 'brand-blue',
  },
  {
    icon: Sparkles,
    title: '持续更新',
    description: '紧跟平台变化，持续迭代优化，确保功能始终可用。',
    color: 'brand-green',
  },
] as const

const COLOR_STYLES = {
  'brand-orange': {
    border: 'group-hover:border-brand-orange',
    iconBg: 'bg-brand-orange/10 text-brand-orange',
    glow: 'bg-brand-orange/[0.03]',
  },
  'brand-blue': {
    border: 'group-hover:border-brand-blue',
    iconBg: 'bg-brand-blue/15 text-brand-blue',
    glow: 'bg-brand-blue/[0.04]',
  },
  'brand-green': {
    border: 'group-hover:border-brand-green',
    iconBg: 'bg-brand-green/10 text-brand-green',
    glow: 'bg-brand-green/[0.03]',
  },
} as const

export default function Features() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="features" className="relative py-16 sm:py-20 md:py-32">
      <div className="section-container" ref={ref}>
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <motion.span
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-body text-sm font-medium text-brand-orange uppercase tracking-widest block"
          >
            Features
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-heading text-3xl xs:text-4xl md:text-5xl lg:text-6xl font-semibold text-brand-dark mt-4 mb-4 md:mb-6"
          >
            功能亮点
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-xl mx-auto text-base sm:text-lg font-body text-brand-dark/40 leading-relaxed"
          >
            精心设计的每一个功能，为你提供极致的自动化体验
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {FEATURES.map((feature, index) => {
            const styles = COLOR_STYLES[feature.color]
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.65,
                  delay: 0.9 + Math.pow(index, 0.7) * 0.12,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                whileHover={{ y: -4, transition: { duration: 0.3 } }}
                className={`group relative p-6 sm:p-8 md:p-10 rounded-2xl border border-transparent ${styles.border} bg-white/40 hover:bg-white/80 transition-all duration-500 hover:shadow-xl hover:shadow-black/5`}
              >
                {/* Hover glow */}
                <div
                  className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${styles.glow}`}
                />

                <div className="relative">
                  <motion.div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 ${styles.iconBg}`}
                    whileHover={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <feature.icon className="w-6 h-6" />
                  </motion.div>
                  <h3 className="font-heading text-xl font-semibold text-brand-dark/80 group-hover:text-brand-dark mb-3 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="font-body text-brand-dark/45 leading-relaxed group-hover:text-brand-dark/70 transition-opacity duration-300">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
