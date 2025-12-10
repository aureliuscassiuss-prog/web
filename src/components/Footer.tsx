import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-zinc-950/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">

                    {/* Navigation Links - Tightly Grouped */}
                    <nav className="flex flex-wrap items-center justify-center gap-x-1.5 md:gap-x-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <FooterLink to="/about">About</FooterLink>
                        <Separator />
                        <FooterLink to="/our-team">Team</FooterLink>
                        <Separator />
                        <FooterLink to="/contact">Contact</FooterLink>
                        <Separator />
                        <FooterLink to="/docs">Docs</FooterLink>
                        <Separator />
                        <FooterLink to="/privacy">Privacy</FooterLink>
                        <Separator />
                        <FooterLink to="/terms">Terms</FooterLink>
                    </nav>

                    {/* Bottom Info Group - Combined for space saving */}
                    <div className="flex items-center gap-4 text-[10px] md:text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                        <span>&copy; {currentYear} Extrovert</span>
                        <span className="h-3 w-px bg-gray-300 dark:bg-gray-700"></span>
                        <div className="flex items-center gap-1">
                            <Heart size={10} className="text-red-500 fill-red-500" />
                            <span>for students</span>
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