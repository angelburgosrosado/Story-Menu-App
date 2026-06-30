import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const imgRes = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: 'A cute dog',
            config: { numberOfImages: 1, aspectRatio: '1:1', outputMimeType: 'image/jpeg' }
        });
        console.log("Image success, num images:", imgRes.generatedImages?.length);
    } catch (e: any) {
        console.error("SDK Error:", e.message);
    }
}
run();
