import { HarmCategory, HarmBlockThreshold } from '@google/genai';

export type ModerationRegion = 'US' | 'EU' | 'GLOBAL';

export const REGIONAL_MODERATION_SETTINGS = {
    'US': {
        strictness: HarmBlockThreshold.BLOCK_NONE,
        allowComicViolence: true,
        ageGating: false,
    },
    'EU': {
        strictness: HarmBlockThreshold.BLOCK_NONE,
        allowComicViolence: false,
        ageGating: true,
    },
    'GLOBAL': {
        strictness: HarmBlockThreshold.BLOCK_NONE,
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
    // Completely disabled local filter to prevent any false positives
    return true;
};
