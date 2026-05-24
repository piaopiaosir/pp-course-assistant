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

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? '100%' : '-100%', opacity: 0 }),
}

function App() {
  const [mounted, setMounted] = useState(false)
  const [page, setPage] = useState<'home' | 'help' | 'sponsor' | 'welfare' | 'status'>('home')
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    setMounted(true)
    // 支持 hash 直链跳转，如 #welfare 直接打开免费次数页
    const hash = window.location.hash.replace('#', '')
    if (hash === 'welfare' || hash === 'help' || hash === 'sponsor' || hash === 'status') {
      setPage(hash as 'welfare' | 'help' | 'sponsor' | 'status')
    }
  }, [])

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

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-brand-light text-brand-dark overflow-hidden">
      <Navbar
        currentPage={page}
        onNavigateHelp={navigateToHelp}
        onNavigateHome={navigateToHome}
        onNavigateSponsor={navigateToSponsor}
        onNavigateWelfare={navigateToWelfare}
        onNavigateStatus={navigateToStatus}
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
      </AnimatePresence>
    </div>
  )
}

export default App
