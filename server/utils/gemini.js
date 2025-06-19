const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

async function generateCaption(tags) {
  try {
    const prompt = `Write a short, funny meme caption using these tags: ${tags.join(', ')}`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,// <-- CHANGE THIS LINE
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || ' No caption generated';
  } catch (error) {
    console.error('Gemini API failed:', error.response?.status, error.response?.data);
    return ' Caption fallback: YOLO to the moon!';
  }
}

module.exports = generateCaption;