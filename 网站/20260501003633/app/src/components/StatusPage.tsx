import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, CheckCircle2, XCircle, Clock, Activity, Search, RefreshCw, Wifi, Trash2, UserCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const SSE_URL = '/api/proxy/uptime-stream'

function formatTime(timeStr: string) {
  if (!timeStr) return ''
  const date = new Date(timeStr + ' UTC')
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

interface Heartbeat {
  status: number
  time: string
  msg: string
  ping: number
}

interface MonitorInfo {
  id: number
  name: string
  type: string
  sendUrl: number
}

interface MonitorGroup {
  id: number
  name: string
  weight: number
  monitorList: MonitorInfo[]
}

interface StatusData {
  config: { title: string }
  publicGroupList: MonitorGroup[]
  incidents: any[]
}

interface HeartbeatData {
  heartbeatList: Record<string, Heartbeat[]>
  uptimeList: Record<string, number>
}

interface MonitorStatus {
  id: number
  name: string
  group: string
  status: 'up' | 'down' | 'pending'
  uptime: number
  ping: number
  heartbeats: Heartbeat[]
}

interface StatusPageProps {
  onBack: () => void
}

function CircularProgress({ value, size = 80, strokeWidth = 6 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-brand-light-gray/50"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-emerald-400 transition-all duration-500"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-heading font-bold text-brand-dark">{value.toFixed(1)}%</span>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-brand-light-gray/50 p-5 animate-pulse">
      <div className="h-4 bg-brand-light-gray/30 rounded w-1/3 mb-3" />
      <div className="h-8 bg-brand-light-gray/30 rounded w-1/2 mb-2" />
      <div className="h-3 bg-brand-light-gray/20 rounded w-2/3" />
    </div>
  )
}

function MonitorSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-brand-light-gray/50 p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-brand-light-gray/30 rounded-full" />
          <div className="h-4 bg-brand-light-gray/30 rounded w-32" />
        </div>
        <div className="h-3 bg-brand-light-gray/20 rounded w-16" />
      </div>
      <div className="flex items-end gap-px h-10 mb-2">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="flex-1 min-w-[2px] bg-brand-light-gray/20 rounded-sm" style={{ height: `${Math.random() * 60 + 20}%` }} />
        ))}
      </div>
      <div className="flex justify-between">
        <div className="h-2 bg-brand-light-gray/20 rounded w-12" />
        <div className="h-2 bg-brand-light-gray/20 rounded w-12" />
      </div>
    </div>
  )
}

