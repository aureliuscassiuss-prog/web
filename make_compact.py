import re

with open(r'c:\Users\abhig\.gemini\antigravity\scratch\uninotes-react\src\components\AdminPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make compact for mobile - in the UsersView function only
# 1. Card header: px-5 py-4 -> px-3 py-2.5, gap-4 -> gap-3
content = re.sub(
    r'className="w-full px-5 py-4 flex items-center gap-4 hover',
    r'className="w-full px-3 py-2.5 flex items-center gap-3 hover',
    content
)

# 2. Avatar: h-12 w-12 rounded-xl -> h-9 w-9 rounded-lg
content = re.sub(
    r'className="h-12 w-12 rounded-xl overflow-hidden',
    r'className="h-9 w-9 rounded-lg overflow-hidden',
    content
)

# 3. User name: font-semibold -> text-sm font-semibold
content = re.sub(
    r'<div className="font-semibold text-gray-900 dark:text-white truncate">',
    r'<div className="text-sm font-semibold text-gray-900 dark:text-white truncate">',
    content
)

# 4. Email: text-sm -> text-xs
content = re.sub(
    r'<div className="text-sm text-gray-500 dark:text-gray-400 truncate">\{user\.email\}',
    r'<div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}',
    content
)

# 5. Chevron icon: size={20} -> size={18}
content = re.sub(
    r'<ChevronRight className="text-gray-400" size=\{20\}',
    r'<ChevronRight className="text-gray-400" size={18}',
    content
)

# 6. Expanded content padding: px-5 pb-5 pt-2 space-y-4 -> px-3 pb-3 pt-1 space-y-3
content = re.sub(
    r'className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-4"',
    r'className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-800 space-y-3"',
    content
)

# 7. Section titles: text-xs mb-2 -> text-[10px] mb-1.5
content = re.sub(
    r'className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"',
    r'className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5"',
    content
)

# 8. Status badges gap: gap-2 -> gap-1.5
content = re.sub(
    r'<div className="flex flex-wrap gap-2">(\s*\{user\.isBanned)',
    r'<div className="flex flex-wrap gap-1.5">\1',
    content
)

# 9. Status badge sizes: px-3 py-1 rounded-lg text-xs -> px-2 py-0.5 rounded-md text-[10px]
content = re.sub(
    r'className="px-3 py-1 rounded-lg text-xs font-bold border bg-',
    r'className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-',
    content
)

# 10. Role dropdown and button gap: gap-2 -> gap-1.5
content = re.sub(
    r'<div className="flex items-center gap-2">(\s*<select)',
    r'<div className="flex items-center gap-1.5">\1',
    content
)

# 11. Select box: text-sm px-3 py-2 rounded-lg -> text-xs px-2 py-1.5 rounded-md
content = re.sub(
    r'className="flex-1 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2',
    r'className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1.5',
    content
)

# 12. Apply button: px-4 py-2 text-sm gap-2 size={16} -> px-2.5 py-1.5 text-xs gap-1 size={14}
content = re.sub(
    r'className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium',
    r'className="px-2.5 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium',
    content
)
content = re.sub(
    r'flex items-center gap-2">\s*<Check size=\{16\} />',
    r'flex items-center gap-1"><Check size={14} />',
    content
)

# 13. Action buttons grid: gap-2 -> gap-1.5, always 2 columns
content = re.sub(
    r'className="grid grid-cols-1 sm:grid-cols-2 gap-2">',
    r'className="grid grid-cols-2 gap-1.5">',
    content
)

# 14. Action buttons: px-4 py-2.5 rounded-lg text-sm gap-2 -> px-2 py-1.5 rounded-md text-xs gap-1
content = re.sub(
    r'className=\{`px-4 py-2\.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2',
    r'className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1',
    content
)

# 15. Icons in action buttons: size={16} -> size={14}
content = re.sub(r'<Ban size=\{16\}', r'<Ban size={14}', content)
content = re.sub(r'<AlertCircle size=\{16\}', r'<AlertCircle size={14}', content)
content = re.sub(r'<Shield size=\{16\}', r'<Shield size={14}', content)
content = re.sub(r'<Trash2 size=\{16\}', r'<Trash2 size={14}', content)
content = re.sub(r'<Loader2 size=\{16\}', r'<Loader2 size={14}', content)

# 16. Processing indicator: text-sm py-2 -> text-xs py-1
content = re.sub(
    r'className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 py-2">',
    r'className="flex items-center justify-center gap-2 text-xs text-blue-600 dark:text-blue-400 py-1">',
    content
)

# 17. Hide button text on mobile with sm:inline (for Ban, Restrict, Trust, Delete buttons)
content = re.sub(
    r'\{user\.isBanned \? \'Unban User\' : \'Ban User\'\}',
    r'<span className="hidden sm:inline">{user.isBanned ? \'Unban\' : \'Ban\'}</span>',
    content
)
content = re.sub(
    r'\{user\.isRestricted \|\| !user\.canUpload \? \'Unrestrict User\' : \'Restrict User\'\}',
    r'<span className="hidden sm:inline">{user.isRestricted || !user.canUpload ? \'Unrestrict\' : \'Restrict\'}</span>',
    content
)
content = re.sub(
    r'\{user\.isTrusted \? \'Remove Trusted Status\' : \'Mark as Trusted User\'\}',
    r'<span className="hidden sm:inline">{user.isTrusted ? \'Untrust\' : \'Trust\'}</span>',
    content
)
content = re.sub(
    r'Delete User',
    r'<span className="hidden sm:inline">Delete</span>',
    content
)
content = re.sub(
    r'Apply',
    r'<span className="hidden sm:inline">Apply</span>',
    content
)

# 18. Remove sm:col-span-2 from buttons since we're using 2 columns always
content = re.sub(r' sm:col-span-2', '', content)

with open(r'c:\Users\abhig\.gemini\antigravity\scratch\uninotes-react\src\components\AdminPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Mobile optimizations applied!')
