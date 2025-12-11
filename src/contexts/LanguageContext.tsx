import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import jsCookie from 'js-cookie';

type Language = 'en' | 'hi' | 'es' | 'fr';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        // Read Google Translate cookie
        // Cookie format: /en/hi 
        const googleCookie = jsCookie.get('googtrans');
        if (googleCookie) {
            const langCode = googleCookie.split('/').pop();
            if (langCode && ['en', 'hi', 'es', 'fr'].includes(langCode)) {
                setLanguageState(langCode as Language);
            }
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        // Set Google Translate cookie
        // Domain might be needed depending on environment, but usually root path works
        jsCookie.set('googtrans', `/en/${lang}`, { path: '/' }); // For Google Translate
        jsCookie.set('googtrans', `/en/${lang}`, { path: '/', domain: window.location.hostname }); // Extra redundancy

        // Force reload to apply Google Translate
        window.location.reload();
    };

    // Legacy support for t() calls - now they just return the default English text
    // Google Translate will handle the DOM text replacement
    const t = (key: string) => {
        const defaults: Record<string, string> = {
            'footer.about': 'About',
            'footer.team': 'Team',
            'footer.contact': 'Contact',
            'footer.docs': 'Docs',
            'footer.privacy': 'Privacy',
            'footer.terms': 'Terms',
            'footer.rights': 'Extrovert',
            'footer.love': 'for students',
            'nav.login': 'Log In',
            'nav.signup': 'Sign Up',
            'nav.resources': 'Resources',
            'nav.community': 'Community',
        };
        return defaults[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
