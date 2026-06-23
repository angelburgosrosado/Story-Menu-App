import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    const history: any[] = [];
    try {
        for (let i = 1; i <= 10; i++) {
            console.log(`Generating page ${i}...`);
            const response = await fetch('http://localhost:3001/api/gemini/beat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-gemini-key': process.env.GEMINI_API_KEY as string
                },
                body: JSON.stringify({
                    pageNum: i,
                    isDecisionPage: i === 3,
                    selectedGenre: 'Adventure',
                    storyTone: 'Exciting',
                    history: history,
                    userEmail: 'angelburgosrosado@gmail.com'
                })
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Failed on page ${i}: ${response.status} ${text}`);
            }
            const data = await response.json();
            history.push({ pageIndex: i, type: 'story', narrative: data });
            console.log(`Page ${i} success: ${data.scene.substring(0, 50)}...`);
        }
        console.log("Generated 10 pages successfully.");
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

run();
