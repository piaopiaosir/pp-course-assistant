import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import InstallGuide from './components/InstallGuide'
import Footer from './components/Footer'
import HelpPage from './components/HelpPage'
import SponsorsPage from './components/SponsorsPage'
import WelfarePage from './components/WelfarePage'
import StatusPage from './components/StatusPage'
import TikuDocPage from './components/TikuDocPage'
import IntroAnimation from './components/IntroAnimation'

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? '100%' : '-100%', opacity: 0 }),
}

function App() {
  const [mounted, setMounted] = useState(false)
  const [introDone, setIntroDone] = useState(false)
  const [page, setPage] = useState<'home' | 'help' | 'sponsor' | 'welfare' | 'status' | 'tiku'>('home')
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    setMounted(true)
    // 支持 hash 直链跳转，如 #welfare 直接打开免费次数页
    const hash = window.location.hash.replace('#', '')
    if (hash === 'welfare' || hash === 'help' || hash === 'sponsor' || hash === 'status' || hash === 'tiku') {
      setPage(hash as 'welfare' | 'help' | 'sponsor' | 'status' | 'tiku')
    }
  }, [])

  const handleIntroComplete = () => {
    setIntroDone(true)
  }

  const navigateToHelp = () => {
    setDirection(1)
    setPage('help')
    window.scrollTo(0, 0)
  }

  const navigateToHome = () => {
    setDirection(-1)
    setPage('home')
    window.scrollTo(0, 0)
  }

  const navigateToSponsor = () => {
    setDirection(1)
    setPage('sponsor')
    window.scrollTo(0, 0)
  }

  const navigateToWelfare = () => {
    setDirection(1)
    setPage('welfare')
    window.scrollTo(0, 0)
  }

  const navigateToStatus = () => {
    setDirection(1)
    setPage('status')
    window.scrollTo(0, 0)
  }

  const navigateToTiku = () => {
    setDirection(1)
    setPage('tiku')
    window.scrollTo(0, 0)
  }

  if (!mounted) return null

  return (
    <div className="relative min-h-screen bg-brand-light text-brand-dark overflow-hidden">
      {/* 主页内容 - 提前渲染在底层，被 IntroAnimation 遮挡 */}
      <motion.div
        className="min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: introDone ? 1 : 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Navbar
          currentPage={page}
          onNavigateHelp={navigateToHelp}
          onNavigateHome={navigateToHome}
          onNavigateSponsor={navigateToSponsor}
          onNavigateWelfare={navigateToWelfare}
          onNavigateStatus={navigateToStatus}
          onNavigateTiku={navigateToTiku}
        />

        <AnimatePresence mode="wait" custom={direction}>
          {page === 'home' && (
            <motion.div
              key="home"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <main>
                <Hero />
                <Features />
                <InstallGuide />
              </main>
              <Footer />
            </motion.div>
          )}
          {page === 'help' && (
            <motion.div
              key="help"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <HelpPage onBack={navigateToHome} />
            </motion.div>
          )}
          {page === 'sponsor' && (
            <motion.div
              key="sponsor"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <SponsorsPage onBack={navigateToHome} />
            </motion.div>
          )}
          {page === 'welfare' && (
            <motion.div
              key="welfare"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <WelfarePage onBack={navigateToHome} />
            </motion.div>
          )}
          {page === 'status' && (
            <motion.div
              key="status"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <StatusPage onBack={navigateToHome} />
            </motion.div>
          )}
          {page === 'tiku' && (
            <motion.div
              key="tiku"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <TikuDocPage onBack={navigateToHome} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 开场动画 - 绝对定位在顶层 */}
      {!introDone && <IntroAnimation onComplete={handleIntroComplete} />}
    </div>
  )
}

export default App
