import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: { translation: { home: "Home", post: "Post", profile: "Profile", whatsHappening: "What's happening?", following: "Following", forYou: "For you" }},
  es: { translation: { home: "Inicio", post: "Publicar", profile: "Perfil", whatsHappening: "¿Qué está pasando?", following: "Siguiendo", forYou: "Para ti" }},
  hi: { translation: { home: "होम", post: "पोस्ट", profile: "प्रोफ़ाइल", whatsHappening: "क्या हो रहा है?", following: "फ़ॉलो किए", forYou: "आपके लिए" }},
  pt: { translation: { home: "Início", post: "Publicar", profile: "Perfil", whatsHappening: "O que está acontecendo?", following: "Seguindo", forYou: "Para você" }},
  zh: { translation: { home: "首页", post: "发布", profile: "个人资料", whatsHappening: "有什么新鲜事？", following: "正在关注", forYou: "为你推荐" }},
  fr: { translation: { home: "Accueil", post: "Publier", profile: "Profil", whatsHappening: "Quoi de neuf ?", following: "Abonnements", forYou: "Pour vous" }},
};

i18n.use(initReactI18next).init({
  resources, lng: "en", fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;