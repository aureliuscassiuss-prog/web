import { Download, Star } from 'lucide-react'

interface ResourceGridProps {
    view: 'resources' | 'leaderboard' | 'papers'
}

const mockResources = [
    {
        id: '1',
        title: 'Data Structures Complete Notes',
        course: 'B.Tech',
        branch: 'CSE',
        year: '2nd Year',
        subject: 'Data Structures',
        resourceType: 'notes',
        description: 'Comprehensive notes covering all topics including arrays, linked lists, trees, graphs, and algorithms.',
        downloads: 1234,
        rating: 4.8,
        uploader: 'Rahul Sharma'
    },
    {
        id: '2',
        title: 'DBMS Previous Year Questions 2023',
        course: 'B.Tech',
        branch: 'CSE',
        year: '3rd Year',
        subject: 'Database Management',
        resourceType: 'pyq',
        description: 'Complete collection of previous year questions with solutions for DBMS final exam.',
        downloads: 892,
        rating: 4.9,
        uploader: 'Priya Patel'
    },
    {
        id: '3',
        title: 'Operating Systems Formula Sheet',
        course: 'B.Tech',
        branch: 'CSE',
        year: '3rd Year',
        subject: 'Operating Systems',
        resourceType: 'formula-sheet',
        description: 'Quick reference formula sheet for OS concepts, scheduling algorithms, and memory management.',
        downloads: 567,
        rating: 4.7,
        uploader: 'Amit Kumar'
    },
]

const mockLeaderboard = [
    { rank: 1, name: 'Rahul Sharma', points: 2450, uploads: 45 },
    { rank: 2, name: 'Priya Patel', points: 2180, uploads: 38 },
    { rank: 3, name: 'Amit Kumar', points: 1920, uploads: 32 },
    { rank: 4, name: 'Sneha Gupta', points: 1650, uploads: 28 },
    { rank: 5, name: 'Vikram Singh', points: 1420, uploads: 24 },
]

const mockPapers = [
    {
        id: '1',
        title: 'Attention Is All You Need',
        authors: 'Vaswani et al.',
        year: '2017',
        summary: 'Introduced the Transformer architecture, revolutionizing natural language processing.',
        tags: ['NLP', 'Deep Learning', 'Transformers']
    },
    {
        id: '2',
        title: 'BERT: Pre-training of Deep Bidirectional Transformers',
        authors: 'Devlin et al.',
        year: '2018',
        summary: 'Presented BERT, a method for pre-training language representations.',
        tags: ['NLP', 'BERT', 'Pre-training']
    },
]

export default function ResourceGrid({ view }: ResourceGridProps) {
    if (view === 'leaderboard') {
        return (
            <div className="p-8">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm transition-colors">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top Contributors</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Students helping students succeed</p>
                    </div>
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr className="text-left">
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Rank</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Name</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Points</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Uploads</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {mockLeaderboard.map((user) => (
                                <tr key={user.rank} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-semibold text-sm ${user.rank <= 3
                                                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                            }`}>
                                            {user.rank}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{user.name}</td>
                                    <td className="px-6 py-4 font-semibold text-red-600 dark:text-red-400">{user.points}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{user.uploads}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    if (view === 'papers') {
        return (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockPapers.map((paper) => (
                    <div key={paper.id} className="card card-hover border-l-4 border-l-red-600 dark:bg-gray-900 dark:border-gray-800 dark:border-l-red-600">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-lg leading-tight text-gray-900 dark:text-white">{paper.title}</h3>
                            <span className="badge bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">Paper</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span>{paper.authors}</span> • <span>{paper.year}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">{paper.summary}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {paper.tags.map((tag) => (
                                <span key={tag} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <button className="btn btn-outline w-full text-sm dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Read</button>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockResources.map((resource, index) => (
                <div
                    key={resource.id}
                    className="card card-hover animate-slide-up cursor-pointer dark:bg-gray-900 dark:border-gray-800"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg leading-tight flex-1 text-gray-900 dark:text-white">{resource.title}</h3>
                        <span className="badge ml-2 dark:bg-gray-800 dark:text-gray-300">{resource.resourceType}</span>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <div>{resource.course} • {resource.branch}</div>
                        <div>{resource.year} • {resource.subject}</div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2">{resource.description}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                                <Download className="w-4 h-4" />
                                {resource.downloads}
                            </span>
                            <span className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                {resource.rating}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {resource.uploader[0]}
                            </div>
                            <span className="text-gray-600 dark:text-gray-400">{resource.uploader.split(' ')[0]}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
