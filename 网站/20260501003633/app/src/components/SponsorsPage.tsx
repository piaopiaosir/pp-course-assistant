import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Sparkles, Zap, Check, X, Loader2, AlertCircle, Copy, CheckCircle } from 'lucide-react'

const PLANS = [
  { name: '500次', price: '4.80', queries: '500', color: 'brand-blue', popular: false },
  { name: '1288次', price: '9.60', queries: '1,288', color: 'brand-green', popular: true },
  { name: '2500次', price: '15.69', queries: '2,500', color: 'brand-orange', popular: false },
]

interface SponsorsPageProps {
  onBack: () => void
}

// ==================== PlanCard ====================

function PlanCard({
  plan, index, onBuy, loading,
}: {
  plan: (typeof PLANS)[number]; index: number; onBuy: () => void; loading: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative p-6 sm:p-8 rounded-2xl border transition-all duration-500 ${plan.popular ? 'border-brand-orange/30 bg-brand-orange/[0.03] shadow-lg shadow-brand-orange/5' : 'border-brand-light-gray bg-white/60 hover:border-brand-dark/15 hover:bg-white/90'}`}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-orange text-white text-xs font-body font-semibold rounded-full whitespace-nowrap shadow-lg shadow-brand-orange/20">推荐</div>
      )}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 ${plan.color === 'brand-orange' ? 'bg-brand-orange/10 text-brand-orange' : plan.color === 'brand-blue' ? 'bg-brand-blue/15 text-brand-blue' : 'bg-brand-green/10 text-brand-green'}`}>
        <Zap className="w-5 h-5" />
      </div>
      <h3 className="font-heading text-lg sm:text-xl font-semibold text-brand-dark mb-2">{plan.name}</h3>
      <p className="text-sm font-body text-brand-dark/40 mb-4">赞助{plan.price}获{plan.queries}次答题次数</p>
      <div className="flex items-baseline gap-0.5 mb-5">
        <span className="text-sm font-body text-brand-dark/50">￥</span>
        <span className="font-heading text-3xl sm:text-4xl font-semibold text-brand-dark">{plan.price}</span>
      </div>
      <ul className="space-y-2.5 mb-6">
        {['永久有效 · 不过期', '脚本全模式通用'].map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
            <span className="text-sm font-body text-brand-dark/45">{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onBuy}
        disabled={loading}
        className={`w-full py-2.5 sm:py-3 rounded-xl font-body text-sm font-semibold transition-all duration-300 border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${plan.popular ? 'bg-brand-orange text-white border-brand-orange hover:bg-brand-orange/90' : 'bg-brand-dark text-brand-light border-brand-dark hover:bg-brand-dark/90'}`}
      >
        {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />处理中...</span> : '赞助支持'}
      </button>
    </motion.div>
  )
}

// ==================== EmailModal ====================

