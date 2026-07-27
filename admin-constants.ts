/**
 * Default seed data used by admin route modules.
 * Extracted from server.ts.
 */
import { GENRES, STYLE_KEYWORDS, ART_STYLES } from './types';

export const DEFAULT_CATEGORIES = [
    // 1. Genres
    ...GENRES.map((name) => {
        const id = `genre-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const emoji = ({
            "Classic Horror": "💀",
            "Superhero Action": "⚡",
            "Dark Sci-Fi": "🚀",
            "High Fantasy": "🏰",
            "Neon Noir Detective": "🕵️",
            "Wasteland Apocalypse": "☣️",
            "Lighthearted Comedy": "🎭",
            "Teen Drama / Slice of Life": "🎒",
            "Anime Story": "🌸",
            "Historical Archeology Tales": "🏺",
            "Custom": "✨"
        } as Record<string, string>)[name] || "📖";
        return {
            id,
            category_type: 'Genre',
            name,
            emoji,
            prompt_instruction: STYLE_KEYWORDS[name] || 'clean illustration, modern aesthetic',
            is_featured: ['Superhero Action', 'Classic Horror', 'Dark Sci-Fi', 'Anime Story'].includes(name),
            is_active: true,
            created_at: new Date().toISOString()
        };
    }),
    // 2. Art Styles
    ...ART_STYLES.map((style) => {
        return {
            id: `style-${style.id}`,
            category_type: 'Style',
            name: style.name,
            emoji: '🎨',
            prompt_instruction: style.promptTemplate,
            is_featured: ['vibrant-comic', 'studio-ghibli'].includes(style.id),
            is_active: true,
            created_at: new Date().toISOString()
        };
    })
];

export const DEFAULT_FLOWS = [
    {
        id: "flow-comic-series",
        slug: "comic-series",
        title: "Comic Series Flow",
        short_description: "Sequential storytelling focusing on character action and script outline.",
        best_for: "Action, sci-fi, manga, and long-term character arcs.",
        output_hint: "Standard multi-panel page grids with word balloons.",
        related_formats: ["comic"],
        visibility_state: "Active",
        show_in_onboarding: true,
        featured: true,
        sort_order: 1
    },
    {
        id: "flow-visual-lesson",
        slug: "visual-lesson",
        title: "Visual Lesson Flow",
        short_description: "Educational flow featuring clear definitions, labels, and structured chapters.",
        best_for: "Classrooms, homeschool syllabi, and study guides.",
        output_hint: "Numbered stages with learning checkpoint prompts.",
        related_formats: ["visual-lesson", "history-lesson"],
        visibility_state: "Active",
        show_in_onboarding: true,
        featured: true,
        sort_order: 2
    },
    {
        id: "flow-bilingual-reader",
        slug: "bilingual-reader",
        title: "Bilingual Reader Flow",
        short_description: "Dual-track reading designed to build confidence in a secondary language.",
        best_for: "Bilingual children, ESL students, and vocabulary builders.",
        output_hint: "Side-by-side translated bubble pairs or alternating pages.",
        related_formats: ["bilingual-story"],
        visibility_state: "Active",
        show_in_onboarding: true,
        featured: true,
        sort_order: 3
    },
    {
        id: "flow-read-aloud",
        slug: "read-aloud",
        title: "Read-Aloud Story Flow",
        short_description: "Optimized for voiceover narration and rich ambient soundscapes.",
        best_for: "Bedtime stories, preschool reading, and audiobooks.",
        output_hint: "Audio-synchronized story text overlay.",
        related_formats: ["kid-story", "bilingual-story"],
        visibility_state: "Active",
        show_in_onboarding: true,
        featured: false,
        sort_order: 4
    },
    {
        id: "flow-concept-tester",
        slug: "concept-tester",
        title: "Quick Concept Test Flow",
        short_description: "Single-scene storyboard to test prompts, characters, or style ideas.",
        best_for: "Admin testing, prompt sandboxes, and style prototyping.",
        output_hint: "A fast, single-panel preview run.",
        related_formats: ["comic", "visual-lesson"],
        visibility_state: "Internal",
        show_in_onboarding: false,
        featured: false,
        sort_order: 5
    }
];

export const DEFAULT_GOALS = [
    {
        id: "goal-fluency",
        slug: "improve-reading-fluency",
        title: "Improve reading fluency",
        short_description: "Strengthen word recognition and reading speed through rhythmic beats.",
        category: "Reading",
        tags: ["fluency", "speed"],
        related_formats: ["bilingual-story", "kid-story"],
        related_creator_flows: ["bilingual-reader", "read-aloud"],
        importance: "Primary",
        visibility_state: "Active",
        show_in_wizard: true,
        show_in_homeschool: true,
        show_in_teacher_flows: true,
        featured: true,
        sort_order: 1
    },
    {
        id: "goal-comprehension",
        slug: "strengthen-reading-comprehension",
        title: "Strengthen reading comprehension",
        short_description: "Track plot details and character motives through visual context.",
        category: "Reading",
        tags: ["comprehension", "plot"],
        related_formats: ["comic", "history-lesson"],
        related_creator_flows: ["comic-series", "visual-lesson"],
        importance: "Primary",
        visibility_state: "Active",
        show_in_wizard: true,
        show_in_homeschool: true,
        show_in_teacher_flows: true,
        featured: true,
        sort_order: 2
    },
    {
        id: "goal-confidence",
        slug: "build-reading-confidence",
        title: "Build reading confidence",
        short_description: "Simple sentences matched with clear visual cues for early learners.",
        category: "Reading",
        tags: ["confidence", "early-reading"],
        related_formats: ["kid-story"],
        related_creator_flows: ["read-aloud"],
        importance: "Primary",
        visibility_state: "Active",
        show_in_wizard: true,
        show_in_homeschool: true,
        show_in_teacher_flows: false,
        featured: false,
        sort_order: 3
    },
    {
        id: "goal-science-clear",
        slug: "explain-science-concept-clearly",
        title: "Explain a science concept clearly",
        short_description: "Make complex scientific ideas simple and fun to visualize.",
        category: "Science",
        tags: ["science", "concepts"],
        related_formats: ["science-explainer"],
        related_creator_flows: ["visual-lesson"],
        importance: "Primary",
        visibility_state: "Active",
        show_in_wizard: true,
        show_in_homeschool: true,
        show_in_teacher_flows: true,
        featured: true,
        sort_order: 4
    },
    {
        id: "goal-science-step",
        slug: "show-science-process-step-by-step",
        title: "Show a science process step by step",
        short_description: "Explain biological or mechanical cycles incrementally.",
        category: "Science",
        tags: ["science", "process"],
        related_formats: ["science-explainer"],
        related_creator_flows: ["visual-lesson"],
        importance: "Primary",
        visibility_state: "Active",
        show_in_wizard: true,
        show_in_homeschool: true,
        show_in_teacher_flows: true,
        featured: false,
        sort_order: 5
    },
    {
        id: "goal-bilingual-vocab",
        slug: "practice-vocabulary-in-two-languages",
        title: "Practice vocabulary in two languages",
        short_description: "Map words between original and translated tracks side-by-side.",
        category: "Language / Vocabulary",
        tags: ["bilingual", "vocabulary"],
        related_formats: ["bilingual-story"],
        related_creator_flows: ["bilingual-reader"],
        importance: "Secondary",
        visibility_state: "Active",
        show_in_wizard: true,
        show_in_homeschool: true,
        show_in_teacher_flows: false,
        featured: true,
        sort_order: 6
    },
    {
        id: "goal-proud",
        slug: "create-story-reader-feels-proud-of",
        title: "Create a story the reader feels proud of",
        short_description: "Create an exciting branching narrative that rewards the reader's choices.",
        category: "Confidence / Sharing",
        tags: ["pride", "sharing"],
        related_formats: ["comic", "kid-story"],
        related_creator_flows: ["comic-series"],
        importance: "Secondary",
        visibility_state: "Active",
        show_in_wizard: true,
        show_in_homeschool: true,
        show_in_teacher_flows: false,
        featured: false,
        sort_order: 7
    }
];

export const DEFAULT_USAGE_MODES = [
    {
        id: "mode-realistic",
        slug: "realistic",
        label: "Realistic reference",
        shortDescription: "A photo-like representation matching the reference image closely.",
        generationBehaviorHint: "Create highly detailed, lifelike renderings of the subject.",
        safetyNotes: "Requires explicit consent from the subject or guardian. Intended for personal use.",
        visibleInWizard: true,
        sortOrder: 1,
        status: "Active"
    },
    {
        id: "mode-stylized",
        slug: "stylized",
        label: "Stylized avatar",
        shortDescription: "A cute, stylized, or cartoonish translation of the photo.",
        generationBehaviorHint: "Translate likeness into 3D Pixar, Anime, or Crayon sketch styles.",
        safetyNotes: "Default safe setting. Perfect for children and family projects.",
        visibleInWizard: true,
        sortOrder: 2,
        status: "Active"
    },
    {
        id: "mode-inspired",
        slug: "inspired",
        label: "Inspired by photo",
        shortDescription: "Loosely inspired by the reference photo (colors, hair shape, overall vibe).",
        generationBehaviorHint: "Use key features but adapt heavily to the chosen aesthetic.",
        safetyNotes: "High creative freedom, low privacy risk.",
        visibleInWizard: true,
        sortOrder: 3,
        status: "Active"
    },
    {
        id: "mode-illustrated",
        slug: "illustrated",
        label: "Recurring illustrated character",
        shortDescription: "Fully hand-drawn look with zero photo likeness (ideal for custom guides).",
        generationBehaviorHint: "Ignore photo references. Focus entirely on prompt character description.",
        safetyNotes: "100% safe. No personal likeness used.",
        visibleInWizard: true,
        sortOrder: 4,
        status: "Active"
    },
    {
        id: "mode-none",
        slug: "none",
        label: "No photo reference",
        shortDescription: "Pure text-to-image prompt creation. No upload required.",
        generationBehaviorHint: "Build strictly from the visual summary text prompts.",
        safetyNotes: "No privacy/consent requirements.",
        visibleInWizard: true,
        sortOrder: 5,
        status: "Active"
    }
];

export const DEFAULT_PERSONAS = [
    {
        id: "persona-science-guide",
        slug: "professor-pumpernickel",
        displayName: "Professor Pumpernickel",
        shortDescription: "A quirky, warm-hearted science explainer guide who loves gadgets.",
        longDescription: "A friendly recurring science tutor who helps kids understand complex biology, space, and math topics.",
        personaType: "Science Helper",
        roleDefaults: ["Science explainer", "Narrator guide"],
        ageGroup: "General",
        audience_tags: ["STEM", "Education"],
        language_tags: ["en"],
        stylePreference: "Handdrawn Sketch",
        visualSummary: "An elderly scientist with wild white hair, round glasses, a green tweed jacket, and a pocket magnifying glass.",
        generationSafeDescription: "An elderly character with messy white hair, thin round spectacles, wearing a cozy green tweed blazer.",
        usageMode: "none",
        referenceImageStatus: "None",
        recurringCharacter: true,
        visibilityScope: "Public",
        consentStatus: "Granted",
        moderationStatus: "Approved",
        approvedForGeneration: true,
        sort_order: 1,
        status: "Active"
    },
    {
        id: "persona-default-child",
        slug: "curious-cody",
        displayName: "Curious Cody",
        shortDescription: "An eager young explorer who asks endless questions.",
        longDescription: "Ideal protagonist for early readers and homeschool educational journeys.",
        personaType: "Child Reader",
        roleDefaults: ["Main character"],
        ageGroup: "Grade K-2",
        audience_tags: ["Early Reader"],
        language_tags: ["en"],
        stylePreference: "Pixar 3D",
        visualSummary: "A 7-year-old child with curly red hair, freckles, wearing a blue t-shirt with a yellow star and canvas sneakers.",
        generationSafeDescription: "A young child with red curly hair, light freckles, wearing a plain blue t-shirt.",
        usageMode: "none",
        referenceImageStatus: "None",
        recurringCharacter: true,
        visibilityScope: "Public",
        consentStatus: "Granted",
        moderationStatus: "Approved",
        approvedForGeneration: true,
        sort_order: 2,
        status: "Active"
    }
];

export const DEFAULT_STYLES = [
    {
        id: "style-pixar-3d",
        slug: "pixar-3d",
        title: "Pixar 3D Adventure",
        shortDescription: "Warm glossy 3D renders, perfect for children.",
        longDescription: "A soft, volumetric 3D style resembling modern animation studio outputs. Highlighted by bright spherical lighting, expressive faces, and high-fidelity textures.",
        visualMood: "Warm, Adventurous, Glossy",
        audienceTags: ["Children", "Early Readers"],
        useCaseTags: ["Bilingual Stories", "Bedtime Stories"],
        styleFamily: "3D Animation",
        recommendationTags: ["Warm", "Friendly"],
        visibleInStudio: true,
        visibleInHomeschool: true,
        visibleInTeacherFlow: true,
        visibilityState: "Active",
        featured: true,
        sortOrder: 1,
        internalTestingOnly: false,
        artworkReference: "/pixar.png"
    },
    {
        id: "style-retro-anime",
        slug: "retro-anime",
        title: "Retro Anime Vectors",
        shortDescription: "Classic cel-shaded anime illustration styles.",
        longDescription: "A handdrawn aesthetic from 90s visual novels. Defined by sharp linework, rich flat color fills, and dramatic camera perspectives.",
        visualMood: "Kinetic, Dynamic, Nostalgic",
        audienceTags: ["Teens", "Students"],
        useCaseTags: ["History Lesson Comics", "Action Stories"],
        styleFamily: "Vector Anime",
        recommendationTags: ["Cool", "Vibrant"],
        visibleInStudio: true,
        visibleInHomeschool: true,
        visibleInTeacherFlow: true,
        visibilityState: "Active",
        featured: false,
        sortOrder: 2,
        internalTestingOnly: false,
        artworkReference: "/anime.png"
    },
    {
        id: "style-noir-inks",
        slug: "noir-inks",
        title: "Noir Comic Inks",
        shortDescription: "Heavy ink washes and dramatic contrast.",
        longDescription: "Stark chiaroscuro ink sketch art. Perfect for high-stakes mysteries, detective layouts, and educational history modules requiring serious focus.",
        visualMood: "Mysterious, High-contrast, Gritty",
        audienceTags: ["General", "Mature"],
        useCaseTags: ["Detective Stories", "History Lessons"],
        styleFamily: "Comic Inked Sketch",
        recommendationTags: ["Serious", "Dramatic"],
        visibleInStudio: true,
        visibleInHomeschool: false,
        visibleInTeacherFlow: true,
        visibilityState: "Active",
        featured: false,
        sortOrder: 3,
        internalTestingOnly: false,
        artworkReference: "/noir.png"
    }
];

export const DEFAULT_PROMPT_TEMPLATES = [
    {
        id: "template-panel-standard",
        slug: "panel-standard",
        title: "Standard Panel Prompt Layer",
        workflowType: "Panel",
        formatMappings: "Comic grids and panel layouts mapping to a single story beat",
        creatorFlowMappings: "Captions and speech bubbles overlaid on illustration",
        styleModifiers: "Clean digital outlines, volumetric ambient occlusion",
        educationalMode: "Add labels or visual descriptions if scientific terms are highlighted",
        bilingualHandlingHint: "Provide side-by-side translated cues in prompt parameters",
        personaConsistencyHint: "Inject character visual descriptions and clothing identifiers",
        status: "Active",
        visibleInAdmin: true,
        internalTestingOnly: false
    },
    {
        id: "template-cover-standard",
        slug: "cover-standard",
        title: "Standard Book Cover Prompt Layer",
        workflowType: "Cover",
        formatMappings: "Title text offset, main character facing the camera",
        creatorFlowMappings: "Central high-fidelity hero pose with atmospheric background",
        styleModifiers: "Epic layout with rich depth of field",
        educationalMode: "Insert subtitle focus banners",
        bilingualHandlingHint: "Dual-language titles rendered in a clean font",
        personaConsistencyHint: "Emphasize key character features in high detail",
        status: "Active",
        visibleInAdmin: true,
        internalTestingOnly: false
    }
];

export const DEFAULT_LANGUAGES = [
    {
        id: "lang-en", code: "en-US", slug: "english", displayName: "English", nativeName: "English",
        direction: "ltr", status: "Active", visibleInStudio: true, visibleInKidStory: true,
        visibleInComicStudio: true, visibleInTeacherFlow: true, visibleInHomeschool: true,
        supportsBilingual: true, supportsNarration: true, supportsTranslation: true,
        internalTestingOnly: false, educationalNotes: "Global primary standard language",
        sortOrder: 1, featured: true
    },
    {
        id: "lang-es", code: "es-MX", slug: "spanish", displayName: "Spanish", nativeName: "Español",
        direction: "ltr", status: "Active", visibleInStudio: true, visibleInKidStory: true,
        visibleInComicStudio: true, visibleInTeacherFlow: true, visibleInHomeschool: true,
        supportsBilingual: true, supportsNarration: true, supportsTranslation: true,
        internalTestingOnly: false, educationalNotes: "Primary dual-language and translation track for US classrooms",
        sortOrder: 2, featured: true
    },
    {
        id: "lang-ja", code: "ja-JP", slug: "japanese", displayName: "Japanese", nativeName: "日本語",
        direction: "ltr", status: "Active", visibleInStudio: true, visibleInKidStory: false,
        visibleInComicStudio: true, visibleInTeacherFlow: true, visibleInHomeschool: false,
        supportsBilingual: true, supportsNarration: true, supportsTranslation: true,
        internalTestingOnly: false, educationalNotes: "Advanced character-based reading path",
        sortOrder: 3, featured: false
    }
];

export const DEFAULT_GLOSSARY = [
    {
        id: "glossary-1", slug: "pumpernickel", sourceTerm: "Professor Pumpernickel", preferredTranslation: "Profesor Pumpernickel",
        sourceLanguageCode: "en-US", targetLanguageCode: "es-MX", termType: "Name", preserveTerm: true,
        scopeType: "Global", internalTestingOnly: false, status: "Active", sortOrder: 1
    },
    {
        id: "glossary-2", slug: "photosynthesis", sourceTerm: "photosynthesis", preferredTranslation: "fotosíntesis",
        sourceLanguageCode: "en-US", targetLanguageCode: "es-MX", termType: "Science Term", preserveTerm: true,
        scopeType: "Global", internalTestingOnly: false, status: "Active", sortOrder: 2
    }
];

export const DEFAULT_VOICES = [
    {
        id: "voice-narrator-1", slug: "narrator-gentle-1", displayName: "Gentle Educator (US)",
        providerId: "elevenlabs-voice-sim", modelId: "eleven_monolingual_v1",
        languageCodes: ["en-US"], primaryLanguageCode: "en-US", accentLabel: "US Friendly",
        toneLabel: "Warm & Clear", ageDescriptor: "Adult", narratorSuitability: true,
        childSafe: true, classroomSafe: true, supportsBilingualWorkflows: false,
        visibleInStudio: true, visibleInKidStory: true, visibleInComicStudio: true,
        visibleInTeacherFlow: true, visibleInHomeschool: true, internalTestingOnly: false,
        status: "Active", featured: true, sortOrder: 1
    },
    {
        id: "voice-narrator-2", slug: "narrator-es-1", displayName: "Narrador Amistoso (MX)",
        providerId: "elevenlabs-voice-sim", modelId: "eleven_multilingual_v2",
        languageCodes: ["es-MX"], primaryLanguageCode: "es-MX", accentLabel: "Mexican Neutral",
        toneLabel: "Energetic & Kind", ageDescriptor: "Adult", narratorSuitability: true,
        childSafe: true, classroomSafe: true, supportsBilingualWorkflows: true,
        visibleInStudio: true, visibleInKidStory: true, visibleInComicStudio: true,
        visibleInTeacherFlow: true, visibleInHomeschool: true, internalTestingOnly: false,
        status: "Active", featured: true, sortOrder: 2
    }
];

export const DEFAULT_SOUNDTRACKS = [
    {
        id: "track-1", slug: "dreamy-classroom", title: "Dreamy Homeschool Classroom",
        category: "Soundtrack", mood: "Soft & Inspiring", educationalSuitability: true,
        familySuitability: true, classroomSuitability: true, languageNeutral: true,
        status: "Active", internalTestingOnly: false, sortOrder: 1
    },
    {
        id: "track-2", slug: "adventure-explorers", title: "Fun Science Explorers",
        category: "Soundtrack", mood: "Upbeat & Playful", educationalSuitability: true,
        familySuitability: true, classroomSuitability: true, languageNeutral: true,
        status: "Active", internalTestingOnly: false, sortOrder: 2
    }
];

