import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Linkedin, Mail, Twitter, Github, Globe, ArrowRight, Sparkles, UserPlus } from 'lucide-react'
import RoleApplicationModal from './RoleApplicationModal'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from './AuthModal'
import TyreLoader from './TyreLoader'

interface TeamMember {
    name: string
    title: string
    image: string
    bio: string
    socials: {
        linkedin?: string
        twitter?: string
        github?: string
        website?: string
        mail?: string
    }
    highlight?: boolean
    role?: string
}
// ... (TeamCard code is skipped in replacement if not touched, but I need to target the block correctly)
// Wait, replace_file_content replaces a block. I should replace interface and the map usage in one go or separate.
// The interface is at top. The map usage is at bottom.
// I will use multi_replace.

// Reusing the TeamCard from the previous functioning implementation to ensure compatibility with data but styling it to fit the original theme if distinct.
// Based on the original file content (Step 381), the card structure was likely imported or similar. 
// I will use a clean, high-quality card design consistent with the 'premium' directive and the 'Hero' section of the original file.
const getAvatarUrl = (avatar: string | null | undefined, name: string) => {
    if (!avatar || avatar === 'undefined' || avatar === 'null') {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    }
    if (avatar.startsWith('http') || avatar.startsWith('/')) return avatar;
    return `/${avatar}`;
}

