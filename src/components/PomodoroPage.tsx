import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, CheckCircle, Plus, Trash2, Code, BookOpen } from 'lucide-react';

type Mode = 'study' | 'coding';
type Goal = {
    id: string;
    text: string;
    completed: boolean;
};

const POMODORO_TIMES = {
    study: 25 * 60,
    coding: 50 * 60,
};

export default function PomodoroPage() {
    const [mode, setMode] = useState<Mode>('study');
    const [timeLeft, setTimeLeft] = useState(POMODORO_TIMES.study);
    const [isActive, setIsActive] = useState(false);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [newGoal, setNewGoal] = useState('');

    // Audio refs (optional: could add sound effects later)

    // Timer Logic
    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            // Determine what to do next? For now just stop.
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    // Mode Switching
    const switchMode = (newMode: Mode) => {
        setIsActive(false);
        setMode(newMode);
        setTimeLeft(POMODORO_TIMES[newMode]);
    };

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(POMODORO_TIMES[mode]);
    };

    // Goal Management
    const addGoal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoal.trim()) return;
        setGoals([...goals, { id: Date.now().toString(), text: newGoal, completed: false }]);
        setNewGoal('');
    };

    const toggleGoal = (id: string) => {
        setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
    };

    const deleteGoal = (id: string) => {
        setGoals(goals.filter(g => g.id !== id));
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = ((POMODORO_TIMES[mode] - timeLeft) / POMODORO_TIMES[mode]) * 100;

    return (
        <div className="min-h-[calc(100vh-6rem)] w-full relative overflow-hidden flex flex-col items-center justify-start py-8 px-4 transition-colors duration-500">

            {/* Background Ambience */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${mode === 'study' ? 'opacity-20' : 'opacity-10'}`}>
                <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] ${mode === 'study' ? 'bg-blue-400' : 'bg-purple-600'}`} />
                <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] ${mode === 'study' ? 'bg-green-400' : 'bg-orange-500'}`} />
            </div>

            <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col lg:flex-row gap-8 items-start">

                {/* Left Col: Timer & Controls */}
                <div className="flex-1 w-full">
                    {/* Mode Switcher */}
                    <div className="flex items-center justify-center gap-4 mb-12">
                        <button
                            onClick={() => switchMode('study')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${mode === 'study'
                                    ? 'bg-blue-100 text-blue-700 shadow-lg shadow-blue-500/20 scale-105 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-black'
                                    : 'bg-gray-100 dark:bg-gray-900 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800'
                                }`}
                        >
                            <BookOpen size={20} />
                            <span>Study Mode</span>
                        </button>
                        <button
                            onClick={() => switchMode('coding')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${mode === 'coding'
                                    ? 'bg-purple-100 text-purple-700 shadow-lg shadow-purple-500/20 scale-105 ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-black'
                                    : 'bg-gray-100 dark:bg-gray-900 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800'
                                }`}
                        >
                            <Code size={20} />
                            <span>Coding Mode</span>
                        </button>
                    </div>

                    {/* Main Timer Display */}
                    <div className="flex flex-col items-center justify-center mb-8 relative">
                        {/* Circle Progress */}
                        <div className="relative w-80 h-80 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
                                <circle
                                    cx="50%"
                                    cy="50%"
                                    r="150"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className="text-gray-200 dark:text-gray-800"
                                />
                                <motion.circle
                                    initial={{ strokeDashoffset: 942 }}
                                    animate={{ strokeDashoffset: 942 - (942 * (progress / 100)) }} // 2 * PI * 150 ≈ 942
                                    cx="50%"
                                    cy="50%"
                                    r="150"
                                    fill="transparent"
                                    stroke={mode === 'study' ? '#3B82F6' : '#9333EA'}
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray="942"
                                    className="transition-all duration-1000 ease-linear"
                                />
                            </svg>

                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 font-mono">
                                    {formatTime(timeLeft)}
                                </span>
                                <span className="text-sm font-medium text-gray-400 mt-2 uppercase tracking-widest">
                                    {isActive ? 'Focusing' : 'Paused'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-6">
                        <button
                            onClick={toggleTimer}
                            className={`p-6 rounded-2xl transition-all duration-200 shadow-xl hover:scale-105 active:scale-95 ${mode === 'study'
                                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                                    : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/30'
                                } text-white`}
                        >
                            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>
                        <button
                            onClick={resetTimer}
                            className="p-6 rounded-2xl bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white shadow-lg border border-gray-100 dark:border-gray-700 hover:scale-105 active:scale-95 transition-all"
                        >
                            <RotateCcw size={32} />
                        </button>
                    </div>
                </div>

                {/* Right Col: Goals */}
                <div className="w-full lg:w-96 glass rounded-3xl p-6 shadow-xl border border-white/20 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${mode === 'study' ? 'from-blue-400 to-green-400' : 'from-purple-400 to-orange-400'}`} />

                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <CheckCircle className={mode === 'study' ? 'text-blue-500' : 'text-purple-500'} />
                        Session Goals
                    </h2>

                    <form onSubmit={addGoal} className="mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                value={newGoal}
                                onChange={(e) => setNewGoal(e.target.value)}
                                placeholder="What's your focus?"
                                className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-none focus:ring-2 focus:ring-opacity-50 transition-all outline-none"
                                style={{
                                    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
                                }}
                            />
                            <button
                                type="submit"
                                className={`absolute right-2 top-2 p-1.5 rounded-lg text-white transition-colors ${mode === 'study' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-500 hover:bg-purple-600'
                                    }`}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </form>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        <AnimatePresence>
                            {goals.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center text-gray-400 py-8 italic"
                                >
                                    No goals set yet. <br /> Let's get productive!
                                </motion.div>
                            )}
                            {goals.map((goal) => (
                                <motion.div
                                    key={goal.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className={`group flex items-center gap-3 p-3 rounded-xl transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-800 ${goal.completed ? 'bg-green-50/50 dark:bg-green-900/10' : 'bg-white dark:bg-gray-900'
                                        }`}
                                >
                                    <button
                                        onClick={() => toggleGoal(goal.id)}
                                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${goal.completed
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                            }`}
                                    >
                                        {goal.completed && <CheckCircle size={14} />}
                                    </button>
                                    <span className={`flex-1 text-sm font-medium transition-all ${goal.completed ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'
                                        }`}>
                                        {goal.text}
                                    </span>
                                    <button
                                        onClick={() => deleteGoal(goal.id)}
                                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-md transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
