import re

with open(r'c:\Users\abhig\.gemini\antigravity\scratch\uninotes-react\src\components\AdminPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix collapsed card avatar (around line 427-428)
content = re.sub(
    r'(\{/\* Avatar \*/\}\s*<div className="h-9 w-9 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">\s*)<NeutralAvatar className="h-full w-full" />(\s*</div>)',
    r'\1{resource.uploaderAvatar ? (\n                                    <img src={resource.uploaderAvatar} alt={resource.uploaderName} className="h-full w-full object-cover" />\n                                ) : (\n                                    <NeutralAvatar className="h-full w-full" />\n                                )}\2',
    content,
    count=1
)

# Fix expanded card avatar (in the "Uploaded By" section, around line 472-473)
content = re.sub(
    r'(<div className="h-8 w-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">\s*)<NeutralAvatar className="h-full w-full" />(\s*</div>\s*<div>)',
    r'\1{resource.uploaderAvatar ? (\n                                                <img src={resource.uploaderAvatar} alt={resource.uploaderName} className="h-full w-full object-cover" />\n                                            ) : (\n                                                <NeutralAvatar className="h-full w-full" />\n                                            )}\2',
    content
)

with open(r'c:\Users\abhig\.gemini\antigravity\scratch\uninotes-react\src\components\AdminPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated avatars to use uploaderAvatar when available!')