function EmailModal({
  planName, onClose, onSubmit, loading, error, statusHint,
}: {
  planName: string; onClose: () => void; onSubmit: (code: string, email: string, paymentMethod: string) => void; loading: boolean; error: string | null; statusHint?: string
}) {
  const [code, setCode] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('alipay')

  const handleSubmit = () => {
    if (!code.trim()) return
    onSubmit(code.trim(), userEmail.trim(), paymentMethod)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-brand-dark/50 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="relative w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-lg font-semibold text-brand-dark">赞助 · {planName}</h3>
          <button onClick={onClose} disabled={loading} className="w-7 h-7 rounded-full flex items-center justify-center text-brand-dark/40 hover:text-brand-dark hover:bg-brand-light-gray/50 transition-colors cursor-pointer disabled:opacity-30"><X className="w-4 h-4" /></button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* 赞助查询暗号 */}
        <div className="mb-4">
          <label className="block text-sm font-body font-medium text-brand-dark/70 mb-1.5">赞助查询暗号</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[\u4e00-\u9fff]/g, ''))}
            placeholder="请设置您的赞助查询暗号（至少6位）"
            disabled={loading}
            className="w-full px-3.5 py-2.5 rounded-lg border border-brand-light-gray bg-brand-light/50 text-sm font-body text-brand-dark placeholder:text-brand-dark/25 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20 transition-colors disabled:opacity-50"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* 邮箱（后期接入邮局服务发送卡密） */}
        <div className="mb-4">
          <label className="block text-sm font-body font-medium text-brand-dark/70 mb-1.5">
            接收邮箱 <span className="text-brand-dark/25 font-normal">（选填，后期将用于发送卡密）</span>
          </label>
          <div className="flex rounded-lg border border-brand-light-gray bg-brand-light/50 focus-within:border-brand-orange focus-within:ring-1 focus-within:ring-brand-orange/20 transition-colors overflow-hidden">
            <input
              type="text"
              value={userEmail.split('@')[0]}
              onChange={(e) => {
                const domain = userEmail.includes('@') ? '@' + userEmail.split('@')[1] : '@qq.com'
                setUserEmail(e.target.value + domain)
              }}
              placeholder="用户名"
              disabled={loading}
              className="flex-1 px-3.5 py-2.5 bg-transparent text-sm font-body text-brand-dark placeholder:text-brand-dark/25 outline-none border-r border-brand-light-gray disabled:opacity-50 min-w-0"
            />
            <select
              value={userEmail.includes('@') ? '@' + userEmail.split('@')[1] : '@qq.com'}
              onChange={(e) => {
                const name = userEmail.split('@')[0] || ''
                setUserEmail(name + e.target.value)
              }}
              disabled={loading}
              className="px-2 py-2.5 bg-transparent text-sm font-body text-brand-dark outline-none cursor-pointer disabled:opacity-50 min-w-0 appearance-none"
            >
              <option value="@qq.com">@qq.com</option>
              <option value="@163.com">@163.com</option>
              <option value="@126.com">@126.com</option>
              <option value="@outlook.com">@outlook.com</option>
              <option value="@gmail.com">@gmail.com</option>
              <option value="@foxmail.com">@foxmail.com</option>
              <option value="@sina.com">@sina.com</option>
            </select>
          </div>
        </div>

        {/* 赞助通道 */}
        <div className="mb-5">
          <label className="block text-sm font-body font-medium text-brand-dark/70 mb-2">赞助通道</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'alipay', label: '支付宝', icon: '💙' },
              { key: 'wechat', label: '微信支付', icon: '💚' },
            ].map((pm) => (
              <button
                key={pm.key}
                onClick={() => setPaymentMethod(pm.key)}
                disabled={loading}
                className={`p-3 rounded-xl border-2 text-sm font-body font-medium transition-all cursor-pointer disabled:opacity-50 ${paymentMethod === pm.key ? 'border-brand-orange bg-brand-orange/5 text-brand-orange' : 'border-brand-light-gray text-brand-dark/50 hover:border-brand-dark/20'}`}
              >
                <span className="mr-1.5">{pm.icon}</span>{pm.label}
              </button>
            ))}
          </div>
        </div>

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          disabled={loading || !code.trim()}
          className="w-full py-2.5 rounded-xl bg-brand-orange text-white text-sm font-body font-semibold hover:bg-brand-orange/90 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />正在处理赞助...</span> : `确认赞助 ￥${PLANS.find(p => p.name === planName)?.price || '—'}`}
        </button>

        {/* 状态提示 */}
        {statusHint && (
          <p className="mt-3 text-center text-xs text-brand-dark/40">{statusHint}</p>
        )}

      </motion.div>
    </motion.div>
  )
}

// ==================== PayModal (支付弹窗 - 仅显示二维码截图) ====================

