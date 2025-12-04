import re

with open(r'c:\Users\abhig\.gemini\antigravity\scratch\uninotes-react\src\components\AdminPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace TabButton component
old_tab_button = r'''function TabButton\(\{ active, onClick, icon, label, count \}: any\) \{
    return \(
        <button onClick=\{onClick\} className=\{`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all \$\{active \? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-white/5'\}`\}>
            \{icon\}
            \{label\}
            \{count > 0 && <span className="bg-red-500 text-white text-\[10px\] px-1\.5 py-0\.5 rounded-full">\{count\}</span>\}
        </button>
    \)
\}'''

new_tab_button = '''function TabButton({ active, onClick, icon, label, count }: any) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-white/5'}`}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
            {count > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{count}</span>}
        </motion.button>
    )
}'''

content = re.sub(old_tab_button, new_tab_button, content)

# Also fix the tab container to remove w-max (let it naturally fit)
content = re.sub(
    r'<div className="flex gap-1 p-1 bg-gray-200/50 dark:bg-white/5 rounded-xl w-max sm:w-auto">',
    r'<div className="flex gap-1 p-1 bg-gray-200/50 dark:bg-white/5 rounded-xl justify-around sm:justify-start sm:w-auto">',
    content
)

with open(r'c:\Users\abhig\.gemini\antigravity\scratch\uninotes-react\src\components\AdminPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated tab navigation for mobile!')
