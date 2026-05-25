import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, RefreshCw, CheckCircle2, XCircle, Clock, Activity } from 'lucide-react'
import { motion } from 'framer-motion'

const UPTIME_BASE = 'https://uptime.piao.one'
const STATUS_SLUG = 'tiku'
const API_KEY = 'uk1_L7l1KJ56-y3dAyiYcVlkkVNwScoMxFAgH2-yyxGe'

// API 返回时间不含时区，需要转为本地时间显示
function formatTime(timeStr: string) {
  if (!timeStr) return ''
  const date = new Date(timeStr + ' UTC')
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
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

interface Heartbeat {
  status: number
  time: string
  msg: string
  ping: number
}

interface StatusData {
  config: {
    title: string
  }
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
  lastCheck: string
  heartbeats: Heartbeat[]
}

interface StatusPageProps {
  onBack: () => void
}

export default function StatusPage({ onBack }: StatusPageProps) {
  const [monitors, setMonitors] = useState<MonitorStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${API_KEY}`,
      }

      const [statusRes, heartbeatRes] = await Promise.all([
        fetch(`${UPTIME_BASE}/api/status-page/${STATUS_SLUG}`, { headers }),
        fetch(`${UPTIME_BASE}/api/status-page/heartbeat/${STATUS_SLUG}`, { headers }),
      ])

      if (!statusRes.ok || !heartbeatRes.ok) {
        throw new Error(`API 请求失败: ${statusRes.status}`)
      }

      const statusData: StatusData = await statusRes.json()
      const heartbeatData: HeartbeatData = await heartbeatRes.json()

      const result: MonitorStatus[] = []

      for (const group of statusData.publicGroupList) {
        for (const monitor of group.monitorList) {
          const beats = heartbeatData.heartbeatList[String(monitor.id)] || []
          const latestBeat = beats[0]
          const uptimeKey = `${monitor.id}_24`
          const uptime = heartbeatData.uptimeList[uptimeKey] ?? 1

          // 取最近100条心跳用于显示条形图
          const recentBeats = beats.slice(0, 100).reverse()

          result.push({
            id: monitor.id,
            name: monitor.name,
            group: group.name,
            status: latestBeat ? (latestBeat.status === 1 ? 'up' : latestBeat.status === 0 ? 'down' : 'pending') : 'pending',
            uptime: Math.round(uptime * 10000) / 100,
            ping: latestBeat?.ping ?? 0,
            lastCheck: latestBeat?.time ?? '',
            heartbeats: recentBeats,
          })
        }
      }

      setMonitors(result)
      setLastUpdate(new Date().toLocaleTimeString('zh-CN'))
    } catch (err: any) {
      setError(err.message || '获取监控数据失败')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const timer = setInterval(fetchData, 60000)
    return () => clearInterval(timer)
  }, [fetchData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchData()
  }

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
            <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-body hover:bg-red-600 transition-colors cursor-pointer">
              重试
            </button>
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
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-brand-dark/40 hover:text-brand-orange transition-colors text-xs font-body cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {lastUpdate && `更新于 ${lastUpdate}`}
            </button>
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
