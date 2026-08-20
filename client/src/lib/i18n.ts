import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      nav: {
        home: "Home",
        articles: "Articles",
        engine: "3D",
        about: "About",
        contact: "Contact",
        admin: "Admin",
      },
    },
  },
  de: {
    translation: {
      nav: {
        home: "Startseite",
        articles: "Artikel",
        engine: "3D",
        about: "Über",
        contact: "Kontakt",
        admin: "Admin",
      },
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
