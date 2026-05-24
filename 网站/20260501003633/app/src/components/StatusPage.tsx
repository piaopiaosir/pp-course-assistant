import { useState } from 'react'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'

const UPTIME_STATUS_URL = 'https://uptime.piao.one/status/tiku'

interface StatusPageProps {
  onBack: () => void
}

export default function StatusPage({ onBack }: StatusPageProps) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="min-h-screen bg-brand-light pt-14 md:pt-20">
      {/* Header */}
      <div className="section-container py-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-brand-dark/60 hover:text-brand-orange transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-body font-medium">返回首页</span>
        </button>
        <h1 className="text-lg md:text-xl font-heading font-semibold text-brand-dark">服务监控</h1>
        <a
          href={UPTIME_STATUS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-brand-dark/40 hover:text-brand-orange transition-colors text-xs font-body"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          新窗口打开
        </a>
      </div>

      {/* iframe Container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="section-container pb-12"
      >
        <div className="relative w-full rounded-xl overflow-hidden border border-brand-light-gray bg-white shadow-sm" style={{ minHeight: '600px' }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-brand-light/80 z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
                <span className="text-sm font-body text-brand-dark/40">加载监控面板中...</span>
              </div>
            </div>
          )}
          <iframe
            src={UPTIME_STATUS_URL}
            title="服务监控"
            className="w-full border-0"
            style={{ minHeight: '700px', height: '80vh' }}
            onLoad={() => setIsLoading(false)}
            allow="clipboard-write"
          />
        </div>
      </motion.div>
    </div>
  )
}
