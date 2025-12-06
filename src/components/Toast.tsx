import { CheckCircle2, AlertCircle } from 'lucide-react'

interface ToastProps {
    message: string
    show: boolean
    type?: 'success' | 'error'
}

export default function Toast({ message, show, type = 'success' }: ToastProps) {
    if (!show) return null

    const isError = type === 'error'

    return (
        <div className={`
            fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-full border px-6 py-3 text-sm font-medium shadow-xl transition-all animate-slide-up
            ${isError
                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/90 dark:text-red-100 dark:border-red-900'
                : 'bg-gray-900 text-white border-gray-800/10 dark:bg-white dark:text-gray-900 dark:border-gray-100/10'}
        `}>
            {isError ? (
                <AlertCircle className="h-4 w-4" />
            ) : (
                <CheckCircle2 className="h-4 w-4 text-green-400 dark:text-green-600" />
            )}
            <span className="whitespace-nowrap">{message}</span>
        </div>
    )
}