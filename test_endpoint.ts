import { getAIClient } from './server.js';
import { HarmCategory, HarmBlockThreshold } from '@google/genai';

async function run() {
    try {
        const response = await fetch('http://localhost:3001/api/gemini/suggest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-gemini-key': process.env.GEMINI_API_KEY as string
            },
            body: JSON.stringify({
                fieldName: 'storyBlueprint',
                genre: 'Superhero Action',
                customPremise: 'Dark Sci-Fi',
                storyTone: 'Exciting & Action-packed',
                userEmail: 'angelburgosrosado@gmail.com'
            })
        });
        const data = await response.json();
        console.log("Response:", data);
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

run();
