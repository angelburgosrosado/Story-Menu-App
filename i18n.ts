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
      },
      stats: {
        comics: "Comics Made",
        vaults: "Casting Vaults",
        cohesion: "Cohesion",
        speech: "Synth Speech"
      },
      sandbox: {
        title: "🎮 Prompt Sandbox Arena",
        desc: "The <1>Prompt Sandbox</1> allows you to prototype universe layouts and story nodes. Input a custom premise or pick a preset below, then synthesize your design.",
        placeholder: "A cybernetic samurai defending a neon city gate...",
        presetLabel: "Select a preset story prompt:",
        preset1: "A neon cyberpunk detective looking at a glowing holographic map on a rainy street.",
        preset2: "An astronaut discovering an ancient mystical stone temple on Mars.",
        preset3: "A cute wizard apprentice accidentally setting their spellbook on fire.",
        generateCard: "⚡ Generate Preview Card",
        generateDesc: "Synthesizes a mockup story block demonstrating <1>visual rendering</1>, <1>casting vault identity</1>, and <1>synth soundtracks</1> matching the prompt.",
        assembling: "Assembling Panels...",
        rendering: "Rendering story frame...",
        runGenerator: "Run the generator sandbox above to witness a dynamic preview.",
        cohesivePanel: "COHESIVE PANEL",
        ok: "100% OK",
        castMember: "Cast Member",
        soundtrack: "Soundtrack",
        openStudio: "Open in Creator Studio"
      },
      showcase: {
        badge: "Artistic Diversity",
        title: "Artisanal & Storybook Styles",
        desc: "Choose a visual framework that aligns with your story's soul. Hand-drawn aesthetics meet modern SaaS tools.",
        renderingLock: "Rendering Lock",
        engine: "Consistent Art Direction Engine",
        launch: "Launch with this Style"
      },
      audio: {
        title: "Interactive Soundscapes",
        subtitle: "Web Audio procedural synth engine",
        desc: "Every multiverse genre carries its own generative procedural theme. Change genres to watch the synthetic frequency arpeggios shift live in your browser's audio nodes.",
        statusLabel: "Soundtrack Status",
        running: "Procedural Audio Running",
        standby: "Synthesizer Standby",
        sfxTitle: "Spatial SFX Board",
        sfxDesc: "Click any trigger block to command the sound synthesis engine directly.",
        sfxLaser: "Laser Beam",
        sfxExplosion: "Explosion",
        sfxPage: "Page Turn",
        sfxCombo: "Combo Synthesis",
        warning: "Ensure your system audio is enabled to hear procedural sounds."
      },
      features: {
        badge: "Chassis v3.11 Publishing Workshop",
        title: "Built For Dynamic Multi-Tenant Publishing",
        desc: "A high-end creative workshop structured to keep your graphic novels continuous, atmospheric, and visually arresting.",
        f1Title: "Story Blueprint Architect",
        f1Desc: "Map chapter goals from inciting incident triggers on page 1 to decision branches on page 3, climbing to the climax on page 9. Strictly structured outline grids.",
        f1Status: "● CHAPTER CONTROL ACTIVE",
        f2Title: "Multi-Tenant Casting Vault",
        f2Desc: "Forge persistent files containing character biometrics, facial weights, clothing references, and style lock keys. Keep heroes and archenemies consistent.",
        f2Status: "● MODEL SYNTAX LOCKED",
        f3Title: "Multi-Engine Diffusion Router",
        f3Desc: "Choose your renderer: LlamaGen.ai (Comic API) for panel grids, Stable Diffusion (via ComfyUI) for raw workflow control, Leonardo.ai (CharRef), or Gemini 2.5 Flash.",
        f3Status: "● DIFFUSION ENGINES STABLE",
        f4Title: "Synthesized Speech Narration",
        f4Desc: "Hear dialogue panels narrated instantly! Generates character text-to-speech outputs in multiple actor voice accents alongside backing audio.",
        f4Status: "● VOICE ENGINES READY",
        f5Title: "Procedural Soundscapes",
        f5Desc: "Generative arpeggios, frequency oscillators, and synthesized background themes that adapt dynamically to your selected story genres.",
        f5Status: "● AUDIOPROCESSOR OPERATIONAL",
        f6Title: "Unified Book & PDF Export",
        f6Desc: "Compile completed comics directly to high-fidelity PDF documents. Automatically packages page layouts, panels, speech bubbles, and text logs.",
        f6Status: "● EXPORTER STANDBY"
      },
      trending: {
        title: "Trending Multiverses",
        create: "Create Your Story",
        by: "by",
        remix: "Remix"
      },
      pricing: {
        title: "Choose Your Multiverse Studio Tier",
        desc: "Instantly deploy professional-grade publication features and take your original comics directly to your global audience.",
        p1Name: "Indie Sandbox",
        p1Title: "À La Carte",
        p1Desc: "Design in transient browser memory. Perfect for casual creators sketching out individual panel frames.",
        p1Price: "$0",
        p1Period: "/ Forever",
        p1F1: "✓ Standard 10-page generation",
        p1F2: "✓ Local JSON state draft files",
        p1F3: "✓ Standard voice synthesis",
        p1F4: "✗ Cloud backup project storage",
        p1F5: "✗ Enterprise high-res styling",
        p1CTA: "Launch Sandbox Mode",
        p2Badge: "✨ Popular Best Value",
        p2Name: "Multiverse Pro",
        p2Title: "The Full Course",
        p2Desc: "Our signature recipe for continuous multi-chapter epics. Secure Web Cloud Firestore database backing.",
        p2Price: "$19",
        p2Period: "/ Monthly",
        p2F1: "✓ Secure Web Cloud Firestore database backing",
        p2F2: "✓ Dynamic 10-chapter Story Blueprints",
        p2F3: "✓ Priority Gemini-3 Image style anchors",
        p2F4: "✓ Limitless character biometric vault cards",
        p2F5: "✓ Multi-language custom voice output synthesis",
        p2CTA: "Access Pro Account",
        p3Name: "Studio Publisher",
        p3Title: "The Multi-Course",
        p3Desc: "Our full-suite solution for professional studios managing continuous, Firestore-backed 10-chapter epic blueprints.",
        p3Price: "$79",
        p3Period: "/ Monthly",
        p3F1: "✓ Everything in Pro plan",
        p3F2: "✓ UHD 4K Vector generation exports",
        p3F3: "✓ Custom model tuning weights",
        p3F4: "✓ Collaborative publishing workspaces",
        p3F5: "✓ Dedicate GCP priority prompt endpoints",
        p3CTA: "Access Enterprise Account"
      },
      cta: {
        title: "Ready to claim your place in the multiverse?",
        desc: "Unlock the creative potential of multimodal artificial intelligence. Draft script blueprints, mold actors, and release immersive visual graphic books safely stored in Firestore today.",
        console: "Access Creative Console",
        sandbox: "Launch local sandbox",
        rights: "© 2026 STORY.MENU. ALL RIGHTS RESERVED.",
        domainLabel: "DOMAIN:",
        chassisLabel: "CHASSIS:"
      }
    },
    layout: {
      nav: {
        logoEditorial: "Writer's Journal",
        logoComic: "Story Menu",
        featuresEditorial: "📖 Features",
        featuresComic: "✨ Features",
        pricingEditorial: "💳 Pricing",
        pricingComic: "💰 Pricing",
        discover: "Discover",
        explore: "Explore",
        signIn: "Sign In",
        studioEditorial: "🖋️ Writing Studio",
        studioComic: "Studio Hub"
      },
      reader: {
        comingSoon: "Reading View (Coming Soon)",
        storyId: "You clicked on story ID: {{id}}",
        backToFeed: "Back to Feed"
      }
    },
    setup: {
      dashboard: {
        editorialBadge: "🖋️ Editorial Workspace v3.11",
        comicBadge: "Issue #01 - Multiverse Reborn",
        skinLabel: "STUDIO SKIN WORKSPACE",
        skinComic: "⚡ Comic Studio",
        skinEditorial: "🖋️ Writer's Journal",
        proSubtitle: "PROFESSIONAL COGNITIVE NARRATIVE CREATOR",
        proDesc: "Designed for writers, authors, and narrative designers seeking smart procedural story arcs and high-fidelity speech narration.",
        comicSubtitle: "INTELLIGENT DYNAMIC COMICS",
        cloudActive: "⚡ CLOUD CREATIVE WORKSPACE ACTIVE",
        cloudDesc: "Fully Integrated Cloud Storage via Google Firestore. Your characters and epic progress are synchronized live!",
        saveDraft: "💾 Save WIP Draft",
        saving: "SNAPSHOT-SAVING...",
        signOut: "🚪 Sign Out & Landing Page",
        firestoreLive: "FIRESTORE CLUSTER LIVE",
        f1Title: "AI STORY ENGINE",
        f1Desc: "Guided by state-of-the-art multimodal context windows to synthesize adaptive scenario dialogues, actions, and captions.",
        f2Title: "CHARACTER PERSISTENCE",
        f2Desc: "Cast recurring characters from your Vault. Upload portrait templates to propagate coherent visual traits.",
        f3Title: "SHARED MULTIVERSE",
        f3Desc: "Publish, preview, review, and organize custom dynamic comic issues in your personal cloud studio library."
      },
      tabs: {
        generateEditorial: "🌌 NARRATIVE CREATOR",
        generateComic: "Spark Multiverse Generator",
        blueprintEditorial: "🗺️ STORY BLUEPRINT ARCHITECT",
        blueprintComic: "Epic Story Blueprint",
        personaEditorial: "🎭 AI PERSONA TUNING STUDIO",
        personaComic: "Cast DNA Studio",
        libraryEditorial: "📚 PUBLICATION ARCHIVE",
        libraryComic: "My Story Library"
      },
      cast: {
        titleEditorial: "1. CAST REGISTRY",
        titleComic: "1. CHOOSE YOUR CAST",
        descEditorial: "Identify characters to participate in the narrative arc. Upload images of your characters to synchronize consistent physical traits recursively during scenario drafts.",
        descComic: "Upload custom character images to create coherent comic likenesses throughout the adventure. Include a Villain for high-stakes conflicts!"
      },
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
      },
      stats: {
        comics: "Cómics Creados",
        vaults: "Bóvedas de Reparto",
        cohesion: "Cohesión",
        speech: "Habla Sintética"
      },
      sandbox: {
        title: "🎮 Arena de Sandbox de Prompts",
        desc: "El <1>Sandbox de Prompts</1> te permite crear prototipos de diseños de universos y nodos de historias. Ingresa una premisa personalizada o elige un ajuste preestablecido a continuación, luego sintetiza tu diseño.",
        placeholder: "Un samurái cibernético defendiendo una puerta de ciudad de neón...",
        presetLabel: "Selecciona un prompt de historia preestablecido:",
        preset1: "Un detective ciberpunk de neón mirando un mapa holográfico brillante en una calle lluviosa.",
        preset2: "Un astronauta descubriendo un antiguo templo místico de piedra en Marte.",
        preset3: "Un lindo aprendiz de mago incendiando accidentalmente su libro de hechizos.",
        generateCard: "⚡ Generar Tarjeta de Vista Previa",
        generateDesc: "Sintetiza un bloque de historia de maqueta que demuestra <1>renderizado visual</1>, <1>identidad de la bóveda de reparto</1> y <1>bandas sonoras sintéticas</1> que coinciden con el prompt.",
        assembling: "Ensamblando Paneles...",
        rendering: "Renderizando marco de historia...",
        runGenerator: "Ejecuta el sandbox generador de arriba para presenciar una vista previa dinámica.",
        cohesivePanel: "PANEL COHESIVO",
        ok: "100% OK",
        castMember: "Miembro del Reparto",
        soundtrack: "Banda Sonora",
        openStudio: "Abrir en Creator Studio"
      },
      showcase: {
        badge: "Diversidad Artística",
        title: "Estilos Artesanales y de Cuentos",
        desc: "Elige un marco visual que se alinee con el alma de tu historia. La estética dibujada a mano se encuentra con las herramientas modernas de SaaS.",
        renderingLock: "Bloqueo de Renderizado",
        engine: "Motor de Dirección de Arte Consistente",
        launch: "Lanzar con este Estilo"
      },
      audio: {
        title: "Paisajes Sonoros Interactivos",
        subtitle: "Motor de síntesis procedimental de Web Audio",
        desc: "Cada género del multiverso tiene su propio tema procedimental generativo. Cambia de género para ver cómo los arpegios de frecuencia sintética cambian en vivo en los nodos de audio de tu navegador.",
        statusLabel: "Estado de la Banda Sonora",
        running: "Audio Procedimental en Ejecución",
        standby: "Sintetizador en Espera",
        sfxTitle: "Tablero Espacial de Efectos de Sonido",
        sfxDesc: "Haz clic en cualquier bloque disparador para comandar el motor de síntesis de sonido directamente.",
        sfxLaser: "Rayo Láser",
        sfxExplosion: "Explosión",
        sfxPage: "Paso de Página",
        sfxCombo: "Síntesis Combinada",
        warning: "Asegúrate de que el audio de tu sistema esté habilitado para escuchar sonidos procedimentales."
      },
      features: {
        badge: "Taller de Publicación Chassis v3.11",
        title: "Construido Para Publicación Dinámica Multiusuario",
        desc: "Un taller creativo de alta gama estructurado para mantener tus novelas gráficas continuas, atmosféricas y visualmente impactantes.",
        f1Title: "Arquitecto de Planos de Historia",
        f1Desc: "Asigna metas de capítulos desde incidentes incitadores en la página 1 hasta ramas de decisión en la página 3, subiendo al clímax en la página 9. Cuadrículas de esquema estrictamente estructuradas.",
        f1Status: "● CONTROL DE CAPÍTULO ACTIVO",
        f2Title: "Bóveda de Reparto Multiusuario",
        f2Desc: "Forja archivos persistentes que contengan biometría de personajes, pesos faciales, referencias de ropa y claves de bloqueo de estilo. Mantén consistentes a héroes y archienemigos.",
        f2Status: "● SINTAXIS DEL MODELO BLOQUEADA",
        f3Title: "Enrutador de Difusión Multimotor",
        f3Desc: "Elige tu renderizador: LlamaGen.ai (Comic API) para cuadrículas de paneles, Stable Diffusion (vía ComfyUI) para control de flujo de trabajo puro, Leonardo.ai (CharRef), o Gemini 2.5 Flash.",
        f3Status: "● MOTORES DE DIFUSIÓN ESTABLES",
        f4Title: "Narración de Voz Sintetizada",
        f4Desc: "¡Escucha paneles de diálogo narrados al instante! Genera salidas de texto a voz de personajes en múltiples acentos de actores de voz junto con audio de fondo.",
        f4Status: "● MOTORES DE VOZ LISTOS",
        f5Title: "Paisajes Sonoros Procedimentales",
        f5Desc: "Arpegios generativos, osciladores de frecuencia y temas de fondo sintetizados que se adaptan dinámicamente a los géneros de historia seleccionados.",
        f5Status: "● AUDIOPROCESADOR OPERATIVO",
        f6Title: "Exportación Unificada de Libros y PDF",
        f6Desc: "Compila cómics completados directamente a documentos PDF de alta fidelidad. Empaqueta automáticamente diseños de página, paneles, globos de diálogo y registros de texto.",
        f6Status: "● EXPORTADOR EN ESPERA"
      },
      trending: {
        title: "Multiversos en Tendencia",
        create: "Crea Tu Historia",
        by: "por",
        remix: "Mezclar"
      },
      pricing: {
        title: "Elige Tu Nivel de Estudio Multiverso",
        desc: "Despliega al instante características de publicación de nivel profesional y lleva tus cómics originales directamente a tu audiencia global.",
        p1Name: "Sandbox Indie",
        p1Title: "A la Carta",
        p1Desc: "Diseña en memoria transitoria del navegador. Perfecto para creadores casuales esbozando marcos de paneles individuales.",
        p1Price: "$0",
        p1Period: "/ Para Siempre",
        p1F1: "✓ Generación estándar de 10 páginas",
        p1F2: "✓ Archivos de borrador de estado JSON local",
        p1F3: "✓ Síntesis de voz estándar",
        p1F4: "✗ Almacenamiento de respaldo en la nube",
        p1F5: "✗ Estilo de alta resolución empresarial",
        p1CTA: "Lanzar Modo Sandbox",
        p2Badge: "✨ Popular Mejor Valor",
        p2Name: "Pro Multiverso",
        p2Title: "El Curso Completo",
        p2Desc: "Nuestra receta distintiva para épicas continuas de múltiples capítulos. Respaldo seguro en base de datos Cloud Firestore.",
        p2Price: "$19",
        p2Period: "/ Mensual",
        p2F1: "✓ Respaldo seguro en base de datos Web Cloud Firestore",
        p2F2: "✓ Planos de Historia Dinámicos de 10 capítulos",
        p2F3: "✓ Anclas de estilo de Imagen Gemini-3 Prioritarias",
        p2F4: "✓ Tarjetas de bóveda biométrica de personajes ilimitadas",
        p2F5: "✓ Síntesis de salida de voz personalizada multilingüe",
        p2CTA: "Acceder a Cuenta Pro",
        p3Name: "Editor de Estudio",
        p3Title: "El Multicurso",
        p3Desc: "Nuestra solución completa para estudios profesionales manejando planos épicos continuos de 10 capítulos respaldados por Firestore.",
        p3Price: "$79",
        p3Period: "/ Mensual",
        p3F1: "✓ Todo en el plan Pro",
        p3F2: "✓ Exportaciones de generación de Vector UHD 4K",
        p3F3: "✓ Pesos de ajuste de modelo personalizados",
        p3F4: "✓ Espacios de trabajo de publicación colaborativos",
        p3F5: "✓ Puntos finales de prompt de prioridad GCP dedicados",
        p3CTA: "Acceder a Cuenta Enterprise"
      },
      cta: {
        title: "¿Listo para reclamar tu lugar en el multiverso?",
        desc: "Desbloquea el potencial creativo de la inteligencia artificial multimodal. Redacta planos de guiones, moldea actores y lanza libros gráficos visuales inmersivos almacenados de forma segura en Firestore hoy.",
        console: "Acceder a Consola Creativa",
        sandbox: "Lanzar sandbox local",
        rights: "© 2026 STORY.MENU. TODOS LOS DERECHOS RESERVADOS.",
        domainLabel: "DOMINIO:",
        chassisLabel: "CHASIS:"
      }
    },
    layout: {
      nav: {
        logoEditorial: "Diario del Escritor",
        logoComic: "Menú de Historia",
        featuresEditorial: "📖 Funciones",
        featuresComic: "✨ Características",
        pricingEditorial: "💳 Precios",
        pricingComic: "💰 Precios",
        discover: "Descubrir",
        explore: "Explorar",
        signIn: "Iniciar Sesión",
        studioEditorial: "🖋️ Estudio de Escritura",
        studioComic: "Centro de Estudio"
      },
      reader: {
        comingSoon: "Vista de Lectura (Próximamente)",
        storyId: "Hiciste clic en la historia ID: {{id}}",
        backToFeed: "Volver al Inicio"
      }
    },
    setup: {
      dashboard: {
        editorialBadge: "🖋️ Espacio de trabajo editorial v3.11",
        comicBadge: "Edición #01 - Multiverso Renacido",
        skinLabel: "ESPACIO DE TRABAJO DEL ESTUDIO",
        skinComic: "⚡ Estudio de Cómic",
        skinEditorial: "🖋️ Diario del Escritor",
        proSubtitle: "CREADOR DE NARRATIVA COGNITIVA PROFESIONAL",
        proDesc: "Diseñado para escritores, autores y diseñadores narrativos que buscan arcos de historias procesales inteligentes y narración de voz de alta fidelidad.",
        comicSubtitle: "CÓMICS DINÁMICOS INTELIGENTES",
        cloudActive: "⚡ ESPACIO DE TRABAJO CREATIVO EN LA NUBE ACTIVO",
        cloudDesc: "Almacenamiento en la nube totalmente integrado a través de Google Firestore. ¡Tus personajes y progreso épico se sincronizan en vivo!",
        saveDraft: "💾 Guardar Borrador WIP",
        saving: "GUARDANDO INSTANTÁNEA...",
        signOut: "🚪 Cerrar Sesión y Página Principal",
        firestoreLive: "CLÚSTER DE FIRESTORE EN VIVO",
        f1Title: "MOTOR DE HISTORIA DE IA",
        f1Desc: "Guiado por ventanas de contexto multimodal de última generación para sintetizar diálogos de escenarios adaptativos, acciones y subtítulos.",
        f2Title: "PERSISTENCIA DE PERSONAJES",
        f2Desc: "Selecciona personajes recurrentes de tu Bóveda. Sube plantillas de retratos para propagar rasgos visuales coherentes.",
        f3Title: "MULTIVERSO COMPARTIDO",
        f3Desc: "Publica, previsualiza, revisa y organiza problemas de cómics dinámicos personalizados en tu biblioteca personal de estudio en la nube."
      },
      tabs: {
        generateEditorial: "🌌 CREADOR DE NARRATIVA",
        generateComic: "Generador de Multiverso Spark",
        blueprintEditorial: "🗺️ ARQUITECTO DE PLANOS DE HISTORIA",
        blueprintComic: "Plano de Historia Épica",
        personaEditorial: "🎭 ESTUDIO DE AJUSTE DE PERSONAJE IA",
        personaComic: "Estudio de ADN de Reparto",
        libraryEditorial: "📚 ARCHIVO DE PUBLICACIÓN",
        libraryComic: "Mi Biblioteca de Historias"
      },
      cast: {
        titleEditorial: "1. REGISTRO DEL ELENCO",
        titleComic: "1. ELIGE TU ELENCO",
        descEditorial: "Identifica personajes para participar en el arco narrativo. Sube imágenes de tus personajes para sincronizar rasgos físicos consistentes recursivamente durante los borradores de escenarios.",
        descComic: "Sube imágenes de personajes personalizadas para crear similitudes de cómics coherentes a lo largo de la aventura. ¡Incluye un villano para conflictos de alto riesgo!"
      },
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
      },
      stats: {
        comics: "作成されたコミック",
        vaults: "キャスティング保管庫",
        cohesion: "一貫性",
        speech: "合成音声"
      },
      sandbox: {
        title: "🎮 プロンプトサンドボックスアリーナ",
        desc: "<1>プロンプトサンドボックス</1>を使用すると、宇宙のレイアウトやストーリーノードのプロトタイプを作成できます。カスタムの前提を入力するか、以下のプリセットを選択して、デザインを合成します。",
        placeholder: "ネオン輝く街の門を守るサイバネティックな侍...",
        presetLabel: "プリセットのストーリープロンプトを選択:",
        preset1: "雨の降る通りで光るホログラフィックマップを見ているネオンサイバーパンクの探偵。",
        preset2: "火星で古代の神秘的な石の寺院を発見する宇宙飛行士。",
        preset3: "誤って魔法の書を燃やしてしまうかわいい魔法使いの弟子。",
        generateCard: "⚡ プレビューカードを生成",
        generateDesc: "プロンプトに一致する<1>ビジュアルレンダリング</1>、<1>キャスティング保管庫のアイデンティティ</1>、および<1>シンセサウンドトラック</1>を示すモックアップストーリーブロックを合成します。",
        assembling: "パネルを組み立て中...",
        rendering: "ストーリーフレームをレンダリング中...",
        runGenerator: "ダイナミックなプレビューを見るには、上のジェネレーターサンドボックスを実行してください。",
        cohesivePanel: "一貫性のあるパネル",
        ok: "100% OK",
        castMember: "キャストメンバー",
        soundtrack: "サウンドトラック",
        openStudio: "クリエイタースタジオで開く"
      },
      showcase: {
        badge: "芸術的な多様性",
        title: "職人技と絵本スタイル",
        desc: "あなたの物語の魂に合った視覚的なフレームワークを選択してください。手描きの美学が最新のSaaSツールと出会います。",
        renderingLock: "レンダリングロック",
        engine: "一貫したアートディレクションエンジン",
        launch: "このスタイルで開始"
      },
      audio: {
        title: "インタラクティブなサウンドスケープ",
        subtitle: "Web Audioプロシージャルシンセエンジン",
        desc: "マルチバースの各ジャンルには、独自の生成的プロシージャルテーマがあります。ジャンルを変更して、ブラウザのオーディオノードで合成周波数アルペジオがライブで変化するのを見てください。",
        statusLabel: "サウンドトラックステータス",
        running: "プロシージャルオーディオ実行中",
        standby: "シンセサイザースタンバイ",
        sfxTitle: "空間SFXボード",
        sfxDesc: "任意のトリガーブロックをクリックして、サウンド合成エンジンを直接制御します。",
        sfxLaser: "レーザービーム",
        sfxExplosion: "爆発",
        sfxPage: "ページめくり",
        sfxCombo: "コンボ合成",
        warning: "プロシージャルサウンドを聞くには、システムのオーディオが有効になっていることを確認してください。"
      },
      features: {
        badge: "シャーシv3.11パブリッシングワークショップ",
        title: "動的なマルチテナント出版のために構築",
        desc: "あなたのグラフィックノベルを継続的で雰囲気があり、視覚的に魅力的なものに保つために構築されたハイエンドのクリエイティブワークショップ。",
        f1Title: "ストーリーブループリントアーキテクト",
        f1Desc: "1ページ目の誘発インシデントのトリガーから3ページ目の決定ブランチ、そして9ページ目のクライマックスへの上昇まで、章の目標をマッピングします。厳密に構成されたアウトライングリッド。",
        f1Status: "● チャプターコントロールアクティブ",
        f2Title: "マルチテナントキャスティング保管庫",
        f2Desc: "キャラクターのバイオメトリクス、顔の重み、服の参照、スタイルロックキーを含む永続的なファイルを構築します。ヒーローと宿敵を一致させます。",
        f2Status: "● モデル構文ロック完了",
        f3Title: "マルチエンジン拡散ルーター",
        f3Desc: "レンダラーを選択します：パネルグリッド用のLlamaGen.ai (Comic API)、生のワークフロー制御用のStable Diffusion (ComfyUI経由)、Leonardo.ai (CharRef)、またはGemini 2.5 Flash。",
        f3Status: "● 拡散エンジン安定",
        f4Title: "合成音声ナレーション",
        f4Desc: "対話パネルが即座にナレーションされるのを聞いてください！バックオーディオと一緒に複数の俳優の音声アクセントでキャラクターのテキスト読み上げ出力を生成します。",
        f4Status: "● 音声エンジン準備完了",
        f5Title: "プロシージャルサウンドスケープ",
        f5Desc: "選択したストーリージャンルに動的に適応する生成的なアルペジオ、周波数オシレーター、合成されたバックグラウンドテーマ。",
        f5Status: "● オーディオプロセッサ稼働中",
        f6Title: "統合ブックとPDFエクスポート",
        f6Desc: "完成したコミックを忠実度の高いPDFドキュメントに直接コンパイルします。ページレイアウト、パネル、吹き出し、テキストログを自動的にパッケージ化します。",
        f6Status: "● エクスポータースタンバイ"
      },
      trending: {
        title: "トレンドのマルチバース",
        create: "あなたのストーリーを作成",
        by: "作",
        remix: "リミックス"
      },
      pricing: {
        title: "マルチバーススタジオ層を選択してください",
        desc: "プロ級の公開機能を即座に展開し、オリジナルコミックを世界中の読者に直接届けます。",
        p1Name: "インディーサンドボックス",
        p1Title: "アラカルト",
        p1Desc: "一時的なブラウザメモリで設計します。個々のパネルフレームをスケッチするカジュアルなクリエイターに最適です。",
        p1Price: "$0",
        p1Period: "/ 永久",
        p1F1: "✓ 標準の10ページ生成",
        p1F2: "✓ ローカルJSON状態ドラフトファイル",
        p1F3: "✓ 標準音声合成",
        p1F4: "✗ クラウドバックアッププロジェクトストレージ",
        p1F5: "✗ エンタープライズ高解像度スタイリング",
        p1CTA: "サンドボックスモードを起動",
        p2Badge: "✨ 人気でお得",
        p2Name: "マルチバースプロ",
        p2Title: "フルコース",
        p2Desc: "継続的な複数章のエピックのための当社のシグネチャーレシピ。安全なWeb Cloud Firestoreデータベースバックアップ。",
        p2Price: "$19",
        p2Period: "/ 月額",
        p2F1: "✓ 安全なWeb Cloud Firestoreデータベースバックアップ",
        p2F2: "✓ 動的な10章のストーリーブループリント",
        p2F3: "✓ 優先Gemini-3イメージスタイルアンカー",
        p2F4: "✓ 無制限のキャラクターバイオメトリック保管庫カード",
        p2F5: "✓ 多言語カスタム音声出力合成",
        p2CTA: "プロアカウントにアクセス",
        p3Name: "スタジオパブリッシャー",
        p3Title: "マルチコース",
        p3Desc: "継続的なFirestoreバックアップの10章のエピックブループリントを管理するプロフェッショナルスタジオ向けのフルスイートソリューション。",
        p3Price: "$79",
        p3Period: "/ 月額",
        p3F1: "✓ プロプランのすべて",
        p3F2: "✓ UHD 4Kベクトル生成エクスポート",
        p3F3: "✓ カスタムモデルのチューニングウェイト",
        p3F4: "✓ 共同パブリッシングワークスペース",
        p3F5: "✓ 専用のGCP優先プロンプトエンドポイント",
        p3CTA: "エンタープライズアカウントにアクセス"
      },
      cta: {
        title: "マルチバースであなたの居場所を主張する準備はできましたか？",
        desc: "マルチモーダル人工知能の創造的な可能性を解き放ちます。今日、スクリプトのブループリントを起草し、俳優を形成し、Firestoreに安全に保存された没入型のビジュアルグラフィックブックをリリースしてください。",
        console: "クリエイティブコンソールにアクセス",
        sandbox: "ローカルサンドボックスを起動",
        rights: "© 2026 STORY.MENU. ALL RIGHTS RESERVED.",
        domainLabel: "ドメイン:",
        chassisLabel: "シャーシ:"
      }
    },
    layout: {
      nav: {
        logoEditorial: "作家のジャーナル",
        logoComic: "ストーリーメニュー",
        featuresEditorial: "📖 機能",
        featuresComic: "✨ 特徴",
        pricingEditorial: "💳 料金",
        pricingComic: "💰 料金",
        discover: "発見する",
        explore: "探索する",
        signIn: "サインイン",
        studioEditorial: "🖋️ 執筆スタジオ",
        studioComic: "スタジオハブ"
      },
      reader: {
        comingSoon: "読書ビュー（近日公開）",
        storyId: "クリックされたストーリーID：{{id}}",
        backToFeed: "フィードに戻る"
      }
    },
    setup: {
      dashboard: {
        editorialBadge: "🖋️ 編集ワークスペース v3.11",
        comicBadge: "第01号 - マルチバースの再誕",
        skinLabel: "スタジオスキンワークスペース",
        skinComic: "⚡ コミックスタジオ",
        skinEditorial: "🖋️ 作家のジャーナル",
        proSubtitle: "プロフェッショナルな認知物語クリエイター",
        proDesc: "スマートな手続き型ストーリーアークと忠実度の高い音声ナレーションを求める作家、著者、ナラティブデザイナー向けに設計されています。",
        comicSubtitle: "インテリジェントなダイナミックコミック",
        cloudActive: "⚡ クラウドクリエイティブワークスペースアクティブ",
        cloudDesc: "Google Firestoreを介した完全に統合されたクラウドストレージ。あなたのキャラクターとエピックな進行状況はライブで同期されます！",
        saveDraft: "💾 WIPドラフトを保存",
        saving: "スナップショットを保存中...",
        signOut: "🚪 サインアウトとランディングページ",
        firestoreLive: "FIRESTOREクラスター稼働中",
        f1Title: "AIストーリーエンジン",
        f1Desc: "適応的なシナリオの対話、アクション、キャプションを合成するための最先端のマルチモーダルコンテキストウィンドウによってガイドされます。",
        f2Title: "キャラクターの永続性",
        f2Desc: "保管庫から繰り返し登場するキャラクターをキャストします。一貫した視覚的特徴を伝播するためにポートレートテンプレートをアップロードします。",
        f3Title: "共有マルチバース",
        f3Desc: "個人のクラウドスタジオライブラリでカスタムダイナミックコミックの発行を公開、プレビュー、レビュー、および整理します。"
      },
      tabs: {
        generateEditorial: "🌌 ナラティブクリエイター",
        generateComic: "スパークマルチバースジェネレーター",
        blueprintEditorial: "🗺️ ストーリーブループリントアーキテクト",
        blueprintComic: "エピックストーリーブループリント",
        personaEditorial: "🎭 AIペルソナチューニングスタジオ",
        personaComic: "キャストDNAスタジオ",
        libraryEditorial: "📚 出版物アーカイブ",
        libraryComic: "マイストーリーライブラリ"
      },
      cast: {
        titleEditorial: "1. キャスト登録",
        titleComic: "1. キャストを選択",
        descEditorial: "物語のアークに参加するキャラクターを特定します。シナリオのドラフト中に一貫した身体的特徴を再帰的に同期させるために、キャラクターの画像をアップロードします。",
        descComic: "冒険全体で一貫したコミックの類似性を作成するために、カスタムキャラクターの画像をアップロードします。ハイステークスの競合のために悪役を含めてください！"
      },
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

import { auto_en, auto_ar, auto_bg, auto_bn, auto_cs, auto_da, auto_de, auto_el, auto_es, auto_fi, auto_fr, auto_he, auto_hi, auto_hr, auto_hu, auto_id, auto_it, auto_ja, auto_ko, auto_ms, auto_nl, auto_no, auto_pl, auto_pt, auto_ro, auto_ru, auto_sk, auto_sv, auto_ta, auto_th, auto_tl, auto_tr, auto_uk, auto_vi, auto_zh_CN, auto_zh_TW } from './autoLocalesAll';
import { core_ar, core_bg, core_bn, core_cs, core_da, core_de, core_el, core_es, core_fi, core_fr, core_he, core_hi, core_hr, core_hu, core_id, core_it, core_ja, core_ko, core_ms, core_nl, core_no, core_pl, core_pt, core_ro, core_ru, core_sk, core_sv, core_ta, core_th, core_tl, core_tr, core_uk, core_vi, core_zh_CN, core_zh_TW } from './coreLocalesAll';
import { sandbox_en, sandbox_ar, sandbox_bg, sandbox_bn, sandbox_cs, sandbox_da, sandbox_de, sandbox_el, sandbox_es, sandbox_fi, sandbox_fr, sandbox_he, sandbox_hi, sandbox_hr, sandbox_hu, sandbox_id, sandbox_it, sandbox_ja, sandbox_ko, sandbox_ms, sandbox_nl, sandbox_no, sandbox_pl, sandbox_pt, sandbox_ro, sandbox_ru, sandbox_sk, sandbox_sv, sandbox_ta, sandbox_th, sandbox_tl, sandbox_tr, sandbox_uk, sandbox_vi, sandbox_zh_CN, sandbox_zh_TW } from './sandboxLocales';
import { sandbox2_en, sandbox2_ar, sandbox2_bg, sandbox2_bn, sandbox2_cs, sandbox2_da, sandbox2_de, sandbox2_el, sandbox2_es, sandbox2_fi, sandbox2_fr, sandbox2_he, sandbox2_hi, sandbox2_hr, sandbox2_hu, sandbox2_id, sandbox2_it, sandbox2_ja, sandbox2_ko, sandbox2_ms, sandbox2_nl, sandbox2_no, sandbox2_pl, sandbox2_pt, sandbox2_ro, sandbox2_ru, sandbox2_sk, sandbox2_sv, sandbox2_ta, sandbox2_th, sandbox2_tl, sandbox2_tr, sandbox2_uk, sandbox2_vi, sandbox2_zh_CN, sandbox2_zh_TW } from './sandbox2Locales';
import { sandbox3_en, sandbox3_ar, sandbox3_bg, sandbox3_bn, sandbox3_cs, sandbox3_da, sandbox3_de, sandbox3_el, sandbox3_es, sandbox3_fi, sandbox3_fr, sandbox3_he, sandbox3_hi, sandbox3_hr, sandbox3_hu, sandbox3_id, sandbox3_it, sandbox3_ja, sandbox3_ko, sandbox3_ms, sandbox3_nl, sandbox3_no, sandbox3_pl, sandbox3_pt, sandbox3_ro, sandbox3_ru, sandbox3_sk, sandbox3_sv, sandbox3_ta, sandbox3_th, sandbox3_tl, sandbox3_tr, sandbox3_uk, sandbox3_vi, sandbox3_zh_CN, sandbox3_zh_TW } from './sandbox3Locales';
import { sandbox4_en, sandbox4_ar, sandbox4_bg, sandbox4_bn, sandbox4_cs, sandbox4_da, sandbox4_de, sandbox4_el, sandbox4_es, sandbox4_fi, sandbox4_fr, sandbox4_he, sandbox4_hi, sandbox4_hr, sandbox4_hu, sandbox4_id, sandbox4_it, sandbox4_ja, sandbox4_ko, sandbox4_ms, sandbox4_nl, sandbox4_no, sandbox4_pl, sandbox4_pt, sandbox4_ro, sandbox4_ru, sandbox4_sk, sandbox4_sv, sandbox4_ta, sandbox4_th, sandbox4_tl, sandbox4_tr, sandbox4_uk, sandbox4_vi, sandbox4_zh_CN, sandbox4_zh_TW } from './sandbox4Locales';
import { sandbox5_en, sandbox5_ar, sandbox5_bg, sandbox5_bn, sandbox5_cs, sandbox5_da, sandbox5_de, sandbox5_el, sandbox5_es, sandbox5_fi, sandbox5_fr, sandbox5_he, sandbox5_hi, sandbox5_hr, sandbox5_hu, sandbox5_id, sandbox5_it, sandbox5_ja, sandbox5_ko, sandbox5_ms, sandbox5_nl, sandbox5_no, sandbox5_pl, sandbox5_pt, sandbox5_ro, sandbox5_ru, sandbox5_sk, sandbox5_sv, sandbox5_ta, sandbox5_th, sandbox5_tl, sandbox5_tr, sandbox5_uk, sandbox5_vi, sandbox5_zh_CN, sandbox5_zh_TW } from './sandbox5Locales';





const resources: any = {
  en,
  'ar': { translation: {} },
  'bg': { translation: {} },
  'bn': { translation: {} },
  'cs': { translation: {} },
  'da': { translation: {} },
  'de': { translation: {} },
  'el': { translation: {} },
  'es': { translation: {} },
  'fi': { translation: {} },
  'fr': { translation: {} },
  'he': { translation: {} },
  'hi': { translation: {} },
  'hr': { translation: {} },
  'hu': { translation: {} },
  'id': { translation: {} },
  'it': { translation: {} },
  'ja': { translation: {} },
  'ko': { translation: {} },
  'ms': { translation: {} },
  'nl': { translation: {} },
  'no': { translation: {} },
  'pl': { translation: {} },
  'pt': { translation: {} },
  'ro': { translation: {} },
  'ru': { translation: {} },
  'sk': { translation: {} },
  'sv': { translation: {} },
  'ta': { translation: {} },
  'th': { translation: {} },
  'tl': { translation: {} },
  'tr': { translation: {} },
  'uk': { translation: {} },
  'vi': { translation: {} },
  'zh-CN': { translation: {} },
  'zh-TW': { translation: {} },
};

const mergeTranslations = (target: any, source: any) => {
  for (const ns of Object.keys(source)) {
    if (!target[ns]) target[ns] = {};
    Object.assign(target[ns], source[ns]);
  }
};

mergeTranslations(resources.en.translation, sandbox_en);
mergeTranslations(resources['ar'].translation, sandbox_ar);
mergeTranslations(resources['bg'].translation, sandbox_bg);
mergeTranslations(resources['bn'].translation, sandbox_bn);
mergeTranslations(resources['cs'].translation, sandbox_cs);
mergeTranslations(resources['da'].translation, sandbox_da);
mergeTranslations(resources['de'].translation, sandbox_de);
mergeTranslations(resources['el'].translation, sandbox_el);
mergeTranslations(resources['es'].translation, sandbox_es);
mergeTranslations(resources['fi'].translation, sandbox_fi);
mergeTranslations(resources['fr'].translation, sandbox_fr);
mergeTranslations(resources['he'].translation, sandbox_he);
mergeTranslations(resources['hi'].translation, sandbox_hi);
mergeTranslations(resources['hr'].translation, sandbox_hr);
mergeTranslations(resources['hu'].translation, sandbox_hu);
mergeTranslations(resources['id'].translation, sandbox_id);
mergeTranslations(resources['it'].translation, sandbox_it);
mergeTranslations(resources['ja'].translation, sandbox_ja);
mergeTranslations(resources['ko'].translation, sandbox_ko);
mergeTranslations(resources['ms'].translation, sandbox_ms);
mergeTranslations(resources['nl'].translation, sandbox_nl);
mergeTranslations(resources['no'].translation, sandbox_no);
mergeTranslations(resources['pl'].translation, sandbox_pl);
mergeTranslations(resources['pt'].translation, sandbox_pt);
mergeTranslations(resources['ro'].translation, sandbox_ro);
mergeTranslations(resources['ru'].translation, sandbox_ru);
mergeTranslations(resources['sk'].translation, sandbox_sk);
mergeTranslations(resources['sv'].translation, sandbox_sv);
mergeTranslations(resources['ta'].translation, sandbox_ta);
mergeTranslations(resources['th'].translation, sandbox_th);
mergeTranslations(resources['tl'].translation, sandbox_tl);
mergeTranslations(resources['tr'].translation, sandbox_tr);
mergeTranslations(resources['uk'].translation, sandbox_uk);
mergeTranslations(resources['vi'].translation, sandbox_vi);
mergeTranslations(resources['zh-CN'].translation, sandbox_zh_CN);
mergeTranslations(resources['zh-TW'].translation, sandbox_zh_TW);
mergeTranslations(resources.en.translation, sandbox2_en);
mergeTranslations(resources['ar'].translation, sandbox2_ar);
mergeTranslations(resources['bg'].translation, sandbox2_bg);
mergeTranslations(resources['bn'].translation, sandbox2_bn);
mergeTranslations(resources['cs'].translation, sandbox2_cs);
mergeTranslations(resources['da'].translation, sandbox2_da);
mergeTranslations(resources['de'].translation, sandbox2_de);
mergeTranslations(resources['el'].translation, sandbox2_el);
mergeTranslations(resources['es'].translation, sandbox2_es);
mergeTranslations(resources['fi'].translation, sandbox2_fi);
mergeTranslations(resources['fr'].translation, sandbox2_fr);
mergeTranslations(resources['he'].translation, sandbox2_he);
mergeTranslations(resources['hi'].translation, sandbox2_hi);
mergeTranslations(resources['hr'].translation, sandbox2_hr);
mergeTranslations(resources['hu'].translation, sandbox2_hu);
mergeTranslations(resources['id'].translation, sandbox2_id);
mergeTranslations(resources['it'].translation, sandbox2_it);
mergeTranslations(resources['ja'].translation, sandbox2_ja);
mergeTranslations(resources['ko'].translation, sandbox2_ko);
mergeTranslations(resources['ms'].translation, sandbox2_ms);
mergeTranslations(resources['nl'].translation, sandbox2_nl);
mergeTranslations(resources['no'].translation, sandbox2_no);
mergeTranslations(resources['pl'].translation, sandbox2_pl);
mergeTranslations(resources['pt'].translation, sandbox2_pt);
mergeTranslations(resources['ro'].translation, sandbox2_ro);
mergeTranslations(resources['ru'].translation, sandbox2_ru);
mergeTranslations(resources['sk'].translation, sandbox2_sk);
mergeTranslations(resources['sv'].translation, sandbox2_sv);
mergeTranslations(resources['ta'].translation, sandbox2_ta);
mergeTranslations(resources['th'].translation, sandbox2_th);
mergeTranslations(resources['tl'].translation, sandbox2_tl);
mergeTranslations(resources['tr'].translation, sandbox2_tr);
mergeTranslations(resources['uk'].translation, sandbox2_uk);
mergeTranslations(resources['vi'].translation, sandbox2_vi);
mergeTranslations(resources['zh-CN'].translation, sandbox2_zh_CN);
mergeTranslations(resources['zh-TW'].translation, sandbox2_zh_TW);
mergeTranslations(resources.en.translation, sandbox3_en);
mergeTranslations(resources['ar'].translation, sandbox3_ar);
mergeTranslations(resources['bg'].translation, sandbox3_bg);
mergeTranslations(resources['bn'].translation, sandbox3_bn);
mergeTranslations(resources['cs'].translation, sandbox3_cs);
mergeTranslations(resources['da'].translation, sandbox3_da);
mergeTranslations(resources['de'].translation, sandbox3_de);
mergeTranslations(resources['el'].translation, sandbox3_el);
mergeTranslations(resources['es'].translation, sandbox3_es);
mergeTranslations(resources['fi'].translation, sandbox3_fi);
mergeTranslations(resources['fr'].translation, sandbox3_fr);
mergeTranslations(resources['he'].translation, sandbox3_he);
mergeTranslations(resources['hi'].translation, sandbox3_hi);
mergeTranslations(resources['hr'].translation, sandbox3_hr);
mergeTranslations(resources['hu'].translation, sandbox3_hu);
mergeTranslations(resources['id'].translation, sandbox3_id);
mergeTranslations(resources['it'].translation, sandbox3_it);
mergeTranslations(resources['ja'].translation, sandbox3_ja);
mergeTranslations(resources['ko'].translation, sandbox3_ko);
mergeTranslations(resources['ms'].translation, sandbox3_ms);
mergeTranslations(resources['nl'].translation, sandbox3_nl);
mergeTranslations(resources['no'].translation, sandbox3_no);
mergeTranslations(resources['pl'].translation, sandbox3_pl);
mergeTranslations(resources['pt'].translation, sandbox3_pt);
mergeTranslations(resources['ro'].translation, sandbox3_ro);
mergeTranslations(resources['ru'].translation, sandbox3_ru);
mergeTranslations(resources['sk'].translation, sandbox3_sk);
mergeTranslations(resources['sv'].translation, sandbox3_sv);
mergeTranslations(resources['ta'].translation, sandbox3_ta);
mergeTranslations(resources['th'].translation, sandbox3_th);
mergeTranslations(resources['tl'].translation, sandbox3_tl);
mergeTranslations(resources['tr'].translation, sandbox3_tr);
mergeTranslations(resources['uk'].translation, sandbox3_uk);
mergeTranslations(resources['vi'].translation, sandbox3_vi);
mergeTranslations(resources['zh-CN'].translation, sandbox3_zh_CN);
mergeTranslations(resources['zh-TW'].translation, sandbox3_zh_TW);
mergeTranslations(resources.en.translation, sandbox4_en);
mergeTranslations(resources['ar'].translation, sandbox4_ar);
mergeTranslations(resources['bg'].translation, sandbox4_bg);
mergeTranslations(resources['bn'].translation, sandbox4_bn);
mergeTranslations(resources['cs'].translation, sandbox4_cs);
mergeTranslations(resources['da'].translation, sandbox4_da);
mergeTranslations(resources['de'].translation, sandbox4_de);
mergeTranslations(resources['el'].translation, sandbox4_el);
mergeTranslations(resources['es'].translation, sandbox4_es);
mergeTranslations(resources['fi'].translation, sandbox4_fi);
mergeTranslations(resources['fr'].translation, sandbox4_fr);
mergeTranslations(resources['he'].translation, sandbox4_he);
mergeTranslations(resources['hi'].translation, sandbox4_hi);
mergeTranslations(resources['hr'].translation, sandbox4_hr);
mergeTranslations(resources['hu'].translation, sandbox4_hu);
mergeTranslations(resources['id'].translation, sandbox4_id);
mergeTranslations(resources['it'].translation, sandbox4_it);
mergeTranslations(resources['ja'].translation, sandbox4_ja);
mergeTranslations(resources['ko'].translation, sandbox4_ko);
mergeTranslations(resources['ms'].translation, sandbox4_ms);
mergeTranslations(resources['nl'].translation, sandbox4_nl);
mergeTranslations(resources['no'].translation, sandbox4_no);
mergeTranslations(resources['pl'].translation, sandbox4_pl);
mergeTranslations(resources['pt'].translation, sandbox4_pt);
mergeTranslations(resources['ro'].translation, sandbox4_ro);
mergeTranslations(resources['ru'].translation, sandbox4_ru);
mergeTranslations(resources['sk'].translation, sandbox4_sk);
mergeTranslations(resources['sv'].translation, sandbox4_sv);
mergeTranslations(resources['ta'].translation, sandbox4_ta);
mergeTranslations(resources['th'].translation, sandbox4_th);
mergeTranslations(resources['tl'].translation, sandbox4_tl);
mergeTranslations(resources['tr'].translation, sandbox4_tr);
mergeTranslations(resources['uk'].translation, sandbox4_uk);
mergeTranslations(resources['vi'].translation, sandbox4_vi);
mergeTranslations(resources['zh-CN'].translation, sandbox4_zh_CN);
mergeTranslations(resources['zh-TW'].translation, sandbox4_zh_TW);
mergeTranslations(resources.en.translation, sandbox5_en);
mergeTranslations(resources['ar'].translation, sandbox5_ar);
mergeTranslations(resources['bg'].translation, sandbox5_bg);
mergeTranslations(resources['bn'].translation, sandbox5_bn);
mergeTranslations(resources['cs'].translation, sandbox5_cs);
mergeTranslations(resources['da'].translation, sandbox5_da);
mergeTranslations(resources['de'].translation, sandbox5_de);
mergeTranslations(resources['el'].translation, sandbox5_el);
mergeTranslations(resources['es'].translation, sandbox5_es);
mergeTranslations(resources['fi'].translation, sandbox5_fi);
mergeTranslations(resources['fr'].translation, sandbox5_fr);
mergeTranslations(resources['he'].translation, sandbox5_he);
mergeTranslations(resources['hi'].translation, sandbox5_hi);
mergeTranslations(resources['hr'].translation, sandbox5_hr);
mergeTranslations(resources['hu'].translation, sandbox5_hu);
mergeTranslations(resources['id'].translation, sandbox5_id);
mergeTranslations(resources['it'].translation, sandbox5_it);
mergeTranslations(resources['ja'].translation, sandbox5_ja);
mergeTranslations(resources['ko'].translation, sandbox5_ko);
mergeTranslations(resources['ms'].translation, sandbox5_ms);
mergeTranslations(resources['nl'].translation, sandbox5_nl);
mergeTranslations(resources['no'].translation, sandbox5_no);
mergeTranslations(resources['pl'].translation, sandbox5_pl);
mergeTranslations(resources['pt'].translation, sandbox5_pt);
mergeTranslations(resources['ro'].translation, sandbox5_ro);
mergeTranslations(resources['ru'].translation, sandbox5_ru);
mergeTranslations(resources['sk'].translation, sandbox5_sk);
mergeTranslations(resources['sv'].translation, sandbox5_sv);
mergeTranslations(resources['ta'].translation, sandbox5_ta);
mergeTranslations(resources['th'].translation, sandbox5_th);
mergeTranslations(resources['tl'].translation, sandbox5_tl);
mergeTranslations(resources['tr'].translation, sandbox5_tr);
mergeTranslations(resources['uk'].translation, sandbox5_uk);
mergeTranslations(resources['vi'].translation, sandbox5_vi);
mergeTranslations(resources['zh-CN'].translation, sandbox5_zh_CN);
mergeTranslations(resources['zh-TW'].translation, sandbox5_zh_TW);
mergeTranslations(resources.en.translation, auto_en);
mergeTranslations(resources['ar'].translation, core_ar);
mergeTranslations(resources['ar'].translation, auto_ar);
mergeTranslations(resources['bg'].translation, core_bg);
mergeTranslations(resources['bg'].translation, auto_bg);
mergeTranslations(resources['bn'].translation, core_bn);
mergeTranslations(resources['bn'].translation, auto_bn);
mergeTranslations(resources['cs'].translation, core_cs);
mergeTranslations(resources['cs'].translation, auto_cs);
mergeTranslations(resources['da'].translation, core_da);
mergeTranslations(resources['da'].translation, auto_da);
mergeTranslations(resources['de'].translation, core_de);
mergeTranslations(resources['de'].translation, auto_de);
mergeTranslations(resources['el'].translation, core_el);
mergeTranslations(resources['el'].translation, auto_el);
mergeTranslations(resources['es'].translation, core_es);
mergeTranslations(resources['es'].translation, auto_es);
mergeTranslations(resources['fi'].translation, core_fi);
mergeTranslations(resources['fi'].translation, auto_fi);
mergeTranslations(resources['fr'].translation, core_fr);
mergeTranslations(resources['fr'].translation, auto_fr);
mergeTranslations(resources['he'].translation, core_he);
mergeTranslations(resources['he'].translation, auto_he);
mergeTranslations(resources['hi'].translation, core_hi);
mergeTranslations(resources['hi'].translation, auto_hi);
mergeTranslations(resources['hr'].translation, core_hr);
mergeTranslations(resources['hr'].translation, auto_hr);
mergeTranslations(resources['hu'].translation, core_hu);
mergeTranslations(resources['hu'].translation, auto_hu);
mergeTranslations(resources['id'].translation, core_id);
mergeTranslations(resources['id'].translation, auto_id);
mergeTranslations(resources['it'].translation, core_it);
mergeTranslations(resources['it'].translation, auto_it);
mergeTranslations(resources['ja'].translation, core_ja);
mergeTranslations(resources['ja'].translation, auto_ja);
mergeTranslations(resources['ko'].translation, core_ko);
mergeTranslations(resources['ko'].translation, auto_ko);
mergeTranslations(resources['ms'].translation, core_ms);
mergeTranslations(resources['ms'].translation, auto_ms);
mergeTranslations(resources['nl'].translation, core_nl);
mergeTranslations(resources['nl'].translation, auto_nl);
mergeTranslations(resources['no'].translation, core_no);
mergeTranslations(resources['no'].translation, auto_no);
mergeTranslations(resources['pl'].translation, core_pl);
mergeTranslations(resources['pl'].translation, auto_pl);
mergeTranslations(resources['pt'].translation, core_pt);
mergeTranslations(resources['pt'].translation, auto_pt);
mergeTranslations(resources['ro'].translation, core_ro);
mergeTranslations(resources['ro'].translation, auto_ro);
mergeTranslations(resources['ru'].translation, core_ru);
mergeTranslations(resources['ru'].translation, auto_ru);
mergeTranslations(resources['sk'].translation, core_sk);
mergeTranslations(resources['sk'].translation, auto_sk);
mergeTranslations(resources['sv'].translation, core_sv);
mergeTranslations(resources['sv'].translation, auto_sv);
mergeTranslations(resources['ta'].translation, core_ta);
mergeTranslations(resources['ta'].translation, auto_ta);
mergeTranslations(resources['th'].translation, core_th);
mergeTranslations(resources['th'].translation, auto_th);
mergeTranslations(resources['tl'].translation, core_tl);
mergeTranslations(resources['tl'].translation, auto_tl);
mergeTranslations(resources['tr'].translation, core_tr);
mergeTranslations(resources['tr'].translation, auto_tr);
mergeTranslations(resources['uk'].translation, core_uk);
mergeTranslations(resources['uk'].translation, auto_uk);
mergeTranslations(resources['vi'].translation, core_vi);
mergeTranslations(resources['vi'].translation, auto_vi);
mergeTranslations(resources['zh-CN'].translation, core_zh_CN);
mergeTranslations(resources['zh-CN'].translation, auto_zh_CN);
mergeTranslations(resources['zh-TW'].translation, core_zh_TW);
mergeTranslations(resources['zh-TW'].translation, auto_zh_TW);

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // Default language, overridden by App.tsx URL logic
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;
