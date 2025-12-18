import { useEffect } from 'react';

// Hook to lock body scroll
export default function useLockBodyScroll(isOpen: boolean) {
    useEffect(() => {
        if (isOpen) {
            // Save original body overflow
            const originalStyle = window.getComputedStyle(document.body).overflow;

            // Prevent scrolling on mount
            document.body.style.overflow = 'hidden';

            // Re-enable scrolling when component unmounts
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isOpen]); // Only re-run if isOpen changes
}
