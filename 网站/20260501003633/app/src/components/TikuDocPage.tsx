import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowLeft, Copy, Check, BookOpen, Zap, Clock, AlertCircle } from 'lucide-react'
import { useState } from 'react'

interface TikuDocPageProps {
  onBack: () => void
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      {label && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-body font-medium text-brand-dark/40">{label}</span>
        </div>
      )}
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-brand-dark/80 text-brand-light opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          title="复制"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <pre className="bg-brand-dark text-brand-light p-4 rounded-lg overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}

function Section({ children, title, icon: Icon, delay = 0 }: { children: React.ReactNode; title: string; icon: React.ElementType; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="mb-8 sm:mb-10"
    >
      <div className="flex items-center gap-2 mb-4 sm:mb-5">
        <div className="w-8 h-8 rounded-lg bg-brand-dark/5 flex items-center justify-center">
          <Icon className="w-4 h-4 text-brand-dark/70" />
        </div>
        <h2 className="font-heading text-base sm:text-lg md:text-xl font-semibold text-brand-dark">
          {title}
        </h2>
      </div>
      <div className="pl-10">{children}</div>
    </motion.div>
  )
}

export default function TikuDocPage({ onBack }: TikuDocPageProps) {
  return (
    <div className="min-h-screen bg-brand-light pt-14 md:pt-20">
      {/* Header */}
      <div className="sticky top-14 md:top-20 z-40 border-b border-brand-light-gray bg-brand-light/90 backdrop-blur-xl">
        <div className="section-container flex items-center justify-between h-12 sm:h-14">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-body text-brand-dark/45 hover:text-brand-orange transition-colors cursor-pointer flex-shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            返回首页
          </button>
          <span className="font-heading text-sm sm:text-base md:text-lg font-semibold text-brand-dark text-center px-2">
            PP题库调用说明
          </span>
          <div className="w-12 sm:w-16 flex-shrink-0" />
        </div>
      </div>

      <div className="section-container py-6 sm:py-8 md:py-12 max-w-3xl mx-auto">
        {/* Intro Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 sm:gap-3 p-4 sm:p-5 rounded-xl bg-brand-orange/[0.06] border border-brand-orange/15 mb-6 sm:mb-8"
        >
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-brand-orange flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs sm:text-sm font-body font-semibold text-brand-orange mb-1">免费接口</p>
            <p className="text-xs sm:text-sm font-body text-brand-dark/50 leading-relaxed">
              本接口完全免费，无需Token认证，每日共享5000次查询额度。仅支持查询服务器缓存内容，不调用外部题库和AI。
            </p>
          </div>
        </motion.div>

        {/* 接口信息 */}
        <Section title="接口信息" icon={BookOpen} delay={0}>
          <div className="bg-white rounded-xl border border-brand-light-gray p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <p className="text-xs text-brand-dark/40 mb-1">请求方法</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">POST</span>
                  <span className="text-sm font-mono text-brand-dark">/api/tiku</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-brand-dark/40 mb-1">Content-Type</p>
                <p className="text-sm font-mono text-brand-dark">application/json</p>
              </div>
              <div>
                <p className="text-xs text-brand-dark/40 mb-1">认证方式</p>
                <p className="text-sm text-brand-dark">无需认证（免费）</p>
              </div>
            </div>
          </div>
        </Section>

        {/* 请求参数 */}
        <Section title="请求参数" icon={BookOpen} delay={0.05}>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-brand-light-gray">
                  <th className="text-left py-2.5 px-3 text-xs font-body font-semibold text-brand-dark/50">参数名</th>
                  <th className="text-left py-2.5 px-3 text-xs font-body font-semibold text-brand-dark/50">类型</th>
                  <th className="text-left py-2.5 px-3 text-xs font-body font-semibold text-brand-dark/50">必填</th>
                  <th className="text-left py-2.5 px-3 text-xs font-body font-semibold text-brand-dark/50">说明</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'question', type: 'string', required: '是', desc: '题目文本内容' },
                  { name: 'options', type: 'string / array', required: '是', desc: '选项内容，数组或逗号分隔的字符串' },
                  { name: 'type', type: 'string', required: '是', desc: '题型：0=单选, 1=多选, 2=填空, 3=判断' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-brand-light-gray/50">
                    <td className="py-2.5 px-3 font-mono text-xs text-brand-dark">{row.name}</td>
                    <td className="py-2.5 px-3 text-xs text-brand-dark/60">{row.type}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600">
                        {row.required}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-brand-dark/60">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 返回格式 */}
        <Section title="返回格式" icon={BookOpen} delay={0.1}>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-body font-medium text-brand-dark mb-2">成功响应</p>
              <CodeBlock
                label="HTTP 200"
                code={`{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "answer": ["北京"],
    "source": "cache",
    "num": 1
  }
}`}
              />
            </div>
            <div>
              <p className="text-sm font-body font-medium text-brand-dark mb-2">未命中缓存</p>
              <CodeBlock
                label="HTTP 404"
                code={`{
  "code": 404,
  "msg": "缓存中未找到该题目答案",
  "data": null
}`}
              />
            </div>
            <div>
              <p className="text-sm font-body font-medium text-brand-dark mb-2">参数错误</p>
              <CodeBlock
                label="HTTP 400"
                code={`{
  "code": 400,
  "msg": "缺少必要参数: question 和 type 为必填项",
  "data": null
}`}
              />
            </div>
          </div>
        </Section>

        {/* 调用示例 */}
        <Section title="调用示例" icon={BookOpen} delay={0.15}>
          <CodeBlock
            label="JavaScript (fetch)"
            code={`const response = await fetch('https://your-domain.com/api/tiku', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: '中国的首都是哪里？',
    options: ['北京', '上海', '广州', '深圳'],
    type: '0'
  })
});

const result = await response.json();
console.log(result);
// { code: 200, msg: '查询成功', data: { answer: ['北京'], source: 'cache', num: 1 } }`}
          />
        </Section>

        {/* 注意事项 */}
        <Section title="注意事项" icon={AlertCircle} delay={0.2}>
          <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-4 sm:p-5">
            <ul className="space-y-3">
              {[
                '本接口仅查询服务器本地缓存，不调用外部题库和AI服务',
                '免费使用，无需Token认证，每日共享5000次查询额度',
                '建议优先调用本接口，未命中时再使用主接口查询',
                '题目文本和选项内容需与缓存数据完全匹配',
                '如需更高频次查询，请联系管理员开通专属通道',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm font-body text-brand-dark/60 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* Footer */}
        <p className="text-center text-xs text-brand-dark/20 mt-10 sm:mt-12 pb-6 sm:pb-8">
          &copy; 2026 网课小助手-飘飘友情提供
        </p>
      </div>
    </div>
  )
}
