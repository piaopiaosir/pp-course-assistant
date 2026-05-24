import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Download, ExternalLink, AlertTriangle, X, CheckCircle } from 'lucide-react'

const SCRIPT_PAGE = 'https://scriptcat.org/zh-CN/script-show-page/5597'
const SCRIPT_DOWNLOAD = '/api/proxy/download.user.js'
const GREASYFORK_URL = 'https://greasyfork.icu/zh-CN/scripts/571917-%E8%B6%85%E6%98%9F%E5%AD%A6%E4%B9%A0%E9%80%9A-%E7%9F%A5%E5%88%B0%E6%99%BA%E6%85%A7%E6%A0%91-%E7%BD%91%E8%AF%BE%E5%B0%8F%E5%8A%A9%E6%89%8B-ai%E8%87%AA%E5%8A%A8%E7%AD%94%E9%A2%98-%E7%AD%94%E6%A1%88%E6%A0%A1%E9%AA%8C-%E9%A3%98%E9%A3%98-%E9%A3%98%E9%A3%98%E5%8F%8B%E6%83%85%E6%8F%90%E4%BE%9B-%E8%87%AA%E5%8A%A8%E8%B7%B3%E8%BD%AC%E4%BB%BB%E5%8A%A1%E7%82%B9-%E8%87%AA%E5%8A%A8%E7%AD%94%E9%A2%98-%E8%B6%85%E9%AB%98%E9%A2%98%E5%BA%93%E8%A6%86%E7%9B%96%E7%8E%87-%E9%80%90%E6%B8%90%E6%94%AF%E6%8C%81%E6%9B%B4%E5%A4%9A%E5%B9%B3%E5%8F%B0'
const SCRIPTCAT_LOGO = '/scriptcat-logo.png'
const TAMPERMONKEY_ICON = '/tampermonkey-icon.png'
const EDGE_ICON = '/edge-icon.webp'

/** 检测结果类型 */
type DetectResult = 'detecting' | 'installed' | 'not-installed' | 'uncertain' | 'mobile-edge'

/**
 * 启发式检测脚本管理器是否已安装
 *
 * 检测策略（多层叠加）：
 * 1. 全局变量探测 — Tampermonkey/脚本猫会注入特定全局对象
 * 2. DOM 特征探测 — 扩展会在页面注入可识别的 DOM 元素
 * 3. navigator 信息辅助 — 排除不支持扩展的浏览器
 *
 * 注意：没有任何单一方法是100%可靠的，但组合使用可以覆盖绝大多数场景
 */
function detectUserscriptManager(): { result: DetectResult; manager?: string } {
  // ===== 第1层：全局变量探测 =====
  const w = window as unknown as Record<string, unknown>

  // Tampermonkey 暴露的全局变量
  if (w.tm || w.Tampermonkey || w.GM || w.GM_info) {
    return { result: 'installed', manager: 'Tampermonkey' }
  }

  // 脚本猫暴露的全局变量
  if (w.SC || w.ScriptCat || w.Cat) {
    return { result: 'installed', manager: '脚本猫' }
  }

  // Violentmonkey
  if (w.VM || w.Violentmonkey) {
    return { result: 'installed', manager: 'Violentmonkey' }
  }

  // ===== 第2层：DOM 特征探测 =====
  const headChildren = document.head?.children
  if (headChildren) {
    for (let i = 0; i < headChildren.length; i++) {
      const el = headChildren[i]
      const idLower = (el.id || '').toLowerCase()
      if (idLower.includes('tampermonkey')) {
        return { result: 'installed', manager: 'Tampermonkey' }
      }
      if (idLower.includes('scriptcat')) {
        return { result: 'installed', manager: '脚本猫' }
      }
    }
  }

  // 脚本猫的 DOM 标记
  if (document.querySelector('[data-scriptcat]') || document.querySelector('.scriptcat-badge')) {
    return { result: 'installed', manager: '脚本猫' }
  }

  // ===== 第3层：浏览器能力判断 =====
  const ua = navigator.userAgent
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua)

  // 移动端 Edge 支持安装扩展，单独标记
  if (isMobile && /Edg(A|\/)/i.test(ua)) {
    return { result: 'mobile-edge' }
  }

  // 其他移动端浏览器不支持扩展
  if (isMobile) {
    return { result: 'not-installed' }
  }

  // 桌面浏览器支持扩展，但没检测到痕迹 → 不确定
  return { result: 'uncertain' }
}

