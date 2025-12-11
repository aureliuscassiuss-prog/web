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
        // Clear cache on language switch to avoid staleness? 
        // Or keep it. Let's keep it but simple.
        setDynamicCache({});
    };

    // 2. Dynamic Translation API (The "Clean" Google Approach)
    const translateText = async (text: string): Promise<string> => {
        if (language === 'en') return text;
        const cacheKey = `${language}:${text}`;

        if (dynamicCache[cacheKey]) return dynamicCache[cacheKey];

        try {
            setIsTranslating(true);
            const response = await fetch('/api/translate', {
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
            setIsTranslating(false);
        }
        return text;
    };

    const t = (key: string, defaultText: string = '') => {
        if (language === 'en') return defaultText || key;

        // Check Manual Dictionary first
        const manual = translations[language]?.[key];
        if (manual) return manual;

        // If no manual, return default for now 
        // (Dynamic usage needs async handling in components)
        return defaultText || key;
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
