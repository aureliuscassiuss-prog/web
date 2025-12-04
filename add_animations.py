import re

with open(r'c:\Users\abhig\.gemini\antigravity\scratch\uninotes-react\src\components\AdminPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the tab container to add relative positioning for the indicator
old_tab_container = r'<div className="flex gap-1 p-1 bg-gray-200/50 dark:bg-white/5 rounded-xl justify-around sm:justify-start sm:w-auto">'
new_tab_container = '<div className="relative flex gap-1 p-1 bg-gray-200/50 dark:bg-white/5 rounded-xl justify-around sm:justify-start sm:w-auto">'
content = content.replace(old_tab_container, new_tab_container)

# 2. Add animated indicator after the tabs (before closing div on line 281)
# Find the closing div of the tab container
tab_section = r'(</TabButton>\s*</div>)\s*(</div>)'
# Add the indicator
indicator_code = r'''\1
                        
                        {/* Animated Tab Indicator */}
                        <motion.div
                            className="absolute bottom-1 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                            initial={false}
                            animate={{
                                left: activeTab === 'pending' ? '0.25rem' : activeTab === 'users' ? '33.33%' : '66.66%',
                                width: activeTab === 'pending' ? 'calc(33.33% - 0.5rem)' : activeTab === 'users' ? 'calc(33.33% - 0.5rem)' : 'calc(33.33% - 0.25rem)'
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                    \2'''
content = re.sub(tab_section, indicator_code, content, count=1)

# 3. Wrap each view with motion.div for slide animations
# Replace PendingView
content = re.sub(
    r'\{activeTab === \'pending\' && <PendingView',
    r'{activeTab === \'pending\' && <motion.div key="pending" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}><PendingView',
    content
)
content = re.sub(
    r'<PendingView resources=\{pendingResources\} processingId=\{processingId\} onAction=\{handleResourceAction\} />\}',
    r'<PendingView resources={pendingResources} processingId={processingId} onAction={handleResourceAction} /></motion.div>}',
    content
)

# Replace UsersView
content = re.sub(
    r'\{activeTab === \'users\' && <UsersView',
    r'{activeTab === \'users\' && <motion.div key="users" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}><UsersView',
    content
)
content = re.sub(
    r'<UsersView users=\{users\} processingId=\{processingId\} onAction=\{handleUserAction\} />\}',
    r'<UsersView users={users} processingId={processingId} onAction={handleUserAction} /></motion.div>}',
    content
)

# Replace structure view
content = re.sub(
    r'\{activeTab === \'structure\' && \(',
    r'{activeTab === \'structure\' && <motion.div key="structure" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>(',
    content
)

# Find the closing of structure section - it's a big block, so find the matching closing
# The structure ends before the next tab check, so we need to add </motion.div> before the closing of the structure conditional
content = re.sub(
    r'(\s*</div>\s*)\)\}(\s*</>\s*\)\}\s*</div>)',
    r'\1)</motion.div>}\2',
    content,
    count=1
)

with open(r'c:\Users\abhig\.gemini\antigravity\scratch\uninotes-react\src\components\AdminPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Added smooth sliding animations and animated tab indicator!')
