import re

file_path = r'c:\Users\abhig\.gemini\antigravity\scratch\uninotes-react\src\components\AdminPanel.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Regex to find the TabButton component
# We look for the function definition and its return statement
pattern = r'function TabButton\(\{ active, onClick, icon, label, count \}: any\) \{[\s\S]*?return \([\s\S]*?<\/motion\.button>\s*\)\s*\}'

# New implementation with absolute positioning for the badge
new_component = '''function TabButton({ active, onClick, icon, label, count }: any) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={`relative flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-white/5'}`}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
            {count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white shadow-sm ring-2 ring-white dark:ring-gray-900 sm:static sm:h-auto sm:w-auto sm:px-1.5 sm:py-0.5 sm:ring-0">
                    {count}
                </span>
            )}
        </motion.button>
    )
}'''

# Perform the replacement
new_content = re.sub(pattern, new_component, content)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated TabButton component.")
else:
    print("Could not find TabButton component to replace.")