const TeamCard = ({ member, index }: { member: TeamMember, index: number }) => {
    const [imgSrc, setImgSrc] = useState(member.image);

    // Update internal state if prop changes
    useEffect(() => {
        setImgSrc(member.image);
    }, [member.image]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={`group relative overflow-hidden rounded-3xl backdrop-blur-md border transition-all duration-300
            ${member.highlight
                    ? 'bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-200 dark:border-indigo-500/30 ring-1 ring-indigo-500/20'
                    : 'bg-white/40 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                }
        `}
        >
            <div className="p-6 flex flex-col items-center text-center relative z-10">
                <div className="relative mb-6">
                    <div className={`
                    absolute inset-0 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500
                    ${member.highlight ? 'bg-indigo-500' : 'bg-blue-500'}
                `} />
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`relative w-32 h-32 rounded-full overflow-hidden border-4 shadow-xl
                        ${member.highlight ? 'border-indigo-100 dark:border-indigo-900/50' : 'border-white dark:border-white/10'}
                    `}
                    >
                        <img
                            src={imgSrc}
                            alt={member.name}
                            onError={() => setImgSrc(`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`)}
                            className="w-full h-full object-cover"
                        />
                    </motion.div>
                    {member.highlight && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -bottom-2 -right-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border border-white dark:border-[#09090b] flex items-center gap-1"
                        >
                            <Sparkles size={10} />
                            FOUNDER
                        </motion.div>
                    )}
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {member.name}
                </h3>
                <p className={`text-sm font-medium mb-3 uppercase tracking-wider
                ${member.highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-blue-600 dark:text-blue-400'}
            `}>
                    {member.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 line-clamp-3">
                    {member.bio}
                </p>

                <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    {member.socials.github && (
                        <a href={member.socials.github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-black hover:text-white text-gray-600 dark:text-gray-400 transition-colors">
                            <Github size={16} />
                        </a>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default function OurTeam() {
    // Logic Integration
    const { user, token } = useAuth()
    const [isLoading, setIsLoading] = useState(true)
    const [teamData, setTeamData] = useState<TeamMember[]>([])
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const res = await fetch('/api/admin?action=team')
                if (res.ok) {
                    const data = await res.json()
                    console.log('Fetched team data:', data.team) // For debugging
                    const dbMembers: TeamMember[] = (data.team || []).map((u: any) => {
                        let title = ''
                        let bio = ''
                        let highlight = false
                        let displayRole = ''

                        if (u.role === 'admin') {
                            title = 'Founder & Visionary'
                            bio = 'Building the future of student collaboration.'
                            highlight = true
                            displayRole = 'admin'
                        } else if (u.role === 'semi-admin') {
                            title = 'Operations & Community'
                            bio = 'Ensuring smooth operations and community growth.'
                            displayRole = 'semi-admin'
                        } else if (u.role === 'content-reviewer') {
                            title = 'Structure Manager'
                            bio = 'Curating high-quality academic resources.'
                            displayRole = 'content-reviewer'
                        }

                        return {
                            name: u.name,
                            role: displayRole, // internal role
                            title: title, // display title
                            image: getAvatarUrl(u.avatar, u.name),
                            bio: bio,
                            highlight: highlight,
                            socials: {
                                // Placeholder socials as our DB might not have them yet
                                github: u.github || '#',
                                // linkedin: HIDDEN as per request
                            }
                        }
                    })

                    setTeamData(dbMembers)
                }
            } catch (error) {
                console.error('Team fetch error:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchTeam()
    }, [])

    const handleOpenRolesClick = (e: any) => {
        e.preventDefault()
        if (!user) {
            setIsAuthModalOpen(true)
        } else {
            setIsRoleModalOpen(true)
        }
    }

    // Organize Data into Sections
    const founder = teamData.find(m => m.role === 'admin')
    const admins = teamData.filter(m => m.role === 'semi-admin')
    const reviewers = teamData.filter(m => m.role === 'content-reviewer')

    // Display Founder fallback
    const displayFounder: TeamMember = founder ? {
        name: founder.name,
        title: founder.title,
        image: founder.image,
        bio: founder.bio,
        socials: { github: founder.socials.github || '#' },
        highlight: true,
        role: founder.role
    } : {
        name: 'Trillion Tip',
        title: 'Founder & Visionary',
        image: 'https://github.com/trilliontip.png',
        bio: 'Leading the vision for a connected student ecosystem.',
        socials: { github: '#' },
        highlight: true,
        role: 'admin'
    }

    const sections = [
        {
            role: "Founder & Visionary",
            description: "The driving force behind the mission to democratize education.",
            members: [displayFounder]
        },
        {
            role: "Operations & Community", // Using 'Admins' slot for Semi-Admins/Ops
            description: "Leading the strategic direction and platform stability.",
            members: admins.map(m => ({
                name: m.name,
                title: 'Operations & Community',
                image: m.image, // Fixed: use m.image
                bio: 'Ensuring smooth operations and community growth.',
                socials: { linkedin: '#' }
            }))
        },
        {
            role: "Content Reviewers",
            description: "Curating and verifying high-quality study resources.",
            members: reviewers.map(m => ({
                name: m.name,
                title: 'Structure Manager',
                image: m.image, // Fixed: use m.image
                bio: 'Curating high-quality academic resources.',
                socials: { linkedin: '#' }
            }))
        }
    ]

    return (
        <div className="min-h-screen bg-white dark:bg-[#030303] text-gray-900 dark:text-gray-200 overflow-hidden relative selection:bg-blue-500/30">

            {/* --- Background Effects --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Top Spotlight */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full opacity-40 dark:opacity-20" />
                {/* Subtle Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-24 max-w-4xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/60 dark:bg-white/5 dark:border-white/10 backdrop-blur-md px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 mb-6">
                        <Sparkles className="h-3 w-3 text-blue-500" />
                        <span>The Humans of Extrovert</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-gray-900 dark:text-white mb-6">
                        Meet the <span className="text-transparent bg-clip-text bg-gradient-to-b from-gray-700 to-gray-400 dark:from-white dark:to-gray-500">Extrovert</span> Team
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        The passionate individuals working behind the scenes to make education accessible, organized, and collaborative for everyone.
                    </p>
                </motion.div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <TyreLoader size={40} />
                    </div>
                ) : (
                    <div className="space-y-32">
                        {sections.map((section) => (
                            section.members.length > 0 && (
                                <div key={section.role} className="scroll-mt-20">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5 }}
                                        className="text-center mb-16"
                                    >
                                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">{section.role}</h2>
                                        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">{section.description}</p>
                                    </motion.div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
                                        {section.members.map((member, index) => (
                                            <TeamCard key={index} member={member} index={index} />
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}

                        {/* Join Us Section - Refined Glass Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="relative rounded-3xl overflow-hidden p-8 md:p-16 text-center border border-gray-200/50 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-2xl shadow-xl"
                        >
                            {/* Subtle inner glow */}
                            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

                            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                                <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-gray-900 dark:text-white">
                                    Want to join the mission?
                                </h2>
                                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                    We're always looking for passionate students to help us build the future of education. Tech, content, or community — there's a place for you.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <a
                                        href="/contact"
                                        className="w-full sm:w-auto px-8 py-3 rounded-full text-white bg-black dark:bg-white dark:text-black font-medium hover:scale-105 transition-transform duration-200 flex items-center justify-center gap-2"
                                    >
                                        Get in Touch
                                        <ArrowRight className="w-4 h-4" />
                                    </a>
                                    <button
                                        onClick={handleOpenRolesClick}
                                        className="w-full sm:w-auto px-8 py-3 rounded-full text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        View Open Roles
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </main>

            <RoleApplicationModal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
            />

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />
        </div>
    )
}