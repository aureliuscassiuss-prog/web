import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import jsCookie from 'js-cookie';

// Extended Language Support
type Language = 'en' | 'hi' | 'bn' | 'mr' | 'te' | 'ta' | 'gu' | 'kn' | 'ml' | 'pa' | 'es' | 'fr' | 'de' | 'it' | 'zh-CN' | 'ja' | 'ru' | 'pt' | 'ar' | 'ko';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, defaultText?: string) => string;
    translateText: (text: string) => Promise<string>;
    isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 1. Manual Dictionary (Professional, Instant, Zero Glitch)
const translations: Partial<Record<Language, Record<string, string>>> = {
    en: {
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
    },
    hi: {
        'footer.about': 'बारे में',
        'footer.team': 'टीम',
        'footer.contact': 'संपर्क',
        'footer.docs': 'दस्तावेज़',
        'footer.privacy': 'गोपनीयता',
        'footer.terms': 'शर्तें',
        'footer.rights': 'एक्स्ट्रावर्ट',
        'footer.love': 'छात्रों के लिए',
        'nav.login': 'लॉग इन',
        'nav.signup': 'साइन अप',
        'nav.resources': 'संसाधन',
        'nav.community': 'समुदाय',
    },
    // Add other manual translations here...
};

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');
    const [dynamicCache, setDynamicCache] = useState<Record<string, string>>({});
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        const savedLang = jsCookie.get('app_language') as Language;
        if (savedLang) setLanguageState(savedLang);
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        jsCookie.set('app_language', lang, { expires: 365 });
        // We do NOT clear cache here, to avoid re-fetching if user switches back
    };

    // 2. Dynamic Translation API (The "Clean" Google Approach)
    const translateText = async (text: string): Promise<string> => {
        // If English, return original
        if (language === 'en') return text;

        const cacheKey = `${language}:${text}`;

        if (dynamicCache[cacheKey]) return dynamicCache[cacheKey];

        try {
            // Simple debounce/queue could go here if needed, but for now direct fetch
            // We set isTranslating only for initial large batches if we wanted, 
            // but for individual calls it might cause flicker if we used a global spinner.
            // Let's keep it false for background updates.
            // setIsTranslating(true); 

            const response = await fetch('/api/ai?action=translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, targetLang: language })
            });
            const data = await response.json();

            if (data.translatedText) {
                setDynamicCache(prev => ({ ...prev, [cacheKey]: data.translatedText }));
                return data.translatedText;
            }
        } catch (error) {
            console.error("Translation failed", error);
        } finally {
            // setIsTranslating(false);
        }
        return text;
    };

    const t = (key: string, defaultText: string = '') => {
        // Always try to find the translation in the current language
        const translated = translations[language]?.[key];
        if (translated) return translated;

        // If not found, and we have a default text, return it
        if (defaultText) return defaultText;

        // Fallback to English dictionary if available
        const englishFallback = translations['en']?.[key];
        if (englishFallback) return englishFallback;

        // Last resort: return key
        return key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, translateText, isTranslating }}>
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
