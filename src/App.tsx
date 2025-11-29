import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Components
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Hero from './components/Hero'
import ResourceGrid from './components/ResourceGrid'
import AIAssistant from './components/AIAssistant'
import UploadModal from './components/UploadModal'
import AuthModal from './components/AuthModal'
import Toast from './components/Toast'
import Profile from './components/Profile'
import BrowseByBranch from './components/BrowseByBranch'
import AdminPanel from './components/AdminPanel'
import SubjectDashboard from './components/SubjectDashboard'

function Layout({
  children,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onUploadClick,
  onAuthClick,
  onProfileClick,
  searchQuery,
  setSearchQuery,
  user,
  isDark,
  toggleTheme
}: any) {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black text-gray-950 dark:text-gray-50 transition-colors duration-200 font-sans selection:bg-gray-900 selection:text-white dark:selection:bg-gray-100 dark:selection:text-black">

      {/* 1. Sticky Top Navigation (Glassmorphism) */}
      <Header
        onUploadClick={onUploadClick}
        onAuthClick={onAuthClick}
        onProfileClick={onProfileClick}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        user={user}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      <div className="flex flex-1 items-start gap-10 px-4 sm:px-6 md:px-8 pt-6 max-w-[1600px] mx-auto w-full">

        {/* 2. Sticky Left Sidebar (Hidden on Mobile) */}
        <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-[240px] flex-col overflow-y-auto md:flex shrink-0">
          <Sidebar
            isMobileMenuOpen={isMobileMenuOpen}
            onMobileMenuClose={() => setIsMobileMenuOpen(false)}
          />
        </aside>

        {/* 3. Main Content Area */}
        <main className="flex-1 min-w-0 pb-10 animate-fade-in">
          {children}
        </main>

        {/* 4. Optional Right Sidebar (TOC) - Placeholder if needed matching the HTML structure */}
        {/* <aside className="sticky top-20 hidden xl:block w-[240px] shrink-0">
             <TableOfContents /> 
           </aside> 
        */}
      </div>

      {/* Mobile Sidebar Overlay (Handled inside Sidebar usually, or here) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-3/4 bg-white dark:bg-black p-4" onClick={e => e.stopPropagation()}>
            <Sidebar isMobileMenuOpen={true} onMobileMenuClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <AIAssistant />
    </div>
  )
}

function AppContent() {
  const { user } = useAuth()

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Data States
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<{ branch?: string; year?: number; subject?: string }>({})
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false })

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
      setIsUploadModalOpen(true)
    }
  }

  return (
    <BrowserRouter>
      <Layout
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onUploadClick={handleUploadClick}
        onAuthClick={() => setIsAuthModalOpen(true)}
        onProfileClick={() => setIsProfileModalOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        isDark={isDark}
        toggleTheme={toggleTheme}
      >
        <Routes>
          {/* Home Route */}
          <Route path="/" element={
            <div className="space-y-8">
              <Hero />
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">Browse Resources</h2>
                <BrowseByBranch onFilterChange={setFilters} />
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <ResourceGrid view="resources" filters={filters} searchQuery={searchQuery} />
              </div>
            </div>
          } />

          {/* Leaderboard Route */}
          <Route path="/leaderboard" element={
            <div className="space-y-6">
              <h1 className="text-3xl font-bold tracking-tight">Community Leaderboard</h1>
              <p className="text-gray-500 dark:text-gray-400">Top contributors helping the community grow.</p>
              <ResourceGrid view="leaderboard" searchQuery={searchQuery} />
            </div>
          } />

          {/* My Uploads Route (Protected) */}
          <Route path="/uploads" element={
            user ? (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">My Contributions</h1>
                <ResourceGrid view="uploads" searchQuery={searchQuery} />
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          } />

          {/* Admin Route (Protected) */}
          <Route path="/admin" element={
            /* Add actual admin check logic here usually */
            user ? <AdminPanel /> : <Navigate to="/" replace />
          } />

          {/* Subject Dashboard Route */}
          <Route path="/resources/:course/:year/:subject" element={<SubjectDashboard />} />

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
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {isProfileModalOpen && user && (
        <Profile onClose={() => setIsProfileModalOpen(false)} />
      )}

      <Toast message={toast.message} show={toast.show} />
    </BrowserRouter>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App