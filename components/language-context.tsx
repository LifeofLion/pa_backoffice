'use client';

import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from 'react';

export type Language = string;

interface LanguageContextType {
	language: Language;
	setLanguage: (lang: Language) => void;
	t: (key: string) => string;
	isLoading: boolean;
	availableLocales: Language[];
	addLocale: (lang: Language) => Promise<void>;
	removeLocale: (lang: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType>({
	language: 'EN',
	setLanguage: async () => {},
	t: (k) => k,
	isLoading: true,
	availableLocales: [],
	addLocale: async () => {},
	removeLocale: async () => {},
});

export function useLanguage() {
	return useContext(LanguageContext);
}

const STORAGE_KEY = 'ecodeli-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
	const [language, setLanguageState] = useState<Language>(() => {
		if (typeof window === 'undefined') return 'EN';
		return localStorage.getItem(STORAGE_KEY) || 'EN';
	});
	const [translations, setTranslations] = useState<Record<string, any>>({});
	const [isLoading, setIsLoading] = useState(true);
	const [availableLocales, setAvailableLocales] = useState<Language[]>([]);

	const BACKEND_URL =
		process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

	const refreshLocales = async () => {
		try {
			// Use static locale files from locales directory
			setAvailableLocales(['en', 'fr', 'es']); // Available locales
		} catch (e) {
			console.error('Cannot load locales:', e);
		}
	};

	useEffect(() => {
		refreshLocales();
	}, []);

	useEffect(() => {
		const load = async () => {
			setIsLoading(true);
			try {
				// Load from local JSON files
				const r = await fetch(
					`/locales/${language.toLowerCase()}.json`,
					{
						cache: 'no-store',
					}
				);
				if (r.ok) setTranslations(await r.json());
				else setTranslations({});
			} catch {
				setTranslations({});
			} finally {
				setIsLoading(false);
			}
		};
		load();
	}, [language, BACKEND_URL]);

	const setLanguage = (loc: Language) => {
		setLanguageState(loc);
		if (typeof window !== 'undefined')
			localStorage.setItem(STORAGE_KEY, loc);
	};

	const addLocale = async (loc: Language) => {
		try {
			const code = loc.toLowerCase();
			// For local files, just add to available locales if not already present
			if (!availableLocales.includes(code)) {
				setAvailableLocales([...availableLocales, code]);
				setLanguage(code);
			}
		} catch (err) {
			console.error('addLocale failed', err);
		}
	};

	const removeLocale = async (loc: Language) => {
		try {
			// For local files, just remove from available locales
			const newLocales = availableLocales.filter(
				(l) => l !== loc.toLowerCase()
			);
			setAvailableLocales(newLocales);
			// Si la locale supprimée était la locale active, passer à la première disponible
			if (loc.toLowerCase() === language.toLowerCase()) {
				if (newLocales.length > 0) {
					setLanguage(newLocales[0]);
				}
			}
		} catch (err) {
			console.error('removeLocale failed', err);
		}
	};

	const t = (key: string) => {
		if (isLoading) return key;
		return (
			key
				.split('.')
				.reduce(
					(acc: any, part) => (acc && acc[part] ? acc[part] : null),
					translations
				) ?? key
		);
	};

	return (
		<LanguageContext.Provider
			value={{
				language,
				setLanguage,
				t,
				isLoading,
				availableLocales,
				addLocale,
				removeLocale,
			}}
		>
			{children}
		</LanguageContext.Provider>
	);
}
