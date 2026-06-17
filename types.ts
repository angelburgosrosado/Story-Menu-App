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

export const GENRES = ["Classic Horror", "Superhero Action", "Dark Sci-Fi", "High Fantasy", "Neon Noir Detective", "Wasteland Apocalypse", "Lighthearted Comedy", "Teen Drama / Slice of Life", "Anime Story", "Historical Archeology Tales", "Custom"];
export const TONES = [
    "ACTION-HEAVY (Short, punchy dialogue. Focus on kinetics.)",
    "INNER-MONOLOGUE (Heavy captions revealing thoughts.)",
    "QUIPPY (Characters use humor as a defense mechanism.)",
    "OPERATIC (Grand, dramatic declarations and high stakes.)",
    "CASUAL (Natural dialogue, focus on relationships/gossip.)",
    "WHOLESOME (Warm, gentle, optimistic.)"
];

export const LANGUAGES = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'ar-EG', name: 'Arabic (Egypt)' },
    { code: 'bg-BG', name: 'Bulgarian (Bulgaria)' },
    { code: 'bn-IN', name: 'Bengali (India)' },
    { code: 'cs-CZ', name: 'Czech (Czech Republic)' },
    { code: 'da-DK', name: 'Danish (Denmark)' },
    { code: 'de-DE', name: 'German (Germany)' },
    { code: 'el-GR', name: 'Greek (Greece)' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'fi-FI', name: 'Finnish (Finland)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'he-IL', name: 'Hebrew (Israel)' },
    { code: 'hi-IN', name: 'Hindi (India)' },
    { code: 'hr-HR', name: 'Croatian (Croatia)' },
    { code: 'hu-HU', name: 'Hungarian (Hungary)' },
    { code: 'id-ID', name: 'Indonesian (Indonesia)' },
    { code: 'it-IT', name: 'Italian (Italy)' },
    { code: 'ja-JP', name: 'Japanese (Japan)' },
    { code: 'ko-KR', name: 'Korean (South Korea)' },
    { code: 'ms-MY', name: 'Malay (Malaysia)' },
    { code: 'nl-NL', name: 'Dutch (Netherlands)' },
    { code: 'no-NO', name: 'Norwegian (Norway)' },
    { code: 'pl-PL', name: 'Polish (Poland)' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ro-RO', name: 'Romanian (Romania)' },
    { code: 'ru-RU', name: 'Russian (Russia)' },
    { code: 'sk-SK', name: 'Slovak (Slovakia)' },
    { code: 'sv-SE', name: 'Swedish (Sweden)' },
    { code: 'ta-IN', name: 'Tamil (India)' },
    { code: 'th-TH', name: 'Thai (Thailand)' },
    { code: 'tl-PH', name: 'Tagalog (Philippines)' },
    { code: 'tr-TR', name: 'Turkish (Turkey)' },
    { code: 'ua-UA', name: 'Ukrainian (Ukraine)' },
    { code: 'vi-VN', name: 'Vietnamese (Vietnam)' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' }
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
  headBase64?: string;
  clothesBase64?: string;
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
