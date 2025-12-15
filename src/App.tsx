import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { X, Upload } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

// Components
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Footer from './components/Footer'
import Hero from './components/Hero'
import Dashboard from './components/Dashboard'
import ResourceGrid from './components/ResourceGrid'
import AIAssistantPage from './components/AIAssistantPage'
import UploadModal from './components/UploadModal'
import AuthModal from './components/AuthModal'
import Toast from './components/Toast'
import ProfilePage from './components/ProfilePage'
import BrowseResources from './components/BrowseResources'
import AdminPanel from './components/AdminPanel'
import Preparation from './components/Preparation'
import CoursePlayer from './components/CoursePlayer'
import AIPapers from './components/AIPapers'
import CGPACalculator from './components/CGPACalculator'
import AboutPage from './components/AboutPage'
import ContactPage from './components/ContactPage'
import DocsPage from './components/DocsPage'
import PrivacyPage from './components/PrivacyPage'
import TermsPage from './components/TermsPage'
import SavedResources from './components/SavedResources'
import SharedResourcesPage from './components/SharedResourcesPage'
import SharedUnitPage from './components/SharedUnitPage';
import OurTeam from './components/OurTeam';
import PomodoroPage from './components/PomodoroPage';
import CoffessionsPage from './components/CoffessionsPage';
import CoffeeChat from './components/CoffeeChat';
import VideoChat from './pages/VideoChat';
import PdfGeneratorPage from './components/PdfGeneratorPage';

import SEO from './components/SEO'
import AttendanceManager from './components/attendance/AttendanceManager'
import CookieBanner from './components/CookieBanner'


function Layout({
  children,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onUploadClick,
  onAuthClick,
  user,
  isDark,
  toggleTheme,
  spotlight
}: any) {
  const navigate = useNavigate()
  const location = useLocation()
  const isCoffessionsPage = location.pathname === '/coffessions'
  const isStanadalonePage = location.pathname === '/video-chat'
  const isChatPage = location.pathname === '/chat'

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className={`flex flex-col bg-white dark:bg-black text-gray-950 dark:text-gray-50 transition-colors duration-200 font-sans selection:bg-gray-900 selection:text-white dark:selection:bg-gray-100 dark:selection:text-black ${(isChatPage || isStanadalonePage) ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'}`}>

      {/* 1. Sticky Top Navigation (Glassmorphism) */}
      {!isStanadalonePage && (
        <div className="flex-shrink-0 sticky top-0 z-50 w-full">
          <Header
            onUploadClick={onUploadClick}
            onAuthClick={onAuthClick}
            onProfileClick={() => navigate('/profile')}
            onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            user={user}
          />
        </div>
      )}

      <div className={
        isStanadalonePage ? "w-full flex-1"
          : isChatPage ? "flex flex-1 w-full overflow-hidden"
            : `flex flex-1 items-start gap-10 ${isCoffessionsPage ? 'px-0 sm:px-6 pt-0' : 'px-4 sm:px-6 pt-6'} md:px-8 max-w-[1600px] mx-auto w-full`
      }>

        {/* 2. Sticky Left Sidebar (Hidden on Mobile) - Hidden on Standalone Pages */}
        {!isStanadalonePage && (
          <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-[240px] flex-col overflow-y-auto md:flex shrink-0">
            <Sidebar
              isMobileMenuOpen={isMobileMenuOpen}
              onMobileMenuClose={() => setIsMobileMenuOpen(false)}
              isDark={isDark}
              toggleTheme={toggleTheme}
              spotlight={spotlight}
            />
          </aside>
        )}

        {/* 3. Main Content Area */}
        <main className={`flex-1 min-w-0 animate-fade-in ${(isStanadalonePage || isChatPage) ? '' : 'pb-24'}`}>
          {children}
        </main>
      </div>

      {/* Footer */}
      {location.pathname !== '/chat' && <Footer />}

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Sidebar with slide animation */}
            <motion.div
              key="sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[70] w-3/4 max-w-sm bg-white dark:bg-black shadow-2xl flex flex-col md:hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header with Logo and Close Button */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <img src="/LOGO.png" alt="Extrovert Logo" className="w-6 h-6 rounded-md object-contain" />
                  <span className="font-semibold text-base text-gray-900 dark:text-white">Extrovert</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  isMobileMenuOpen={true}
                  onMobileMenuClose={() => setIsMobileMenuOpen(false)}
                  isDark={isDark}
                  toggleTheme={toggleTheme}
                  spotlight={spotlight}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Protected Route Component - Shows auth modal for non-logged users
