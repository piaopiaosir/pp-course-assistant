import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowLeft, Download, AlertTriangle } from 'lucide-react'

interface HelpPageProps {
  onBack: () => void
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

const STEPS = [
  {
    title: '请先把脚本更新到最新版',
    content: '旧版本可能无法正常运行，请先确认你使用的是最新版本。',
    action: { label: '前往安装页', onClick: () => scrollToSection('install') },
    hasImage: false,
  },
  {
    title: '确认安装了脚本猫或篡改猴',
    content: '脚本猫和篡改猴是运行用户脚本的浏览器扩展，至少安装其中一个。注意：不要同时安装两者，否则可能冲突。',
    links: [
      { label: '安装脚本猫', href: 'https://docs.scriptcat.org/' },
      { label: '安装篡改猴', href: 'https://www.tampermonkey.net/' },
    ],
    hasImage: true,
    imageLabel: '示例图 — 脚本猫已启用',
  },
  {
    title: '确认脚本管理器已开启',
    content: '点击浏览器右上角的扩展图标，确认脚本猫或篡改猴处于开启状态。误操作关闭会导致所有脚本失效。',
    hasImage: true,
    imageLabel: '示例图 — 扩展管理面板',
  },
  {
    title: '切换到刷课页面，确认脚本已安装并启用',
    content: '打开脚本管理器面板，在「已安装脚本」中查看"网课小助手"是否显示且开关为打开状态。如果有多个脚本同时运行，请暂时关闭其他脚本。',
    hasImage: true,
    imageLabel: '示例图 — 脚本开关状态',
  },
  {
    title: '检查站点访问权限',
    content: '点击脚本右侧的三角标记，确认脚本未被排除或屏蔽。在扩展详细信息中，将站点访问权限设为「在所有站点上」。',
    hasImage: true,
    imageLabel: '示例图 — 站点权限设置',
  },
  {
    title: '开启开发者模式',
    content: '进入浏览器「管理扩展」页面（chrome://extensions/ 或 edge://extensions/），打开右上角的「开发者模式」开关。',
    note: '如果没有这个选项，可以跳过这一步。',
    hasImage: true,
    imageLabel: '示例图 — 开发者模式开关',
  },
  {
    title: 'Chrome 浏览器需开启「允许运行用户脚本」',
    content: '在 Chrome 中，进入 chrome://flags/#user-script-api，将「User Script API」设为 Enabled，然后重启浏览器。',
    note: 'Edge 浏览器通常无需此步骤，如果你用的不是 Chrome，可以跳过。',
    hasImage: false,
  },
]

function StepCard({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="py-6 sm:py-9 border-b border-brand-light-gray last:border-0"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="flex-shrink-0 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-brand-dark text-brand-light flex items-center justify-center text-xs sm:text-sm font-body font-semibold">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-base sm:text-lg md:text-xl font-semibold text-brand-dark mb-1.5 sm:mb-2">
            {step.title}
          </h3>
          <p className="text-xs sm:text-sm font-body text-brand-dark/50 leading-relaxed mb-2 sm:mb-3">
            {step.content}
          </p>

          {step.action && (
            <button
              onClick={step.action.onClick}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-brand-dark text-brand-light text-xs sm:text-sm font-body font-semibold rounded-full hover:bg-brand-orange transition-all duration-300 mb-2 sm:mb-3 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {step.action.label}
            </button>
          )}

          {step.links && (
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-2 sm:mb-3">
              {step.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-body font-medium text-brand-dark/45 border border-brand-light-gray rounded-full hover:text-brand-dark hover:border-brand-dark/20 transition-all duration-300"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {step.hasImage && (
            <div className="mt-2 sm:mt-3 w-full h-32 sm:h-40 md:h-48 rounded-lg border border-brand-light-gray bg-brand-light-gray/50 flex items-center justify-center text-xs sm:text-sm text-brand-mid-gray">
              {step.imageLabel}
            </div>
          )}

          {step.note && (
            <p className="text-[11px] sm:text-xs text-brand-dark/30 italic mt-1.5 sm:mt-2">{step.note}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function HelpPage({ onBack }: HelpPageProps) {
  return (
    <div className="min-h-screen bg-brand-light pt-14 md:pt-20">
      {/* Help Header */}
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
            脚本不运行排查
          </span>
          <div className="w-12 sm:w-16 flex-shrink-0" /> {/* spacer */}
        </div>
      </div>

      <div className="section-container py-6 sm:py-8 md:py-12 max-w-4xl mx-auto">
        {/* Alert */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 sm:gap-3 p-4 sm:p-5 rounded-xl bg-brand-orange/[0.06] border border-brand-orange/15 mb-6 sm:mb-8"
        >
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-brand-orange flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs sm:text-sm font-body font-semibold text-brand-orange mb-1">重要提醒</p>
            <p className="text-xs sm:text-sm font-body text-brand-dark/50 leading-relaxed">
              排查错误时，请先切换到刷课页面或出错页面。不同页面下脚本状态不一样，在此页面操作可能不会生效。
            </p>
          </div>
        </motion.div>

        {/* Steps */}
        <div>
          {STEPS.map((step, i) => (
            <StepCard key={i} step={step} index={i} />
          ))}
        </div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-2xl bg-brand-light-gray/50 border border-brand-light-gray"
        >
          <h4 className="font-body font-semibold text-brand-dark mb-2 sm:mb-3 text-sm sm:text-base">
            🎯 以上步骤全部检查完毕后
          </h4>
          <p className="text-xs sm:text-sm text-brand-dark/45 leading-relaxed mb-1.5 sm:mb-2">
            请<b>重启浏览器</b>，再重新进入课程页面。
          </p>
          <p className="text-xs sm:text-sm text-brand-dark/45 leading-relaxed">
            如果脚本依然没有运行，可以加入QQ群：
          </p>
          <a
            href="https://qm.qq.com/q/weTeLXfqJq"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 sm:mt-2 text-base sm:text-lg font-semibold text-brand-orange hover:underline inline-block"
          >
            QQ群：152898956
          </a>
          <p className="text-xs text-brand-dark/30 mt-1">
            点击即可跳转加入群聊，联系时请描述清楚问题。
          </p>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-brand-dark/20 mt-10 sm:mt-12 pb-6 sm:pb-8">
          &copy; 2026 网课小助手-飘飘友情提供
        </p>
      </div>
    </div>
  )
}
