import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        console.log("Testing text generation...");
        const textRes = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Hello'
        });
        console.log("Text success:", textRes.text);

        console.log("Testing image generation...");
        const imgRes = await ai.models.generateImages({
            model: 'imagen-3.0-generate-001',
            prompt: 'A cute dog',
            config: { numberOfImages: 1, aspectRatio: '1:1', outputMimeType: 'image/jpeg' }
        });
        console.log("Image success, num images:", imgRes.generatedImages?.length);
    } catch (e: any) {
        console.error("SDK Error:", e.message);
    }
}
run();
