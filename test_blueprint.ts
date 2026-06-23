import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        const storyBlueprint = [
            { chapterNum: 1, title: 'Start', goal: 'Introduce hero' },
            { chapterNum: 2, title: 'Middle', goal: 'Hero fights' },
            { chapterNum: 3, title: 'Decision', goal: 'Hero chooses' }
        ];

        console.log(`Generating page 3 with blueprint...`);
        const response = await fetch('http://localhost:3001/api/gemini/beat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-gemini-key': process.env.GEMINI_API_KEY as string
            },
            body: JSON.stringify({
                pageNum: 3,
                isDecisionPage: true,
                selectedGenre: 'Adventure',
                storyTone: 'Exciting',
                history: [],
                userEmail: 'angelburgosrosado@gmail.com',
                storyBlueprint
            })
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed: ${response.status} ${text}`);
        }
        const data = await response.json();
        console.log(`Success: ${JSON.stringify(data, null, 2)}`);
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

run();
