import { useState, useEffect } from 'react'
import { Gift, ArrowLeft, CheckCircle, XCircle, Loader2, Dices, X, Sparkles, Skull } from 'lucide-react'

interface WelfarePageProps {
  onBack: () => void
}

// 随机模式趣味文案
function getRandomComment(count: number): { text: string; color: string } {
  if (count >= 300) {
    const texts = [
      '风浪越大，鱼越贵！欧皇无疑！',
      '这运气，建议立刻去买彩票！',
      '天选之人！这波血赚！',
      '运气爆表！系统都惊了！',
      '那还说啥啊，给了给了',
    ]
    return { text: texts[Math.floor(Math.random() * texts.length)], color: 'text-amber-500' }
  } else if (count >= 200) {
    const texts = [
      '不亏不亏，稳稳当当～',
      '中规中矩，不赔不赚！',
      '平均水平的运气，还行还行～',
      '比固定200还多，小赚！',
    ]
    return { text: texts[Math.floor(Math.random() * texts.length)], color: 'text-blue-500' }
  } else if (count >= 100) {
    const texts = [
      '亏了亏了，不如选固定200啊！',
      '运气一般般，下次还是稳一手吧～',
      '贪心了吧？固定200不香吗？',
      '只能说...运气不够赌什么赌！',
    ]
    return { text: texts[Math.floor(Math.random() * texts.length)], color: 'text-orange-500' }
  } else {
    const texts = [
      '惨，太惨了，建议重开！',
      '这运气...还是老实选固定200吧！',
      '主打一个参与感！血亏！',
      '恭喜你成为了赌徒大冤种！',
      '下次还敢赌吗？',
      '赌徒不值得同情',
    ]
    return { text: texts[Math.floor(Math.random() * texts.length)], color: 'text-red-500' }
  }
}

