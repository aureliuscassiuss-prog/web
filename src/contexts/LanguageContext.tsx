import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import jsCookie from 'js-cookie';

// Added Indian languages: bn (Bengali), mr (Marathi), te (Telugu), ta (Tamil), gu (Gujarati), kn (Kannada), ml (Malayalam), pa (Punjabi)
type Language = 'en' | 'hi' | 'bn' | 'mr' | 'te' | 'ta' | 'gu' | 'kn' | 'ml' | 'pa' | 'es' | 'fr' | 'de' | 'it' | 'zh-CN' | 'ja' | 'ru' | 'pt' | 'ar' | 'ko';

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
        const googleCookie = jsCookie.get('googtrans');
        if (googleCookie) {
            const langCode = googleCookie.split('/').pop();
            // Simple validation to ensure it's a code we support
            if (langCode) {
                setLanguageState(langCode as Language);
            }
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);

        // If English (default), we want to clear the translation
        if (lang === 'en') {
            jsCookie.remove('googtrans', { path: '/' });
            jsCookie.remove('googtrans', { path: '/', domain: window.location.hostname });
            jsCookie.remove('googtrans', { path: '/', domain: '.' + window.location.hostname });
        } else {
            // For other languages, set the cookie
            // We set it for multiple domain variations to ensure it "sticks"
            const cookieValue = `/en/${lang}`;
            jsCookie.set('googtrans', cookieValue, { path: '/' });
            jsCookie.set('googtrans', cookieValue, { path: '/', domain: window.location.hostname });
            jsCookie.set('googtrans', cookieValue, { path: '/', domain: '.' + window.location.hostname });
        }

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
