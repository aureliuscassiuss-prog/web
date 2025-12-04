import re

with open(r'c:\Users\abhig\.gemini\antigravity\scratch\uninotes-react\src\components\AdminPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Apply button (line 561-564)
content = re.sub(
    r'className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"\s*>\s*<Check size=\{16\} />\s*Apply',
    r'className="px-2.5 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1">\n                                                    <Check size={14} />\n                                                    <span className="hidden sm:inline">Apply</span>',
    content
)

# Fix Ban button
content = re.sub(
    r'(className=\{`px-4 py-2\.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 \$\{user\.isBanned\s*\?\s*[^}]+\}\s*`\})\s*>\s*<Ban size=\{16\} />\s*\{user\.isBanned \? \'Unban User\' : \'Ban User\'\}',
    r'\1>\n                                                    <Ban size={14} />\n                                                    <span className="hidden sm:inline">{user.isBanned ? \'Unban\' : \'Ban\'}</span>',
    content
)
# Update the button className for Ban
content = re.sub(
    r'className=\{`px-4 py-2\.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 \$\{user\.isBanned',
    r'className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${user.isBanned',
    content
)

# Fix Restrict button
content = re.sub(
    r'<AlertCircle size=\{16\} />\s*\{user\.isRestricted \|\| !user\.canUpload \? \'Unrestrict User\' : \'Restrict User\'\}',
    r'<AlertCircle size={14} />\n                                                    <span className="hidden sm:inline">{user.isRestricted || !user.canUpload ? \'Unrestrict\' : \'Restrict\'}</span>',
    content
)
# Update Restrict button className
content = re.sub(
    r'className=\{`px-4 py-2\.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 \$\{user\.isRestricted \|\| !user\.canUpload',
    r'className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${user.isRestricted || !user.canUpload',
    content
)

# Fix Trust button and ADD delete button after it
trust_button_pattern = r'(<button\s+onClick=\{\(\) => onAction\(user\._id, user\.isTrusted \? \'untrust\' : \'trust\'\)\}\s+disabled=\{isProcessing\}\s+className=\{`px-4 py-2\.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:col-span-2 \$\{user\.isTrusted[^}]+\}`\}\s*>\s*)<Shield size=\{16\} />\s*\{user\.isTrusted \? \'Remove Trusted Status\' : \'Mark as Trusted User\'\}\s*</button>'

replacement = r'''<button
                                                    onClick={() => onAction(user._id, user.isTrusted ? 'untrust' : 'trust')}
                                                    disabled={isProcessing}
                                                    className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${user.isTrusted
                                                        ? 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                                                        : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                                                        }`}
                                                >
                                                    <Shield size={14} />
                                                    <span className="hidden sm:inline">{user.isTrusted ? 'Untrust' : 'Trust'}</span>
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => onAction(user._id, 'delete')}
                                                    disabled={isProcessing}
                                                    className="px-2 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                                                >
                                                    <Trash2 size={14} />
                                                    <span className="hidden sm:inline">Delete</span>
                                                </button>'''

content = re.sub(trust_button_pattern, replacement, content, flags=re.DOTALL)

# Fix Processing indicator
content = re.sub(
    r'<div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 py-2">\s*<Loader2 size=\{16\} className="animate-spin" />',
    r'<div className="flex items-center justify-center gap-2 text-xs text-blue-600 dark:text-blue-400 py-1">\n                                        <Loader2 size={14} className="animate-spin" />',
    content
)

with open(r'c:\Users\abhig\.gemini\antigravity\scratch\uninotes-react\src\components\AdminPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('All button fixes and delete button added!')
