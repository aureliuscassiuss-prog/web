
import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface TyreLoaderProps {
    size?: number;
    className?: string;
    fullScreen?: boolean; // New prop to toggle full-screen overlay & scroll lock
}

export default function TyreLoader({ size = 50, className = "", fullScreen = false }: TyreLoaderProps) {

    // Scroll Lock Logic
    useEffect(() => {
        if (fullScreen) {
            // Check if document is defined (for safety)
            if (typeof document !== 'undefined') {
                const originalStyle = window.getComputedStyle(document.body).overflow;
                document.body.style.overflow = 'hidden';

                // Cleanup on unmount or when fullScreen changes to false
                return () => {
                    document.body.style.overflow = originalStyle;
                };
            }
        }
    }, [fullScreen]);

    const LoaderContent = () => (
        <motion.div
            className={`relative flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full text-gray-900 dark:text-gray-100"
            >
                {/* Outer Tyre Circle */}
                <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="12" className="opacity-100" />

                {/* Treads / Cuts - Simple cutout pattern to make it look like a tyre */}
                {/* We use specific strokeDasharray to create gaps in a thinner overlay circle or just use lines */}
                {/* Let's use simple lines radiating from center for "spokes/treads" visual */}
                <circle cx="50" cy="50" r="42" stroke="white" strokeWidth="4" strokeDasharray="10 15" className="dark:stroke-black opacity-30" />

                {/* Inner Hub */}
                <circle cx="50" cy="50" r="15" fill="currentColor" className="opacity-100" />
            </svg>
        </motion.div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <LoaderContent />
                <p className="mt-4 text-xs font-medium text-gray-500 uppercase tracking-widest animate-pulse">Loading</p>
            </div>
        );
    }

    return <LoaderContent />;
}
