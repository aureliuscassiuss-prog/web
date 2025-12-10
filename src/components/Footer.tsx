import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Copyright */}
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        &copy; {new Date().getFullYear()} Extrovert. All rights reserved.
                    </div>

                    {/* Links */}
                    <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                        <FooterLink to="/about">About Us</FooterLink>
                        <FooterLink to="/our-team">Our Team</FooterLink>
                        <FooterLink to="/contact">Contact</FooterLink>
                        <FooterLink to="/docs">Docs</FooterLink>
                        <FooterLink to="/privacy">Privacy</FooterLink>
                        <FooterLink to="/terms">Terms</FooterLink>
                    </nav>

                    {/* Made with love */}
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <span>Made with</span>
                        <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" />
                        <span>for students</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}

function FooterLink({ to, children }: { to: string, children: React.ReactNode }) {
    return (
        <Link
            to={to}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
            {children}
        </Link>
    )
}
