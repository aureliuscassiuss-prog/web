import re

with open(r'c:\Users\abhig\.gemini\antigravity\scratch\uninotes-react\src\components\AdminPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and add delete button
delete_button = """
                                                {/* Delete */}
                                                <button
                                                    onClick={() => onAction(user._id, 'delete')}
                                                    disabled={isProcessing}
                                                    className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:col-span-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                                                >
                                                    <Trash2 size={16} />
                                                    Delete User
                                                </button>"""

# Insert after Trust button
pattern = r"(\{user\.isTrusted \? 'Remove Trusted Status' : 'Mark as Trusted User'\}\s*</button>)"
if re.search(pattern, content):
    content = re.sub(pattern, r'\1' + delete_button, content)
    print('Delete button added!')
else:
    print('Pattern not found')

with open(r'c:\Users\abhig\.gemini\antigravity\scratch\uninotes-react\src\components\AdminPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
