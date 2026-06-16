import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// -----------------------------------------------------------------------------
// EN (English)
// -----------------------------------------------------------------------------
const en = {
  translation: {
    setup: {
      buttons: {
        launchEditorial: "🖋️ LAUNCH STORY ENVIRONMENTS",
        launchComic: "🔥 START ADVENTURE !",
        compiling: "COMPILING COGNITIVE BLUEPRINT...",
        crafting: "CRAFTING DIVERSE REALITY...",
        reqEditorial: "⚠️ HERO CAST REQUIRED TO BEGIN",
        reqComic: "⚠️ AWAITING HERO INITIATION..."
      }
    }
  }
};

// -----------------------------------------------------------------------------
// ES (Spanish)
// -----------------------------------------------------------------------------
const es = {
  translation: {
    setup: {
      buttons: {
        launchEditorial: "🖋️ INICIAR ENTORNOS DE HISTORIA",
        launchComic: "🔥 ¡COMENZAR AVENTURA!",
        compiling: "COMPILANDO PLANO COGNITIVO...",
        crafting: "CREANDO REALIDAD DIVERSA...",
        reqEditorial: "⚠️ SE REQUIERE ELENCO PARA COMENZAR",
        reqComic: "⚠️ ESPERANDO INICIACIÓN DEL HÉROE..."
      }
    }
  }
};

// -----------------------------------------------------------------------------
// JA (Japanese)
// -----------------------------------------------------------------------------
const ja = {
  translation: {
    setup: {
      buttons: {
        launchEditorial: "🖋️ ストーリー環境を起動",
        launchComic: "🔥 冒険を始める！",
        compiling: "認知ブループリントをコンパイル中...",
        crafting: "多様な現実を構築中...",
        reqEditorial: "⚠️ 開始するにはキャストが必要です",
        reqComic: "⚠️ ヒーローの開始を待っています..."
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en,
      es,
      ja
    },
    lng: "en", // Default language, overridden by App.tsx URL logic
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;
