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

import SEO from './components/SEO'
import AttendanceManager from './components/attendance/AttendanceManager'


function Layout({
  children,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onUploadClick,
  onAuthClick,
  user,
  isDark,
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

function AppContent() {
  const { user } = useAuth()

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
                title="Extrovert - #1 Resource Hub for Medicaps University | Notes & PYQs"
                description="Access the best collection of Medicaps University notes, previous year question papers (PYQs), and syllabus for B.Tech, MBA, and BBA students."
              />
              {user ? <Dashboard /> : <Hero onGetStarted={handleGetStarted} user={user} />}
            </div>
          } />

          {/* Browse Resources Route */}
          <Route path="/resources" element={
            <>
              <SEO
                title="Medicaps University Notes, PYQs & Syllabus - B.Tech, MBA, BBA"
                description="Find and download Medicaps University study materials. Filter by course, branch, and year. Comprehensive notes for CSE, IT, ME, CE, and more."
                url="https://extrovert.site/resources"
              />
              <BrowseResources onUploadRequest={handleUploadWithData} />
            </>
          } />

          {/* CGPA Calculator Route (Public) */}
          <Route path="/cgpa-calculator" element={<CGPACalculator />} />

          {/* Attendance Manager Route (Protected) */}
          <Route path="/attendance" element={
            <ProtectedRoute onAuthRequired={() => {
              setAuthModalInitialView('login')
              setIsAuthModalOpen(true)
            }}>
              <AttendanceManager />
            </ProtectedRoute>
          } />

          {/* AI Assistant Route (Protected) */}
          <Route path="/ai-assistant" element={
            <ProtectedRoute onAuthRequired={() => {
              setAuthModalInitialView('login')
              setIsAuthModalOpen(true)
            }}>
              <AIAssistantPage />
            </ProtectedRoute>
          } />

          {/* Leaderboard Route */}
          <Route path="/leaderboard" element={
            <>
              <SEO
                title="Top Contributors - Medicaps University Community"
                description="See who's leading the academic community at Medicaps University. Join the leaderboard by sharing your notes and helping fellow students."
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