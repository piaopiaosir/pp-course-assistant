import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowLeft, Copy, Check, Zap, BookOpen, Terminal, Loader2, Send, ChevronDown } from 'lucide-react'

interface TikuDocPageProps {
  onBack: () => void
}

// ==================== 目录数据 ====================
const TOC_ITEMS = [
  { id: 'overview', label: '接口概览', icon: Zap },
  { id: 'endpoint', label: '接口信息', icon: Terminal },
  { id: 'params', label: '请求参数', icon: BookOpen },
  { id: 'response', label: '返回格式', icon: Terminal },
  { id: 'example', label: '调用示例', icon: BookOpen },
  { id: 'test', label: '在线测试', icon: Send },
  { id: 'notes', label: '注意事项', icon: BookOpen },
]

// VS Code 风格代码块
function VsCodeBlock({ code, label, language }: { code: string; label: string; language: 'json' | 'javascript' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const highlightJson = (jsonStr: string) => {
    return jsonStr.split(/("[^"]*")|(\b\d+\b)|(\bnull\b)|([{},\[\]:])|(\/\/.*)/g).map((part, i) => {
      if (!part) return null
      if (part === 'null') return <span key={i} className="text-[#d4d4d4]">{part}</span>
      if (part.match(/^"[^"]*"$/)) {
        const afterPart = jsonStr.substring(jsonStr.indexOf(part) + part.length).trimStart()
        if (afterPart.startsWith(':')) {
          return <span key={i} className="text-[#9cdcfe]">{part}</span>
        }
        return <span key={i} className="text-[#ce9178]">{part}</span>
      }
      if (part.match(/^\d+$/)) return <span key={i} className="text-[#b5cea8]">{part}</span>
      if (part.match(/^[{}\[\]:]$/)) return <span key={i} className="text-[#d4d4d4]">{part}</span>
      return <span key={i} className="text-[#d4d4d4]">{part}</span>
    })
  }

  const highlightJs = (str: string) => {
    const lines = str.split('\n')
    return lines.map((line, i) => {
      let processed = line
        .replace(/(\/\/.*$)/g, '<span class="text-[#6a9955]">$1</span>')
        .replace(/('(?:[^'\\]|\\.)*')/g, '<span class="text-[#ce9178]">$1</span>')
        .replace(/\b(const|let|var|async|await|function|return|if|else|new|try|catch|throw)\b/g, '<span class="text-[#569cd6]">$1</span>')
        .replace(/\b(fetch|JSON|stringify|log)\b/g, '<span class="text-[#dcdcaa]">$1</span>')
        .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-[#569cd6]">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="text-[#b5cea8]">$1</span>')
      return <div key={i} dangerouslySetInnerHTML={{ __html: processed }} />
    })
  }

  return (
    <div className="bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-lg shadow-brand-dark/10">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          <span className="ml-3 text-xs text-white/40 font-mono">{label}</span>
        </div>
        <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-white/50 hover:text-white/80 hover:bg-white/10 transition-all duration-200 cursor-pointer" title="复制">
          {copied ? (
            <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">已复制</span></>
          ) : (
            <><Copy className="w-3.5 h-3.5" /><span>复制</span></>
          )}
        </button>
      </div>
      <pre className="p-4 sm:p-5 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed text-[#d4d4d4]">
        <code>{language === 'json' ? highlightJson(code) : highlightJs(code)}</code>
      </pre>
    </div>
  )
}

// 滚动入场卡片
function AnimatedCard({ children, delay = 0, className = '', id }: { children: React.ReactNode; delay?: number; className?: string; id?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div ref={ref} id={id} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay, ease: 'easeOut' }} className={`scroll-mt-32 ${className}`}>
      {children}
    </motion.div>
  )
}

