import type { PublicLocale } from "@/config/site";

export const dictionaries = {
  fr: {
    nav: { home: "Accueil", features: "Fonctionnalités", solutions: "Solutions", ergo: "Analyse ergomètre", boat: "Analyse bateau", resources: "Ressources", blog: "Blog", pricing: "Tarifs", login: "Connexion", start: "Commencer" },
    common: { discover: "Découvrir la plateforme", startAnalysis: "Commencer une analyse", learnMore: "En savoir plus", contact: "Demander une démonstration", search: "Rechercher", noResults: "Aucun résultat public trouvé.", install: "Installer RowMotion AI" },
    footer: { product: "Produit", solutions: "Solutions", resources: "Ressources", company: "Entreprise", legal: "Légal", languages: "Langues" },
  },
  en: {
    nav: { home: "Home", features: "Features", solutions: "Solutions", ergo: "Ergometer analysis", boat: "Boat analysis", resources: "Resources", blog: "Blog", pricing: "Pricing", login: "Sign in", start: "Get started" },
    common: { discover: "Discover the platform", startAnalysis: "Start an analysis", learnMore: "Learn more", contact: "Request a demo", search: "Search", noResults: "No public result found.", install: "Install RowMotion AI" },
    footer: { product: "Product", solutions: "Solutions", resources: "Resources", company: "Company", legal: "Legal", languages: "Languages" },
  },
  ar: {
    nav: { home: "الرئيسية", features: "الميزات", solutions: "الحلول", ergo: "تحليل جهاز التجديف", boat: "تحليل القارب", resources: "الموارد", blog: "المدونة", pricing: "الأسعار", login: "تسجيل الدخول", start: "ابدأ الآن" },
    common: { discover: "اكتشف المنصة", startAnalysis: "ابدأ التحليل", learnMore: "اعرف المزيد", contact: "اطلب عرضاً توضيحياً", search: "بحث", noResults: "لم يتم العثور على نتائج عامة.", install: "ثبّت RowMotion AI" },
    footer: { product: "المنتج", solutions: "الحلول", resources: "الموارد", company: "الشركة", legal: "قانوني", languages: "اللغات" },
  },
} as const;
export function getDictionary(locale: PublicLocale) { return dictionaries[locale]; }
