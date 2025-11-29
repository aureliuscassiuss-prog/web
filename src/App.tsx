import { useState, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Hero from './components/Hero'
import ResourceGrid from './components/ResourceGrid'
import AIAssistant from './components/AIAssistant'
import UploadModal from './components/UploadModal'
import AuthModal from './components/AuthModal'
import Toast from './components/Toast'

function AppContent() {
  const { user } = useAuth()
  const [currentView, setCurrentView] = useState('home')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false })

  // Theme State
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    return false
  })

  // Apply Theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  const toggleTheme = () => setIsDark(!isDark)

  const showToast = (message: string) => {
    setToast({ message, show: true })
    setTimeout(() => setToast({ message: '', show: false }), 3000)
  }

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />

        <main className="flex-1 flex flex-col min-w-0">
          <Header
            onUploadClick={() => {
              if (!user) {
                setIsAuthModalOpen(true)
                showToast('Please sign in to upload resources')
              } else {
                setIsUploadModalOpen(true)
              }
            }}
            onAuthClick={() => setIsAuthModalOpen(true)}
            user={user}
            isDark={isDark}
            toggleTheme={toggleTheme}
          />

          <div className="flex-1">
            {currentView === 'home' && (
              <>
                <Hero />
                <ResourceGrid view="resources" />
              </>
            )}
            {currentView === 'leaderboard' && <ResourceGrid view="leaderboard" />}
            {currentView === 'papers' && <ResourceGrid view="papers" />}
          </div>
        </main>

        <AIAssistant />

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

        <Toast message={toast.message} show={toast.show} />
      </div>
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
