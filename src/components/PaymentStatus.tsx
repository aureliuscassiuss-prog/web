import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Download, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentStatusProps {
    status: 'success' | 'failed';
    ticketId?: string;
    message?: string;
    onDownload?: () => void;
    onRetry?: () => void;
    onClose?: () => void;
}

export default function PaymentStatus({ status, ticketId, message, onDownload, onRetry, onClose }: PaymentStatusProps) {

    useEffect(() => {
        if (status === 'success') {
            // Trigger Confetti
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);

                // since particles fall down, start a bit higher than random
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [status]);

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
            {status === 'success' ? (
                // SUCCESS STATE
                <>
                    <div className="relative mb-6">
                        {/* Animated Circle Background */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center relative z-10"
                        >
                            <Check className="w-12 h-12 text-green-600" strokeWidth={3} />
                        </motion.div>
                        {/* Pulse Ring */}
                        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Booking Confirmed!</h2>
                    <p className="text-gray-500 mb-8 max-w-xs">{message || "Your ticket has been booked successfully. You can download it now."}</p>

                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        {onDownload && (
                            <button
                                onClick={onDownload}
                                className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Download size={18} /> Download Ticket
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-medium transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </>
            ) : (
                // FAILURE STATE
                <>
                    <div className="relative mb-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1, rotate: [0, -10, 10, -10, 0] }}
                            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                            className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center relative z-10"
                        >
                            <X className="w-12 h-12 text-red-500" />
                        </motion.div>
                        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Failed</h2>
                    <p className="text-gray-500 mb-8 max-w-xs">{message || "Oops! Something went wrong with the transaction. Please try again."}</p>

                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="w-full py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 hover:bg-red-600 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={18} /> Retry Payment
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
