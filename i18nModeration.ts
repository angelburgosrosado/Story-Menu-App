import { HarmCategory, HarmBlockThreshold } from '@google/genai';

export type ModerationRegion = 'US' | 'EU' | 'GLOBAL';

export const REGIONAL_MODERATION_SETTINGS = {
    'US': {
        strictness: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        allowComicViolence: true,
        ageGating: false,
    },
    'EU': {
        strictness: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        allowComicViolence: false,
        ageGating: true,
    },
    'GLOBAL': {
        strictness: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        allowComicViolence: true,
        ageGating: false,
    }
};

export const getModerationConfig = (region: ModerationRegion = 'GLOBAL') => {
    return REGIONAL_MODERATION_SETTINGS[region] || REGIONAL_MODERATION_SETTINGS['GLOBAL'];
};

const PROFANITY_LIST = [
    'fuck', 'shit', 'bitch', 'cunt', 'rape'
];

export const passesLocalFilter = (text: string): boolean => {
    if (!text) return true;
    const lower = text.toLowerCase();
    for (const word of PROFANITY_LIST) {
        if (lower.includes(word)) return false;
    }
    return true;
};
