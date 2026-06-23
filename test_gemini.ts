import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

async function run() {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { text: "STYLE: Masterpiece Superhero Action comic character sheet, detailed ink, neutral background. FULL BODY. Character: " },
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE
                }
            ],
            config: { imageConfig: { aspectRatio: '1:1' } }
        });
        console.log("Success:", !!response.candidates?.[0]);
    } catch (e: any) {
        console.error("Error generating image:", e.message);
    }
}

run();
