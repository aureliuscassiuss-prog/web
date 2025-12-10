import { Link } from 'react-router-dom'
import { Github, Twitter, Linkedin, Mail, Heart } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <img src="/LOGO.png" alt="Extrovert Logo" className="w-8 h-8 rounded-lg object-contain" />
                            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Extrovert</span>
                        </div>
                        <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
                            Empowering students with high-quality study resources, verified notes, and a collaborative community for academic excellence.
                        </p>
                        <div className="flex gap-4">
                            <SocialLink href="#" icon={<Github size={18} />} label="GitHub" />
                            <SocialLink href="#" icon={<Twitter size={18} />} label="Twitter" />
                            <SocialLink href="#" icon={<Linkedin size={18} />} label="LinkedIn" />
                            <SocialLink href="#" icon={<Mail size={18} />} label="Email" />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Platform</h3>
                        <ul className="space-y-3">
                            <FooterLink to="/resources">Browse Resources</FooterLink>
                            <FooterLink to="/uploads">Upload Notes</FooterLink>
                            <FooterLink to="/leaderboard">Leaderboard</FooterLink>
                            <FooterLink to="/ai-assistant">AI Assistant</FooterLink>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Company</h3>
                        <ul className="space-y-3">
                            <FooterLink to="/about">About Us</FooterLink>
                            <FooterLink to="/our-team">Our Team</FooterLink>
                            <FooterLink to="/contact">Contact</FooterLink>
                            <FooterLink to="/docs">Documentation</FooterLink>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Legal</h3>
                        <ul className="space-y-3">
                            <FooterLink to="/privacy">Privacy Policy</FooterLink>
                            <FooterLink to="/terms">Terms of Service</FooterLink>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        &copy; {new Date().getFullYear()} Extrovert. All rights reserved.
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Made with love */}
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                            <span>Made with</span>
                            <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" />
                            <span>for students</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

function FooterLink({ to, children }: { to: string, children: React.ReactNode }) {
    return (
        <li>
            <Link
                to={to}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
                {children}
            </Link>
        </li>
    )
}

function SocialLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
    return (
        <a
            href={href}
            aria-label={label}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 transition-all duration-200 hover:-translate-y-0.5"
        >
            {icon}
        </a>
    )
}
