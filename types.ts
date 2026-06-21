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
export const TONES = [
    "ACTION-HEAVY (Short, punchy dialogue. Focus on kinetics.)",
    "INNER-MONOLOGUE (Heavy captions revealing thoughts.)",
    "QUIPPY (Characters use humor as a defense mechanism.)",
    "OPERATIC (Grand, dramatic declarations and high stakes.)",
    "CASUAL (Natural dialogue, focus on relationships/gossip.)",
    "WHOLESOME (Warm, gentle, optimistic.)"
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
