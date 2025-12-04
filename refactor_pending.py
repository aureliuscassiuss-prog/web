import re

with open(r'c:\Users\abhig\.gemini\antigravity\scratch\uninotes-react\src\components\AdminPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_pending_view = '''function PendingView({ resources, processingId, onAction }: any) {
    const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null)

    const NeutralAvatar = ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="24" height="24" className="fill-gray-100 dark:fill-gray-800" />
            <circle cx="12" cy="8" r="4" className="fill-gray-300 dark:fill-gray-600" />
            <path d="M4 20C4 16 8 15 12 15C16 15 20 16 20 20" strokeWidth="0" className="fill-gray-300 dark:fill-gray-600" />
        </svg>
    )

    if (resources.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <Check size={48} className="mb-4 opacity-20" />
                <p>No pending approvals</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {resources.map((resource: PendingResource) => {
                const isExpanded = expandedRequestId === resource._id
                const isProcessing = processingId === resource._id

                return (
                    <motion.div
                        key={resource._id}
                        initial={false}
                        className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
                    >
                        {/* Collapsed Card Header */}
                        <button
                            onClick={() => setExpandedRequestId(isExpanded ? null : resource._id)}
                            className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                        >
                            {/* Avatar */}
                            <div className="h-9 w-9 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                <NeutralAvatar className="h-full w-full" />
                            </div>

                            {/* Request Info */}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{resource.title}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{resource.uploaderName}</div>
                            </div>

                            {/* Request ID Badge */}
                            <div className="flex-shrink-0">
                                <StatusBadge type="warning" label="Request" />
                            </div>

                            {/* Expand Icon */}
                            <motion.div
                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex-shrink-0"
                            >
                                <ChevronRight className="text-gray-400" size={18} />
                            </motion.div>
                        </button>

                        {/* Expanded Content */}
                        <motion.div
                            initial={false}
                            animate={{
                                height: isExpanded ? 'auto' : 0,
                                opacity: isExpanded ? 1 : 0
                            }}
                            transition={{
                                height: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] },
                                opacity: { duration: 0.2, delay: isExpanded ? 0.1 : 0 }
                            }}
                            className="overflow-hidden"
                        >
                            <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-800 space-y-3">
                                {/* Uploader Info */}
                                <div>
                                    <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                        Uploaded By
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                            <NeutralAvatar className="h-full w-full" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-gray-900 dark:text-white">{resource.uploaderName}</div>
                                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                                {new Date(resource.createdAt).toLocaleDateString()} • {new Date(resource.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Resource Details */}
                                <div>
                                    <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                        Details
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="text-xs text-gray-700 dark:text-gray-300">
                                            <span className="font-semibold">Subject:</span> {resource.subject}
                                        </div>
                                        <div className="text-xs text-gray-700 dark:text-gray-300">
                                            <span className="font-semibold">Class:</span> {resource.year} Year - {resource.branch}
                                        </div>
                                        {resource.unit && (
                                            <div className="text-xs text-gray-700 dark:text-gray-300">
                                                <span className="font-semibold">Unit:</span> {resource.unit}
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-700 dark:text-gray-300">
                                            <span className="font-semibold">Type:</span> {resource.type}
                                        </div>
                                        {resource.description && (
                                            <div className="text-xs text-gray-700 dark:text-gray-300">
                                                <span className="font-semibold">Description:</span> {resource.description}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div>
                                    <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                        Actions
                                    </div>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {/* Review */}
                                        <a
                                            href={resource.driveLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                                        >
                                            <ExternalLink size={14} />
                                            <span className="hidden sm:inline">Review</span>
                                        </a>

                                        {/* Approve */}
                                        <button
                                            onClick={() => onAction(resource._id, 'approve')}
                                            disabled={isProcessing}
                                            className="px-2 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                                        >
                                            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                            <span className="hidden sm:inline">Approve</span>
                                        </button>

                                        {/* Reject */}
                                        <button
                                            onClick={() => onAction(resource._id, 'reject')}
                                            disabled={isProcessing}
                                            className="px-2 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                                        >
                                            <X size={14} />
                                            <span className="hidden sm:inline">Reject</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )
            })}
        </div>
    )
}'''

# Find and replace the PendingView function
pattern = r'function PendingView\(\{ resources, processingId, onAction \}: any\) \{[^}]*(?:\{[^}]*\}[^}]*)*\}'
# Use a more specific pattern that matches the entire function
pattern = r'function PendingView\(\{ resources, processingId, onAction \}: any\) \{[\s\S]*?^\}'

# Find the function using line numbers
lines = content.split('\n')
start_idx = None
end_idx = None
brace_count = 0

for i, line in enumerate(lines):
    if 'function PendingView' in line:
        start_idx = i
        brace_count = 0
    if start_idx is not None:
        brace_count += line.count('{') - line.count('}')
        if brace_count == 0 and i > start_idx:
            end_idx = i
            break

if start_idx is not None and end_idx is not None:
    # Replace the function
    new_lines = lines[:start_idx] + new_pending_view.split('\n') + lines[end_idx+1:]
    content = '\n'.join(new_lines)
    
    with open(r'c:\Users\abhig\.gemini\antigravity\scratch\uninotes-react\src\components\AdminPanel.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'PendingView replaced successfully! (lines {start_idx+1} to {end_idx+1})')
else:
    print('Could not find PendingView function')
