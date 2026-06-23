import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
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
                history: [
                    { pageIndex: 1, type: 'story', narrative: { caption: "It began.", dialogue: "Hello", scene: "A forest", focus_char: "hero" } },
                    { pageIndex: 2, type: 'story', narrative: { caption: "They walked.", dialogue: "Yes", scene: "A path", focus_char: "hero" } }
                ],
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
