import { useState } from 'react'
import { X, Upload as UploadIcon, FileText } from 'lucide-react'

interface UploadModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (title: string) => void
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        course: '',
        year: '',
        branch: '',
        subject: '',
        resourceType: '',
    })
    const [file, setFile] = useState<File | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) {
            alert('Please select a file')
            return
        }

        setIsUploading(true)
        setTimeout(() => {
            setIsUploading(false)
            onSuccess(formData.title)
            setFormData({ title: '', description: '', course: '', year: '', branch: '', subject: '', resourceType: '' })
            setFile(null)
        }, 1500)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            if (selectedFile.size > 50 * 1024 * 1024) {
                alert('File size exceeds 50MB limit')
                return
            }
            setFile(selectedFile)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) {
            if (droppedFile.size > 50 * 1024 * 1024) {
                alert('File size exceeds 50MB limit')
                return
            }
            setFile(droppedFile)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-modal-in border border-gray-200 dark:border-gray-800">
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Resource</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Share your notes with the community</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Title *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Data Structures Notes"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="input dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Description *</label>
                        <textarea
                            required
                            rows={3}
                            placeholder="Brief description..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="input resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Course *</label>
                            <select
                                required
                                value={formData.course}
                                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                className="input dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900"
                            >
                                <option value="">Select...</option>
                                <option value="B.Tech">B.Tech</option>
                                <option value="B.Sc">B.Sc</option>
                                <option value="BBA">BBA</option>
                                <option value="B.Com">B.Com</option>
                                <option value="MBA">MBA</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Year *</label>
                            <select
                                required
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                className="input dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900"
                            >
                                <option value="">Select...</option>
                                <option value="1st Year">1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Branch *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. CSE"
                                value={formData.branch}
                                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                className="input dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subject *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Data Structures"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="input dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Resource Type *</label>
                        <select
                            required
                            value={formData.resourceType}
                            onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                            className="input dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900"
                        >
                            <option value="">Select...</option>
                            <option value="notes">Notes</option>
                            <option value="pyq">Previous Year Questions</option>
                            <option value="assignment">Assignment</option>
                            <option value="formula-sheet">Formula Sheet</option>
                            <option value="summary">Summary</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">File *</label>
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('file-input')?.click()}
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${isDragging
                                    ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600'
                                }`}
                        >
                            <input
                                id="file-input"
                                type="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <UploadIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">
                                Drag and drop your file here, or click to browse
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">PDF, DOC, DOCX, PPT, PPTX (Max 50MB)</p>
                        </div>

                        {file && (
                            <div className="mt-4 flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <FileText className="w-8 h-8 text-red-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate text-gray-900 dark:text-white">{file.name}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setFile(null) }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isUploading}
                        className="btn btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
                    >
                        {isUploading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <UploadIcon className="w-5 h-5" />
                                Upload Resource
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
