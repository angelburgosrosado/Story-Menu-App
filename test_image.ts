import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        const response = await fetch('http://localhost:3001/api/gemini/image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-gemini-key': process.env.GEMINI_API_KEY as string
            },
            body: JSON.stringify({
                userEmail: 'angelburgosrosado@gmail.com',
                prompt: "The lush forest path opens into a sunlit clearing where the VILLAIN, dressed in a regal adversary suit, stands mockingly before the HERO and the CO-STAR.",
                type: 'story',
                heroRef: { base64: '' },
                friendRef: null,
                villainRef: null
            })
        });
        const data = await response.json();
        console.log("Response:", data.imageUrl ? 'Success' : data);
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

run();
