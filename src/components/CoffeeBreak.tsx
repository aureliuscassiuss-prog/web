import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface CoffeeBreakProps {
    timeLeft?: number;
    totalTime?: number;
}

export default function CoffeeBreak({ timeLeft = 300, totalTime = 300 }: CoffeeBreakProps) {
    // 0.0 (Full) -> 1.0 (Empty)
    const progress = Math.max(0, Math.min(1, (totalTime - timeLeft) / totalTime));

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const isRunning = timeLeft > 0 && timeLeft < totalTime;

    // --- PHYSICS CALCULATIONS ---

    // TOP SAND PATH GENERATOR
    // Simulates a "Cone of Depression". The center is lower than the sides.
    const topPath = useMemo(() => {
        const maxHeight = 80; // Height of one bulb
        const startY = 5;     // Top padding
        const endY = 80;      // Neck position

        // Calculate how much sand is left (volume approx)
        const sandLevel = startY + (progress * (endY - startY));

        // The "Dip" represents the funnel effect. 
        // As sand gets lower, the dip gets sharper.
        // If empty (progress = 1), y is at the neck.

        const sideY = sandLevel;
        const centerY = Math.min(endY, sandLevel + 10); // Center is 10 units lower (funnel)

        // Draw the shape: TopLeft -> CenterDip -> TopRight -> BottomRight -> BottomLeft
        // We extend to BottomRight(100,80) and BottomLeft(0,80) which is the neck
        return `M 0,${sideY} L 50,${centerY} L 100,${sideY} L 100,${endY} L 0,${endY} Z`;
    }, [progress]);


    // BOTTOM SAND PATH GENERATOR
    // Simulates a "Mound". The center is higher than the sides.
    const bottomPath = useMemo(() => {
        const base = 160; // Bottom of glass
        const maxHeight = 75;

        // Current height of the pile
        const h = progress * maxHeight;

        // The pile shape:
        // Center Peak (x=50, y = base - h)
        // Sides slope down. We use a Quadratic Curve (Q) to make it look like a soft pile.

        return `M 0,${base} L 100,${base} L 100,${base - (h * 0.2)} Q 50,${base - h - 5} 0,${base - (h * 0.2)} Z`;
    }, [progress]);


    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100/60 dark:bg-gray-900/60 backdrop-blur-3xl rounded-3xl border border-white/50 dark:border-gray-700/50 shadow-2xl p-8 min-h-[400px] overflow-hidden relative selection:bg-amber-200">

            {/* Background Atmosphere */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-orange-50/40 to-stone-200/40 dark:from-black/60 dark:to-stone-900/60 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center gap-10">

                <div className="relative w-48 h-72 drop-shadow-2xl">
                    <svg viewBox="0 0 100 160" className="w-full h-full overflow-visible">
                        <defs>
                            {/* --- TEXTURES --- */}

                            {/* 1. Static Sand Noise (The grains themselves don't move, the mask moves) */}
                            <filter id="staticGrain">
                                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="1" stitchTiles="stitch" />
                                <feColorMatrix type="saturate" values="0" />
                                <feComponentTransfer>
                                    <feFuncA type="linear" slope="0.5" />
                                </feComponentTransfer>
                            </filter>

                            {/* 2. Motion Stream Noise (Vertical blur for falling sand) */}
                            <filter id="fallingGrain" x="0%" y="0%" width="100%" height="100%">
                                <feTurbulence type="fractalNoise" baseFrequency="0.05 0.8" numOctaves="1" />
                                <feColorMatrix type="saturate" values="0" />
                            </filter>

                            {/* 3. Sand Color Gradient */}
                            <radialGradient id="sandGradient" cx="0.5" cy="0.5" r="0.6">
                                <stop offset="0%" stopColor="#f59e0b" /> {/* Bright Amber */}
                                <stop offset="80%" stopColor="#b45309" /> {/* Dark Amber Shadow */}
                            </radialGradient>

                            <linearGradient id="glassReflection" x1="0" x2="1" y1="0" y2="0">
                                <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                                <stop offset="20%" stopColor="rgba(255,255,255,0.05)" />
                                <stop offset="50%" stopColor="rgba(255,255,255,0)" />
                                <stop offset="80%" stopColor="rgba(255,255,255,0.05)" />
                                <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
                            </linearGradient>

                            {/* 4. Glass Inner Shape (The container walls) */}
                            <clipPath id="containerMask">
                                <path d="M12,6 Q12,75 48,79 L52,79 Q88,75 88,6 L88,6 C88,3 86,2 50,2 C14,2 12,3 12,6 Z M12,154 Q12,85 48,81 L52,81 Q88,85 88,154 L88,154 C88,157 86,158 50,158 C14,158 12,157 12,154 Z" />
                            </clipPath>
                        </defs>

                        {/* --- BACK GLASS (Shadows) --- */}
                        <path
                            d="M10,6 Q10,75 48,80 L52,80 Q90,75 90,6 L90,6 C90,2 88,0 50,0 C12,0 10,2 10,6 Z M10,154 Q10,85 48,80 L52,80 Q90,85 90,154 L90,154 C90,158 88,160 50,160 C12,160 10,158 10,154 Z"
                            fill="rgba(0,0,0,0.2)"
                        />

                        {/* ======================================================= */}
                        {/* SAND LAYERS */}
                        {/* ======================================================= */}
                        <g clipPath="url(#containerMask)">

                            {/* --- TOP SAND --- */}
                            {/* 
                                Logic: We draw a static rectangle of sand texture. 
                                We Mask it using the `d` path calculated in useMemo.
                                This ensures the texture doesn't slide, only the boundary reveals/hides it.
                            */}
                            <path
                                d={topPath}
                                fill="url(#sandGradient)"
                            />
                            {/* Grain Overlay for Top */}
                            <path
                                d={topPath}
                                fill="#78350f"
                                filter="url(#staticGrain)"
                                opacity="0.3"
                            />


                            {/* --- FALLING STREAM --- */}
                            {isRunning && (
                                <g>
                                    {/* The core stream */}
                                    <path d="M49,80 L51,80 L50.5,160 L49.5,160 Z" fill="#f59e0b" opacity="0.9" />

                                    {/* Moving Particles (The dash effect) */}
                                    <motion.line
                                        x1="50" y1="80" x2="50" y2="160"
                                        stroke="#fff"
                                        strokeWidth="2"
                                        strokeDasharray="4 6"
                                        opacity="0.5"
                                        filter="url(#fallingGrain)"
                                        animate={{ strokeDashoffset: [0, -20] }} // Fast movement
                                        transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }}
                                    />
                                </g>
                            )}


                            {/* --- BOTTOM SAND --- */}
                            {/* Logic: Same as top, the path grows, revealing the static texture underneath */}
                            <path
                                d={bottomPath}
                                fill="url(#sandGradient)"
                            />
                            {/* Grain Overlay for Bottom */}
                            <path
                                d={bottomPath}
                                fill="#78350f"
                                filter="url(#staticGrain)"
                                opacity="0.3"
                            />
                        </g>


                        {/* --- FRONT GLASS (Reflections & Body) --- */}
                        <path
                            d="M10,6 Q10,75 48,80 L52,80 Q90,75 90,6 L90,6 C90,2 88,0 50,0 C12,0 10,2 10,6 Z M10,154 Q10,85 48,80 L52,80 Q90,85 90,154 L90,154 C90,158 88,160 50,160 C12,160 10,158 10,154 Z"
                            fill="url(#glassReflection)"
                            stroke="rgba(255,255,255,0.4)"
                            strokeWidth="1"
                        />

                        {/* Highlights (Specular lighting) */}
                        <path d="M15,10 Q15,65 40,75" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                        <path d="M15,150 Q15,95 40,85" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />

                        {/* Rim Light */}
                        <path d="M85,10 Q85,65 60,75" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.2" />

                    </svg>

                    {/* Ambient Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl -z-10" />
                </div>

                {/* --- TIME DISPLAY --- */}
                <div className="flex flex-col items-center">
                    <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700/70 dark:text-amber-500/80 mb-2">
                        Time Remaining
                    </h3>
                    <div className="relative">
                        <span className="text-6xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-br from-stone-700 to-stone-900 dark:from-stone-100 dark:to-stone-400 tabular-nums tracking-tighter drop-shadow-sm">
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}