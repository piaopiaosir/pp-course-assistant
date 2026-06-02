import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Copy, Check, Zap, BookOpen, Terminal, Loader2, ChevronDown, Play, Globe, X } from 'lucide-react'

interface TikuDocPageProps {
  onBack: () => void
}

const SERVERS = [
  { label: '广州节点', ip: '122.152.249.109', region: '🇨🇳 广州' },
  { label: '北京节点', ip: '152.136.30.238', region: '🇨🇳 北京' },
]

const TOC_ITEMS = [
  { id: 'overview', label: '接口概览', icon: Zap },
  { id: 'params', label: '请求参数', icon: BookOpen },
  { id: 'examples', label: '调用示例', icon: Terminal },
  { id: 'response', label: '返回格式', icon: Terminal },
  { id: 'notes', label: '注意事项', icon: BookOpen },
]

function ResponseCodeBlock() {
  const [activeStatus, setActiveStatus] = useState<200 | 404 | 400 | 401 | 429>(200)
  const [copied, setCopied] = useState(false)

  const responses: Record<number, { label: string; color: string; desc: string; code: string }> = {
    200: {
      label: 'HTTP 200',
      desc: '查询成功',
      color: 'bg-brand-green/15 text-brand-green border-brand-green/50 ring-1 ring-brand-green/20',
      code: `{
  "code": 200,         // 状态码
  "msg": "查询成功",    // 状态信息
  "data": {
    "answer": ["北京"], // 题目答案
    "source": "cache",  // 答案来源
    "num": 1            // token剩余查题次数
  }
}`,
    },
    404: {
      label: 'HTTP 404',
      desc: '未找到答案',
      color: 'bg-brand-orange/15 text-brand-orange border-brand-orange/50 ring-1 ring-brand-orange/20',
      code: `{
  "code": 404,
  "msg": "未找到答案",
  "data": null
}`,
    },
    400: {
      label: 'HTTP 400',
      desc: '参数错误',
      color: 'bg-red-100 text-red-600 border-red-300 ring-1 ring-red-200',
      code: `{
  "code": 400,
  "msg": "参数错误：question 不能为空",
  "data": null
}`,
    },
    401: {
      label: 'HTTP 401',
      desc: '认证失败',
      color: 'bg-red-100 text-red-600 border-red-300 ring-1 ring-red-200',
      code: `{
  "code": 401,
  "msg": "缺少或无效的 Authorization 头，值应为 free",
  "data": null
}`,
    },
    429: {
      label: 'HTTP 429',
      desc: '调用次数超限',
      color: 'bg-brand-orange/15 text-brand-orange border-brand-orange/50 ring-1 ring-brand-orange/20',
      code: `{
  "code": 429,
  "msg": "今日接口调用次数已达上限（5000次），请明日再试",
  "data": { "used": 5000, "total": 5000 }
}`,
    },
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(responses[activeStatus].code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-light-gray/60 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-5 sm:px-6 py-3 bg-gradient-to-r from-brand-orange/[0.06] to-transparent border-b border-brand-light-gray/40">
        <Terminal className="w-4 h-4 text-brand-dark/50" />
        <h3 className="font-heading text-sm sm:text-base font-semibold text-brand-dark">返回格式</h3>
      </div>
      <div className="p-5 sm:p-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(responses) as unknown as number[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveStatus(key as 200 | 404 | 400 | 401 | 429)}
              className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all duration-200 cursor-pointer border ${activeStatus === key ? responses[key].color : 'bg-white text-brand-dark/50 border-brand-light-gray/60 hover:text-brand-dark/70 hover:border-brand-dark/20'}`}
            >
              {responses[key].label}
            </button>
          ))}
        </div>
        <div className="bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-lg shadow-brand-dark/10">
          <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              <span className="ml-3 text-xs text-white/40 font-mono">response_{activeStatus}.json</span>
            </div>
            <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-white/50 hover:text-white/80 hover:bg-white/10 transition-all cursor-pointer">
              {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">已复制</span></> : <><Copy className="w-3.5 h-3.5" /><span>复制</span></>}
            </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStatus}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed text-[#d4d4d4]">
                <code>{responses[activeStatus].code}</code>
              </pre>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function ExampleCodeBlock() {
  const [activeLang, setActiveLang] = useState<'shell' | 'node' | 'js' | 'python'>('shell')
  const [copied, setCopied] = useState(false)

  const examples = {
    shell: {
      label: 'cURL',
      file: 'request.sh',
      code: `curl --location 'http://122.152.249.109/api/tiku' \\\\
  --header 'Content-Type: application/json' \\\\
  --data '{
    "question": "中国的首都是哪里？",
    "options": ["北京", "上海", "广州", "深圳"],
    "type": "0"
  }'`,
    },
    node: {
      label: 'Node.js',
      file: 'request.js',
      code: `const servers = ["122.152.249.109", "152.136.30.238"]
const server = servers[Math.floor(Math.random() * servers.length)]

const http = require("http")

const data = JSON.stringify({
  question: "中国的首都是哪里？",
  options: ["北京", "上海", "广州", "深圳"],
  type: "0",
})

const options = {
  hostname: server,
  port: 80,
  path: "/api/tiku",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  },
}

const req = http.request(options, (res) => {
  let body = ""
  res.on("data", (chunk) => { body += chunk })
  res.on("end", () => { console.log(JSON.parse(body)) })
})

req.write(data)
req.end()`,
    },
    js: {
      label: 'JavaScript',
      file: 'request.mjs',
      code: `const servers = ["122.152.249.109", "152.136.30.238"]
const server = servers[Math.floor(Math.random() * servers.length)]

const response = await fetch(\`http://\${server}/api/tiku\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    question: "中国的首都是哪里？",
    options: ["北京", "上海", "广州", "深圳"],
    type: "0",
  }),
})

const data = await response.json()
console.log(data)`,
    },
    python: {
      label: 'Python',
      file: 'request.py',
      code: `import random
import requests

servers = ["122.152.249.109", "152.136.30.238"]
server = random.choice(servers)

url = f"http://{server}/api/tiku"
data = {
    "question": "中国的首都是哪里？",
    "options": ["北京", "上海", "广州", "深圳"],
    "type": "0",
}

response = requests.post(url, json=data)
print(response.json())`,
    },
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(examples[activeLang].code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(examples) as Array<keyof typeof examples>).map((key) => (
          <button
            key={key}
            onClick={() => setActiveLang(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all duration-200 cursor-pointer border ${
              activeLang === key
                ? 'bg-brand-orange/10 text-brand-orange border-brand-orange/30'
                : 'bg-white text-brand-dark/50 border-brand-light-gray/60 hover:text-brand-dark/70 hover:border-brand-dark/20'
            }`}
          >
            {examples[key].label}
          </button>
        ))}
      </div>
      <div className="bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-lg shadow-brand-dark/10">
        <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            <span className="ml-3 text-xs text-white/40 font-mono">{examples[activeLang].file}</span>
          </div>
          <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-white/50 hover:text-white/80 hover:bg-white/10 transition-all cursor-pointer">
            {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">已复制</span></> : <><Copy className="w-3.5 h-3.5" /><span>复制</span></>}
          </button>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLang}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed text-[#d4d4d4]">
              <code>{examples[activeLang].code}</code>
            </pre>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function AnimatedCard({ children, delay = 0, className = '', id }: { children: React.ReactNode; delay?: number; className?: string; id?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div ref={ref} id={id} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay, ease: 'easeOut' }} className={`scroll-mt-32 ${className}`}>
      {children}
    </motion.div>
  )
}

function DebugModal({ isOpen, onClose, selectedServer, onServerChange }: {
  isOpen: boolean
  onClose: () => void
  selectedServer: number
  onServerChange: (idx: number) => void
}) {
  const [requestTab, setRequestTab] = useState<'params' | 'headers' | 'body'>('body')
  const [requestBody, setRequestBody] = useState(`{
  "question": "中国的首都是哪里？",
  "options": ["北京", "上海", "广州", "深圳"],
  "type": "0"
}`)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [responseStatus, setResponseStatus] = useState<number | null>(null)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  const handleSendRequest = useCallback(async () => {
    let parsedBody: any
    try {
      parsedBody = JSON.parse(requestBody)
    } catch {
      setResponseStatus(0)
      setResponseTime(0)
      setTestResult(JSON.stringify({ code: 400, msg: '请求体 JSON 格式错误', data: null }, null, 2))
      return
    }
    setIsTesting(true)
    setTestResult(null)
    setResponseStatus(null)
    setResponseTime(null)
    const server = SERVERS[selectedServer].ip
    const startTime = Date.now()
    try {
      const res = await fetch(`http://${server}/api/tiku`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedBody),
      })
      const elapsed = Date.now() - startTime
      setResponseStatus(res.status)
      setResponseTime(elapsed)
      const data = await res.json()
      setTestResult(JSON.stringify(data, null, 2))
    } catch {
      const elapsed = Date.now() - startTime
      setResponseStatus(0)
      setResponseTime(elapsed)
      setTestResult(JSON.stringify({ code: 500, msg: '请求失败，请检查网络连接', data: null }, null, 2))
    } finally {
      setIsTesting(false)
    }
  }, [requestBody, selectedServer])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const jsonLines = requestBody.split('\n')
  const maxLineNum = jsonLines.length.toString().length

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex justify-end"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50" />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-xl h-full bg-white shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-brand-light-gray/30 flex-shrink-0">
              <span className="font-heading text-sm font-semibold text-brand-dark">在线运行</span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={selectedServer}
                    onChange={(e) => onServerChange(Number(e.target.value))}
                    className="appearance-none bg-transparent text-xs font-body text-brand-dark/60 px-2 py-1 pr-6 rounded hover:bg-brand-light-gray/30 focus:outline-none cursor-pointer"
                  >
                    {SERVERS.map((s, i) => (
                      <option key={i} value={i}>{s.region}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-dark/30 pointer-events-none" />
                </div>
                <button onClick={onClose} className="flex items-center justify-center w-7 h-7 rounded-lg text-brand-dark/30 hover:text-brand-dark/60 hover:bg-brand-dark/5 transition-all cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-5 py-3 flex-shrink-0">
              <div className="flex items-stretch rounded-lg border border-brand-light-gray/80 bg-white overflow-hidden h-9">
                  <div className="flex items-center px-2.5 flex-shrink-0">
                    <span className="inline-flex items-center h-6 rounded-md px-1.5 py-0.5 text-xs font-semibold font-mono bg-brand-orange/10 text-brand-orange">POST</span>
                  </div>
                  <div className="flex items-center flex-1 min-w-0 border-l border-brand-light-gray/50 pl-2.5">
                    <Globe className="w-3.5 h-3.5 text-brand-dark/25 mr-1.5 flex-shrink-0" />
                    <span className="text-xs font-mono text-brand-dark/40 flex-shrink-0">http://{SERVERS[selectedServer].ip}</span>
                    <span className="text-sm font-mono text-brand-dark/60 truncate">/api/tiku</span>
                  </div>
                <button
                  onClick={handleSendRequest}
                  disabled={isTesting}
                  className="flex items-center gap-1.5 px-4 bg-brand-orange text-white text-xs font-body font-semibold hover:bg-brand-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex-shrink-0"
                >
                  {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>发送</span>
                </button>
              </div>
            </div>

            <div className="flex items-center px-5 pt-1 gap-0 border-b border-brand-light-gray/30 flex-shrink-0">
              <button
                onClick={() => setRequestTab('params')}
                className={`px-3 py-2 text-xs font-body font-medium border-b-2 transition-all duration-200 cursor-pointer ${
                  requestTab === 'params'
                    ? 'text-brand-dark border-brand-orange'
                    : 'text-brand-dark/40 border-transparent hover:text-brand-dark/60'
                }`}
              >
                Params
              </button>
              <button
                onClick={() => setRequestTab('headers')}
                className={`px-3 py-2 text-xs font-body font-medium border-b-2 transition-all duration-200 cursor-pointer ${
                  requestTab === 'headers'
                    ? 'text-brand-dark border-brand-orange'
                    : 'text-brand-dark/40 border-transparent hover:text-brand-dark/60'
                }`}
              >
                Headers
              </button>
              <button
                onClick={() => setRequestTab('body')}
                className={`px-3 py-2 text-xs font-body font-medium border-b-2 transition-all duration-200 cursor-pointer ${
                  requestTab === 'body'
                    ? 'text-brand-dark border-brand-orange'
                    : 'text-brand-dark/40 border-transparent hover:text-brand-dark/60'
                }`}
              >
                Body
              </button>
              <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-brand-dark/30 bg-brand-light-gray/30">application/json</span>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {requestTab === 'params' && (
                <div className="px-5 py-4 space-y-2.5">
                  {[
                    { key: 'question', value: '题目内容（必填）', required: true },
                    { key: 'options', value: '["北京", "上海", "广州", "深圳"]', required: false },
                    { key: 'type', value: '"0"=单选 / "1"=多选 / "2"=判断', required: false },
                  ].map((p) => (
                    <div key={p.key} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-[#f5f5f5]">
                      <span className="text-xs font-mono text-brand-dark/50 w-24 flex-shrink-0">{p.key}</span>
                      <span className="text-xs font-mono text-brand-dark/40 flex-1">{p.value}</span>
                      {p.required ? (
                        <span className="text-[10px] font-medium text-red-500">必填</span>
                      ) : (
                        <span className="text-[10px] font-medium text-brand-dark/25">选填</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {requestTab === 'headers' && (
                <div className="px-5 py-4 space-y-0.5">
                  {[
                    { key: 'Content-Type', value: 'application/json', checked: true },
                    { key: 'Accept', value: 'application/json', checked: true },
                    { key: 'Authorization', value: 'free', checked: true },
                  ].map((h) => (
                    <div key={h.key} className="flex items-center gap-2 py-2.5 px-3 border-b border-brand-light-gray/20">
                      <div className="w-4 h-4 rounded-full border-2 border-brand-green flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-xs font-mono text-brand-dark/60 w-28 flex-shrink-0">{h.key}</span>
                      <span className="text-xs font-mono text-brand-dark/70">{h.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {requestTab === 'body' && (
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-brand-dark/40 bg-brand-light-gray/30 px-2 py-0.5 rounded">JSON</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-body text-brand-dark/30">示例 ▼</span>
                      <button onClick={async () => { await navigator.clipboard.writeText(requestBody) }} className="text-brand-dark/30 hover:text-brand-dark/50 transition-colors cursor-pointer">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="relative rounded-lg border border-brand-light-gray/80 overflow-hidden">
                    <div className="flex">
                      <div className="flex-shrink-0 bg-[#f5f5f5] text-right select-none pt-3 pb-3 pr-2 pl-3">
                        {jsonLines.map((_, i) => (
                          <div key={i} className="text-xs font-mono text-brand-dark/25 leading-relaxed h-[1.4rem] flex items-center justify-end" style={{ minWidth: `${maxLineNum + 0.5}rem` }}>
                            {i + 1}
                          </div>
                        ))}
                      </div>
                      <textarea
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        spellCheck={false}
                        className="flex-1 min-h-[140px] px-3 py-3 bg-white text-sm font-mono text-brand-dark/80 leading-relaxed focus:outline-none resize-none tabular-nums"
                        style={{ tabSize: 2 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 border-t border-brand-light-gray/30">
                <div className="px-5 py-2.5 flex items-center justify-between">
                  <span className="text-sm font-body font-semibold text-brand-dark/70">返回结果</span>
                  {testResult && responseTime !== null && (
                    <span className="text-xs font-mono text-brand-dark/30">{responseTime}ms</span>
                  )}
                </div>

                {!testResult && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 rounded-full bg-brand-light-gray/30 flex items-center justify-center mb-3">
                      <Play className="w-5 h-5 text-brand-dark/20" />
                    </div>
                    <p className="text-sm font-body text-brand-dark/30">点击&quot;发送&quot;按钮获取返回结果</p>
                  </div>
                )}

                {testResult && (
                  <div className="bg-[#f5f5f5]">
                    <div className="flex items-center justify-between px-5 py-2 border-b border-brand-light-gray/20">
                      <div className="flex items-center gap-2">
                        {responseStatus !== null && responseStatus > 0 && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${responseStatus >= 200 && responseStatus < 300 ? 'bg-brand-green/15 text-brand-green' : responseStatus >= 400 && responseStatus < 500 ? 'bg-brand-orange/15 text-brand-orange' : 'bg-red-50 text-red-600'}`}>
                            {responseStatus} {responseStatus >= 200 && responseStatus < 300 ? 'OK' : responseStatus === 404 ? 'Not Found' : 'Error'}
                          </span>
                        )}
                        {responseStatus === 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-red-50 text-red-600">ERR</span>
                        )}
                        <span className="text-xs font-body text-brand-dark/30">application/json</span>
                      </div>
                      <button onClick={async () => { await navigator.clipboard.writeText(testResult) }} className="flex items-center gap-1 text-xs text-brand-dark/30 hover:text-brand-dark/50 transition-colors cursor-pointer">
                        <Copy className="w-3 h-3" /><span>复制</span>
                      </button>
                    </div>
                    <div className="p-4 overflow-x-auto">
                      <pre className="text-xs font-mono leading-relaxed text-brand-dark/70 whitespace-pre-wrap break-all">{testResult}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function TikuDocPage({ onBack }: TikuDocPageProps) {
  const [activeSection, setActiveSection] = useState('overview')
  const [selectedServer, setSelectedServer] = useState(0)
  const [debugOpen, setDebugOpen] = useState(false)

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

  const params = [
    { name: 'Content-Type', type: 'string', required: true, desc: 'application/json', isHeader: true },
    { name: 'Accept', type: 'string', required: false, desc: 'application/json', isHeader: true },
    { name: 'Authorization', type: 'string', required: true, desc: 'Token，值为 free', isHeader: true },
    { name: 'question', type: 'string', required: true, desc: '题目内容', isHeader: false },
    { name: 'options', type: 'array', required: false, desc: '选项内容，数组格式（如 ["北京", "上海", "广州", "深圳"]）', isHeader: false },
    { name: 'type', type: 'string', required: false, desc: '题目类型："0"=单选（默认），"1"=多选，"2"=判断', isHeader: false },
  ]

  const notes = [
    '每日共享5000次查询额度，超出后当日无法继续查询，次日重置。',
    '请勿恶意刷接口，否则IP将被封禁。',
    '接口返回的答案仅供参考，请自行判断准确性。',
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} className="min-h-screen bg-[#faf9f5] pt-14 md:pt-20">
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

          <div className="flex-1 min-w-0 flex flex-col gap-6">

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

            <AnimatedCard id="endpoint-url" delay={0.15}>
              <div className="bg-white rounded-2xl border border-brand-light-gray/60 overflow-hidden shadow-sm">
                <div className="bg-[#f5f5f5] px-4 sm:px-5 py-3.5">
                  <div className="flex items-stretch rounded-lg border border-brand-light-gray/80 bg-white overflow-hidden shadow-sm h-9 sm:h-10">
                    <div className="flex items-center px-2.5 sm:px-3 flex-shrink-0">
                      <span className="inline-flex items-center h-6 rounded-md px-1.5 py-0.5 text-xs font-semibold font-mono bg-brand-orange/10 text-brand-orange">POST</span>
                    </div>
                    <div className="flex items-center flex-1 min-w-0 border-l border-brand-light-gray/60">
                      <div className="relative flex-shrink-0">
                        <select
                          value={selectedServer}
                          onChange={(e) => setSelectedServer(Number(e.target.value))}
                          className="appearance-none bg-transparent text-sm font-mono text-brand-dark/70 px-2.5 py-1.5 pr-6 focus:outline-none cursor-pointer h-full"
                        >
                          {SERVERS.map((s, i) => (
                            <option key={i} value={i}>http://{s.ip}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-dark/30 pointer-events-none" />
                      </div>
                      <span className="text-sm font-mono text-brand-dark/60 hover:underline hover:decoration-dashed cursor-default flex-shrink-0 pr-2">/api/tiku</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 pr-1">
                      <button
                        onClick={() => setDebugOpen(true)}
                        className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-md bg-brand-orange text-white text-xs sm:text-sm font-body font-semibold hover:bg-brand-orange/90 transition-all duration-200 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>调试</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 px-1">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-brand-dark/25" />
                      <span className="text-[11px] font-body text-brand-dark/35">{SERVERS[selectedServer].region}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                      <span className="text-[11px] font-body text-brand-dark/35">{SERVERS[selectedServer].label}</span>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedCard>

            <AnimatedCard id="params" delay={0.2}>
              <div className="bg-white rounded-2xl border border-brand-light-gray/60 overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 px-5 sm:px-6 py-3 bg-gradient-to-r from-brand-orange/[0.06] to-transparent border-b border-brand-light-gray/40">
                  <BookOpen className="w-4 h-4 text-brand-dark/50" />
                  <h3 className="font-heading text-sm sm:text-base font-semibold text-brand-dark">请求参数</h3>
                </div>
                <div>
                  <div className="px-5 sm:px-6 py-2.5 border-b border-brand-light-gray/30 bg-brand-light-gray/10">
                    <span className="text-xs font-body font-semibold text-brand-dark/50">Header 参数</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-brand-light-gray/40">
                          <th className="text-left px-5 sm:px-6 py-2.5 font-body font-semibold text-brand-dark/60">参数名</th>
                          <th className="text-left px-3 py-2.5 font-body font-semibold text-brand-dark/60">类型</th>
                          <th className="text-left px-3 py-2.5 font-body font-semibold text-brand-dark/60">必填</th>
                          <th className="text-left px-3 py-2.5 font-body font-semibold text-brand-dark/60">说明</th>
                        </tr>
                      </thead>
                      <tbody>
                        {params.filter(p => p.isHeader).map((p) => (
                          <tr key={p.name} className="border-b border-brand-light-gray/20 last:border-b-0 hover:bg-brand-orange/[0.03] transition-colors">
                            <td className="px-5 sm:px-6 py-2.5 font-mono text-brand-dark/80">{p.name}</td>
                            <td className="px-3 py-2.5 font-mono text-brand-dark/50">{p.type}</td>
                            <td className="px-3 py-2.5">
                              {p.required ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">必填</span>
                              ) : (
                                <span className="text-brand-dark/30">选填</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 font-body text-brand-dark/50">{p.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-5 sm:px-6 py-2.5 border-b border-brand-light-gray/30 border-t border-t-brand-light-gray/40 bg-brand-light-gray/10">
                    <span className="text-xs font-body font-semibold text-brand-dark/50">Body 参数</span>
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-brand-dark/30 bg-brand-light-gray/30">application/json</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-brand-light-gray/40">
                          <th className="text-left px-5 sm:px-6 py-2.5 font-body font-semibold text-brand-dark/60">参数名</th>
                          <th className="text-left px-3 py-2.5 font-body font-semibold text-brand-dark/60">类型</th>
                          <th className="text-left px-3 py-2.5 font-body font-semibold text-brand-dark/60">必填</th>
                          <th className="text-left px-3 py-2.5 font-body font-semibold text-brand-dark/60">说明</th>
                        </tr>
                      </thead>
                      <tbody>
                        {params.filter(p => !p.isHeader).map((p) => (
                          <tr key={p.name} className="border-b border-brand-light-gray/20 last:border-b-0 hover:bg-brand-orange/[0.03] transition-colors">
                            <td className="px-5 sm:px-6 py-2.5 font-mono text-brand-dark/80">{p.name}</td>
                            <td className="px-3 py-2.5 font-mono text-brand-dark/50">{p.type}</td>
                            <td className="px-3 py-2.5">
                              {p.required ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">必填</span>
                              ) : (
                                <span className="text-brand-dark/30">选填</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 font-body text-brand-dark/50">{p.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </AnimatedCard>

            <AnimatedCard id="examples" delay={0.25}>
              <div className="bg-white rounded-2xl border border-brand-light-gray/60 overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 px-5 sm:px-6 py-3 bg-gradient-to-r from-brand-orange/[0.06] to-transparent border-b border-brand-light-gray/40">
                  <Terminal className="w-4 h-4 text-brand-dark/50" />
                  <h3 className="font-heading text-sm sm:text-base font-semibold text-brand-dark">请求示例代码</h3>
                </div>
                <div className="p-5 sm:p-6">
                  <ExampleCodeBlock />
                </div>
              </div>
            </AnimatedCard>

            <AnimatedCard id="response" delay={0.3}>
              <ResponseCodeBlock />
            </AnimatedCard>

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

      <DebugModal
        isOpen={debugOpen}
        onClose={() => setDebugOpen(false)}
        selectedServer={selectedServer}
        onServerChange={setSelectedServer}
      />

      <div className="section-container py-6 sm:py-8 border-t border-brand-light-gray/40">
        <p className="text-center text-xs text-brand-dark/20 font-body">&copy; 2026 网课小助手-飘飘友情提供</p>
      </div>
    </motion.div>
  )
}
