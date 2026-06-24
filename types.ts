/**
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
