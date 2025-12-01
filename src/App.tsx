import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

// Components
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Footer from './components/Footer'
import Hero from './components/Hero'
import ResourceGrid from './components/ResourceGrid'
import AIAssistantPage from './components/AIAssistantPage'
import UploadModal from './components/UploadModal'
import AuthModal from './components/AuthModal'
import Toast from './components/Toast'
import ProfilePage from './components/ProfilePage'
import BrowseResources from './components/BrowseResources'
import AdminPanel from './components/AdminPanel'
import AboutPage from './components/AboutPage'
import ContactPage from './components/ContactPage'
import DocsPage from './components/DocsPage'
import PrivacyPage from './components/PrivacyPage'
import TermsPage from './components/TermsPage'


function Layout({
  children,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onUploadClick,
  onAuthClick,
  searchQuery,
  setSearchQuery,
  user,
  isDark,
  toggleTheme,
  spotlight
}: any) {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black text-gray-950 dark:text-gray-50 transition-colors duration-200 font-sans selection:bg-gray-900 selection:text-white dark:selection:bg-gray-100 dark:selection:text-black">

      {/* 1. Sticky Top Navigation (Glassmorphism) */}
      <Header
        onUploadClick={onUploadClick}
        onAuthClick={onAuthClick}
        onProfileClick={() => navigate('/profile')}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        user={user}
      />

      <div className="flex flex-1 items-start gap-10 px-4 sm:px-6 md:px-8 pt-6 max-w-[1600px] mx-auto w-full">

        {/* 2. Sticky Left Sidebar (Hidden on Mobile) */}
        <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-[240px] flex-col overflow-y-auto md:flex shrink-0">
          <Sidebar
            isMobileMenuOpen={isMobileMenuOpen}
            onMobileMenuClose={() => setIsMobileMenuOpen(false)}
            isDark={isDark}
            toggleTheme={toggleTheme}
            spotlight={spotlight}
          />
        </aside>

        {/* 3. Main Content Area */}
        <main className="flex-1 min-w-0 pb-10 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Footer */}
      <Footer />

      {/* Mobile Sidebar Overlay */}
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
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Sidebar with slide animation */}
            <motion.div
              key="sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm bg-white dark:bg-black shadow-2xl flex flex-col md:hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header with Logo and Close Button */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-xs">UN</span>
                  </div>
                  <span className="font-semibold text-base text-gray-900 dark:text-white">UniNotes</span>
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

function AppContent() {
  const { user } = useAuth()

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Data States
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<{ branch?: string; year?: number; subject?: string }>({})
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false })
  const [uploadInitialData, setUploadInitialData] = useState<any>(null)

  // Spotlight State
  const [spotlight, setSpotlight] = useState<string | null>(null)

  // Theme State
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
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
    setIsMobileMenuOpen(true)
    setSpotlight('browse-resources')
    setTimeout(() => setSpotlight(null), 3000)
  }

  return (
    <BrowserRouter>
      <Layout
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onUploadClick={handleUploadClick}
        onAuthClick={() => setIsAuthModalOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        isDark={isDark}
        toggleTheme={toggleTheme}
        spotlight={spotlight}
      >
        <Routes>
          {/* Home Route */}
          <Route path="/" element={
            <div className="space-y-8">
              <Hero onGetStarted={handleGetStarted} />
            </div>
          } />

          {/* Browse Resources Route */}
          <Route path="/resources" element={<BrowseResources onUploadRequest={handleUploadWithData} />} />

          {/* AI Assistant Route */}
          <Route path="/ai-assistant" element={<AIAssistantPage />} />

          {/* Leaderboard Route */}
          <Route path="/leaderboard" element={
            <ResourceGrid view="leaderboard" searchQuery={searchQuery} />
          } />

          {/* My Uploads Route (Protected) */}
          <Route path="/uploads" element={
            user ? (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">My Contributions</h1>
                <ResourceGrid view="uploads" searchQuery={searchQuery} onUploadRequest={handleUploadWithData} />
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          } />

          {/* Admin Route (Protected) */}
          <Route path="/admin" element={
            user && user.role === 'admin' ? <AdminPanel /> : <Navigate to="/" replace />
          } />


          {/* Profile Route (Protected) */}
          <Route path="/profile" element={
            user ? <ProfilePage /> : <Navigate to="/" replace />
          } />

          {/* About Route */}
          <Route path="/about" element={<AboutPage />} />

          {/* Contact Route */}
          <Route path="/contact" element={<ContactPage />} />

          {/* Docs Route */}
          <Route path="/docs" element={<DocsPage />} />

          {/* Privacy Route */}
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Terms Route */}
          <Route path="/terms" element={<TermsPage />} />

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
      />

      <Toast message={toast.message} show={toast.show} />
    </BrowserRouter>
  )
}

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

export default App