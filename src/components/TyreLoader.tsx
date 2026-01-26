
import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface TyreLoaderProps {
    size?: number;
    className?: string;
    fullScreen?: boolean; // New prop to toggle full-screen overlay & scroll lock
}

export default function TyreLoader({ size = 32, className = "", fullScreen = false }: TyreLoaderProps) {

    // Scroll Lock Logic (User wants NO scroll while loading)
    useEffect(() => {
        if (fullScreen) {
            if (typeof document !== 'undefined') {
                const originalStyle = window.getComputedStyle(document.body).overflow;
                document.body.style.overflow = 'hidden';
                return () => {
                    document.body.style.overflow = originalStyle;
                };
            }
        }
    }, [fullScreen]);

    const LoaderContent = () => (
        <div
            className={`relative flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
        >
            <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-800" />
            <motion.div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-black dark:border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
        </div>
    );

    if (fullScreen) {
        return (
            // Z-index lowered to 20 to sit BEHIND the Header (which is z-30)
            <div className="fixed inset-0 z-[20] flex flex-col items-center justify-center bg-white/90 dark:bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                <LoaderContent />
            </div>
        );
    }

    return <LoaderContent />;
}
