export const TOKEN_VALUE_USD = 0.01; // 1 Story Token = $0.01 USD
export const PROFIT_MARGIN_MULTIPLIER = 2.0; // 100% markup to cover infrastructure/free tier

export const AI_MODELS = {
    // Image Models (Cost per image in USD)
    'gemini-2.5-flash-image': { type: 'image', costUsd: 0.03 },
    'dall-e-3': { type: 'image', costUsd: 0.04 },
    
    // Text Models (Cost per 1K input tokens + 1K output tokens average in USD)
    'gemini-2.5-flash': { type: 'text', costUsd: 0.00015 },
    'gemini-3.5-flash': { type: 'text', costUsd: 0.0003 },
    
    // Audio/Voice Models (Cost per generation in USD)
    'gemini-3.1-flash-tts-preview': { type: 'audio', costUsd: 0.01 },
};

/**
 * Calculates the required Story Tokens for a given generation.
 * Ensures the platform always remains profitable.
 */
export function calculateTokenCost(modelId: keyof typeof AI_MODELS, estimatedTokens: number = 1000): number {
    const model = AI_MODELS[modelId];
    if (!model) return 1; // Fallback to 1 token

    let costUsd = 0;
    if (model.type === 'image' || model.type === 'audio') {
        costUsd = model.costUsd;
    } else {
        costUsd = (estimatedTokens / 1000) * model.costUsd;
    }

    // Apply markup
    const markedUpUsd = costUsd * PROFIT_MARGIN_MULTIPLIER;
    
    // Convert to Story Tokens (round up to nearest integer to avoid fractional tokens)
    const tokensRequired = Math.ceil(markedUpUsd / TOKEN_VALUE_USD);
    
    // Minimum charge of 1 Token per action
    return Math.max(1, tokensRequired);
}