/**
 * 异步深度检测（补充同步检测的不足）
 * 使用 Chrome 扩展资源探测：尝试加载扩展内部图标
 * 如果扩展已安装且允许资源访问，图片会加载成功
 */
async function detectAsync(): Promise<{ result: DetectResult; manager?: string }> {
  const extensions = [
    { id: 'dhdgffkkebhmkfjojejmpbldmpobfkfo', name: 'Tampermonkey' },
    { id: 'gcalenpjmijncebpfijmoaglllgpjagf', name: 'Tampermonkey Beta' },
    { id: 'ndcooeababhlmipbcodhobmgihkjipfk', name: '脚本猫' },
  ]

  for (const ext of extensions) {
    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => reject()
        setTimeout(() => reject(), 1500)
        img.src = `chrome-extension://${ext.id}/images/icon.png`
      })
      return { result: 'installed', manager: ext.name }
    } catch {
      // 资源加载失败，继续尝试下一个
    }
  }

  return { result: 'uncertain' }
}

const INSTALL_METHODS = [
  {
    id: 'local',
    label: '本站下载（推荐）',
    description: '点击下载 .user.js，脚本管理器自动识别安装',
    steps: [
      '确保已安装 Tampermonkey / 脚本猫 等脚本管理器',
      '点击下方按钮下载脚本文件',
      '脚本管理器会自动弹出安装提示',
      '确认安装并启用脚本，刷新目标页面开始使用',
    ],
    actionLabel: '下载安装',
    actionHref: SCRIPT_DOWNLOAD,
    actionIcon: Download,
    isExternal: false,
  },
  {
    id: 'scriptcat',
    label: '脚本猫',
    description: '国产开源脚本管理器，轻量好用',
    steps: [
      '安装 <a href="https://docs.scriptcat.org/" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 hover:text-brand-orange transition-colors">脚本猫 扩展</a>',
      '点击下方按钮，跳转到脚本猫脚本页',
      '在脚本猫页面中点击「安装」',
      '刷新目标页面，开始使用',
    ],
    actionLabel: '脚本猫安装',
    actionHref: SCRIPT_PAGE,
    actionIcon: ExternalLink,
    isExternal: true,
  },
  {
    id: 'tampermonkey',
    label: '篡改猴',
    description: '最流行的用户脚本管理器，一键安装',
    steps: [
      '安装 <a href="https://www.tampermonkey.net/" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 hover:text-brand-orange transition-colors">Tampermonkey 扩展</a>',
      '点击下方按钮，跳转到 GreasyFork 脚本页',
      '在页面中点击「安装此脚本」',
      '刷新目标页面，开始使用',
    ],
    actionLabel: 'GreasyFork 安装',
    actionHref: GREASYFORK_URL,
    actionIcon: ExternalLink,
    isExternal: true,
  },
]