function ProtectedRoute({ children, onAuthRequired }: { children: React.ReactNode, onAuthRequired: () => void }) {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [hasShownModal, setHasShownModal] = useState(false)

  useEffect(() => {
    // Wait for auth state to load before checking authentication
    if (!isLoading && !user && !hasShownModal) {
      onAuthRequired()
      setHasShownModal(true)
      // Redirect to home after a brief delay to allow modal to show
      setTimeout(() => {
        navigate('/')
      }, 100)
    }
  }, [user, isLoading, hasShownModal, onAuthRequired, navigate])

  // Show nothing while loading auth state
  if (isLoading) {
    return null
  }

  if (!user) {
    return null // Don't render anything while redirecting
  }

  return <>{children}</>
}

// Protected Admin Route Component
function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  if (!user || !['admin', 'semi-admin', 'content-reviewer', 'structure-manager'].includes(user.role || '')) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

import { useAutoTranslation } from './hooks/useAutoTranslation';

function AppContent() {
  const { user } = useAuth()
  useAutoTranslation(); // Enable auto-translation for the entire app

  // --- PROTECTION: Prevent Context Menu (Right Click) ---
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalInitialView, setAuthModalInitialView] = useState<'login' | 'signup'>('login')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Data States
  const [searchQuery] = useState('')
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false })
  const [uploadInitialData, setUploadInitialData] = useState<any>(null)

  // Spotlight State
  const [spotlight] = useState<string | null>(null)

  // Helper function to determine theme based on time of day
  const getThemeByTime = () => {
    const hour = new Date().getHours()
    // Dark mode: 6 PM (18:00) to 6 AM (06:00)
    return hour >= 18 || hour < 6
  }

  // Theme State
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')

      // Priority: saved preference → time-based → system preference
      if (savedTheme === 'dark') return true
      if (savedTheme === 'light') return false

      // If no saved preference, use time-based theme
      return getThemeByTime()
    }
    return false
  })

  // Theme Effect
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  const toggleTheme = () => setIsDark(!isDark)

  const showToast = (message: string) => {
    setToast({ message, show: true })
    setTimeout(() => setToast({ message: '', show: false }), 3000)
  }

  const handleUploadClick = () => {
    if (!user) {
      setIsAuthModalOpen(true)
      showToast('Please sign in to upload resources')
    } else {
      setUploadInitialData(null)
      setIsUploadModalOpen(true)
    }
  }

  const handleUploadWithData = (data: any) => {
    if (!user) {
      setIsAuthModalOpen(true)
      showToast('Please sign in to upload resources')
    } else {
      setUploadInitialData(data)
      setIsUploadModalOpen(true)
    }
  }

  const handleGetStarted = () => {
    if (user) {
      setIsMobileMenuOpen(true)
    } else {
      setAuthModalInitialView('signup')
      setIsAuthModalOpen(true)
    }
  }

  return (
    <BrowserRouter>
      <Layout
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onUploadClick={handleUploadClick}
        onAuthClick={() => {
          setAuthModalInitialView('login')
          setIsAuthModalOpen(true)
        }}
        user={user}
        isDark={isDark}
        toggleTheme={toggleTheme}
        spotlight={spotlight}
      >
        <Routes>
          {/* Home Route */}
          <Route path="/" element={
            <div className="space-y-8">
              <SEO
                title="Extrovert - #1 Medicaps University Notes | College Notes & PYQs"
                description="Download the best Medicaps University notes, previous year question papers (PYQs), and syllabus. The ultimate resource hub for B.Tech and MBA students."
              />
              {user ? <Dashboard /> : <Hero onGetStarted={handleGetStarted} user={user} />}
            </div>
          } />

          {/* Browse Resources Route */}
          <Route path="/resources" element={
            <>
              <SEO
                title="Browse Medicaps Notes & Syllabus - All Semesters"
                description="Comprehensive collection of Medicaps University notes and study materials. Filter by branch (CSE, IT, ME) and year. Download for free."
                url="https://extrovert.site/resources"
              />
              <BrowseResources onUploadRequest={handleUploadWithData} />
            </>
          } />

          {/* CGPA Calculator Route (Public) */}
          <Route path="/cgpa-calculator" element={
            <>
              <SEO
                title="CGPA Calculator for Medicaps University"
                description="Calculate your CGPA and SGPA instantly with the Extrovert CGPA Calculator. Tailored for Medicaps grading system."
              />
              <CGPACalculator />
            </>
          } />

          {/* Pomodoro Timer Route (Public) */}
          <Route path="/pomodoro" element={
            <>
              <SEO
                title="Study Timer & Pomodoro - Focus Mode"
                description="Boost your productivity with our aesthetic Pomodoro timer and lo-fi beats. Perfect for long study sessions."
              />
              <PomodoroPage />
            </>
          } />

          {/* Attendance Manager Route (Protected) */}
          <Route path="/attendance" element={
            <ProtectedRoute onAuthRequired={() => {
              setAuthModalInitialView('login')
              setIsAuthModalOpen(true)
            }}>
              <SEO title="Attendance Manager - Track Your Classes" />
              <AttendanceManager />
            </ProtectedRoute>
          } />

          {/* AI Assistant Route (Protected) */}
          <Route path="/ai-assistant" element={
            <ProtectedRoute onAuthRequired={() => {
              setAuthModalInitialView('login')
              setIsAuthModalOpen(true)
            }}>
              <SEO title="AI Study Assistant - Ask Doubts Instantly" />
              <AIAssistantPage />
            </ProtectedRoute>
          } />

          {/* Leaderboard Route */}
          <Route path="/leaderboard" element={
            <>
              <SEO
                title="Top Contributors Leaderboard - Medicaps Community"
                description="See the top students contributing notes and resources to the Extrovert community."
                url="https://extrovert.site/leaderboard"
              />
              <ResourceGrid view="leaderboard" searchQuery={searchQuery} />
            </>
          } />
          {/* Preparation Routes (Protected) */}
          <Route path="/preparation" element={
            <ProtectedRoute onAuthRequired={() => {
              setAuthModalInitialView('login')
              setIsAuthModalOpen(true)
            }}>
              <Preparation />
            </ProtectedRoute>
          } />
          <Route path="/preparation/play" element={
            <ProtectedRoute onAuthRequired={() => {
              setAuthModalInitialView('login')
              setIsAuthModalOpen(true)
            }}>
              <CoursePlayer />
            </ProtectedRoute>
          } />

          {/* Coffessions Route (Public but requires auth to post, Page handles it) */}
          <Route path="/coffessions" element={
            <>
              <SEO
                title="Coffessions - Anonymous College Confessions"
                description="Share your campus secrets and thoughts anonymously on Coffessions. Safe, fun, and disappearing in 48 hours."
              />
              <CoffessionsPage />
            </>
          } />

          {/* CoffeeChat Route (Public/Protected) */}
          <Route path="/chat" element={
            <>
              <SEO
                title="Group Chat (GC) - Medicaps Student Community"
                description="Join the live group chat for Medicaps University students. Discuss exams, events, and campus life."
              />
              <CoffeeChat />
            </>
          } />

          {/* Video Chat Route (Protected) */}
          <Route path="/video-chat" element={
            <ProtectedRoute onAuthRequired={() => {
              setAuthModalInitialView('login')
              setIsAuthModalOpen(true)
            }}>
              <SEO
                title="Omex - Omegle Alternative from Extrovert | Random Video Chat"
                description="Meet new people on Omex, the safe Omegle alternative for students. Random video chat with verified college peers."
              />
              <VideoChat />
            </ProtectedRoute>
          } />

          {/* PDF Generator Route (Public with rate limit) */}
          <Route path="/pdf-generator" element={
            <>
              <SEO
                title="Free AI PDF Generator - Create Documents Instantly"
                description="The best free AI PDF Generator. Create professional letters, applications, and reports in seconds with AI. No signup required."
              />
              <PdfGeneratorPage />
            </>
          } />

          {/* AI Papers Route (Protected) */}
          <Route path="/ai-papers" element={
            <ProtectedRoute onAuthRequired={() => {
              setAuthModalInitialView('login')
              setIsAuthModalOpen(true)
            }}>
              <AIPapers />
            </ProtectedRoute>
          } />

          {/* Admin Route (Protected) */}
          <Route path="/admin" element={
            <ProtectedAdminRoute>
              <AdminPanel />
            </ProtectedAdminRoute>
          } />


          {/* My Uploads Route (Protected) */}
          <Route path="/uploads" element={
            <ProtectedRoute onAuthRequired={() => {
              setAuthModalInitialView('login')
              setIsAuthModalOpen(true)
            }}>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h1 className="text-3xl font-bold tracking-tight">My Contributions</h1>
                  <button
                    onClick={handleUploadClick}
                    className="flex items-center gap-2 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-black/5 dark:shadow-white/5"
                  >
                    <Upload size={18} />
                    <span>Upload More</span>
                  </button>
                </div>
                <ResourceGrid view="uploads" searchQuery={searchQuery} onUploadRequest={handleUploadWithData} />
              </div>
            </ProtectedRoute>
          } />


          {/* Saved Resources Route (Protected) */}
          <Route path="/saved-resources" element={
            <ProtectedRoute onAuthRequired={() => {
              setAuthModalInitialView('login')
              setIsAuthModalOpen(true)
            }}>
              <SavedResources />
            </ProtectedRoute>
          } />

          {/* Profile Route (Protected) */}
          <Route path="/profile" element={
            <ProtectedRoute onAuthRequired={() => {
              setAuthModalInitialView('login')
              setIsAuthModalOpen(true)
            }}>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* About Route */}
          <Route path="/about" element={<AboutPage />} />

          {/* Our Team Route */}
          <Route path="/our-team" element={<OurTeam />} />

          {/* Contact Route */}
          <Route path="/contact" element={<ContactPage />} />

          {/* Docs Route */}
          <Route path="/docs" element={
            <>
              <SEO
                title="Documentation"
                description="Learn how to use Extrovert, upload resources, and get the most out of the platform."
                url="https://extrovert.site/docs"
              />
              <DocsPage />
            </>
          } />

          {/* Privacy Route */}
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Terms Route */}
          <Route path="/terms" element={<TermsPage />} />

          {/* Shared Resources Route */}
          <Route path="/shared/:slug" element={<SharedResourcesPage />} />

          {/* Shared Unit Route */}
          <Route path="/share/unit" element={<SharedUnitPage />} />
          <Route path="/share/subject" element={<SharedUnitPage />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      {/* Global Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={(title) => {
          setIsUploadModalOpen(false)
          showToast(`✅ "${title}" uploaded successfully!`)
        }}
        initialData={uploadInitialData}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialView={authModalInitialView}
      />

      <Toast message={toast.message} show={toast.show} />

      {!user && <CookieBanner />}
    </BrowserRouter>
  )
}

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy_client_id_to_prevent_crash'}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

export default App