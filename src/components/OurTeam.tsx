import { motion } from 'framer-motion'
import { Linkedin, Mail, Twitter, Github, Globe } from 'lucide-react'

// Enhanced Team Data
const TEAM_MEMBERS = [
    {
        role: "Founder & Visionary",
        description: "The driving force behind the mission to democratize education.",
        members: [
            {
                name: "Your Name", // Replace with actual founder name
                title: "Founder & Lead Developer",
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80", // Placeholder
                bio: "Passionate about building tools that help students succeed. Believes in open knowledge and community collaboration.",
                socials: {
                    linkedin: "#",
                    twitter: "#",
                    github: "#",
                    website: "#"
                },
                highlight: true // Special styling flag
            }
        ]
    },
    {
        role: "Admins",
        description: "Leading the strategic direction and platform stability.",
        members: [
            {
                name: "Admin Name",
                title: "Lead Administrator",
                image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&q=80",
                bio: "Driving the technical and strategic direction of the platform.",
                socials: {
                    linkedin: "#",
                    twitter: "#",
                    github: "#",
                    mail: "mailto:admin@example.com"
                }
            },
            {
                name: "Co-Admin Name",
                title: "Co-Administrator",
                image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&q=80",
                bio: "Focusing on community growth, partnerships and outreach.",
                socials: {
                    linkedin: "#",
                    twitter: "#",
                    mail: "mailto:coadmin@example.com"
                }
            }
        ]
    },
    {
        role: "Operations & Community",
        description: "Ensuring smooth daily operations and a vibrant community.",
        members: [
            {
                name: "Semi-Admin One",
                title: "Operations Lead",
                image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&q=80",
                bio: "Managing day-to-day operations and student support queries.",
                socials: {
                    linkedin: "#",
                    twitter: "#"
                }
            },
            {
                name: "Semi-Admin Two",
                title: "Community Manager",
                image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&q=80",
                bio: "Engaging with our student community and gathering continuous feedback.",
                socials: {
                    linkedin: "#",
                    github: "#"
                }
            }
        ]
    },
    {
        role: "Content Reviewers",
        description: "Curating and verifying high-quality study resources.",
        members: [
            {
                name: "Manager One",
                title: "Content Lead",
                image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&q=80",
                bio: "Overseeing the quality and organization of study materials.",
                socials: {
                    linkedin: "#",
                    mail: "#"
                }
            },
            {
                name: "Manager Two",
                title: "Resource Verifier",
                image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&q=80",
                bio: "Verifying the accuracy and relevance of uploaded notes.",
                socials: {
                    linkedin: "#"
                }
            },
            {
                name: "Manager Three",
                title: "Syllabus Expert",
                image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&q=80",
                bio: "Keeping the curriculum and subject lists up to date.",
                socials: {
                    linkedin: "#"
                }
            }
        ]
    }
]

export default function OurTeam() {
    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-black w-full">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
                            Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">Extrovert</span> Team
                        </h1>
                        <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                            The passionate individuals working behind the scenes to make education accessible and organized for everyone.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Team Sections */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
                {TEAM_MEMBERS.map((section) => (
                    <div key={section.role} className="scroll-mt-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{section.role}</h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">{section.description}</p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
                            {section.members.map((member, index) => (
                                <TeamCard key={member.name} member={member} index={index} />
                            ))}
                        </div>
                    </div>
                ))}

                {/* Join Us Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="relative rounded-3xl overflow-hidden bg-indigo-600 py-16 px-6 text-center shadow-2xl"
                >
                    <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                        <h2 className="text-3xl font-bold text-white tracking-tight sm:text-4xl">
                            Want to join the mission?
                        </h2>
                        <p className="text-lg text-indigo-100">
                            We're always looking for passionate students to help us build the future of education. Tech, content, or community - there's a place for you.
                        </p>
                        <div className="flex items-center justify-center gap-4 pt-4">
                            <a
                                href="/contact"
                                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-indigo-600 bg-white hover:bg-indigo-50 transition-colors duration-200"
                            >
                                Get in Touch
                            </a>
                            <a
                                href="#"
                                className="inline-flex items-center justify-center px-6 py-3 border border-indigo-400 text-base font-medium rounded-lg text-white hover:bg-indigo-700 transition-colors duration-200"
                            >
                                View Open Roles
                            </a>
                        </div>
                    </div>
                    {/* Decorative background elements */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
                        <div className="absolute top-[-50%] left-[-20%] w-[800px] h-[800px] rounded-full bg-white blur-3xl" />
                        <div className="absolute bottom-[-50%] right-[-20%] w-[800px] h-[800px] rounded-full bg-purple-500 blur-3xl" />
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

interface TeamMember {
    name: string;
    title: string;
    image: string;
    bio: string;
    socials: {
        linkedin?: string;
        twitter?: string;
        github?: string;
        website?: string;
        mail?: string;
    };
    highlight?: boolean;
}

function TeamCard({ member, index }: { member: TeamMember, index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`group relative bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 ${member.highlight
                    ? 'ring-2 ring-indigo-500/20 dark:ring-indigo-400/20'
                    : 'ring-1 ring-gray-200 dark:ring-gray-800'
                }`}
        >
            {/* Highlight Badge */}
            {member.highlight && (
                <div className="absolute top-0 right-0 mt-4 mr-4 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase rounded-full tracking-wider">
                    Founder
                </div>
            )}

            <div className="aspect-square relative mb-6 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
            </div>

            <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {member.name}
                </h3>
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                    {member.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed h-10">
                    {member.bio}
                </p>

                {/* Social Links */}
                <div className="flex items-center justify-center gap-4 pt-4">
                    {member.socials.website && (
                        <SocialIcon href={member.socials.website} icon={<Globe size={18} />} color="text-gray-400 hover:text-emerald-500" />
                    )}
                    {member.socials.linkedin && (
                        <SocialIcon href={member.socials.linkedin} icon={<Linkedin size={18} />} color="text-gray-400 hover:text-[#0077b5]" />
                    )}
                    {member.socials.github && (
                        <SocialIcon href={member.socials.github} icon={<Github size={18} />} color="text-gray-400 hover:text-black dark:hover:text-white" />
                    )}
                    {member.socials.twitter && (
                        <SocialIcon href={member.socials.twitter} icon={<Twitter size={18} />} color="text-gray-400 hover:text-[#1DA1F2]" />
                    )}
                    {member.socials.mail && (
                        <SocialIcon href={member.socials.mail} icon={<Mail size={18} />} color="text-gray-400 hover:text-red-500" />
                    )}
                </div>
            </div>
        </motion.div>
    )
}

function SocialIcon({ href, icon, color }: { href: string, icon: React.ReactNode, color: string }) {
    return (
        <a
            href={href}
            className={`${color} transition-colors transform hover:scale-110 active:scale-95 duration-200`}
        >
            {icon}
        </a>
    )
}
