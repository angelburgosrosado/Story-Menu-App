/**
 * Screen Name: Types Definitions
 * Purpose: Central TypeScript interfaces and data constants for Story.Menu
 * Version: 1.2.0
 * Date: 2026-07-09
 * Phase: Phase 3 - Character and Photo-Persona System Implementation
 * What changed in this revision: Added TypeScript interfaces for Persona, ReferenceImage, RoleAssignment, and UsageMode.
 * 
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MAX_STORY_PAGES = 10;
export const BACK_COVER_PAGE = 11;
export const TOTAL_PAGES = 11;
export const INITIAL_PAGES = 2;
export const GATE_PAGE = 2;
export const BATCH_SIZE = 6;
export const DECISION_PAGES = [3];

export const GENRES = ["Superhero Action", "Historical Archeology Tales", "Classic Horror", "Dark Sci-Fi", "High Fantasy", "Neon Noir Detective", "Wasteland Apocalypse", "Lighthearted Comedy", "Teen Drama / Slice of Life", "Anime Story", "Custom"];

export const STYLE_KEYWORDS: Record<string, string> = {
    "Superhero Action": "dynamic comic book style, bold lines, vibrant colors, heroic poses, cinematic lighting, dramatic shading",
    "Historical Archeology Tales": "vintage pulp adventure, sepia tones, detailed environments, realistic proportions, matte painting, treasure hunter aesthetic",
    "Classic Horror": "macabre, dark shadows, high contrast, eerie atmosphere, gothic illustration style, chilling",
    "Dark Sci-Fi": "cyberpunk, grimdark, neon glow, intricate mechanical details, moody atmosphere, futuristic dystopian",
    "High Fantasy": "epic fantasy illustration, ethereal lighting, ornate armor, mystical creatures, vibrant magic effects, rich oil painting",
    "Neon Noir Detective": "neo-noir, synthwave color palette, stark shadows, rain-slicked streets, cinematic angles, hardboiled",
    "Wasteland Apocalypse": "post-apocalyptic, grimy, rusty textures, desaturated colors, harsh sunlight, survivalist gear, detailed ruins",
    "Lighthearted Comedy": "cartoony, bright pastel colors, exaggerated expressions, clean lines, flat shading, cheerful",
    "Teen Drama / Slice of Life": "webtoon style, soft lighting, expressive faces, modern casual clothing, everyday environments, cel shaded",
    "Anime Story": "anime style, cel-shaded, large expressive eyes, dynamic action lines, colorful hair, japanese animation aesthetic, vibrant",
    "Custom": "clean illustration, modern aesthetic, highly detailed, professional art"
};
export const TONES = [
    "ACTION-HEAVY (Short, punchy dialogue. Focus on kinetics.)",
    "INNER-MONOLOGUE (Heavy captions revealing thoughts.)",
    "QUIPPY (Characters use humor as a defense mechanism.)",
    "OPERATIC (Grand, dramatic declarations and high stakes.)",
    "CASUAL (Natural dialogue, focus on relationships/gossip.)",
    "WHOLESOME (Warm, gentle, optimistic.)"
];

export interface ArtStyle {
    id: string;
    name: string;
    promptTemplate: string;
}

export const ART_STYLES: ArtStyle[] = [
    { id: 'photorealistic-cartoon', name: 'Photorealistic Cartoon Style', promptTemplate: 'Photorealistic Cartoon Style, hyper-detailed 3D render, Disney Pixar style, cinematic lighting' },
    { id: 'cinema-3d', name: 'Cinema 3D Rendering', promptTemplate: 'Cinema 3D Render Animation, Unreal Engine 5, Octane Render, 8k resolution, volumetric lighting' },
    { id: '8-panel', name: '8 Panel Comic', promptTemplate: '8 panel comic layout, sequential art, comic book grid, varied panel sizes' },
    { id: 'roblox-comic', name: 'Roblox Players Comic Gen', promptTemplate: 'Roblox game style, blocky avatars, Roblox aesthetics, bright game colors' },
    { id: 'minecraft-comic', name: 'Minecraft Players Comic Gen', promptTemplate: 'Minecraft voxel style, blocky environment, pixelated textures, Minecraft aesthetics' },
    { id: 'roblox-generator', name: 'Roblox Player Generator', promptTemplate: 'Detailed Roblox avatar character design, Roblox studio render, crisp 3D' },
    { id: 'vibrant-comic', name: 'Vibrant Comic Book', promptTemplate: 'Vibrant Comic Book style, rich dynamic colors, bold ink outlines, energetic halftone dots' },
    { id: 'studio-ghibli', name: 'Studio Ghibli AI', promptTemplate: 'Studio Ghibli anime style, Hayao Miyazaki, lush watercolor backgrounds, cel-shaded characters' },
    { id: 'watercolor-comic', name: 'Watercolor Comic Strip', promptTemplate: 'Watercolor comic strip, fluid brush strokes, soft pastel colors, traditional media' },
    { id: 'paper-cut', name: 'Paper Cut Style', promptTemplate: 'Paper cut style, layered papercraft, drop shadows, textured craft paper, diorama aesthetic' },
    { id: 'retro-scifi', name: 'Retro Sci-Fi', promptTemplate: 'Retro Sci-Fi, 1970s pulp science fiction, vintage colors, Moebius style, worn paper texture' },
    { id: 'minimalist-comic', name: 'Minimalist Comic Art', promptTemplate: 'Minimalist comic art, clean lines, plenty of negative space, simple shapes, elegant' }
];

export const LANGUAGES = [
    { code: 'en-US', name: '🇺🇸 English' },
    { code: 'es-MX', name: '🇲🇽 Spanish' },
    { code: 'ja-JP', name: '🇯🇵 Japanese' },
    { code: 'ar-EG', name: '🇪🇬 Arabic' },
    { code: 'bg-BG', name: '🇧🇬 Bulgarian' },
    { code: 'bn-IN', name: '🇮🇳 Bengali' },
    { code: 'cs-CZ', name: '🇨🇿 Czech' },
    { code: 'da-DK', name: '🇩🇰 Danish' },
    { code: 'de-DE', name: '🇩🇪 German' },
    { code: 'el-GR', name: '🇬🇷 Greek' },
    { code: 'fi-FI', name: '🇫🇮 Finnish' },
    { code: 'fr-FR', name: '🇫🇷 French' },
    { code: 'he-IL', name: '🇮🇱 Hebrew' },
    { code: 'hi-IN', name: '🇮🇳 Hindi' },
    { code: 'hr-HR', name: '🇭🇷 Croatian' },
    { code: 'hu-HU', name: '🇭🇺 Hungarian' },
    { code: 'id-ID', name: '🇮🇩 Indonesian' },
    { code: 'it-IT', name: '🇮🇹 Italian' },
    { code: 'ko-KR', name: '🇰🇷 Korean' },
    { code: 'ms-MY', name: '🇲🇾 Malay' },
    { code: 'nl-NL', name: '🇳🇱 Dutch' },
    { code: 'no-NO', name: '🇳🇴 Norwegian' },
    { code: 'pl-PL', name: '🇵🇱 Polish' },
    { code: 'pt-BR', name: '🇧🇷 Portuguese' },
    { code: 'ro-RO', name: '🇷🇴 Romanian' },
    { code: 'ru-RU', name: '🇷🇺 Russian' },
    { code: 'sk-SK', name: '🇸🇰 Slovak' },
    { code: 'sv-SE', name: '🇸🇪 Swedish' },
    { code: 'ta-IN', name: '🇮🇳 Tamil' },
    { code: 'th-TH', name: '🇹🇭 Thai' },
    { code: 'tl-PH', name: '🇵🇭 Tagalog' },
    { code: 'tr-TR', name: '🇹🇷 Turkish' },
    { code: 'ua-UA', name: '🇺🇦 Ukrainian' },
    { code: 'vi-VN', name: '🇻🇳 Vietnamese' },
    { code: 'zh-CN', name: '🇨🇳 Chinese (Simplified)' },
    { code: 'zh-TW', name: '🇹🇼 Chinese (Traditional)' }
];

export interface ComicFace {
  id: string;
  type: 'cover' | 'story' | 'back_cover';
  imageUrl?: string;
  narrative?: Beat;
  choices: string[];
  resolvedChoice?: string;
  isLoading: boolean;
  pageIndex?: number;
  isDecisionPage?: boolean;
}

export interface Beat {
  caption?: string;
  dialogue?: string;
  scene: string;
  choices: string[];
  focus_char: 'hero' | 'friend' | 'villain' | 'other';
}

export const VOICES = [
    { id: 'Zephyr', name: 'Zephyr (Heroic & Bold)' },
    { id: 'Kore', name: 'Kore (Dramatic & Clear)' },
    { id: 'Fenrir', name: 'Fenrir (Mysterious & Deep)' },
    { id: 'Puck', name: 'Puck (Playful & Quick)' },
    { id: 'Charon', name: 'Charon (Dark & Intense)' }
];

export interface Persona {
  base64: string;
  desc: string;
  hairText?: string;
  clothesText?: string;
}

export interface CharacterIdentitySchema {
  actor_id: string;
  archetype_role: 'Hero' | 'Co-Star' | 'Nemesis';
  persistence_layer: {
    biometric_backbone: string;
    structural_constants: string;
    chromatic_anchor: string;
  };
  adaptive_layer: {
    sartorial_style: string;
    active_wardrobe: string;
  };
  rendering_directives: {
    art_style_lock: string;
    continuity_weight: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

export interface ChapterGoal {
  chapterNum: number;
  title: string;
  goal: string;
}

export const WARDROBE_PRESETS = {
        Hero: {
            Tactical: {
                name: "Tactical Vanguard Armor",
                emoji: "🛡️",
                desc: "A form-fitting dark charcoal Kevlar weave suit with glowing cybernetic blue trim, carbon-fiber shoulder pauldrons, magnetic leg holsters, and heavy-duty steel-toed combat boots.",
                styleLock: "Modern American Comic, high contrast digital outlines",
                sartorialStyle: "High-Tech Military Cyber-Vanguard"
            },
            Gala: {
                name: "Gala Elite Splendor",
                emoji: "✨",
                desc: "A pristine tailored satin-lapel midnight blue tuxedo with pristine silver silk embroidery pattern, light-up sapphire cufflinks, and a sleek modern smart-watch chronometer.",
                styleLock: "Classic Noir Chiaroscuro Comic Art",
                sartorialStyle: "Sophisticated Metahuman High-Society Executive"
            },
            Casual: {
                name: "Metropolitan Casual",
                emoji: "👕",
                desc: "An oversized graphite-gray hoodie emblazoned with a faded neon-green graphic, worn-out vintage blue jeans, scuffed leather high-tops, and dark wire-frame spectacles.",
                styleLock: "Gothic Graphic Novel Ink Hatching",
                sartorialStyle: "Gritty Urban Streetwear"
            }
        },
        'Co-Star': {
            Tactical: {
                name: "Tactical Shadow Recon",
                emoji: "🕵️",
                desc: "A flexible matte-black stealth suit with muted violet ambient strips, thermal goggles perched on the head, lightweight utility belt pouches, and silent rubber-soled infiltration footwear.",
                styleLock: "High-tension espionage manga style",
                sartorialStyle: "Covert Spec-Ops Scouting Infiltrator"
            },
            Gala: {
                name: "Gala Velvet Phantom",
                emoji: "👗",
                desc: "A flowy backless deep violet velvet sheath gown with emerald-accented lace sleeves, a concealed micro-holster under the thigh slit, and a diamond choker communicator.",
                styleLock: "Retro 1950s Pulp Illustration, rich color gradients",
                sartorialStyle: "Elegant Classic Dame espionage dress"
            },
            Casual: {
                name: "Casual Decker Lounge",
                emoji: "🧥",
                desc: "A cozy distressed olive bomber jacket, soft black cotton cargo joggers with red accents, fingerless wool gloves, and chunky cyber-runner platform sneakers.",
                styleLock: "Cozy Pastel Anime Comic Frame",
                sartorialStyle: "Lo-fi Cyberpunk Hacker Lounge"
            }
        },
        Villain: {
            Tactical: {
                name: "Nemesis Warmonger Exoskeleton",
                emoji: "💀",
                desc: "Reinforced Obsidian titanium-alloy power armor plates, serrated red-energy shoulder conduits, an opaque crimson-tinted skull facade helmet, and heavy-duty hydraulic energy-venting boots.",
                styleLock: "Brutalist Sci-Fi Cyber-Illustration, thick heavy linework, extreme dark shadows",
                sartorialStyle: "Over-engineered Militaristic Warmonger Exoskeleton"
            },
            Gala: {
                name: "Nemesis Oligarch Haute-Couture",
                emoji: "🍷",
                desc: "An opulent three-piece burgundy velvet suit with gold-gilded baroque lapel patterns, a dark silk cravat, and a heavy ruby-topped metallic mechanical cane weapon.",
                styleLock: "Sinister Elitist Noir Comic Art, deep focus chiaroscuro with royal red lighting",
                sartorialStyle: "Arrogant Plutocratic Syndicate Overlord"
            },
            Casual: {
                name: "Nemesis Viper Lounge Suit",
                emoji: "👓",
                desc: "A casual tailored black silk shirt unbuttoned at the collar, slate-grey tailored linen pants, designer emerald-skin loafers, and thick gradient-tinted gold-framed aviators.",
                styleLock: "Neon Noir Comic Art, high shadow contrast",
                sartorialStyle: "Luxury Rogue Syndicate Underboss"
            }
        }
    };

export interface StartingFormat {
    id: string;
    slug: string;
    title: string;
    short_description: string;
    long_description: string;
    audience_tags: string[];
    category_tags: string[];
    recommended_for: string;
    sample_output_hint: string;
    age_range: string;
    visibility_state: 'Draft' | 'Active' | 'Hidden' | 'Internal';
    show_in_onboarding: boolean;
    show_in_homeschool: boolean;
    show_in_teacher_flows: boolean;
    featured: boolean;
    sort_order: number;
    icon: string;
}

export interface CreatorFlow {
    id: string;
    slug: string;
    title: string;
    short_description: string;
    best_for: string;
    output_hint: string;
    related_formats: string[];
    visibility_state: 'Draft' | 'Active' | 'Hidden' | 'Internal';
    show_in_onboarding: boolean;
    featured: boolean;
    sort_order: number;
}

export interface StoryGoal {
    id: string;
    slug: string;
    title: string;
    short_description: string;
    category: string;
    tags: string[];
    related_formats: string[];
    related_creator_flows: string[];
    importance: 'Primary' | 'Secondary' | 'Optional';
    visibility_state: 'Draft' | 'Active' | 'Hidden' | 'Internal';
    show_in_wizard: boolean;
    show_in_homeschool: boolean;
    show_in_teacher_flows: boolean;
    featured: boolean;
    sort_order: number;
}

export interface Persona {
    id: string;
    slug: string;
    displayName: string;
    shortDescription: string;
    longDescription: string;
    personaType: 'Me' | 'Child Reader' | 'Story Guide' | 'Science Helper' | 'Teacher Voice Character' | 'Family Character' | 'Custom Character';
    roleDefaults: string[];
    ageGroup: string;
    audience_tags: string[];
    language_tags: string[];
    stylePreference: string;
    visualSummary: string;
    generationSafeDescription: string;
    usageMode: string; // references UsageMode.slug
    referenceImageId?: string;
    referenceImageStatus?: 'None' | 'Pending' | 'Approved' | 'Rejected';
    recurringCharacter: boolean;
    visibilityScope: 'Private' | 'Classroom-only' | 'Family-only' | 'Public';
    consentStatus: 'Granted' | 'Not Granted';
    moderationStatus: 'Unmoderated' | 'Approved' | 'Flagged';
    approvedForGeneration: boolean;
    internalNotes?: string;
    sort_order: number;
    status: 'Active' | 'Archived';
    created_at?: string;
}

export interface ReferenceImage {
    id: string;
    fileName: string;
    mimeType: string;
    previewUrl: string;
    uploadStatus: 'Uploading' | 'Completed' | 'Failed';
    cropStatus: 'Uncropped' | 'Cropped';
    moderationStatus: 'Pending' | 'Approved' | 'Flagged';
    consentVerified: boolean;
    approvedForGeneration: boolean;
    altText?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface RoleAssignment {
    id: string;
    personaId: string;
    projectId: string; // or wizard session binding
    roleType: 'Main character' | 'Narrator guide' | 'Supporting family member' | 'Teacher/host' | 'Science explainer' | 'Class mascot' | 'Side character';
    isPrimary: boolean;
    displayPriority: number;
    recurringIntent: boolean;
    storyNotes?: string;
}

export interface UsageMode {
    id: string;
    slug: string;
    label: string;
    shortDescription: string;
    generationBehaviorHint: string;
    safetyNotes: string;
    visibleInWizard: boolean;
    sortOrder: number;
    status: 'Active' | 'Archived';
}

export interface StyleRecord {
    id: string;
    slug: string;
    title: string;
    shortDescription: string;
    longDescription: string;
    visualMood: string;
    audienceTags: string[];
    useCaseTags: string[];
    styleFamily: string;
    recommendationTags: string[];
    visibleInStudio: boolean;
    visibleInHomeschool: boolean;
    visibleInTeacherFlow: boolean;
    visibilityState: 'Draft' | 'Active' | 'Hidden' | 'Internal';
    featured: boolean;
    sortOrder: number;
    internalTestingOnly: boolean;
    previewToken?: string;
    artworkReference?: string;
}

export interface ImageGenerationJob {
    id: string;
    projectId: string;
    workflowType: string;
    providerId: string;
    modelId: string;
    status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
    requestType: 'Panel' | 'Cover' | 'Variant';
    promptTemplateId: string;
    styleId: string;
    personaIds: string[];
    sceneIds?: string[];
    panelIds?: string[];
    coverMode: boolean;
    retryCount: number;
    errorState?: string;
    outputAssetIds: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface PanelGenerationRequest {
    id: string;
    projectId: string;
    panelTitle: string;
    beatSummary: string;
    educationalFocus: string;
    visualSummary: string;
    settingDescription: string;
    personaIds: string[];
    styleId: string;
    languageHandlingMode: 'original' | 'bilingual-parallel' | 'bilingual-alternating';
    consistencyNotes?: string;
    promptSafeDescription: string;
    generationState: 'Pending' | 'Generating' | 'Completed' | 'Failed';
    selectedAssetId?: string;
    variantAssetIds: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface CoverGenerationRequest {
    id: string;
    projectId: string;
    title: string;
    subtitle?: string;
    educationalFocus?: string;
    personaIds: string[];
    styleId: string;
    visualSummary: string;
    promptSafeDescription: string;
    generationState: 'Pending' | 'Generating' | 'Completed' | 'Failed';
    selectedAssetId?: string;
    variantAssetIds: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface GeneratedAsset {
    id: string;
    assetType: 'Panel' | 'Cover' | 'Variant';
    sourceJobId: string;
    sourceRequestId: string;
    previewUrl: string;
    status: 'Pending' | 'Completed' | 'Archived';
    selected: boolean;
    approved: boolean;
    archived: boolean;
    moderationState: 'Unmoderated' | 'Approved' | 'Flagged';
    storageBindingPlaceholder?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface PromptTemplate {
    id: string;
    slug: string;
    title: string;
    workflowType: string;
    formatMappings: string;
    creatorFlowMappings: string;
    styleModifiers: string;
    educationalMode: string;
    bilingualHandlingHint: string;
    personaConsistencyHint: string;
    status: 'Active' | 'Draft' | 'Archived';
    visibleInAdmin: boolean;
    internalTestingOnly: boolean;
}

export interface LanguageRecord {
    id: string;
    code: string;
    slug: string;
    displayName: string;
    nativeName: string;
    localizedDisplayName?: string;
    direction: 'ltr' | 'rtl';
    status: 'Active' | 'Archived';
    visibleInStudio: boolean;
    visibleInKidStory: boolean;
    visibleInComicStudio: boolean;
    visibleInTeacherFlow: boolean;
    visibleInHomeschool: boolean;
    supportsBilingual: boolean;
    supportsNarration: boolean;
    supportsTranslation: boolean;
    internalTestingOnly: boolean;
    educationalNotes?: string;
    sortOrder: number;
    featured: boolean;
}

export interface ProjectLanguageSettings {
    id: string;
    projectId: string;
    sourceLanguageCode: string;
    targetLanguageCode: string;
    bilingualMode: boolean;
    primaryReadingLanguage: string;
    secondaryDisplayLanguage?: string;
    translationToneMode?: string;
    readingOrderMode?: string;
    narrationLanguageMode?: string;
    fallbackLanguageCode?: string;
    status: string;
}

export interface TranslationUnit {
    id: string;
    projectId: string;
    parentContentType: 'Panel' | 'Cover' | 'Teaser';
    parentContentId: string;
    fieldType: 'caption' | 'dialogue' | 'scene' | 'title' | 'subtitle';
    sourceText: string;
    sourceLanguageCode: string;
    translatedText: string;
    targetLanguageCode: string;
    translationStatus: 'Pending' | 'Draft' | 'Needs-Review' | 'Approved';
    reviewStatus: 'Approved' | 'Flagged' | 'Unmoderated';
    protectedTermIds: string[];
    glossaryEntryIds: string[];
    overrideApplied: boolean;
    providerJobId?: string;
    variantGroupId?: string;
}

export interface TranslationJob {
    id: string;
    projectId: string;
    providerId: string;
    modelId: string;
    workflowId: string;
    sourceLanguageCode: string;
    targetLanguageCode: string;
    translationMode: string;
    glossarySnapshot?: string;
    protectedTermsSnapshot?: string;
    status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
    retryCount: number;
    errorState?: string;
    resultBindingIds: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface GlossaryEntry {
    id: string;
    slug: string;
    sourceTerm: string;
    preferredTranslation: string;
    sourceLanguageCode: string;
    targetLanguageCode: string;
    termType: 'Name' | 'Science Term' | 'Recurring Phrase' | 'Classroom Phrase' | 'Brand Term';
    preserveTerm: boolean;
    scopeType: 'Global' | 'Project-specific';
    scopeId?: string;
    notes?: string;
    internalTestingOnly: boolean;
    status: 'Active' | 'Archived';
    sortOrder: number;
}

export interface LanguageAvailabilityRule {
    id: string;
    languageCode: string;
    productArea: string;
    studioType: string;
    enabled: boolean;
    internalTestingOnly: boolean;
    note?: string;
    sortOrder: number;
}

export interface TranslationWorkflow {
    id: string;
    slug: string;
    title: string;
    workflowType: string;
    eligibleSourceLanguages: string[];
    eligibleTargetLanguages: string[];
    glossarySupport: boolean;
    protectedTermSupport: boolean;
    bilingualOutputSupport: boolean;
    narrationCompatibility: boolean;
    status: 'Active' | 'Archived';
    internalTestingOnly: boolean;
}

export interface VoiceRecord {
    id: string;
    slug: string;
    displayName: string;
    providerId: string;
    modelId: string;
    languageCodes: string[];
    primaryLanguageCode: string;
    accentLabel: string;
    toneLabel: string;
    ageDescriptor: 'Child' | 'Teen' | 'Adult' | 'Senior';
    narratorSuitability: boolean;
    childSafe: boolean;
    classroomSafe: boolean;
    supportsBilingualWorkflows: boolean;
    visibleInStudio: boolean;
    visibleInKidStory: boolean;
    visibleInComicStudio: boolean;
    visibleInTeacherFlow: boolean;
    visibleInHomeschool: boolean;
    internalTestingOnly: boolean;
    status: 'Active' | 'Archived';
    featured: boolean;
    sortOrder: number;
}

export interface ProjectNarrationSettings {
    id: string;
    projectId: string;
    narrationEnabled: boolean;
    narrationMode: 'narrator-only' | 'character-aware' | 'bilingual-alternating';
    narratorVoiceId: string;
    characterVoiceMode: boolean;
    narrationLanguageCode: string;
    pacingMode: 'slow' | 'standard' | 'fast';
    readingStyleMode?: string;
    soundtrackEnabled: boolean;
    soundtrackSelectionId?: string;
    ambienceSelectionId?: string;
    fallbackVoiceId?: string;
    status: string;
}

export interface NarrationUnit {
    id: string;
    projectId: string;
    parentContentType: 'Panel' | 'Intro' | 'Outro';
    parentContentId: string;
    textBindingId: string;
    sourceText: string;
    languageCode: string;
    assignedVoiceId: string;
    narrationMode: string;
    pacingMode: string;
    status: 'Pending' | 'Generating' | 'Completed' | 'Failed';
    reviewStatus: 'Approved' | 'Flagged' | 'Unmoderated';
    outputAssetId?: string;
    overrideApplied: boolean;
    providerJobId?: string;
    variantGroupId?: string;
}

export interface NarrationJob {
    id: string;
    projectId: string;
    providerId: string;
    modelId: string;
    workflowId: string;
    voiceId: string;
    languageCode: string;
    narrationMode: string;
    pacingMode: string;
    soundtrackBindingId?: string;
    unitIds: string[];
    status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
    retryCount: number;
    errorState?: string;
    resultBindingIds: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface AudioAsset {
    id: string;
    assetType: 'Intro' | 'Panel' | 'Dialogue' | 'Outro' | 'Soundtrack' | 'Ambience';
    sourceJobId: string;
    sourceUnitId: string;
    previewUrl: string;
    status: 'Pending' | 'Completed' | 'Archived';
    selected: boolean;
    approved: boolean;
    archived: boolean;
    moderationState: 'Approved' | 'Flagged' | 'Unmoderated';
    storageBindingPlaceholder?: string;
    durationMs: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface SoundtrackAmbienceItem {
    id: string;
    slug: string;
    title: string;
    category: 'Soundtrack' | 'Ambience';
    mood: string;
    educationalSuitability: boolean;
    familySuitability: boolean;
    classroomSuitability: boolean;
    languageNeutral: boolean;
    status: 'Active' | 'Archived';
    internalTestingOnly: boolean;
    sortOrder: number;
}

export interface NarrationWorkflow {
    id: string;
    slug: string;
    title: string;
    workflowType: string;
    eligibleLanguages: string[];
    eligibleVoices: string[];
    soundtrackSupport: boolean;
    bilingualCompatibility: boolean;
    exportCompatibility: boolean;
    status: 'Active' | 'Archived';
    internalTestingOnly: boolean;
}

export interface VoiceAvailabilityRule {
    id: string;
    voiceId: string;
    productArea: string;
    studioType: string;
    languageCode: string;
    enabled: boolean;
    internalTestingOnly: boolean;
    note?: string;
    sortOrder: number;
}

export interface AiProvider {
    id: string;
    slug: string;
    displayName: string;
    providerType: 'text' | 'image' | 'translation' | 'narration' | 'audio' | 'multimodal';
    baseEndpoint?: string;
    status: 'Active' | 'Inactive' | 'Testing' | 'Deprecated';
    internalTestingOnly: boolean;
    notes?: string;
    sortOrder: number;
}

export interface AiModel {
    id: string;
    providerId: string;
    slug: string;
    displayName: string;
    capabilityTypes: ('text' | 'image' | 'translation' | 'narration' | 'audio' | 'multimodal')[];
    recommendedUseCases?: string;
    maxContextLength?: number;
    costTier: 'Free' | 'Low' | 'Medium' | 'High';
    performanceTier: 'Standard' | 'Premium' | 'Ultra';
    status: 'Active' | 'Inactive' | 'Testing' | 'Deprecated';
    internalTestingOnly: boolean;
    defaultForWorkflowType?: boolean;
    notes?: string;
}

export interface AiWorkflow {
    id: string;
    slug: string;
    title: string;
    workflowType: string;
    capabilityTypes: string[];
    description?: string;
    defaultProviderId: string;
    defaultModelId: string;
    status: 'Active' | 'Archived';
    internalTestingOnly: boolean;
    notes?: string;
}

export interface AiRoutingRule {
    id: string;
    workflowType: string;
    planTier: 'Free' | 'Entry' | 'High User';
    environment: 'production' | 'testing';
    sourceLanguageCode?: string;
    targetLanguageCode?: string;
    providerId: string;
    modelId: string;
    configSnapshot?: any;
    status: 'Active' | 'Inactive';
    internalTestingOnly: boolean;
    priority: number;
    notes?: string;
}

export interface AiFallbackConfig {
    id: string;
    workflowType: string;
    primaryProviderId: string;
    primaryModelId: string;
    fallbackProviderId: string;
    fallbackModelId: string;
    retryThreshold: number;
    enabled: boolean;
    notes?: string;
}

export interface PlanTierCapabilityMap {
    id: string;
    planTier: 'Free' | 'Entry' | 'High User';
    workflowType: string;
    capabilityLabel: string;
    enabled: boolean;
    notes?: string;
}





