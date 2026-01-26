
import { motion } from 'framer-motion';

export default function TyreLoader({ size = 40, className = "" }: { size?: number, className?: string }) {
    return (
        <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <motion.span
                style={{
                    display: "block",
                    width: size,
                    height: size,
                    border: "3px solid",
                    borderColor: "currentColor",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    display: "inline-block",
                    boxSizing: "border-box"
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="text-gray-900 dark:text-gray-100 opacity-90"
            />
        </div>
    );
}
