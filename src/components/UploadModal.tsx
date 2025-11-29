import { useState } from 'react'
import { X, Upload as UploadIcon, FileText } from 'lucide-react'
import { BRANCHES, YEARS, getSubjectsByBranchAndYear } from '../data/academicStructure'

interface UploadModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (title: string) => void
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        course: 'B.Tech',
        yearNum: 0,
        year: '',
        branch: '',
        subject: '',
        resourceType: '',
    })
    const [file, setFile] = useState<File | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // 1. Basic Validation
        if (!file) {
            alert('Please select a file')
            return
        }

        if (!navigator.onLine) {
            alert('No internet connection')
            return
        }

        setIsUploading(true)
        setUploadProgress(0)

        try {
            const token = localStorage.getItem('token')
            if (!token) {
                throw new Error('Authentication required. Please sign in.')
            }

            // Create FormData
            const formDataToSend = new FormData()
            formDataToSend.append('file', file)
            formDataToSend.append('title', formData.title)
            formDataToSend.append('description', formData.description)
            formDataToSend.append('course', formData.course)
            formDataToSend.append('yearNum', formData.yearNum.toString())
            formDataToSend.append('year', formData.year)
            formDataToSend.append('branch', formData.branch)
            formDataToSend.append('subject', formData.subject)
            formDataToSend.append('resourceType', formData.resourceType)

            // 2. Wrap XHR in a Promise with robust error handling
            const response = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest()

                // Time out after 60 seconds
                xhr.timeout = 60000

                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100
                        setUploadProgress(Math.round(percentComplete))
                    }
                })

                xhr.addEventListener('load', () => {
                    // 3. Handle specific HTTP Status Codes
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const result = JSON.parse(xhr.responseText)
                            resolve(result)
                        } catch (err) {
                            // Response was 200 OK, but not JSON (rare but possible)
                            resolve(xhr.responseText)
                        }
                    } else if (xhr.status === 413) {
                        reject(new Error('File is too large for the server.'))
                    } else if (xhr.status === 401) {
                        reject(new Error('Session expired. Please login again.'))
                    } else {
                        // 4. Try to extract server error message safely
                        try {
                            const errorResponse = JSON.parse(xhr.responseText)
                            reject(new Error(errorResponse.message || errorResponse.error || `Upload failed (Status: ${xhr.status})`))
                        } catch (e) {
                            // If response is HTML (like a 500 Nginx page), don't parse it
                            console.error("Non-JSON Error Response:", xhr.responseText)
                            reject(new Error(`Server Error (${xhr.status}): Please try again later.`))
                        }
                    }
                })

                xhr.addEventListener('error', () => {
                    // This triggers on network failures (DNS, CORS, offline)
                    reject(new Error('Network error. Check your connection or CORS settings.'))
                })

                xhr.addEventListener('timeout', () => {
                    reject(new Error('Upload timed out. The file might be too large or connection is slow.'))
                })

                xhr.open('POST', '/api/upload/resource')
                xhr.setRequestHeader('Authorization', `Bearer ${token}`)

                // Do NOT set Content-Type header manually for FormData, browser does it automatically with boundary

                xhr.send(formDataToSend)
            })

            // Success
            onSuccess(formData.title)
            resetForm()
            onClose()

        } catch (error: any) {
            console.error('Upload Process Error:', error)

            // 5. User-friendly Error Display
            let displayMessage = 'Failed to upload resource.'

            if (error.message) {
                displayMessage = error.message
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                displayMessage = 'Network connection failed.'
            }

            alert(displayMessage)
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            course: 'B.Tech',
            yearNum: 0,
            year: '',
            branch: '',
            subject: '',
            resourceType: '',
        })
        setFile(null)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            validateAndSetFile(selectedFile)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) {
            validateAndSetFile(droppedFile)
        }
    }

    const validateAndSetFile = (selectedFile: File) => {
        if (selectedFile.size > 50 * 1024 * 1024) {
            alert('File size exceeds 50MB limit')
            return
        }

        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ]

        if (!allowedTypes.includes(selectedFile.type)) {
            alert('Please select a valid file type: PDF, DOC, DOCX, PPT, or PPTX')
            return
        }

        setFile(selectedFile)
    }

    const handleYearChange = (yearStr: string) => {
        const yearNum = parseInt(yearStr.replace(/\D/g, ''))
        setFormData({ ...formData, year: yearStr, yearNum, branch: '', subject: '' })
    }

    const handleBranchChange = (branchId: string) => {
        setFormData({ ...formData, branch: branchId, subject: '' })
    }

    const availableSubjects = formData.yearNum && formData.branch
        ? getSubjectsByBranchAndYear(formData.branch, formData.yearNum)
        : []

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-modal-in border border-gray-200 dark:border-gray-800">
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Resource</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Share your notes with the community</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
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
                            disabled={isUploading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                            disabled={isUploading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Course *</label>
                            <select
                                required
                                value={formData.course}
                                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                disabled={isUploading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
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
                                onChange={(e) => handleYearChange(e.target.value)}
                                disabled={isUploading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Select...</option>
                                {YEARS.map(year => (
                                    <option key={year} value={`${year}${year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year`}>
                                        Year {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Branch *</label>
                            <select
                                required
                                value={formData.branch}
                                onChange={(e) => handleBranchChange(e.target.value)}
                                disabled={isUploading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Select...</option>
                                {BRANCHES.map(branch => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.code} - {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subject *</label>
                            <select
                                required
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                disabled={!formData.branch || !formData.yearNum || isUploading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Select...</option>
                                {availableSubjects.map(subject => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Resource Type *</label>
                        <select
                            required
                            value={formData.resourceType}
                            onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                            disabled={isUploading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                            onClick={() => !isUploading && document.getElementById('file-input')?.click()}
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${isUploading
                                ? 'opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700'
                                : isDragging
                                    ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-800'
                                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600'
                                }`}
                        >
                            <input
                                id="file-input"
                                type="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx"
                                onChange={handleFileChange}
                                disabled={isUploading}
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
                                <FileText className="w-8 h-8 text-black dark:text-white flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate text-gray-900 dark:text-white">{file.name}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </div>
                                    {isUploading && (
                                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                            <div
                                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                                {!isUploading && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setFile(null) }}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isUploading || !file}
                        className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                    >
                        {isUploading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Uploading... {uploadProgress}%
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