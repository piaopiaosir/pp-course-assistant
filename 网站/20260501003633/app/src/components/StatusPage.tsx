import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, CheckCircle2, XCircle, Clock, Activity } from 'lucide-react'
import { motion } from 'framer-motion'

const SSE_URL = '/api/proxy/uptime-stream'

// API 返回时间不含时区，需要转为本地时间显示
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

export default function StatusPage({ onBack }: StatusPageProps) {
  const [monitors, setMonitors] = useState<MonitorStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState('')
  const eventSourceRef = useRef<EventSource | null>(null)

  // 解析后端推送的数据
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

  const getBarColor = (status: number) => {
    if (status === 1) return 'bg-emerald-400'
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
        <div className="section-container flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
            <span className="text-sm font-body text-brand-dark/40">加载监控数据中...</span>
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
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-600 font-body text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // 按组分类
  const groups = monitors.reduce<Record<string, MonitorStatus[]>>((acc, m) => {
    if (!acc[m.group]) acc[m.group] = []
    acc[m.group].push(m)
    return acc
  }, {})

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
        <div className="w-20" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="section-container pb-12"
      >
        {/* 总览卡片 */}
        <div className={`rounded-xl p-5 mb-6 border ${allUp ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {allUp ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              <div>
                <p className={`font-heading font-semibold ${allUp ? 'text-emerald-700' : 'text-red-700'}`}>
                  {allUp ? '所有服务运行正常' : '部分服务异常'}
                </p>
                <p className="text-xs font-body text-brand-dark/40 mt-0.5">
                  共 {monitors.length} 个监控项 · {monitors.filter(m => m.status === 'up').length} 正常
                </p>
              </div>
            </div>
            {lastUpdate && (
              <span className="text-xs font-body text-brand-dark/30">
                更新于 {lastUpdate}
              </span>
            )}
          </div>
        </div>

        {/* 监控组 */}
        {Object.entries(groups).map(([groupName, groupMonitors], groupIdx) => (
          <div key={groupName} className="mb-6">
            <h2 className="text-sm font-heading font-semibold text-brand-dark/60 mb-3 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              {groupName}
            </h2>
            <div className="space-y-3">
              {groupMonitors.map((monitor, idx) => (
                <motion.div
                  key={monitor.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIdx * 0.1 + idx * 0.05, duration: 0.3 }}
                  className="bg-white rounded-xl border border-brand-light-gray p-4 md:p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${monitor.status === 'up' ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : monitor.status === 'down' ? 'bg-red-400 shadow-sm shadow-red-400/50' : 'bg-yellow-400 shadow-sm shadow-yellow-400/50'}`} />
                      <span className="font-heading font-semibold text-brand-dark text-sm md:text-base">{monitor.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-body text-brand-dark/40">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {monitor.ping > 0 ? `${monitor.ping}ms` : '-'}
                      </span>
                      <span className={`font-semibold ${monitor.uptime >= 99 ? 'text-emerald-600' : monitor.uptime >= 95 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {monitor.uptime.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* 心跳条形图 */}
                  <div className="flex items-end gap-px h-6">
                    {monitor.heartbeats.map((beat, i) => (
                      <div
                        key={i}
                        className={`flex-1 min-w-[2px] rounded-sm transition-all ${getBarColor(beat.status)}`}
                        style={{ height: beat.status === 1 ? `${Math.max(15, Math.min(100, (beat.ping / 2000) * 100))}%` : '100%' }}
                        title={`${formatTime(beat.time)} · ${beat.status === 1 ? '正常' : '异常'}${beat.ping ? ` · ${beat.ping}ms` : ''}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] font-body text-brand-dark/25">
                      {formatTime(monitor.heartbeats[0]?.time || '')}
                    </span>
                    <span className="text-[10px] font-body text-brand-dark/25">
                      {formatTime(monitor.heartbeats[monitor.heartbeats.length - 1]?.time || '')}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {/* 底部说明 */}
        <div className="text-center mt-8">
          <p className="text-xs font-body text-brand-dark/25">
            数据每 60 秒自动刷新 · 24 小时可用率统计
          </p>
        </div>
      </motion.div>
    </div>
  )
}
