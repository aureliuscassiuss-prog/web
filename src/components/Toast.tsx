import { CheckCircle2 } from 'lucide-react'

interface ToastProps {
    message: string
    show: boolean
}

export default function Toast({ message, show }: ToastProps) {
    if (!show) return null

    return (
        <div className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-full border border-gray-800/10 bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-xl transition-all dark:border-gray-100/10 dark:bg-white dark:text-gray-900 animate-slide-up">
            <CheckCircle2 className="h-4 w-4 text-green-400 dark:text-green-600" />
            <span className="whitespace-nowrap">{message}</span>
        </div>
    )
}