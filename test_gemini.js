const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
(async () => {
  try {
    const res = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: 'A comic style hero',
      config: { numberOfImages: 1 }
    });
    console.log("Success");
  } catch (e) {
    console.error("Error:", e.message);
  }
})();
