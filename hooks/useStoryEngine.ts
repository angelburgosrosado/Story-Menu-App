import { ComicFace, Beat, Persona, GeneratedCharacterModel, CharacterIdentitySchema, ChapterGoal } from '../types';

export const generateImageBase = async (
    beat: Beat,
    type: ComicFace['type'],
    styleEra: string,
    visuals: {
        heroVisuals?: string;
        friendVisuals?: string;
        villainVisuals?: string;
        selectedGenre?: string;
        selectedLanguage?: string;
        heroRef?: GeneratedCharacterModel | null;
        friendRef?: GeneratedCharacterModel | null;
        villainRef?: GeneratedCharacterModel | null;
        provider?: 'gemini' | 'llamagen' | 'comfyui' | 'leonardo';
    }
): Promise<string> => {
    try {
        const response = await fetch('/api/gemini/image', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-gemini-key': localStorage.getItem('GEMINI_API_KEY') || ''
            },
            body: JSON.stringify({
                beat,
                type,
                styleEra,
                ...visuals
            })
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server image failure: ${response.status}`);
        }
        const data = await response.json();
        return data.imageUrl || '';
    } catch (e) {
        console.error("API Error in generateImageBase:", e);
        throw e;
    }
};

export const generateTextBeatBase = async (
    promptOptions: {
        history?: ComicFace[];
        pageNum?: number;
        isDecisionPage?: boolean;
        selectedGenre?: string;
        selectedLanguage?: string;
        storyTone?: string;
        customPremise?: string;
        creativeDirectives?: string;
        richMode?: boolean;
        heroVisuals?: string;
        friendVisuals?: string;
        villainVisuals?: string;
        villainDna?: string;
        nemesisDNA?: CharacterIdentitySchema;
        soundPrompt?: string;
        friendInstruction?: string;
        villainInstruction?: string;
        langName?: string;
        storyBlueprint?: ChapterGoal[];
    }
): Promise<Beat> => {
    try {
        const response = await fetch('/api/gemini/beat', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-gemini-key': localStorage.getItem('GEMINI_API_KEY') || ''
            },
            body: JSON.stringify(promptOptions)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server beat failure: ${response.status}`);
        }

        const parsed = await response.json();
        if (parsed.dialogue) parsed.dialogue = parsed.dialogue.replace(/^[\w\s\-]+:\s*/i, '').replace(/["']/g, '').trim();
        if (parsed.caption) parsed.caption = parsed.caption.replace(/^[\w\s\-]+:\s*/i, '').trim();
        if (!promptOptions.isDecisionPage) parsed.choices = [];
        if (!['hero', 'friend', 'other'].includes(parsed.focus_char)) parsed.focus_char = 'hero';

        return parsed as Beat;
    } catch (e) {
        console.error("API Error in generateTextBeatBase:", e);
        throw e;
    }
};

export const generateSpeechBase = async (text: string, voiceName: string): Promise<string> => {
    try {
        const res = await fetch('/api/gemini/speech', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-gemini-key': localStorage.getItem('GEMINI_API_KEY') || ''
            },
            body: JSON.stringify({ text, voiceName })
        });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Speech server failure: ${res.status}`);
        }
        const data = await res.json();
        return data.base64Audio || '';
    } catch (e) {
        console.error("API Error in generateSpeechBase:", e);
        throw e;
    }
};

export const enhanceKidStoryBase = async (rawText: string): Promise<string> => {
    try {
        const res = await fetch('/api/gemini/enhance-kid-story', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-gemini-key': localStorage.getItem('GEMINI_API_KEY') || ''
            },
            body: JSON.stringify({ rawText })
        });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Server failure: ${res.status}`);
        }
        const data = await res.json();
        return data.enhancedStory || '';
    } catch (e) {
        console.error("API Error in enhanceKidStoryBase:", e);
        throw e;
    }
};
