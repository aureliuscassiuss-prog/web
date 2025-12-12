import { Link } from 'react-router-dom'
import { Heart, Globe, Check } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const { language, setLanguage, t } = useLanguage();
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const langMenuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
                setIsLangMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const languages = [
        // Top Priority
        { code: 'en', label: 'English' },
        { code: 'hi', label: 'हिंदी (Hindi)' },

        // Indian Regional (Alphabetical or Popularity)
        { code: 'bn', label: 'বাংলা (Bengali)' },
        { code: 'mr', label: 'मराठी (Marathi)' },
        { code: 'te', label: 'తెలుగు (Telugu)' },
        { code: 'ta', label: 'தமிழ் (Tamil)' },
        { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
        { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
        { code: 'ml', label: 'മലയാളം (Malayalam)' },
        { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },

        // Global
        { code: 'es', label: 'Español' },
        { code: 'fr', label: 'Français' },
        { code: 'de', label: 'Deutsch' },
        { code: 'it', label: 'Italiano' },
        { code: 'zh-CN', label: '中文 (Chinese)' },
        { code: 'ja', label: '日本語 (Japanese)' },
        { code: 'ru', label: 'Русский (Russian)' },
        { code: 'pt', label: 'Português' },
        { code: 'ar', label: 'العربية (Arabic)' },
        { code: 'ko', label: '한국어 (Korean)' },
    ];

    return (
        <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-zinc-950 relative z-40">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                    {/* Navigation Links */}
                    <nav className="flex flex-wrap items-center justify-center gap-x-1.5 md:gap-x-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <FooterLink to="/about">{t('footer.about')}</FooterLink>
                        <Separator />
                        <FooterLink to="/our-team">{t('footer.team')}</FooterLink>
                        <Separator />
                        <FooterLink to="/contact">{t('footer.contact')}</FooterLink>
                        <Separator />
                        <FooterLink to="/docs">{t('footer.docs')}</FooterLink>
                        <Separator />
                        <FooterLink to="/privacy">{t('footer.privacy')}</FooterLink>
                        <Separator />
                        <FooterLink to="/terms">{t('footer.terms')}</FooterLink>
                    </nav>

                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                        {/* Language Selector */}
                        <div className="relative" ref={langMenuRef}>
                            <button
                                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs font-medium text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors shadow-sm"
                            >
                                <Globe size={12} className="text-indigo-500" />
                                <span>{languages.find(l => l.code === language)?.label || 'English'}</span>
                            </button>

                            {isLangMenuOpen && (
                                <div className="absolute bottom-full right-0 md:left-1/2 md:-translate-x-1/2 mb-2 w-40 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200 notranslate">
                                    {languages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                setLanguage(lang.code as any);
                                                setIsLangMenuOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors
                                            ${language === lang.code ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-600 dark:text-gray-400'}
                                        `}
                                        >
                                            {lang.label}
                                            {language === lang.code && <Check size={12} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Bottom Info Group */}
                        <div className="flex items-center gap-4 text-[10px] md:text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                            <span>&copy; {currentYear} {t('footer.rights')}</span>
                            <span className="h-3 w-px bg-gray-300 dark:bg-gray-700"></span>
                            <div className="flex items-center gap-1">
                                <Heart size={10} className="text-red-500 fill-red-500" />
                                <span>{t('footer.love')}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </footer>
    )
}

// A clean Link component with hover effects
function FooterLink({ to, children }: { to: string, children: React.ReactNode }) {
    return (
        <Link
            to={to}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline hover:decoration-indigo-600/30 underline-offset-4 transition-all px-1 py-1"
        >
            {children}
        </Link>
    )
}

// A tiny dot separator to save space but keep things readable
function Separator() {
    return (
        <span className="text-gray-300 dark:text-gray-700 select-none">&middot;</span>
    )
}