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
          className="text-brand-green transition-all duration-500"
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

  const getBarColor = (status: number, index: number, total: number) => {
    const opacity = index < total / 2 ? 'opacity-40' : 'opacity-100'
    if (status === 1) return `bg-brand-green ${opacity}`
    if (status === 0) return 'bg-red-400'
    return 'bg-yellow-400'
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
            <div className={`w-2 h-2 rounded-full ${allUp ? 'bg-brand-green' : 'bg-red-400'} animate-pulse`} />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-2xl border border-brand-light-gray/50 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-brand-green" />
              </div>
              <span className="text-sm font-body text-brand-dark/60">运行中</span>
            </div>
            <div className="flex items-baseline gap-1">
              <motion.span
                key={upCount}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-3xl font-heading font-bold text-brand-dark"
              >
                {upCount}
              </motion.span>
              <span className="text-lg font-heading text-brand-dark/40">/</span>
              <span className="text-lg font-heading text-brand-dark/40">{monitors.length}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-2xl border border-brand-light-gray/50 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-brand-green" />
              </div>
              <span className="text-sm font-body text-brand-dark/60">可用率</span>
            </div>
            <div className="flex items-center justify-center">
              <CircularProgress value={avgUptime} size={80} strokeWidth={6} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-2xl border border-brand-light-gray/50 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-brand-blue" />
              </div>
              <span className="text-sm font-body text-brand-dark/60">平均响应</span>
            </div>
            <div className="flex items-baseline gap-1">
              <motion.span
                key={avgPing}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-3xl font-heading font-bold text-brand-dark"
              >
                {avgPing}
              </motion.span>
              <span className="text-sm font-body text-brand-dark/40">ms</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`rounded-2xl p-6 mb-6 border ${allUp ? 'bg-brand-green/[0.04] border-brand-green/20' : 'bg-red-50 border-red-200/50'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${allUp ? 'bg-brand-green/10' : 'bg-red-100'}`}>
              {allUp ? (
                <CheckCircle2 className="w-8 h-8 text-brand-green" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2.5 h-2.5 rounded-full ${allUp ? 'bg-brand-green' : 'bg-red-400'} animate-pulse`} />
                <p className={`font-heading font-semibold text-lg ${allUp ? 'text-brand-green' : 'text-red-600'}`}>
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
                              ? 'bg-brand-green shadow-sm shadow-brand-green/30'
                              : monitor.status === 'down'
                              ? 'bg-red-400 shadow-sm shadow-red-400/30'
                              : 'bg-yellow-400 shadow-sm shadow-yellow-400/30'
                          }`}
                        />
                        <span className="font-heading font-semibold text-brand-dark text-sm md:text-base">{monitor.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-body">
                        <span className={`flex items-center gap-1 ${monitor.ping < 200 ? 'text-brand-green' : 'text-brand-orange'}`}>
                          <Clock className="w-3 h-3" />
                          {monitor.ping > 0 ? `${monitor.ping}ms` : '-'}
                        </span>
                        <span className={`font-semibold ${monitor.uptime >= 99 ? 'text-brand-green' : monitor.uptime >= 95 ? 'text-brand-orange' : 'text-red-500'}`}>
                          {monitor.uptime.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-end gap-px h-10 mb-2">
                      {monitor.heartbeats.map((beat, i) => (
                        <div
                          key={i}
                          className={`flex-1 min-w-[2px] rounded-sm transition-all hover:scale-y-110 ${getBarColor(beat.status, i, monitor.heartbeats.length)}`}
                          style={{ height: beat.status === 1 ? `${Math.max(20, Math.min(100, (beat.ping / 2000) * 100))}%` : '100%' }}
                          title={`${formatTime(beat.time)} · ${beat.status === 1 ? '正常' : '异常'}${beat.ping ? ` · ${beat.ping}ms` : ''}`}
                        />
                      ))}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-body text-brand-dark/25">
                        {formatTime(monitor.heartbeats[monitor.heartbeats.length - 1]?.time || '')}
                      </span>
                      <div className="flex items-center gap-2 flex-1 mx-3">
                        <div className="flex-1 bg-brand-light-gray/50 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${monitor.uptime}%` }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="bg-gradient-to-r from-brand-green to-brand-green/70 rounded-full h-full"
                          />
                        </div>
                      </div>
                      <span className="text-[10px] font-body text-brand-dark/25">
                        {formatTime(monitor.heartbeats[0]?.time || '')}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="bg-gradient-to-br from-brand-blue/[0.04] to-transparent rounded-2xl border border-brand-blue/10 p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
              <Search className="w-4 h-4 text-brand-blue" />
            </div>
            <h3 className="font-heading font-semibold text-brand-dark">快速排查指南</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm font-body">
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-brand-light-gray/50">
              <Wifi className="w-4 h-4 text-brand-green" />
              <span className="text-brand-dark/70">检查网络连接</span>
            </div>
            <span className="text-brand-dark/30">→</span>
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-brand-light-gray/50">
              <Trash2 className="w-4 h-4 text-brand-orange" />
              <span className="text-brand-dark/70">清除浏览器缓存</span>
            </div>
            <span className="text-brand-dark/30">→</span>
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-brand-light-gray/50">
              <UserCircle className="w-4 h-4 text-brand-blue" />
              <span className="text-brand-dark/70">联系管理员</span>
            </div>
          </div>
        </motion.div>

        <div className="text-center pt-4 border-t border-brand-light-gray/30">
          <p className="text-xs font-body text-brand-dark/30">
            数据每 60 秒自动刷新 · 24 小时可用率统计
          </p>
        </div>
      </motion.div>
    </div>
  )
}
