import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// -----------------------------------------------------------------------------
// EN (English)
// -----------------------------------------------------------------------------
const en = {
  translation: {
    home: {
      nav: {
        showcase: "Artistic Showcase",
        soundscapes: "Soundscapes",
        capabilities: "Capabilities",
        pricing: "Pricing",
        trending: "Trending",
        launchStudio: "Launch Studio"
      },
      hero: {
        badge: "Live SaaS Production Ready at Story.Menu",
        title1: "What universe are you ",
        title2: "Craving Today?",
        subtitle: "Welcome to Story.Menu—the ultimate interactive AI creator suite where epic multi-agent narrative arcs, locked character DNA, and real-time synth soundtracks are served on-demand.",
        unlockCloud: "Unlock Cloud Studio Sync",
        trySandbox: "Try sandbox offline"
      }
    },
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
    home: {
      nav: {
        showcase: "Galería Artística",
        soundscapes: "Paisajes Sonoros",
        capabilities: "Capacidades",
        pricing: "Precios",
        trending: "Tendencias",
        launchStudio: "Iniciar Estudio"
      },
      hero: {
        badge: "SaaS en Vivo Listo para Producción en Story.Menu",
        title1: "¿Qué universo estás ",
        title2: "anhelando hoy?",
        subtitle: "Bienvenido a Story.Menu—la suite creadora interactiva de IA definitiva donde arcos narrativos épicos multi-agente, ADN de personajes bloqueados y bandas sonoras sintéticas en tiempo real se sirven a pedido.",
        unlockCloud: "Desbloquear Sincronización en la Nube",
        trySandbox: "Probar el sandbox sin conexión"
      }
    },
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
    home: {
      nav: {
        showcase: "アートショーケース",
        soundscapes: "サウンドスケープ",
        capabilities: "機能",
        pricing: "料金",
        trending: "トレンド",
        launchStudio: "スタジオを起動"
      },
      hero: {
        badge: "Story.Menu での本番環境 SaaS",
        title1: "今日はどんな宇宙を",
        title2: "お探しですか？",
        subtitle: "Story.Menuへようこそ。エピックなマルチエージェントの物語、固定されたキャラクターのDNA、そしてリアルタイムのシンセサウンドトラックがオンデマンドで提供される、究極のインタラクティブなAIクリエイタースイートです。",
        unlockCloud: "クラウドスタジオ同期を解除",
        trySandbox: "オフラインでサンドボックスを試す"
      }
    },
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
