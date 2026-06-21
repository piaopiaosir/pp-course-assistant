import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import logoImg from '../../image/图层 1.png'

const NAV_ITEMS = [
  { label: '首页', id: 'home' },
  { label: '下载脚本', id: 'install' },
  { label: '免费次数', id: 'welfare' },
  { label: '服务监控', id: 'status' },
  { label: '题库接口', id: 'tiku' },
  { label: '故障排查', id: 'help' },
] as const

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

interface NavbarProps {
  className?: string
  currentPage?: 'home' | 'help' | 'sponsor' | 'welfare' | 'status' | 'tiku'
  onNavigateHelp?: () => void
  onNavigateHome?: () => void
  onNavigateSponsor?: () => void
  onNavigateWelfare?: () => void
  onNavigateStatus?: () => void
  onNavigateTiku?: () => void
}

export default function Navbar({ className = '', currentPage = 'home', onNavigateHelp, onNavigateHome, onNavigateSponsor, onNavigateWelfare, onNavigateStatus, onNavigateTiku }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pendingSectionRef = useRef<string | null>(null)
  const isHelpPage = currentPage === 'help'
  const isSponsorPage = currentPage === 'sponsor'
  const isWelfarePage = currentPage === 'welfare'
  const isStatusPage = currentPage === 'status'
  const isTikuPage = currentPage === 'tiku'
  const isSubPage = isHelpPage || isSponsorPage || isWelfarePage || isStatusPage || isTikuPage

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // When we navigate back to home, scroll to the pending section
  useEffect(() => {
    if (!isSubPage && pendingSectionRef.current) {
      const sectionId = pendingSectionRef.current
      pendingSectionRef.current = null
      setTimeout(() => scrollToSection(sectionId), 500)
    }
  }, [isSubPage])

  const goHomeThenScroll = (sectionId: string) => {
    if (isSubPage && onNavigateHome) {
      pendingSectionRef.current = sectionId
      onNavigateHome()
    } else {
      scrollToSection(sectionId)
    }
  }

  const handleLogoClick = () => {
    if (isSubPage && onNavigateHome) {
      onNavigateHome()
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNavClick = (id: string) => {
    setMobileOpen(false)
    if (id === 'home') {
      if (isSubPage && onNavigateHome) {
        onNavigateHome()
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } else if (id === 'help') {
      if (isHelpPage) return
      if (onNavigateHelp) onNavigateHelp()
    } else if (id === 'sponsor') {
      if (isSponsorPage) return
      if (onNavigateSponsor) onNavigateSponsor()
    } else if (id === 'welfare') {
      if (isWelfarePage) return
      if (onNavigateWelfare) onNavigateWelfare()
    } else if (id === 'status') {
      if (isStatusPage) return
      if (onNavigateStatus) onNavigateStatus()
    } else if (id === 'tiku') {
      if (isTikuPage) return
      if (onNavigateTiku) onNavigateTiku()
    } else {
      goHomeThenScroll(id)
    }
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-brand-light/80 backdrop-blur-xl shadow-[0_1px_0_0_#e8e6dc]'
          : 'bg-transparent'
      } ${className}`}
    >
      <div className="section-container flex items-center justify-between h-14 md:h-20">
        {/* Logo */}
        <button onClick={handleLogoClick} className="flex items-center gap-2 md:gap-2.5 group cursor-pointer flex-shrink-0">
          <img src={logoImg} alt="Logo" className="w-8 h-8 md:w-9 md:h-9 object-contain shadow-md rounded-lg" />
          <span className="font-heading text-lg md:text-xl font-semibold tracking-tight text-brand-dark whitespace-nowrap">
            网课小助手
          </span>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {NAV_ITEMS.map((item) => {
            const isActive =
              (!isSubPage && item.id === 'home') ||
              (isHelpPage && item.id === 'help') ||
              (isWelfarePage && item.id === 'welfare') ||
              (isStatusPage && item.id === 'status') ||
              (isTikuPage && item.id === 'tiku')
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-sm font-body font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'text-brand-orange'
                    : 'text-brand-dark/60 hover:text-brand-orange'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 -mr-2 text-brand-dark/70 hover:text-brand-dark transition-colors cursor-pointer flex-shrink-0"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={mobileOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="md:hidden overflow-hidden bg-brand-light/95 backdrop-blur-xl border-b border-brand-light-gray"
      >
        <div className="section-container py-4 flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              (!isSubPage && item.id === 'home') ||
              (isHelpPage && item.id === 'help') ||
              (isWelfarePage && item.id === 'welfare') ||
              (isStatusPage && item.id === 'status') ||
              (isTikuPage && item.id === 'tiku')
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`py-2.5 text-sm font-body font-medium transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'text-brand-orange'
                    : 'text-brand-dark/60 hover:text-brand-orange'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </motion.div>
    </motion.nav>
  )
}