export default function StatusPage({ onBack }: StatusPageProps) {
  const [monitors, setMonitors] = useState<MonitorStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState('')
  const eventSourceRef = useRef<EventSource | null>(null)

  const processData = (statusData: StatusData, heartbeatData: HeartbeatData) => {
    const result: MonitorStatus[] = []
    for (const group of statusData.publicGroupList) {
      for (const monitor of group.monitorList) {
        const beats = heartbeatData.heartbeatList[String(monitor.id)] || []
        const latestBeat = beats[0]
        const uptimeKey = `${monitor.id}_24`
        const uptime = heartbeatData.uptimeList[uptimeKey] ?? 1
        const recentBeats = beats.slice(0, 100)

        result.push({
          id: monitor.id,
          name: monitor.name,
          group: group.name,
          status: latestBeat ? (latestBeat.status === 1 ? 'up' : latestBeat.status === 0 ? 'down' : 'pending') : 'pending',
          uptime: Math.round(uptime * 10000) / 100,
          ping: latestBeat?.ping ?? 0,
          heartbeats: recentBeats,
        })
      }
    }
    setMonitors(result)
    setLastUpdate(new Date().toLocaleTimeString('zh-CN'))
  }

  useEffect(() => {
    const es = new EventSource(SSE_URL)
    eventSourceRef.current = es

    es.onmessage = (event) => {
      try {
        const { statusData, heartbeatData } = JSON.parse(event.data)
        processData(statusData, heartbeatData)
        setIsLoading(false)
        setError(null)
      } catch {}
    }

    es.onerror = () => {
      es.close()
      setError('监控数据连接失败')
      setIsLoading(false)
    }

    return () => {
      es.close()
    }
  }, [])

  const allUp = monitors.length > 0 && monitors.every(m => m.status === 'up')
  const upCount = monitors.filter(m => m.status === 'up').length
  const avgPing = monitors.length > 0 ? Math.round(monitors.reduce((sum, m) => sum + m.ping, 0) / monitors.length) : 0
  const avgUptime = monitors.length > 0 ? monitors.reduce((sum, m) => sum + m.uptime, 0) / monitors.length : 0

  const getBarColor = (status: number) => {
    if (status === 1) return 'bg-emerald-400'
    if (status === 0) return 'bg-red-400'
    return 'bg-yellow-400'
  }

  const getBarOpacity = (index: number, total: number) => {
    // 从旧到新透明度平滑过渡：0.3 → 1.0
    const ratio = total > 1 ? index / (total - 1) : 1
    return 0.3 + ratio * 0.7
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-light pt-14 md:pt-20">
        <div className="section-container py-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-brand-dark/60 hover:text-brand-orange transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-body font-medium">返回首页</span>
          </button>
          <h1 className="text-lg md:text-xl font-heading font-semibold text-brand-dark">服务监控</h1>
          <div className="w-20" />
        </div>
        <div className="section-container pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="space-y-3">
            <MonitorSkeleton />
            <MonitorSkeleton />
            <MonitorSkeleton />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-light pt-14 md:pt-20">
        <div className="section-container py-6 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-brand-dark/60 hover:text-brand-orange transition-colors cursor-pointer group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-body font-medium">返回首页</span>
          </button>
          <h1 className="text-lg md:text-xl font-heading font-semibold text-brand-dark">服务监控</h1>
          <div className="w-20" />
        </div>
        <div className="section-container py-16">
          <div className="bg-white rounded-2xl border border-red-200/50 p-8 text-center max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-red-600 font-body text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-body font-medium hover:bg-brand-orange/90 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              重新连接
            </button>
          </div>
        </div>
      </div>
    )
  }

  const groups = monitors.reduce<Record<string, MonitorStatus[]>>((acc, m) => {
    if (!acc[m.group]) acc[m.group] = []
    acc[m.group].push(m)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-brand-light pt-14 md:pt-20">
      <div className="section-container py-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-brand-dark/60 hover:text-brand-orange transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-body font-medium">返回首页</span>
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-lg md:text-xl font-heading font-semibold text-brand-dark">服务监控</h1>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${allUp ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
            <span className="text-xs font-body text-brand-dark/50">实时监控中</span>
          </div>
        </div>
        <div className="w-20" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="section-container pb-12"
      >
        {lastUpdate && (
          <div className="text-right mb-4">
            <span className="text-xs font-body text-brand-dark/40">最后更新: {lastUpdate}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {/* 运行中卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="group relative glass-card overflow-hidden cursor-default transition-all duration-500 hover:shadow-[0_8px_32px_rgba(120,140,93,0.15)] hover:border-brand-green/30"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-green/10 rounded-full blur-2xl group-hover:bg-brand-green/20 transition-colors duration-500" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-emerald-400/8 rounded-full blur-xl group-hover:bg-emerald-400/15 transition-colors duration-500" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-green to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-green/20 group-hover:shadow-brand-green/40 transition-shadow duration-500">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-body font-medium text-brand-dark/60 group-hover:text-brand-dark/80 transition-colors duration-300">运行中</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-green/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                  <span className="text-[10px] font-body font-medium text-brand-green tracking-wide uppercase">Live</span>
                </div>
              </div>
              <div className="mb-5">
                <span className="text-5xl font-heading font-bold tracking-tight bg-gradient-to-br from-brand-dark via-brand-dark/90 to-brand-green bg-clip-text text-transparent">
                  {upCount}
                </span>
                <span className="text-2xl font-heading font-medium text-brand-dark/20 ml-0.5">/{monitors.length}</span>
              </div>
              <div className="relative h-2 bg-brand-green/8 rounded-full overflow-hidden mb-3">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-green/5 to-brand-green/10 rounded-full" />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${monitors.length > 0 ? (upCount / monitors.length) * 100 : 0}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="relative h-full bg-gradient-to-r from-brand-green to-emerald-400 rounded-full shadow-sm shadow-brand-green/30"
                />
              </div>
              <p className="text-xs font-body text-brand-dark/40 group-hover:text-brand-dark/60 transition-colors duration-300">
                {upCount === monitors.length ? '所有服务正常运行' : `${monitors.length - upCount} 个服务异常`}
              </p>
            </div>
          </motion.div>

          {/* 可用率卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="group relative glass-card overflow-hidden cursor-default transition-all duration-500 hover:shadow-[0_8px_32px_rgba(106,155,204,0.15)] hover:border-brand-blue/30"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-blue/10 rounded-full blur-2xl group-hover:bg-brand-blue/20 transition-colors duration-500" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-sky-400/8 rounded-full blur-xl group-hover:bg-sky-400/15 transition-colors duration-500" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-sky-400 flex items-center justify-center shadow-lg shadow-brand-blue/20 group-hover:shadow-brand-blue/40 transition-shadow duration-500">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-body font-medium text-brand-dark/60 group-hover:text-brand-dark/80 transition-colors duration-300">可用率</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-blue/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
                  <span className="text-[10px] font-body font-medium text-brand-blue tracking-wide uppercase">24h</span>
                </div>
              </div>
              <div className="mb-5">
                <span className="text-5xl font-heading font-bold tracking-tight bg-gradient-to-br from-brand-dark via-brand-dark/90 to-brand-blue bg-clip-text text-transparent">
                  {avgUptime.toFixed(1)}
                </span>
                <span className="text-2xl font-heading font-medium text-brand-dark/20 ml-0.5">%</span>
              </div>
              <div className="relative h-2 bg-brand-blue/8 rounded-full overflow-hidden mb-3">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/5 to-brand-blue/10 rounded-full" />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${avgUptime}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="relative h-full bg-gradient-to-r from-brand-blue to-sky-400 rounded-full shadow-sm shadow-brand-blue/30"
                />
              </div>
              <p className="text-xs font-body text-brand-dark/40 group-hover:text-brand-dark/60 transition-colors duration-300">过去24小时可用率</p>
            </div>
          </motion.div>

          {/* 平均响应卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="group relative glass-card overflow-hidden cursor-default transition-all duration-500 hover:shadow-[0_8px_32px_rgba(217,119,87,0.15)] hover:border-brand-orange/30"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-orange/10 rounded-full blur-2xl group-hover:bg-brand-orange/20 transition-colors duration-500" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-amber-400/8 rounded-full blur-xl group-hover:bg-amber-400/15 transition-colors duration-500" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-orange to-amber-400 flex items-center justify-center shadow-lg shadow-brand-orange/20 group-hover:shadow-brand-orange/40 transition-shadow duration-500">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-body font-medium text-brand-dark/60 group-hover:text-brand-dark/80 transition-colors duration-300">平均响应</span>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${avgPing < 800 ? 'bg-brand-green/10' : avgPing < 1500 ? 'bg-amber-400/10' : 'bg-red-400/10'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${avgPing < 800 ? 'bg-brand-green' : avgPing < 1500 ? 'bg-amber-400' : 'bg-red-400'} animate-pulse`} />
                  <span className={`text-[10px] font-body font-medium tracking-wide uppercase ${avgPing < 800 ? 'text-brand-green' : avgPing < 1500 ? 'text-amber-500' : 'text-red-400'}`}>
                    {avgPing < 800 ? 'Fast' : avgPing < 1500 ? 'Normal' : 'Slow'}
                  </span>
                </div>
              </div>
              <div className="mb-5">
                <span className="text-5xl font-heading font-bold tracking-tight bg-gradient-to-br from-brand-dark via-brand-dark/90 to-brand-orange bg-clip-text text-transparent">
                  {avgPing}
                </span>
                <span className="text-2xl font-heading font-medium text-brand-dark/20 ml-0.5">ms</span>
              </div>
              <div className={`relative h-2 rounded-full overflow-hidden mb-3 ${avgPing < 800 ? 'bg-brand-green/8' : avgPing < 1500 ? 'bg-amber-400/8' : 'bg-red-400/8'}`}>
                <div className={`absolute inset-0 rounded-full ${avgPing < 800 ? 'bg-gradient-to-r from-brand-green/5 to-brand-green/10' : avgPing < 1500 ? 'bg-gradient-to-r from-amber-400/5 to-amber-400/10' : 'bg-gradient-to-r from-red-400/5 to-red-400/10'}`} />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: avgPing < 800 ? '30%' : avgPing < 1500 ? '60%' : '90%' }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative h-full rounded-full shadow-sm ${avgPing < 800 ? 'bg-gradient-to-r from-brand-green to-emerald-400 shadow-brand-green/30' : avgPing < 1500 ? 'bg-gradient-to-r from-amber-400 to-orange-400 shadow-brand-orange/30' : 'bg-gradient-to-r from-red-400 to-red-500 shadow-red-400/30'}`}
                />
              </div>
              <p className="text-xs font-body text-brand-dark/40 group-hover:text-brand-dark/60 transition-colors duration-300">
                {avgPing < 800 ? '响应速度良好' : avgPing < 1500 ? '响应速度一般' : '响应速度较慢'}
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`rounded-2xl p-6 mb-6 border ${allUp ? 'bg-emerald-400/[0.04] border-emerald-400/20' : 'bg-red-50 border-red-200/50'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${allUp ? 'bg-emerald-400/10' : 'bg-red-100'}`}>
              {allUp ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2.5 h-2.5 rounded-full ${allUp ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
                <p className={`font-heading font-semibold text-lg ${allUp ? 'text-emerald-500' : 'text-red-600'}`}>
                  {allUp ? '所有服务运行正常' : '部分服务异常'}
                </p>
              </div>
              <p className="text-sm font-body text-brand-dark/50">
                共 {monitors.length} 个监控项 · {upCount} 个正常运行 · {monitors.length - upCount} 个异常
              </p>
            </div>
          </div>
        </motion.div>

        {Object.entries(groups).map(([groupName, groupMonitors], groupIdx) => (
          <motion.div
            key={groupName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + groupIdx * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <h2 className="text-sm font-heading font-semibold text-brand-dark/60 mb-3 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              {groupName}
            </h2>
            <div className="space-y-3">
              <AnimatePresence>
                {groupMonitors.map((monitor, idx) => (
                  <motion.div
                    key={monitor.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    className={`bg-white rounded-2xl border p-5 transition-all ${
                      monitor.status === 'down'
                        ? 'border-red-200 animate-[alert-flash_1.5s_ease-in-out_infinite]'
                        : 'border-brand-light-gray/50 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            monitor.status === 'up'
                              ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                              : monitor.status === 'down'
                              ? 'bg-red-400 shadow-sm shadow-red-400/30'
                              : 'bg-yellow-400 shadow-sm shadow-yellow-400/30'
                          }`}
                        />
                        <span className="font-heading font-semibold text-brand-dark text-sm md:text-base">{monitor.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-body">
                        <span className={`flex items-center gap-1 ${monitor.ping < 200 ? 'text-emerald-500' : 'text-brand-orange'}`}>
                          <Clock className="w-3 h-3" />
                          {monitor.ping > 0 ? `${monitor.ping}ms` : '-'}
                        </span>
                        <span className={`font-semibold ${monitor.uptime >= 99 ? 'text-emerald-500' : monitor.uptime >= 95 ? 'text-brand-orange' : 'text-red-500'}`}>
                          {monitor.uptime.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-end gap-px h-10 mb-2">
                      {monitor.heartbeats.map((beat, i) => (
                        <div
                          key={i}
                          className={`flex-1 min-w-[2px] rounded-sm transition-all hover:scale-y-110 ${getBarColor(beat.status)}`}
                          style={{
                            height: beat.status === 1 ? `${Math.max(20, Math.min(100, (beat.ping / 2000) * 100))}%` : '100%',
                            opacity: getBarOpacity(i, monitor.heartbeats.length),
                          }}
                          title={`${formatTime(beat.time)} · ${beat.status === 1 ? '正常' : '异常'}${beat.ping ? ` · ${beat.ping}ms` : ''}`}
                        />
                      ))}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-body text-brand-dark/25">
                        {formatTime(monitor.heartbeats[0]?.time || '')}
                      </span>
                      <div className="flex items-center gap-2 flex-1 mx-3">
                        <div className="flex-1 bg-brand-light-gray/50 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${monitor.uptime}%` }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="bg-gradient-to-r from-emerald-400 to-emerald-400/70 rounded-full h-full"
                          />
                        </div>
                      </div>
                      <span className="text-[10px] font-body text-brand-dark/25">
                        {formatTime(monitor.heartbeats[monitor.heartbeats.length - 1]?.time || '')}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}

        <div className="text-center pt-4 border-t border-brand-light-gray/30">
          <p className="text-xs font-body text-brand-dark/30">
            数据每 60 秒自动刷新 · 24 小时可用率统计
          </p>
        </div>
      </motion.div>
    </div>
  )
}
