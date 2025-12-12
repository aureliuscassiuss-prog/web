import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, CheckCircle, Plus, Trash2, Code, BookOpen, Coffee, X, Maximize, Minimize, Settings, Save } from 'lucide-react';
import confetti from 'canvas-confetti';
import CoffeeBreak from './CoffeeBreak';

type Mode = 'study' | 'coding' | 'break';

type Goal = {
    id: string;
    text: string;
    completed: boolean;
};

// Configuration
// Default Configuration
const DEFAULT_CONFIG = {
    study: { time: 25 * 60, color: 'text-blue-500', stroke: '#3B82F6', bg: 'bg-blue-500', lightBg: 'bg-blue-50', gradient: 'from-blue-600 to-cyan-400' },
    coding: { time: 50 * 60, color: 'text-violet-500', stroke: '#8B5CF6', bg: 'bg-violet-500', lightBg: 'bg-violet-50', gradient: 'from-violet-600 to-fuchsia-400' },
    break: { time: 5 * 60, color: 'text-emerald-500', stroke: '#10B981', bg: 'bg-emerald-500', lightBg: 'bg-emerald-50', gradient: 'from-emerald-500 to-teal-400' },
};

type TimerConfig = typeof DEFAULT_CONFIG;

export default function PomodoroPage() {
    const [config, setConfig] = useState<TimerConfig>(() => {
        const saved = localStorage.getItem('pomodoroConfig');
        return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    });

    const getSavedState = (m: Mode) => {
        const allStates = JSON.parse(localStorage.getItem('pomodoroStates') || '{}');
        return allStates[m] || null;
    };

    const saveModeState = (m: Mode, active: boolean, time: number) => {
        const allStates = JSON.parse(localStorage.getItem('pomodoroStates') || '{}');
        allStates[m] = {
            isActive: active,
            timeLeft: time,
            endTime: active ? Date.now() + time * 1000 : null
        };
        localStorage.setItem('pomodoroStates', JSON.stringify(allStates));
    };

    const [mode, setMode] = useState<Mode>(() => {
        const savedMode = localStorage.getItem('pomodoroLastMode');
        return (savedMode as Mode) || 'study';
    });

    const initTimerState = (currentMode: Mode) => {
        const saved = getSavedState(currentMode);
        if (saved) {
            if (saved.isActive && saved.endTime) {
                const remaining = Math.ceil((saved.endTime - Date.now()) / 1000);
                return {
                    time: remaining > 0 ? remaining : 0,
                    active: remaining > 0
                };
            }
            return { time: saved.timeLeft, active: false };
        }
        return { time: config[currentMode].time, active: false };
    };

    const [timerState] = useState(() => initTimerState(mode));
    const [timeLeft, setTimeLeft] = useState(timerState.time);
    const [isActive, setIsActive] = useState(timerState.active);

    // Initialize allGoals from localStorage; handle migration from old array if needed
    const [allGoals, setAllGoals] = useState<Record<Mode, Goal[]>>(() => {
        const saved = localStorage.getItem('pomodoroGoals');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Check if it's the old array format
            if (Array.isArray(parsed)) {
                return { study: parsed, coding: [], break: [] };
            }
            return parsed;
        }
        return { study: [], coding: [], break: [] };
    });

    // Derived state for current goals (helper)
    const currentGoals = allGoals[mode];

    const [newGoal, setNewGoal] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [tempTimes, setTempTimes] = useState({
        study: config.study.time / 60,
        coding: config.coding.time / 60,
        break: config.break.time / 60
    });

    useEffect(() => {
        localStorage.setItem('pomodoroGoals', JSON.stringify(allGoals));
    }, [allGoals]);

    useEffect(() => {
        localStorage.setItem('pomodoroLastMode', mode);
    }, [mode]);

    useEffect(() => {
        document.title = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')} - ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;

        // --- Timer Logic (Per Mode) ---
        let interval: NodeJS.Timeout | null = null;

        // Ensure accurate end time reference
        const currentSaved = getSavedState(mode);
        let endTime = currentSaved?.endTime;

        if (isActive && timeLeft > 0) {
            // Auto-correction: If state says active but no endTime, fix it.
            if (!endTime) {
                endTime = Date.now() + timeLeft * 1000;
                saveModeState(mode, true, timeLeft);
            }

            interval = setInterval(() => {
                const now = Date.now();
                const newTimeLeft = Math.max(0, Math.ceil((endTime! - now) / 1000));

                setTimeLeft(newTimeLeft);

                if (newTimeLeft === 0) {
                    setIsActive(false);
                    saveModeState(mode, false, 0);
                    // Play end sound
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3');
                    audio.play().catch(e => console.log('Timer end audio failed', e));
                }
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            // Cleanup if we entered holding 0
            setIsActive(false);
            saveModeState(mode, false, 0);
        }

        return () => { if (interval) clearInterval(interval); };
    }, [isActive, timeLeft, mode]); // Depend on Mode switch

    const switchMode = (newMode: Mode) => {
        // Save CURRENT mode state before switching
        saveModeState(mode, isActive, timeLeft);

        // Switch
        setMode(newMode);

        // Load NEW mode state
        const newState = initTimerState(newMode);
        setTimeLeft(newState.time);
        setIsActive(newState.active);
    };

    const updateConfig = () => {
        const newConfig = {
            ...config,
            study: { ...config.study, time: tempTimes.study * 60 },
            coding: { ...config.coding, time: tempTimes.coding * 60 },
            break: { ...config.break, time: tempTimes.break * 60 }
        };
        setConfig(newConfig);
        localStorage.setItem('pomodoroConfig', JSON.stringify(newConfig));

        // Reset current timer if it wasn't running, to apply new settings
        if (!isActive) {
            const newTime = newConfig[mode].time;
            setTimeLeft(newTime);
            saveModeState(mode, false, newTime);
        }

        setIsSettingsOpen(false);
    };

    const toggleTimer = () => {
        const newActive = !isActive;
        setIsActive(newActive);
        saveModeState(mode, newActive, timeLeft);
    };

    const resetTimer = () => {
        setIsActive(false);
        const newTime = config[mode].time;
        setTimeLeft(newTime);
        saveModeState(mode, false, newTime);
    };

    const addGoal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoal.trim()) return;

        const newGoalObj: Goal = { id: Date.now().toString(), text: newGoal, completed: false };
        setAllGoals(prev => ({
            ...prev,
            [mode]: [...prev[mode], newGoalObj]
        }));
        setNewGoal('');
    };

    const toggleGoal = (id: string) => {
        setAllGoals(prev => ({
            ...prev,
            [mode]: prev[mode].map(g => {
                if (g.id === id) {
                    const newCompleted = !g.completed;
                    if (newCompleted) {
                        confetti({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 },
                            colors: mode === 'study' ? ['#3B82F6', '#10B981'] : ['#8B5CF6', '#F59E0B']
                        });
                        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3');
                        audio.volume = 0.5;
                        audio.play().catch(e => console.log('Audio play failed', e));
                    }
                    return { ...g, completed: newCompleted };
                }
                return g;
            })
        }));
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    const deleteGoal = (id: string) => {
        setAllGoals(prev => ({
            ...prev,
            [mode]: prev[mode].filter(g => g.id !== id)
        }));
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate Progress
    const totalTime = config[mode].time;
    const progress = ((totalTime - timeLeft) / totalTime) * 100;
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // True Full Screen Overlay Class
    const containerClass = isFullscreen
        ? "fixed inset-0 z-[100] bg-white dark:bg-black overflow-y-auto flex flex-col items-center justify-center"
        : "min-h-[calc(100vh-6rem)] w-full bg-white dark:bg-black text-gray-800 dark:text-gray-100 font-sans transition-colors duration-500 overflow-x-hidden relative flex flex-col";

    return (
        <div className={containerClass}>

            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[100px] opacity-20 transition-all duration-1000 ${config[mode].bg}`} />
                <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[100px] opacity-20 transition-all duration-1000 ${mode === 'study' ? 'bg-cyan-400' : mode === 'coding' ? 'bg-fuchsia-600' : 'bg-teal-400'}`} />
            </div>

            {/* Navbar / Header */}
            <header className="relative z-20 w-full max-w-6xl mx-auto p-6 flex justify-between items-center">
                <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    <div className={`w-3 h-3 rounded-full ${config[mode].bg}`} />
                    <span>Focus<span className="opacity-50">Flow</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        title="Settings"
                    >
                        <Settings size={20} />
                    </button>
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        title={isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
                    >
                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-start w-full max-w-5xl mx-auto px-4 pb-12 gap-8 lg:gap-16 lg:flex-row lg:items-start lg:justify-center lg:mt-8">

                {/* Left Column: Timer & Controls */}
                <div className="flex-1 w-full max-w-md flex flex-col items-center">

                    {/* Mode Switcher */}
                    <div className="flex p-1.5 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 mb-8 w-full max-w-sm">
                        {(['study', 'coding', 'break'] as Mode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => switchMode(m)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${mode === m
                                    ? 'bg-white dark:bg-gray-800 shadow-md text-gray-900 dark:text-white scale-[1.02]'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                            >
                                {m === 'study' && <BookOpen size={16} />}
                                {m === 'coding' && <Code size={16} />}
                                {m === 'break' && <Coffee size={16} />}
                                <span className="capitalize hidden sm:inline">{m}</span>
                            </button>
                        ))}
                    </div>

                    {/* Timer Circle */}
                    <div className="relative mb-10 group cursor-default">
                        {/* Glow Effect */}
                        <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 transition-colors duration-700 ${config[mode].bg}`} />

                        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                {/* Track */}
                                <circle
                                    cx="50%" cy="50%" r={radius}
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className="text-gray-200 dark:text-gray-800 opacity-50"
                                />
                                {/* Progress */}
                                <motion.circle
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={{ strokeDashoffset }}
                                    cx="50%" cy="50%" r={radius}
                                    fill="transparent"
                                    stroke={config[mode].stroke}
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    className="transition-all duration-500 ease-in-out drop-shadow-md"
                                />
                            </svg>

                            <div className="absolute inset-0 flex items-center justify-center flex-col z-10">
                                <span className={`text-6xl sm:text-7xl font-mono font-bold tracking-tighter tabular-nums transition-colors duration-300 ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                                <span className={`text-sm font-medium uppercase tracking-[0.2em] mt-2 transition-colors duration-300 ${config[mode].color}`}>
                                    {isActive ? 'Running' : 'Paused'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Play Controls */}
                    <div className="flex items-center gap-6">
                        <button
                            onClick={toggleTimer}
                            className={`h-16 w-16 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-gray-300/50 dark:shadow-black/50 transition-all hover:scale-105 active:scale-95 bg-gradient-to-br ${config[mode].gradient}`}
                        >
                            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>

                        <button
                            onClick={resetTimer}
                            className="h-14 w-14 rounded-2xl flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-white shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95"
                            title="Reset Timer"
                        >
                            <RotateCcw size={24} />
                        </button>
                    </div>
                </div>

                {/* Right Column: Goal Manager OR Coffee Break */}
                <div className="w-full max-w-md lg:h-[500px] flex flex-col">
                    {mode === 'break' ? (
                        <CoffeeBreak timeLeft={timeLeft} totalTime={config.break.time} />
                    ) : (
                        <div className="flex-1 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-gray-700/50 shadow-xl overflow-hidden flex flex-col">

                            {/* Header */}
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-white/40 dark:bg-gray-800/40">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                                    <CheckCircle className={config[mode].color} size={20} />
                                    {mode === 'coding' ? 'Coding Tasks' : 'Study Goals'}
                                    <span className="ml-auto text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                                        {currentGoals.filter(g => g.completed).length}/{currentGoals.length}
                                    </span>
                                </h2>
                            </div>

                            {/* Scrollable List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                <AnimatePresence mode='popLayout'>
                                    {currentGoals.length === 0 && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2 mt-8"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                                                <Plus size={20} />
                                            </div>
                                            <p className="text-sm">No tasks yet.</p>
                                            <p className="text-xs">Add one below to start.</p>
                                        </motion.div>
                                    )}

                                    {currentGoals.map((goal) => (
                                        <motion.div
                                            key={goal.id}
                                            layout
                                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={`group flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200 ${goal.completed
                                                ? 'bg-gray-50/50 dark:bg-gray-900/30 border-transparent opacity-75'
                                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                        >
                                            <button
                                                onClick={() => toggleGoal(goal.id)}
                                                className={`flex-shrink-0 w-6 h-6 rounded-full border-[2px] flex items-center justify-center transition-all duration-200 ${goal.completed
                                                    ? `${config[mode].bg} border-transparent scale-110`
                                                    : 'border-gray-300 dark:border-gray-500 hover:border-gray-400 text-transparent'
                                                    }`}
                                            >
                                                <CheckCircle size={14} className="text-white" />
                                            </button>

                                            <span className={`flex-1 text-sm font-medium transition-all ${goal.completed ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'
                                                }`}>
                                                {goal.text}
                                            </span>

                                            <button
                                                onClick={() => deleteGoal(goal.id)}
                                                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                aria-label="Delete goal"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
                                <form onSubmit={addGoal} className="relative group">
                                    <input
                                        type="text"
                                        value={newGoal}
                                        onChange={(e) => setNewGoal(e.target.value)}
                                        placeholder="Add a new task..."
                                        className="w-full pl-4 pr-12 py-3.5 bg-gray-50 dark:bg-black/20 rounded-xl text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all border border-transparent focus:bg-white dark:focus:bg-gray-900"
                                        style={{
                                            ['--tw-ring-color' as any]: mode === 'study' ? '#3B82F6' : mode === 'coding' ? '#8B5CF6' : '#10B981'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newGoal.trim()}
                                        className={`absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center rounded-lg text-white transition-all duration-200 ${newGoal.trim()
                                            ? `${config[mode].bg} shadow-md hover:scale-105 active:scale-95`
                                            : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                            }`}
                                    >
                                        <Plus size={18} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Settings Modal */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setIsSettingsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative z-10 w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold">Timer Settings</h3>
                                <button onClick={() => setIsSettingsOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {(['study', 'coding', 'break'] as const).map((t) => (
                                    <div key={t} className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium capitalize text-gray-600 dark:text-gray-400">
                                            {t} Duration (minutes)
                                        </label>
                                        <input
                                            type="number"
                                            value={tempTimes[t]}
                                            onChange={(e) => setTempTimes({ ...tempTimes, [t]: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-black/30 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            min="1"
                                            max="120"
                                        />
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={updateConfig}
                                className="w-full mt-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-medium hover:opacity-90 flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                Save Changes
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}