
import { motion } from 'framer-motion';

export default function TyreLoader({ size = 40, className = "" }: { size?: number, className?: string }) {
    return (
        <motion.div
            className={`relative flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
            {/* Tyre Body */}
            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
            >
                {/* Outer Rubber Tyre */}
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="10" className="text-gray-900 dark:text-gray-100 opactiy-90" />

                {/* Inner Rim Detail - Silver/Metallic Ring */}
                <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="2" className="text-gray-500 dark:text-gray-400 opacity-50" />

                {/* 5-Spoke Mag Wheel Design */}
                <path
                    d="M50 50 L50 15 M50 50 L83 40 M50 50 L70 80 M50 50 L30 80 M50 50 L17 40"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="text-gray-400 dark:text-gray-500"
                />

                {/* Center Hub */}
                <circle cx="50" cy="50" r="8" fill="currentColor" className="text-yellow-500" />
                {/* Porsche Crest Hint (Red Dot in center) */}
                <circle cx="50" cy="50" r="3" fill="#D32F2F" />

                {/* Brake Caliper (Static relative to wheel rotation, but here it spins with wheel for simple effect or we make it static wrapping div? 
                   User said "tyre rotating", so the whole thing usually rotates. 
                   Realistically caliper stays still. Let's keep it simple: whole wheel rotates.) 
                */}
            </svg>
        </motion.div>
    );
}
