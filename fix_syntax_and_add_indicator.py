import re

file_path = r'c:\Users\abhig\.gemini\antigravity\scratch\uninotes-react\src\components\AdminPanel.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix syntax errors (remove backslashes before single quotes)
content = content.replace("\\'", "'")

# 2. Add the animated indicator if it's missing
# Look for the tab container
tab_container_start = '<div className="relative flex gap-1 p-1 bg-gray-200/50 dark:bg-white/5 rounded-xl justify-around sm:justify-start sm:w-auto">'

if tab_container_start in content and 'layoutId="active-tab"' not in content:
    # We need to insert the indicator code inside this div
    indicator_code = '''
                        {/* Animated Tab Indicator */}
                        {activeTab === 'pending' && (
                            <motion.div
                                layoutId="active-tab"
                                className="absolute bottom-1 left-1 top-1 rounded-lg bg-white dark:bg-gray-800 shadow-sm z-0"
                                style={{ width: 'calc(33.33% - 0.5rem)' }}
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        {activeTab === 'users' && (
                            <motion.div
                                layoutId="active-tab"
                                className="absolute bottom-1 top-1 rounded-lg bg-white dark:bg-gray-800 shadow-sm z-0"
                                style={{ left: '33.33%', width: 'calc(33.33% - 0.5rem)' }}
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        {activeTab === 'structure' && (
                            <motion.div
                                layoutId="active-tab"
                                className="absolute bottom-1 right-1 top-1 rounded-lg bg-white dark:bg-gray-800 shadow-sm z-0"
                                style={{ width: 'calc(33.33% - 0.5rem)' }}
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <div className="relative z-10 flex w-full sm:w-auto justify-around sm:justify-start gap-1">'''
    
    # Replace the start of the container to include the indicator and wrap buttons
    content = content.replace(
        tab_container_start,
        tab_container_start + indicator_code
    )
    
    # We also need to close the extra div we added around the buttons
    # Find the closing div of the original container
    # The original structure was: <div container> <TabButton/>... </div>
    # Now it is: <div container> <indicator/> <div wrapper> <TabButton/>... </div> </div>
    # So we need to add a closing </div> before the final closing </div>
    
    # Find the last TabButton
    last_tab_button = '<TabButton active={activeTab === \'structure\'} onClick={() => setActiveTab(\'structure\')} icon={<Settings size={16} />} label="Structure" />'
    content = content.replace(
        last_tab_button,
        last_tab_button + '\n                        </div>'
    )

# 3. Fix the structure view conditional opening parenthesis
# It was: ... transition={{ duration: 0.3 }}>(
# Should be: ... transition={{ duration: 0.3 }}>
content = content.replace('transition={{ duration: 0.3 }}>(', 'transition={{ duration: 0.3 }}>')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed syntax errors and added animated indicator!')