export default function WelfarePage({ onBack }: WelfarePageProps) {
  const [userId, setUserId] = useState('')
  const [mode, setMode] = useState<'fixed' | 'random'>('fixed')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    msg: string
    data?: { addedCount: number; newTotal: number; token?: string; mode?: string }
  } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [randomComment, setRandomComment] = useState<{ text: string; color: string } | null>(null)
  const [rollingCount, setRollingCount] = useState<number | null>(null)

  // 数字滚动动画
  useEffect(() => {
    if (!showModal || !result?.success || !result.data) return
    const count = result.data.addedCount
    // 仅随机模式且非0次时做滚动
    if (result.data.mode !== 'random' || count === 0) {
      setRollingCount(count)
      return
    }
    const duration = 1800
    const totalSteps = 30
    // 前80%步骤完全随机，后20%逐步收拢到目标值
    const randomPhase = Math.floor(totalSteps * 0.8)
    let step = 0
    const timer = setInterval(() => {
      step++
      if (step >= totalSteps) {
        clearInterval(timer)
        setRollingCount(count)
        return
      }
      if (step <= randomPhase) {
        // 随机阶段：0~400 完全随机
        setRollingCount(Math.floor(Math.random() * 400))
      } else {
        // 收拢阶段：逐渐靠近目标值，波动越来越小
        const progress = (step - randomPhase) / (totalSteps - randomPhase) // 0→1
        const maxDelta = Math.floor(120 * (1 - progress)) // 波动从120逐渐缩小到0
        const offset = Math.floor(Math.random() * maxDelta * 2) - maxDelta
        const value = Math.max(0, Math.min(400, count + offset))
        setRollingCount(value)
      }
    }, duration / totalSteps)
    return () => clearInterval(timer)
  }, [showModal, result])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId.trim()) return

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/proxy/welfare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.trim(), mode }),
      })
      const data = await res.json()
      const r = { success: data.code === 200, msg: data.msg, data: data.data }
      setResult(r)
      if (r.success && r.data?.mode === 'random') {
        setRandomComment(getRandomComment(r.data.addedCount))
      }
      setShowModal(true)
    } catch {
      setResult({ success: false, msg: '网络请求失败，请稍后重试' })
      setShowModal(true)
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setRollingCount(null)
    setRandomComment(null)
  }

  return (
    <div className="min-h-screen pt-20 md:pt-28 pb-16">
      <div className="section-container max-w-2xl mx-auto">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-brand-dark/50 hover:text-brand-dark transition-colors mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-body">返回首页</span>
        </button>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-orange/20 to-brand-orange/5 mb-5">
            <Gift className="w-8 h-8 text-brand-orange" />
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-brand-dark mb-3">
            免费领取次数
          </h1>
          <p className="font-body text-brand-dark/60 text-base leading-relaxed max-w-sm mx-auto">
            每位用户可领取一次福利，可选择固定 200 次或随机抽取 0~400 次查询次数
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-brand-light-gray p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-body font-medium text-brand-dark/70 mb-2">
                学习通用户ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setUserId(v) }}
                placeholder="请输入您的学习通用户ID（纯数字）"
                className="w-full px-4 py-3 rounded-xl border border-brand-light-gray bg-brand-light/50
                  font-body text-sm text-brand-dark placeholder:text-brand-dark/30
                  focus:outline-none focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/10
                  transition-all"
                disabled={loading}
              />
              <p className="mt-2 text-xs text-brand-dark/40 font-body">
                用户ID可在脚本面板的「推广奖励」界面中查看
              </p>
            </div>

            {/* Mode Selection */}
            <div>
              <label className="block text-sm font-body font-medium text-brand-dark/70 mb-2">
                领取方式
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('fixed')}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer ${
                    mode === 'fixed'
                      ? 'border-brand-orange bg-brand-orange/5 shadow-sm'
                      : 'border-brand-light-gray bg-white hover:border-brand-orange/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Gift className={`w-4 h-4 ${mode === 'fixed' ? 'text-brand-orange' : 'text-brand-dark/40'}`} />
                    <span className={`text-sm font-body font-medium ${mode === 'fixed' ? 'text-brand-dark' : 'text-brand-dark/60'}`}>
                      固定 200 次
                    </span>
                  </div>
                  <p className="text-xs font-body text-brand-dark/40">稳赚不赔，必得 200 次</p>
                  {mode === 'fixed' && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand-orange flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('random')}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer ${
                    mode === 'random'
                      ? 'border-brand-orange bg-brand-orange/5 shadow-sm'
                      : 'border-brand-light-gray bg-white hover:border-brand-orange/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Dices className={`w-4 h-4 ${mode === 'random' ? 'text-brand-orange' : 'text-brand-dark/40'}`} />
                    <span className={`text-sm font-body font-medium ${mode === 'random' ? 'text-brand-dark' : 'text-brand-dark/60'}`}>
                      随机 0~400 次
                    </span>
                  </div>
                  <p className="text-xs font-body text-brand-dark/40">拼手气，概率分布抽取</p>
                  {mode === 'random' && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand-orange flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              </div>
              {mode === 'random' && (
                <div className="mt-3 p-3 rounded-lg bg-brand-orange/5 border border-brand-orange/10">
                  <p className="text-xs font-body text-brand-dark/50 mb-2">概率分布：</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-brand-light-gray overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: '60%' }} />
                      </div>
                      <span className="text-xs font-body text-brand-dark/50 w-24 text-right">0~199 次</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-brand-light-gray overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full" style={{ width: '30%' }} />
                      </div>
                      <span className="text-xs font-body text-brand-dark/50 w-24 text-right">200~299 次</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-brand-light-gray overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: '10%' }} />
                      </div>
                      <span className="text-xs font-body text-brand-dark/50 w-24 text-right">300~400 次</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !userId.trim()}
              className="w-full py-3 rounded-xl bg-brand-dark text-brand-light font-body font-medium text-sm
                hover:bg-brand-dark/90 active:scale-[0.98] transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  领取中...
                </>
              ) : mode === 'fixed' ? (
                <>
                  <Gift className="w-4 h-4" />
                  领取 200 次查询
                </>
              ) : (
                <>
                  <Dices className="w-4 h-4" />
                  随机抽取 0~400 次
                </>
              )}
            </button>
          </form>
        </div>

        {/* Result Modal */}
        {showModal && result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeModal}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
              className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-[scaleIn_0.3s_ease-out]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-brand-light-gray/50 hover:bg-brand-light-gray flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-brand-dark/40" />
              </button>

              {result.success && result.data ? (
                <>
                  {/* Icon - 滚动动画结束后才显示，避免提前暴露结果 */}
                  {rollingCount === result.data.addedCount && (
                    <>
                      {result.data.mode === 'random' ? (
                        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
                          result.data.addedCount >= 300
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                            : result.data.addedCount >= 200
                            ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                            : result.data.addedCount >= 100
                            ? 'bg-gradient-to-br from-orange-300 to-orange-500'
                            : 'bg-gradient-to-br from-gray-400 to-gray-600'
                        }`}>
                          {result.data.addedCount >= 300 ? (
                            <Sparkles className="w-10 h-10 text-white" />
                          ) : result.data.addedCount >= 100 ? (
                            <Dices className="w-10 h-10 text-white" />
                          ) : (
                            <Skull className="w-10 h-10 text-white" />
                          )}
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-6">
                          <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                      )}
                    </>
                  )}

                  {/* 滚动中显示loading图标 */}
                  {rollingCount !== null && rollingCount !== result.data.addedCount && (
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 bg-gradient-to-br from-gray-300 to-gray-400 animate-pulse">
                      <Dices className="w-10 h-10 text-white" />
                    </div>
                  )}

                  {/* Title - 滚动动画结束后才显示最终标题 */}
                  <h2 className="font-heading text-xl font-semibold text-brand-dark mb-2">
                    {rollingCount === result.data.addedCount
                      ? (result.data.mode === 'random' ? '抽奖结果' : '领取成功')
                      : '抽奖中...'
                    }
                  </h2>

                  {/* Count Display */}
                  <div className="my-6">
                    <span className={`font-heading text-5xl font-bold ${
                      rollingCount === result.data.addedCount
                        ? result.data.mode === 'random'
                          ? result.data.addedCount >= 300
                            ? 'text-amber-500'
                            : result.data.addedCount >= 200
                            ? 'text-blue-500'
                            : result.data.addedCount >= 100
                            ? 'text-orange-500'
                            : 'text-red-500'
                          : 'text-emerald-500'
                        : 'text-brand-dark/60'
                    }`}>
                      {rollingCount !== null ? rollingCount : result.data.addedCount}
                    </span>
                    <span className="font-body text-lg text-brand-dark/50 ml-1">次</span>
                  </div>

                  {/* Fun comment for random mode */}
                  {result.data.mode === 'random' && randomComment && rollingCount === result.data.addedCount && (
                    <p className={`font-body text-sm font-medium mb-4 ${randomComment.color}`}>
                      {randomComment.text}
                    </p>
                  )}

                  {/* Details */}
                  <div className="bg-brand-light/50 rounded-xl p-4 text-left space-y-2">
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-brand-dark/50">当前总次数</span>
                      <span className="text-brand-dark font-medium">{result.data.newTotal}</span>
                    </div>
                    {result.data.token && (
                      <div className="flex justify-between font-body text-sm">
                        <span className="text-brand-dark/50">充入Token</span>
                        <span className="text-brand-dark font-medium font-mono text-xs">{result.data.token}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Error */}
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-500 mb-6">
                    <XCircle className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="font-heading text-xl font-semibold text-brand-dark mb-3">领取失败</h2>
                  <p className="font-body text-sm text-red-600 mb-2">{result.msg}</p>
                </>
              )}

              <button
                onClick={closeModal}
                className="mt-6 w-full py-3 rounded-xl bg-brand-dark text-brand-light font-body font-medium text-sm
                  hover:bg-brand-dark/90 active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                我知道了
              </button>
            </div>
          </div>
        )}

        {/* Rules */}
        <div className="mt-8 bg-white rounded-2xl border border-brand-light-gray p-6 shadow-sm">
          <h3 className="font-heading text-base font-semibold text-brand-dark mb-4">领取须知</h3>
          <ul className="space-y-3 text-sm font-body text-brand-dark/60">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-brand-orange/10 text-brand-orange text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              每位用户仅限领取一次，可选择固定 200 次或随机抽取 0~400 次查询次数
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-brand-orange/10 text-brand-orange text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              需要先使用过脚本，系统才能识别您的用户ID
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-brand-orange/10 text-brand-orange text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              用户ID为学习通账号的唯一标识（纯数字），可在脚本面板的「推广奖励」界面中查看
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
