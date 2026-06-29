const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
(async () => {
  try {
    const res = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: 'A comic style hero',
      config: { numberOfImages: 1 }
    });
    console.log("Success, returned base64 string starting with: ", res?.generatedImages?.[0]?.image?.imageBytes?.substring(0, 10));
  } catch (e) {
    console.error("Error:", e.message);
  }
})();
