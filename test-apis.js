import 'dotenv/config';

async function main() {
    const geminiKey = process.env.GEMINI_API_KEY;
    console.log("Key:", geminiKey.substring(0, 10) + "...");
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
    const data = await res.json();
    console.log(data);
}
main();