function PayModal({ payUrl, taskId, amount, paymentMethod, onClose, onCardReady }: { payUrl: string; taskId?: string; amount?: string; paymentMethod?: string; onClose: () => void; onCardReady?: (cards: string[]) => void }) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [polling, setPolling] = useState(!!taskId)
  const [pollHint, setPollHint] = useState('')

  // SSE 监听后端主动推送卡密结果
  useEffect(() => {
    if (!taskId) return
    let es: EventSource | null = null
    const timeoutId = setTimeout(() => {
      setPolling(false)
      setPollHint('赞助超时，请确认是否已完成赞助')
    }, 600000) // 10 分钟超时

    es = new EventSource(`/api/proxy/order-stream/${taskId}`)
    es.addEventListener('update', (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.status === 'completed' && data.cardKeys?.length > 0) {
          es?.close()
          clearTimeout(timeoutId)
          setPolling(false)
          onCardReady?.(data.cardKeys)
        } else if (data.status === 'timeout' || data.status === 'failed') {
          es?.close()
          clearTimeout(timeoutId)
          setPolling(false)
          setPollHint('赞助超时，请确认是否已完成赞助')
        }
      } catch {}
    })

    return () => {
      es?.close()
      clearTimeout(timeoutId)
    }
  }, [taskId, onCardReady])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="relative w-full max-w-[440px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-brand-light-gray bg-white shrink-0">
          <span className="font-heading text-sm font-semibold text-brand-dark">
            谢谢赞助喵
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-brand-dark/40 hover:text-brand-dark hover:bg-brand-light-gray/50 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* 金额显示 */}
        {amount && (
          <div className="text-center pt-5 pb-2">
            <span className="text-xs font-body text-brand-dark/40">支付金额</span>
            <div className="font-heading text-xl font-semibold text-brand-orange mt-0.5">{amount}</div>
          </div>
        )}

        {/* 支付截图 */}
        <div className="flex flex-col items-center px-6 pb-6">
          {imageLoading && !imageError && (
            <div className="flex items-center justify-center py-16 w-full">
              <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
              <span className="ml-2 text-sm text-brand-dark/40">支付截图加载中...</span>
            </div>
          )}
          {imageError && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <AlertCircle className="w-10 h-10 text-brand-orange mb-3" />
              <p className="text-sm text-brand-dark/60 text-center">截图加载失败，请点击"新窗口打开"扫码支付</p>
            </div>
          )}
          <img
            src={payUrl}
            alt="支付二维码"
            className={`max-w-full rounded-xl border border-brand-light-gray ${imageLoading ? 'hidden' : ''}`}
            onLoad={() => setImageLoading(false)}
            onError={() => { setImageLoading(false); setImageError(true) }}
          />
          {!imageLoading && !imageError && (
            <p className="text-xs text-brand-dark/40 mt-3 text-center">
            {paymentMethod === 'wechat' ? '请使用微信扫码完成支付' : '请使用支付宝扫码完成支付'}
          </p>
          )}
        </div>

        {/* 轮询状态 */}
        {polling && (
          <div className="px-5 py-3 bg-white border-t border-brand-light-gray">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-orange" />
              <span className="text-xs text-brand-dark/50">{pollHint || '等待支付完成，自动获取卡密...'}</span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ==================== CardKeyModal (卡密展示弹窗) ====================

function CardKeyModal({ cardKeys, onClose }: { cardKeys: string[]; onClose: () => void }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = useCallback(async (key: string, index: number) => {
    try {
      await navigator.clipboard.writeText(key)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch {
      // fallback
      const textarea = document.createElement('textarea')
      textarea.value = key
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    }
  }, [])

  const handleCopyAll = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cardKeys.join('\n'))
    } catch {}
  }, [cardKeys])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-light-gray bg-gradient-to-r from-brand-orange/5 to-brand-orange/[0.02]">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-brand-green" />
            <span className="font-heading text-sm font-semibold text-brand-dark">赞助成功 · 卡密已获取</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-brand-dark/40 hover:text-brand-dark hover:bg-brand-light-gray/50 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        {/* Card Keys */}
        <div className="p-5">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-body font-medium text-brand-dark/50">共 {cardKeys.length} 张卡密</span>
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1 text-xs font-body text-brand-orange hover:text-brand-orange/80 transition-colors cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                一键复制全部
              </button>
            </div>
            <div className="space-y-2">
              {cardKeys.map((key, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-brand-light/50 border border-brand-light-gray hover:border-brand-orange/20 transition-colors group">
                  <span className="text-xs font-body text-brand-dark/30 w-6 text-right">{i + 1}.</span>
                  <code className="flex-1 text-sm font-mono text-brand-dark font-medium tracking-wide select-all">{key}</code>
                  <button
                    onClick={() => handleCopy(key, i)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-brand-dark/25 hover:text-brand-orange hover:bg-brand-orange/5 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                    title="复制"
                  >
                    {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-brand-green" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-brand-dark/30 text-center">
            请妥善保管卡密
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ==================== SponsorsPage 主组件 ====================

export default function SponsorsPage({ onBack }: SponsorsPageProps) {
  const ref = useRef<HTMLDivElement>(null)
  useInView(ref, { once: true, margin: '-80px' })

  // 状态
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)   // 选中了哪个套餐
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [statusHint, setStatusHint] = useState<string | null>(null)  // 异步处理时的状态提示
  const [payUrl, setPayUrl] = useState<string | null>(null)               // 支付页面截图URL
  const [taskId, setTaskId] = useState<string | null>(null)               // 轮询任务ID
  const [payAmount, setPayAmount] = useState<string | null>(null)         // 支付金额
  const [payMethod, setPayMethod] = useState<string | null>(null)         // 支付方式
  const [cardKeys, setCardKeys] = useState<string[] | null>(null)         // 获取到的卡密
  const [captchaImage, setCaptchaImage] = useState<string | null>(null)   // 验证码图片
  const [captchaAnswer, setCaptchaAnswer] = useState('')                  // 用户输入的验证码

  // 关闭支付弹窗
  const handlePayClose = useCallback(() => {
    setPayUrl(null)
    setTaskId(null)
    setPayAmount(null)
    setPayMethod(null)
  }, [])

  // 支付完成回调 → 关闭支付弹窗，显示卡密
  const handleCardReady = useCallback((cards: string[]) => {
    setPayUrl(null)
    setTaskId(null)
    setPayAmount(null)
    setPayMethod(null)
    setCardKeys(cards)
  }, [])

  // 用户提交验证码 → 调用后端 API 继续购买流程
  const handleCaptchaSubmit = async () => {
    if (!captchaAnswer.trim() || !taskId) return
    try {
      const res = await fetch('/api/proxy/captcha-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, captchaAnswer: captchaAnswer.trim() }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: '提交失败' }))
        setOrderError(errData.error || '验证码提交失败')
        return
      }
      // 验证码提交成功，清除验证码显示，恢复 loading
      setCaptchaImage(null)
      setCaptchaAnswer('')
      setOrderLoading(true)
      setStatusHint('验证码已提交，继续处理赞助...')
    } catch (err: any) {
      setOrderError(err.message || '验证码提交失败')
    }
  }

  // 用户点击"立即购买" → 弹出邮箱填写弹窗
  const handleBuyClick = (planName: string) => {
    setSelectedPlan(planName)
    setOrderError(null)
  }

  // 用户提交 → 调用后端代理创建订单（异步模式）
  const handleOrderSubmit = async (code: string, email: string, paymentMethod: string) => {
    setOrderLoading(true)
    setOrderError(null)

    try {
      // 1. 确保代理服务已初始化
      const initRes = await fetch('/api/proxy/init', { method: 'POST' }).catch(() => null)
      if (!initRes || !initRes.ok) {
        throw new Error('支付服务未启动，请先在终端运行 npm run proxy 启动代理服务')
      }

      // 2. 创建订单（异步模式：立即返回 taskId）
      const res = await fetch('/api/proxy/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: selectedPlan, email, paymentMethod, code }),
      })

      if (!res.ok) {
        let errorMsg = `服务器错误 (${res.status})`
        try {
          const errData = await res.json()
          errorMsg = errData.error || errorMsg
        } catch {}
        throw new Error(errorMsg)
      }

      const text = await res.text()
      if (!text) throw new Error('服务器返回空响应')

      let data: any
      try { data = JSON.parse(text) }
      catch { throw new Error(`服务器返回了非JSON数据: ${text.slice(0, 100)}`) }

      if (!data.success) throw new Error(data.error || '赞助创建失败')

      const orderTaskId = data.taskId

      // 3. 如果后端直接返回了卡密（极少数情况）
      if (data.paymentUrl === 'direct' && data.cardKeys?.length > 0) {
        setSelectedPlan(null)
        setOrderLoading(false)
        setCardKeys(data.cardKeys)
        return
      }

      // 4. SSE 模式：后端主动推送状态，无需轮询
      const planPrice = PLANS.find(p => p.name === selectedPlan)?.price
      setStatusHint('正在为您跳转赞助页面，请稍候...')

      // 建立 SSE 长连接
      const sseUrl = `/api/proxy/order-stream/${orderTaskId}`
      const es = new EventSource(sseUrl)
      const timeoutId = setTimeout(() => {
        es.close()
        setOrderError('赞助处理超时，请刷新页面后重试')
        setOrderLoading(false)
        setStatusHint(null)
      }, 120000) // 2 分钟超时

      es.addEventListener('update', (event) => {
        try {
          const statusData = JSON.parse(event.data)

          if (statusData.status === 'captcha_required') {
            // 验证码拦截：显示验证码图片让用户输入
            setCaptchaImage(statusData.captchaImage)
            setCaptchaAnswer('')
            setStatusHint('hsfaka 触发了验证码，请输入验证码继续...')
            setOrderLoading(false) // 不显示全局 loading，改为显示验证码输入框
          } else if (statusData.status === 'pending_payment') {
            es.close()
            clearTimeout(timeoutId)
            setSelectedPlan(null)
            setOrderLoading(false)
            setStatusHint(null)
            setPayUrl(statusData.paymentUrl)
            setTaskId(orderTaskId)
            setPayAmount(statusData.amount || planPrice || null)
            setPayMethod(paymentMethod)
            setCardKeys(null)
          } else if (statusData.status === 'completed' && statusData.cardKeys?.length > 0) {
            es.close()
            clearTimeout(timeoutId)
            setSelectedPlan(null)
            setOrderLoading(false)
            setStatusHint(null)
            setCardKeys(statusData.cardKeys)
          } else if (statusData.status === 'failed') {
            es.close()
            clearTimeout(timeoutId)
            throw new Error(statusData.error || '赞助处理失败，请稍后重试')
          }
          // 'processing' → 继续等待后端推送
        } catch (err: any) {
          es.close()
          clearTimeout(timeoutId)
          setOrderError(err.message || '处理异常')
          setOrderLoading(false)
          setStatusHint(null)
        }
      })

      es.addEventListener('error', () => {
        // SSE 连接断开会自动重连，忽略临时错误
      })

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setOrderError('请求超时，购买流程时间较长，请重试')
      } else if (err.message === 'Failed to fetch') {
        setOrderError('无法连接支付服务，请确保已运行 npm run proxy')
      } else {
        setOrderError(err.message || '网络错误，请稍后重试')
      }
      setOrderLoading(false)
      setStatusHint(null)
    }
  }

  return (
    <div className="min-h-screen bg-brand-light pt-14 md:pt-20">
      {/* ====== 支付页面弹窗 ====== */}
      <AnimatePresence>
        {payUrl && <PayModal payUrl={payUrl} taskId={taskId || undefined} amount={payAmount || undefined} paymentMethod={payMethod || undefined} onClose={handlePayClose} onCardReady={handleCardReady} />}
      </AnimatePresence>

      {/* ====== 卡密弹窗 ====== */}
      <AnimatePresence>
        {cardKeys && cardKeys.length > 0 && (
          <CardKeyModal cardKeys={cardKeys} onClose={() => setCardKeys(null)} />
        )}
      </AnimatePresence>

      {/* ====== 验证码输入弹窗 ====== */}
      <AnimatePresence>
        {captchaImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[105] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-brand-dark/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="relative w-full max-w-[380px] bg-white rounded-2xl shadow-2xl p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-lg font-semibold text-brand-dark">请输入验证码</h3>
                <button onClick={() => { setCaptchaImage(null); setCaptchaAnswer('') }} className="w-7 h-7 rounded-full flex items-center justify-center text-brand-dark/40 hover:text-brand-dark hover:bg-brand-light-gray/50 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-sm text-brand-dark/50 mb-4">hsfaka 网站触发了验证码拦截，请根据下图输入验证码</p>
              <div className="mb-4 rounded-xl overflow-hidden border border-brand-light-gray">
                <img src={captchaImage} alt="验证码" className="w-full" />
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="请输入验证码"
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-lg border border-brand-light-gray bg-brand-light/50 text-sm font-body text-brand-dark placeholder:text-brand-dark/25 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleCaptchaSubmit()}
                />
              </div>
              <button
                onClick={handleCaptchaSubmit}
                disabled={!captchaAnswer.trim()}
                className="w-full py-2.5 rounded-xl bg-brand-orange text-white text-sm font-body font-semibold hover:bg-brand-orange/90 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                提交验证码
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== 邮箱填写弹窗 ====== */}
      <AnimatePresence>
        {selectedPlan && (
          <EmailModal
            planName={selectedPlan}
            onClose={() => { if (!orderLoading) { setSelectedPlan(null); setOrderError(null); setStatusHint(null) } }}
            onSubmit={handleOrderSubmit}
            loading={orderLoading}
            error={orderError}
            statusHint={statusHint || undefined}
          />
        )}
      </AnimatePresence>

      {/* ====== 顶部导航 ====== */}
      <div className="sticky top-14 md:top-20 z-40 border-b border-brand-light-gray bg-brand-light/90 backdrop-blur-xl">
        <div className="section-container flex items-center justify-between h-12 sm:h-14">
          <button onClick={onBack} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-body text-brand-dark/45 hover:text-brand-orange transition-colors cursor-pointer flex-shrink-0">
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            返回首页
          </button>
          <span className="font-heading text-sm sm:text-base md:text-lg font-semibold text-brand-dark text-center px-2">赞助答题次数</span>
          <div className="w-12 sm:w-16 flex-shrink-0" />
        </div>
      </div>

      {/* ====== 主体内容 ====== */}
      <div className="section-container py-6 sm:py-8 md:py-12 max-w-5xl mx-auto">
        {/* Intro */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-10 md:mb-14">
          <span className="inline-flex items-center gap-2 font-body text-sm font-medium text-brand-orange uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Sponsor
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-brand-dark mb-3 md:mb-4">学习通小助手 · 查题赞助</h1>
          <p className="max-w-lg mx-auto text-sm sm:text-base font-body text-brand-dark/40 leading-relaxed">感谢赞助支持小助手，赞助后将自动获得相应答题次数</p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.name} plan={plan} index={i} onBuy={() => handleBuyClick(plan.name)} loading={orderLoading && selectedPlan === plan.name} />
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-brand-dark/20 mt-8 sm:mt-10 pb-6 sm:pb-8">&copy; 2026 网课小助手-飘飘友情提供</p>
      </div>
    </div>
  )
}
