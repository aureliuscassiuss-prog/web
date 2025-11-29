import { CheckCircle2 } from 'lucide-react'

interface ToastProps {
    message: string
    show: boolean
}

export default function Toast({ message, show }: ToastProps) {
    if (!show) return null

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-slide-up z-50">
            <CheckCircle2 className="w-5 h-5 text-green-400 dark:text-green-600" />
            <span className="font-medium">{message}</span>
        </div>
    )
}