export default function InstallGuide() {
  const [activeTab, setActiveTab] = useState('local')
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [detectResult, setDetectResult] = useState<DetectResult>('detecting')
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const activeMethod = INSTALL_METHODS.find((m) => m.id === activeTab)!

  // 组件挂载时执行检测
  useEffect(() => {
    // 同步检测
    const syncResult = detectUserscriptManager()

    if (syncResult.result === 'installed') {
      setDetectResult('installed')
      return
    }

    if (syncResult.result === 'mobile-edge') {
      setDetectResult('mobile-edge')
      return
    }

    if (syncResult.result === 'not-installed') {
      setDetectResult('not-installed')
      return
    }

    // 同步检测不确定时，尝试异步深度检测
    detectAsync().then((asyncResult) => {
      if (asyncResult.result === 'installed') {
        setDetectResult('installed')
      } else {
        setDetectResult(asyncResult.result)
      }
    })
  }, [])

  /** 点击下载按钮 - 使用试探性下载方式 */
  const handleDownloadClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (activeMethod.isExternal) return

    // 非 Edge 移动端禁止下载，引导下载 Edge
    if (detectResult === 'not-installed') {
      e.preventDefault()
      setShowHelpModal(true)
      return
    }

    // mobile-edge 或其他状态允许下载
    e.preventDefault()

    const downloadWindow = window.open(SCRIPT_DOWNLOAD, '_blank')

    setTimeout(() => {
      if (downloadWindow && !downloadWindow.closed) {
        setShowHelpModal(true)
      }
    }, 1500)
  }, [activeMethod.isExternal, detectResult])

  /** 未安装脚本管理器时的提示卡片 */
  const renderInstallWarning = () => {
    if (detectResult === 'installed' || detectResult === 'detecting') return null

    const isMobileNotEdge = detectResult === 'not-installed'
    const isMobileEdge = detectResult === 'mobile-edge'

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className={`rounded-xl border p-4 mb-5 ${
          isMobileNotEdge
            ? 'bg-brand-orange/5 border-brand-orange/20'
            : isMobileEdge
            ? 'bg-brand-green/5 border-brand-green/20'
            : 'bg-brand-blue/5 border-brand-blue/20'
        }`}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isMobileNotEdge ? 'text-brand-orange' : isMobileEdge ? 'text-brand-green' : 'text-brand-blue'}`} />
          <div>
            <p className={`font-body text-sm font-semibold mb-1 ${isMobileNotEdge ? 'text-brand-orange' : isMobileEdge ? 'text-brand-green' : 'text-brand-blue'}`}>
              {isMobileNotEdge
                ? '手机也可以用脚本！请下载 Edge 浏览器'
                : isMobileEdge
                ? '已检测到 Edge 浏览器，请安装脚本猫或油猴扩展'
                : '建议先安装脚本管理器'}
            </p>
            <p className={`font-body text-xs ${isMobileNotEdge ? 'text-brand-dark/50' : isMobileEdge ? 'text-brand-dark/50' : 'text-brand-dark/50'}`}>
              {isMobileNotEdge
                ? '当前浏览器不支持安装扩展，但手机 Edge 浏览器支持！下载 Edge 后安装脚本猫或油猴即可使用脚本'
                : isMobileEdge
                ? 'Edge 浏览器支持安装扩展，请在菜单 → 扩展中搜索安装脚本猫或油猴，然后下载脚本即可'
                : '我们未能确认您的浏览器是否已安装脚本管理器。如果您尚未安装，请先安装后再下载脚本，否则脚本无法正常运行。'}
            </p>
            {isMobileNotEdge && (
              <div className="flex flex-wrap gap-2 mt-3">
                <a
                  href="https://play.google.com/store/apps/details?id=com.microsoft.emmx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-brand-light-gray hover:border-brand-orange/40 hover:bg-brand-orange/5 text-xs font-body text-brand-dark/70 transition-colors"
                >
                  <img src={EDGE_ICON} alt="Edge" className="w-3.5 h-3.5" />
                  下载 Edge 浏览器
                </a>
              </div>
            )}
            {isMobileEdge && (
              <div className="flex flex-wrap gap-2 mt-3">
                <a
                  href="https://docs.scriptcat.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-brand-light-gray hover:border-brand-green/40 hover:bg-brand-green/5 text-xs font-body text-brand-dark/70 transition-colors"
                >
                  <img src={SCRIPTCAT_LOGO} alt="脚本猫" className="w-3.5 h-3.5" />
                  安装脚本猫
                </a>
                <a
                  href="https://www.tampermonkey.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-brand-light-gray hover:border-brand-green/40 hover:bg-brand-green/5 text-xs font-body text-brand-dark/70 transition-colors"
                >
                  <img src={TAMPERMONKEY_ICON} alt="Tampermonkey" className="w-3.5 h-3.5" />
                  安装油猴
                </a>
              </div>
            )}
            {!isMobileNotEdge && !isMobileEdge && (
              <div className="flex flex-wrap gap-2 mt-3">
                <a
                  href="https://docs.scriptcat.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-brand-light-gray hover:border-brand-blue/40 hover:bg-brand-blue/5 text-xs font-body text-brand-dark/70 transition-colors"
                >
                  <img src={SCRIPTCAT_LOGO} alt="脚本猫" className="w-3.5 h-3.5" />
                  安装脚本猫
                </a>
                <a
                  href="https://www.tampermonkey.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-brand-light-gray hover:border-brand-blue/40 hover:bg-brand-blue/5 text-xs font-body text-brand-dark/70 transition-colors"
                >
                  <img src={TAMPERMONKEY_ICON} alt="Tampermonkey" className="w-3.5 h-3.5" />
                  安装 Tampermonkey
                </a>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <section id="install" className="relative py-16 sm:py-20 md:py-32 bg-brand-dark/[0.02]">
      <div className="section-container">
        {/* Section Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 md:mb-20"
        >
          <span className="font-body text-sm font-medium text-brand-blue uppercase tracking-widest">
            Installation
          </span>
          <h2 className="font-heading text-3xl xs:text-4xl md:text-5xl lg:text-6xl font-semibold text-brand-dark mt-4 mb-4 md:mb-6">
            脚本下载
          </h2>
          <p className="max-w-xl mx-auto text-base sm:text-lg font-body text-brand-dark/40 leading-relaxed">
            选择你喜欢的方式，开始使用网课小助手
          </p>
        </motion.div>

        {/* Tab + Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          {/* Tabs */}
          <div className="flex flex-col xs:flex-row gap-1.5 xs:gap-2 p-1.5 bg-brand-light-gray/50 rounded-2xl mb-6 md:mb-8 overflow-x-auto">
            {INSTALL_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => setActiveTab(method.id)}
                className={`flex-1 py-2.5 xs:py-3 px-3 xs:px-4 rounded-xl text-xs xs:text-sm font-body font-medium transition-all duration-300 whitespace-nowrap ${
                  activeTab === method.id
                    ? 'bg-white text-brand-dark shadow-sm'
                    : 'text-brand-dark/40 hover:text-brand-dark/60'
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>

          {/* 未安装脚本管理器时的提示 */}
          {renderInstallWarning()}

          {/* Content */}
          <div className="glass-card p-6 sm:p-8 md:p-10">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5 md:mb-6">
              <Download className="w-5 h-5 text-brand-orange" />
              <h3 className="font-heading text-lg sm:text-xl font-semibold text-brand-dark">
                {activeMethod.label}
              </h3>
              <span className="hidden sm:inline text-sm text-brand-dark/30">—</span>
              <span className="text-xs sm:text-sm text-brand-dark/40 w-full sm:w-auto">{activeMethod.description}</span>
            </div>

            <ol className="space-y-3 sm:space-y-4 mb-6 md:mb-8">
              {activeMethod.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 sm:gap-4">
                  <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-brand-dark/[0.06] flex items-center justify-center text-xs sm:text-sm font-body font-medium text-brand-dark/60">
                    {i + 1}
                  </span>
                  <span
                    className="font-body text-sm sm:text-base text-brand-dark/55 pt-0.5 [&_a]:text-brand-blue [&_a]:font-medium"
                    dangerouslySetInnerHTML={{ __html: step }}
                  />
                </li>
              ))}
            </ol>

            {/* CTA Button */}
            <div className="flex flex-col xs:flex-row gap-3">
              <a
                href={activeMethod.actionHref}
                target={activeMethod.isExternal ? '_blank' : undefined}
                rel={activeMethod.isExternal ? 'noopener noreferrer' : undefined}
                onClick={handleDownloadClick}
                className={`inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 font-body font-semibold rounded-full transition-all duration-300 shadow-lg text-sm sm:text-base ${
                  detectResult === 'installed' || detectResult === 'mobile-edge'
                    ? 'bg-brand-dark text-brand-light hover:bg-brand-orange shadow-brand-dark/10'
                    : detectResult === 'not-installed'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                    : 'bg-brand-dark text-brand-light hover:bg-brand-orange shadow-brand-dark/10'
                }`}
                >
                <activeMethod.actionIcon className="w-4 h-4" />
                {activeMethod.actionLabel}
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 帮助提示弹窗 */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowHelpModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, type: 'spring', damping: 25 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setShowHelpModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              <div className="p-6 sm:p-8">
                {/* 标题 */}
                <h3 className="font-heading text-lg font-semibold text-brand-dark mb-4">
                  {detectResult === 'not-installed' ? '手机也可以用脚本！' : detectResult === 'mobile-edge' ? '请安装脚本猫或油猴扩展' : '请检查新打开的页面'}
                </h3>

                {/* 非 Edge 移动端提示 */}
                {detectResult === 'not-installed' && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-body text-sm font-semibold text-amber-700 mb-1">
                        当前浏览器不支持安装扩展
                      </p>
                      <p className="font-body text-xs text-amber-600">
                        手机 Edge 浏览器支持安装扩展！下载 Edge 后安装脚本猫或油猴即可使用脚本
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <a
                          href="https://play.google.com/store/apps/details?id=com.microsoft.emmx"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-xs font-body text-amber-700 transition-colors"
                        >
                          下载 Edge 浏览器
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edge 移动端提示 */}
                {detectResult === 'mobile-edge' && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-body text-sm font-semibold text-green-700 mb-1">
                        已检测到 Edge 浏览器
                      </p>
                      <p className="font-body text-xs text-green-600">
                        Edge 支持安装扩展，请在菜单 → 扩展中搜索安装脚本猫或油猴，然后下载脚本即可
                      </p>
                    </div>
                  </div>
                )}

                {/* 桌面端两种情况说明 */}
                {detectResult !== 'not-installed' && detectResult !== 'mobile-edge' && (
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-body text-sm font-semibold text-green-700 mb-1">
                          看到脚本安装界面？
                        </p>
                        <p className="font-body text-xs text-green-600">
                          说明脚本管理器已正确拦截，点击「安装」即可完成安装
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-body text-sm font-semibold text-amber-700 mb-1">
                          看到脚本代码内容？
                        </p>
                        <p className="font-body text-xs text-amber-600">
                          说明脚本管理器未拦截，请先安装脚本管理器
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="font-body text-xs text-brand-dark/40 mb-5">
                  {detectResult === 'uncertain'
                    ? '由于浏览器安全限制，网页无法100%确定扩展安装状态，请根据页面内容自行判断'
                    : detectResult === 'not-installed'
                    ? '下载 Edge 浏览器后，安装脚本猫或油猴即可使用脚本'
                    : detectResult === 'mobile-edge'
                    ? '安装脚本猫或油猴扩展后，刷新本页面下载脚本'
                    : '请根据新打开页面的内容判断是否安装成功'}
                </p>

                {/* 安装脚本管理器选项 */}
                <div className="space-y-2 mb-4">
                  <p className="font-body text-xs text-brand-dark/50 mb-2">
                    {detectResult === 'not-installed' ? '需要支持扩展的浏览器？' : '需要安装脚本管理器？'}
                  </p>
                  {detectResult === 'not-installed' ? (
                    <div className="flex flex-col xs:flex-row gap-2">
                      <a
                        href="https://play.google.com/store/apps/details?id=com.microsoft.emmx"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-gray-200 hover:border-brand-orange/30 hover:bg-amber-50 transition-all font-body text-sm text-brand-dark/70"
                      >
                        <img src={EDGE_ICON} alt="Edge" className="w-4 h-4" />
                        下载 Edge 浏览器
                      </a>
                    </div>
                  ) : (
                    <div className="flex flex-col xs:flex-row gap-2">
                        <a
                          href="https://docs.scriptcat.org/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-gray-200 hover:border-brand-dark/30 hover:bg-gray-50 transition-all font-body text-sm text-brand-dark/70"
                        >
                          <img src={SCRIPTCAT_LOGO} alt="脚本猫" className="w-4 h-4" />
                          脚本猫
                        </a>
                      <a
                        href="https://www.tampermonkey.net/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-gray-200 hover:border-brand-dark/30 hover:bg-gray-50 transition-all font-body text-sm text-brand-dark/70"
                      >
                        <img src={TAMPERMONKEY_ICON} alt="Tampermonkey" className="w-4 h-4" />
                        Tampermonkey
                      </a>
                    </div>
                  )}
                </div>

                {/* 关闭按钮 */}
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="w-full py-2.5 px-4 rounded-full bg-brand-dark text-brand-light font-body text-sm font-semibold hover:bg-brand-orange transition-colors"
                >
                  我知道了
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
