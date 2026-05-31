/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'tr';

type LanguageProviderProps = {
  children: React.ReactNode;
  defaultLanguage?: Language;
  storageKey?: string;
};

type LanguageProviderState = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
};

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Page Header
    "Welcome back": "Welcome back",
    "Welcome back, {name}": "Welcome back, {name}",
    "Here's your Daily Dashboard Overview.": "Here's your Daily Dashboard Overview.",
    
    // Sidebar Groups
    "Main": "Main",
    "Game": "Game",
    "Drivers": "Drivers",
    "Human Resources Department": "Human Resources Department",
    "Event Department": "Event Department",
    "Admin": "Admin",

    // Sidebar items
    "Dashboard": "Dashboard",
    "Banner": "Banner",
    "Members": "Members",
    "Download": "Download",
    "Map": "Map",
    "Jobs": "Jobs",
    "Events": "Events",
    "Ranking": "Ranking",
    "FAQ": "FAQ",
    "LOA Requests": "LOA Requests",
    "LOA Management": "LOA Management",
    "Attendance Logs": "Attendance Logs",
    "Blacklist Driver": "Blacklist Driver",
    "Driver Manage": "Driver Manage",
    "Left Drivers": "Left Drivers",
    "HR Applications": "HR Applications",
    "Event Calendar Manage": "Event Calendar Manage",
    "Event invites": "Event invites",
    "Blacklist VTC's": "Blacklist VTC's",
    "All members": "All members",
    "Blacklist Staff/Management": "Blacklist Staff/Management",
    "History": "History",
    "Support": "Support",
    "Settings": "Settings",
    "Account settings": "Account settings",
    "Sign out": "Sign out",

    // Stat Cards
    "Drivers Number": "Drivers Number",
    "Total VTC Members": "Total VTC Members",
    "Total Jobs": "Total Jobs",
    "All-time completed deliveries": "All-time completed deliveries",
    "Total Distance": "Total Distance",
    "Distance on completed jobs": "Distance on completed jobs",
    "Events This Month": "Events This Month",
    "VTC Events Attending": "VTC Events Attending",

    // Job Statistics Card
    "Job Statistics": "Job Statistics",
    "Performance overview of distance and deliveries.": "Performance overview of distance and deliveries.",
    "View performance": "View performance",

    // Upcoming Convoy Card
    "No upcoming convoys": "No upcoming convoys",
    "View info": "View info",
    "To be determined": "To be determined",
    "Euro Truck Simulator 2": "Euro Truck Simulator 2",
    "American Truck Simulator": "American Truck Simulator",

    // Dashboard Table
    "Detail informations of jobs": "Detail informations of jobs",
    "Latest deliveries logged in Trucky.": "Latest deliveries logged in Trucky.",
    "Driver": "Driver",
    "Route": "Route",
    "Cargo": "Cargo",
    "Distance": "Distance",
    "No recent jobs found.": "No recent jobs found.",
    "Showing": "Showing",
    "to": "to",
    "of": "of",
    "entries": "entries",
    "Previous": "Previous",
    "Next": "Next",
    "Showing {start} to {end} of {total} entries": "Showing {start} to {end} of {total} entries",
  },
  tr: {
    // Page Header
    "Welcome back": "Tekrar hoş geldin",
    "Welcome back, {name}": "Tekrar hoş geldin, {name}",
    "Here's your Daily Dashboard Overview.": "İşte Günlük Kontrol Paneli Özetiniz.",
    
    // Sidebar Groups
    "Main": "Ana Sayfa",
    "Game": "Oyun",
    "Drivers": "Sürücüler",
    "Human Resources Department": "İnsan Kaynakları Departmanı",
    "Event Department": "Etkinlik Departmanı",
    "Admin": "Yönetici",

    // Sidebar items
    "Dashboard": "Kontrol Paneli",
    "Banner": "Afiş",
    "Members": "Üyeler",
    "Download": "İndir",
    "Map": "Harita",
    "Jobs": "İşler",
    "Events": "Etkinlikler",
    "Ranking": "Sıralama",
    "FAQ": "SSS",
    "LOA Requests": "İzin İstekleri",
    "LOA Management": "İzin Yönetimi",
    "Attendance Logs": "Katılım Kayıtları",
    "Blacklist Driver": "Kara Listedeki Sürücüler",
    "Driver Manage": "Sürücü Yönetimi",
    "Left Drivers": "Ayrılan Sürücüler",
    "HR Applications": "İK Başvuruları",
    "Event Calendar Manage": "Etkinlik Takvimi Yönetimi",
    "Event invites": "Etkinlik Davetleri",
    "Blacklist VTC's": "Kara Listedeki VTC'ler",
    "All members": "Tüm Üyeler",
    "Blacklist Staff/Management": "Kara Listedeki Yetkililer",
    "History": "Geçmiş",
    "Support": "Destek",
    "Settings": "Ayarlar",
    "Account settings": "Hesap Ayarları",
    "Sign out": "Oturumu Kapat",

    // Stat Cards
    "Drivers Number": "Sürücü Sayısı",
    "Total VTC Members": "Toplam VTC Üyesi",
    "Total Jobs": "Toplam İş",
    "All-time completed deliveries": "Tüm zamanların tamamlanan teslimatları",
    "Total Distance": "Toplam Mesafe",
    "Distance on completed jobs": "Tamamlanan işlerdeki mesafe",
    "Events This Month": "Bu Ayki Etkinlikler",
    "VTC Events Attending": "Katılınan VTC Etkinlikleri",

    // Job Statistics Card
    "Job Statistics": "İş İstatistikleri",
    "Performance overview of distance and deliveries.": "Mesafe ve teslimatların performans genel bakışı.",
    "View performance": "Performansı görüntüle",

    // Upcoming Convoy Card
    "No upcoming convoys": "Yaklaşan konvoy yok",
    "View info": "Bilgiyi görüntüle",
    "To be determined": "Belirlenecek",
    "Euro Truck Simulator 2": "Euro Truck Simulator 2",
    "American Truck Simulator": "American Truck Simulator",

    // Dashboard Table
    "Detail informations of jobs": "İşlerin detaylı bilgileri",
    "Latest deliveries logged in Trucky.": "Trucky'de kaydedilen son teslimatlar.",
    "Driver": "Sürücü",
    "Route": "Rota",
    "Cargo": "Kargo",
    "Distance": "Mesafe",
    "No recent jobs found.": "Son bulunan iş yok.",
    "Showing": "Gösteriliyor",
    "to": "ile",
    "of": "toplam",
    "entries": "giriş arasından",
    "Previous": "Önceki",
    "Next": "Sonraki",
    "Showing {start} to {end} of {total} entries": "{total} giriş arasından {start} ile {end} arası gösteriliyor",
  }
};

const LanguageContext = createContext<LanguageProviderState | undefined>(undefined);

export function LanguageProvider({
  children,
  defaultLanguage = 'en',
  storageKey = 'ethub-language',
}: LanguageProviderProps) {
  const [language, setLangState] = useState<Language>(
    () => (localStorage.getItem(storageKey) as Language) || defaultLanguage
  );

  const setLanguage = (lang: Language) => {
    localStorage.setItem(storageKey, lang);
    setLangState(lang);
  };

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    const langDict = translations[language] || translations.en;
    let translation = langDict[key] || key;

    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        translation = translation.replace(`{${placeholder}}`, String(value));
      });
    }

    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
