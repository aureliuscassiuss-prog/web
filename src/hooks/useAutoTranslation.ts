import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// We use a global WeakMap to store the ORIGINAL (English) text of every node we touch.
// This survives unmounts/remounts of the component, ensuring we never lose the source logic.
const originalTextMap = new WeakMap<Node, string>();

export function useAutoTranslation() {
    const { language, translateText } = useLanguage();

    useEffect(() => {
        // Function to process a single node
        const processNode = async (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim()) {
                const currentText = node.nodeValue;

                // 1. Capture Original Text (if not already captured)
                if (!originalTextMap.has(node)) {
                    // We assume the initial text encountered is the "Source" (English)
                    // This creates a potential race condition if the page loads in Hindi, 
                    // but since default state is 'en', it should be fine.
                    // Ideally, we'd mark the DOM server-side, but this is client-side React.
                    originalTextMap.set(node, currentText);
                }

                const original = originalTextMap.get(node)!;

                // 2. Filtering
                // Skip non-translatable text (numbers, symbols only)
                if (!/[a-zA-Z]/.test(original)) return;

                // Check parent constraints
                const parent = node.parentElement;
                if (!parent) return;

                // Skip Scripts, Styles, Inputs
                if (['SCRIPT', 'STYLE', 'CODE', 'NOSCRIPT', 'INPUT', 'TEXTAREA'].includes(parent.tagName)) return;

                // Respect 'notranslate' class
                if (parent.closest('.notranslate')) return;

                // 3. Action based on Language
                if (language === 'en') {
                    // Restore Original
                    if (node.nodeValue !== original) {
                        node.nodeValue = original;
                    }
                } else {
                    // Translate Original -> Target
                    try {
                        const translated = await translateText(original);
                        if (translated && node.nodeValue !== translated) {
                            node.nodeValue = translated;
                        }
                    } catch (e) {
                        // Keep original on error
                    }
                }
            }
        };

        const walk = (node: Node) => {
            processNode(node);
            node.childNodes.forEach(walk);
        };

        // Initial Pass
        walk(document.body);

        // Observer for dynamic content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(walk);
                // We also might want to watch for characterData changes, but that triggers infinite loops
                // if we update it ourselves. So we stick to addedNodes and manual re-walks.
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, [language, translateText]);
}
