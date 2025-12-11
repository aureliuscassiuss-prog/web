import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export function useAutoTranslation() {
    const { language, translateText } = useLanguage();

    useEffect(() => {
        if (language === 'en') return;

        const translateNode = async (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim()) {
                const originalText = node.nodeValue.trim();
                // Skip if already translated (heuristic: we might need a better way, but simple cache check in translateText handles this)
                // Also skip numbers or symbols
                if (!/[a-zA-Z]/.test(originalText)) return;

                // Check if parent is Script or Style
                const parent = node.parentElement;
                if (!parent || ['SCRIPT', 'STYLE', 'CODE', 'NOSCRIPT'].includes(parent.tagName)) return;

                // Do not translate inputs
                if (['INPUT', 'TEXTAREA'].includes(parent.tagName)) return;

                // Respect 'notranslate' class (standard convention)
                if (parent.closest('.notranslate')) return;

                try {
                    const translated = await translateText(originalText);
                    if (translated && translated !== originalText) {
                        node.nodeValue = node.nodeValue.replace(originalText, translated);
                    }
                } catch (e) {
                    // Fail silently
                }
            }
        };

        const walk = (node: Node) => {
            translateNode(node);
            node.childNodes.forEach(walk);
        };

        // Initial translation
        walk(document.body);

        // Watch for changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(walk);
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, [language, translateText]);
}
