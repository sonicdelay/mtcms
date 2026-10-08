import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      nav: {
        beWelcome: "Welcome",
        home: "Home",
        articles: "Articles",
        engine: "Engine",
        about: "About",
        contact: "Contact",
        admin: "Admin",
      },
      homePageDescription: "Home of mtCMS.",
    },
  },
  de: {
    translation: {
      nav: {
        beWelcome: "Willkommen",
        home: "Startseite",
        articles: "Artikel",
        engine: "Engine",
        about: "Über",
        contact: "Kontakt",
        admin: "Admin",
      },
      homePageDescription: "Heimat von mtCMS.",
    },
  },
};

void i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