export default function TikuDocPage({ onBack }: TikuDocPageProps) {
  const [activeSection, setActiveSection] = useState('overview')
  const [testForm, setTestForm] = useState({ question: '', options: '', type: '0' })
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  // 滚动高亮当前目录
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0.1 }
    )

    TOC_ITEMS.forEach((item) => {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testForm.question.trim()) return
    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/tiku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: testForm.question, options: testForm.options || undefined, type: parseInt(testForm.type) }),
      })
      const data = await res.json()
      setTestResult(JSON.stringify(data, null, 2))
    } catch {
      setTestResult(JSON.stringify({ code: 500, msg: '请求失败，请检查网络连接', data: null }, null, 2))
    } finally {
      setIsTesting(false)
    }
  }

  const params = [
    { name: 'question', type: 'string', required: true, desc: '题目内容' },
    { name: 'options', type: 'string', required: false, desc: '选项内容，用 | 分隔（如 A.北京|B.上海|C.广州|D.深圳）' },
    { name: 'type', type: 'number', required: false, desc: '题目类型：0=单选（默认），1=多选，2=判断' },
  ]

  const responses = [
    { status: 200, label: 'HTTP 200', color: 'bg-brand-green/15 text-brand-green', desc: '查询成功', code: '{\n  "code": 200,\n  "msg": "查询成功",\n  "data": {\n    "answer": ["北京"],\n    "source": "cache",\n    "num": 1\n  }\n}' },
    { status: 404, label: 'HTTP 404', color: 'bg-brand-orange/15 text-brand-orange', desc: '未找到答案', code: '{\n  "code": 404,\n  "msg": "未找到答案",\n  "data": null\n}' },
    { status: 400, label: 'HTTP 400', color: 'bg-red-50 text-red-600', desc: '参数错误', code: '{\n  "code": 400,\n  "msg": "参数错误：question 不能为空",\n  "data": null\n}' },
  ]

  const exampleCode = `const response = await fetch('/api/tiku', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    question: '中国的首都是哪里？',
    options: 'A.北京|B.上海|C.广州|D.深圳',
    type: 0,
  }),
})

const data = await response.json()
console.log(data)
// { code: 200, msg: "查询成功", data: { answer: ["北京"], source: "cache", num: 1 } }`

  const notes = [
    '本接口仅查询服务器缓存，不调用外部题库和AI，部分题目可能无法查到。',
    '每日共享5000次查询额度，超出后当日无法继续查询，次日重置。',
    '请勿恶意刷接口，否则IP将被封禁。',
    '接口返回的答案仅供参考，请自行判断准确性。',
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} className="min-h-screen bg-[#faf9f5] pt-14 md:pt-20">
      {/* Sticky Header */}
      <div className="sticky top-14 md:top-20 z-40 border-b border-brand-light-gray/60 bg-[#faf9f5]/90 backdrop-blur-xl">
        <div className="section-container flex items-center justify-between h-12 sm:h-14">
          <button onClick={onBack} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-body text-brand-dark/45 hover:text-brand-orange transition-colors cursor-pointer flex-shrink-0">
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            返回首页
          </button>
          <span className="font-heading text-sm sm:text-base md:text-lg font-semibold text-brand-dark text-center px-2">PP题库调用说明</span>
          <div className="w-12 sm:w-16 flex-shrink-0" />
        </div>
      </div>

      <div className="section-container py-6 sm:py-8 md:py-12 max-w-6xl mx-auto">
        <div className="relative flex gap-4 lg:gap-5">
          {/* 左侧目录导航 - fixed 定位，始终可见 */}
          <div className="hidden lg:block w-44 flex-shrink-0">
            <nav className="fixed top-36 z-30 w-44 flex flex-col max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-hide py-2">
            <h4 className="text-xs font-body font-semibold text-brand-dark/40 uppercase tracking-wider mb-3">目录</h4>
            <div className="space-y-1">
              {TOC_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-body transition-all duration-300 text-left cursor-pointer ${
                      isActive
                        ? 'bg-brand-orange/10 text-brand-orange font-medium'
                        : 'text-brand-dark/50 hover:text-brand-dark/70 hover:bg-brand-dark/[0.03]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-orange' : 'text-brand-dark/30'}`} />
                    <span className="truncate">{item.label}</span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-orange flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </nav>
          </div>

          {/* ====== 右侧内容区 ====== */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* 1. Hero 区域 - 接口概览 */}
            <AnimatedCard id="overview" delay={0}>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-orange/[0.08] via-brand-orange/[0.03] to-transparent px-6 py-8 sm:px-10 sm:py-10">
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-brand-orange/[0.06] pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-brand-orange/[0.04] pointer-events-none" />
                <div className="relative z-10">
                  <h1 className="font-heading text-[32px] font-bold text-brand-dark mb-2">PP题库调用说明</h1>
                  <p className="text-base font-body text-brand-dark/50">简洁高效的免费题库查询接口</p>
                </div>
              </div>
            </AnimatedCard>

            {/* 2. 免费接口提示卡片 */}
            <AnimatedCard id="overview-tip" delay={0.05}>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-orange/[0.04] to-transparent border border-brand-orange/15 border-l-4 border-l-brand-orange">
                <div className="flex items-start gap-3 sm:gap-4 p-5 sm:p-6">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-brand-orange" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-body font-semibold text-brand-orange mb-1">免费接口 · 每日5000次</p>
                    <p className="text-xs sm:text-sm font-body text-brand-dark/50 leading-relaxed">
                      本接口完全免费，无需Token认证，每日共享5000次查询额度。仅支持查询服务器缓存内容，不调用外部题库和AI。
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedCard>

            {/* 3. 接口信息卡片 */}
            <AnimatedCard id="endpoint" delay={0.1}>
              <div className="bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-lg shadow-brand-dark/10">
                <div className="bg-[#2d2d2d] px-4 py-2.5 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="ml-3 text-xs text-white/30 font-mono">api_endpoint</span>
                </div>
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-brand-green/20 text-brand-green">POST</span>
                    <span className="text-sm sm:text-base font-mono text-[#569cd6]">/api/tiku</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="text-white/40 font-mono">Content-Type:</span>
                    <span className="text-[#ce9178] font-mono">application/json</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="text-white/40 font-mono">Authorization:</span>
                    <span className="text-[#6a9955] font-mono">无需认证</span>
                  </div>
                </div>
              </div>
            </AnimatedCard>

            {/* 4. 请求参数表格 */}
            <AnimatedCard id="params" delay={0.15}>
              <div className="bg-white rounded-2xl border border-brand-light-gray/60 overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 px-5 sm:px-6 py-3 bg-gradient-to-r from-brand-orange/[0.06] to-transparent border-b border-brand-light-gray/40">
                  <BookOpen className="w-4 h-4 text-brand-dark/50" />
                  <h3 className="font-heading text-sm sm:text-base font-semibold text-brand-dark">请求参数</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-brand-light-gray/40">
                        <th className="text-left px-5 sm:px-6 py-3 font-body font-semibold text-brand-dark/60">参数名</th>
                        <th className="text-left px-3 py-3 font-body font-semibold text-brand-dark/60">类型</th>
                        <th className="text-left px-3 py-3 font-body font-semibold text-brand-dark/60">必填</th>
                        <th className="text-left px-3 py-3 font-body font-semibold text-brand-dark/60">说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      {params.map((p) => (
                        <tr key={p.name} className="border-b border-brand-light-gray/20 last:border-b-0 hover:bg-brand-orange/[0.03] transition-colors">
                          <td className="px-5 sm:px-6 py-3 font-mono text-brand-dark/80">{p.name}</td>
                          <td className="px-3 py-3 font-mono text-brand-dark/50">{p.type}</td>
                          <td className="px-3 py-3">
                            {p.required ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">必填</span>
                            ) : (
                              <span className="text-brand-dark/30">选填</span>
                            )}
                          </td>
                          <td className="px-3 py-3 font-body text-brand-dark/50">{p.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </AnimatedCard>

            {/* 5. 返回格式卡片 */}
            <AnimatedCard id="response" delay={0.2}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Terminal className="w-4 h-4 text-brand-dark/50" />
                  <h3 className="font-heading text-sm sm:text-base font-semibold text-brand-dark">返回格式</h3>
                </div>
                {responses.map((r) => (
                  <div key={r.status} className="bg-white rounded-2xl border border-brand-light-gray/60 overflow-hidden shadow-sm hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-center gap-3 px-5 sm:px-6 py-3 border-b border-brand-light-gray/40">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold ${r.color}`}>{r.label}</span>
                      <span className="text-xs font-body text-brand-dark/40">{r.desc}</span>
                    </div>
                    <VsCodeBlock code={r.code} label={`response_${r.status}.json`} language="json" />
                  </div>
                ))}
              </div>
            </AnimatedCard>

            {/* 6. 调用示例 */}
            <AnimatedCard id="example" delay={0.25}>
              <VsCodeBlock code={exampleCode} label="JavaScript (fetch)" language="javascript" />
            </AnimatedCard>

            {/* 7. 在线测试 */}
            <AnimatedCard id="test" delay={0.3}>
              <div className="bg-white rounded-2xl border border-brand-light-gray/60 overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 px-5 sm:px-6 py-3 border-b border-brand-light-gray/40 bg-gradient-to-r from-brand-orange/[0.06] to-transparent">
                  <Send className="w-4 h-4 text-brand-orange" />
                  <h3 className="font-heading text-sm sm:text-base font-semibold text-brand-dark">在线测试</h3>
                </div>
                <div className="p-5 sm:p-6">
                  <form onSubmit={handleTestSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-body font-semibold text-brand-dark/60 mb-1.5">question <span className="text-red-500">*</span></label>
                      <input type="text" value={testForm.question} onChange={(e) => setTestForm(prev => ({ ...prev, question: e.target.value }))} placeholder="输入题目内容" required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-light-gray/80 bg-brand-light/50 text-sm font-body text-brand-dark placeholder:text-brand-dark/25 focus:outline-none focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/10 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-body font-semibold text-brand-dark/60 mb-1.5">options <span className="text-brand-dark/25 font-normal">选填</span></label>
                      <input type="text" value={testForm.options} onChange={(e) => setTestForm(prev => ({ ...prev, options: e.target.value }))} placeholder="A.选项1|B.选项2|C.选项3|D.选项4"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-light-gray/80 bg-brand-light/50 text-sm font-body text-brand-dark placeholder:text-brand-dark/25 focus:outline-none focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/10 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-body font-semibold text-brand-dark/60 mb-1.5">type <span className="text-brand-dark/25 font-normal">选填</span></label>
                      <div className="relative">
                        <select value={testForm.type} onChange={(e) => setTestForm(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-brand-light-gray/80 bg-brand-light/50 text-sm font-body text-brand-dark focus:outline-none focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/10 transition-all appearance-none cursor-pointer">
                          <option value="0">0 - 单选题</option>
                          <option value="1">1 - 多选题</option>
                          <option value="2">2 - 判断题</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-dark/30 pointer-events-none" />
                      </div>
                    </div>
                    <button type="submit" disabled={isTesting || !testForm.question.trim()}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-orange text-white text-sm font-body font-semibold hover:bg-brand-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer">
                      {isTesting ? <><Loader2 className="w-4 h-4 animate-spin" />请求中...</> : <><Send className="w-4 h-4" />发送测试请求</>}
                    </button>
                  </form>
                  {testResult && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mt-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-body font-semibold text-brand-dark/50">响应结果</span>
                      </div>
                      <VsCodeBlock code={testResult} label="response.json" language="json" />
                    </motion.div>
                  )}
                </div>
              </div>
            </AnimatedCard>

            {/* 8. 注意事项 */}
            <AnimatedCard id="notes" delay={0.35}>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-orange/[0.04] to-transparent border border-brand-orange/10 border-l-4 border-l-brand-orange">
                <div className="p-5 sm:p-6">
                  <h3 className="font-heading text-sm sm:text-base font-semibold text-brand-dark mb-4">注意事项</h3>
                  <div className="space-y-3">
                    {notes.map((note, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-semibold">{i + 1}</span>
                        <p className="text-xs sm:text-sm font-body text-brand-dark/50 leading-relaxed">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedCard>

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="section-container py-6 sm:py-8 border-t border-brand-light-gray/40">
        <p className="text-center text-xs text-brand-dark/20 font-body">&copy; 2026 网课小助手-飘飘友情提供</p>
      </div>
    </motion.div>
  )
}