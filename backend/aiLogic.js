// backend/aiLogic.js
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const groqClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

// 1. Transcribe Function (Updated)
async function transcribeAudio(filePath) {
    try {
        console.log(`🔍 AI Logic received file: ${filePath}`);

        // Check if file exists and has size
        if (!fs.existsSync(filePath)) {
            console.error("❌ File not found at path:", filePath);
            return null;
        }
        const stats = fs.statSync(filePath);
        console.log(`📄 File Size: ${stats.size} bytes`);
        if (stats.size < 100) {
            console.error("❌ File is too small (empty recording?)");
            return null;
        }

        // Force a clean filename for the API
        // This fixes the Windows path issue
        const fileStream = fs.createReadStream(filePath);
        
        // ⚡ CRITICAL FIX: Explicitly cast the stream to have a name
        // This ensures OpenAI SDK sends 'filename="upload.webm"' in the header
        fileStream.name = "upload.webm"; 

        const transcription = await groqClient.audio.transcriptions.create({
            file: fileStream,
            model: "whisper-large-v3",
            language: "ar",
            response_format: "json",
        });

        console.log("✅ Groq Transcription Result:", transcription.text ? "Text received" : "Empty");
        return transcription.text;

    } catch (error) {
        console.error("❌ Transcription Error:", error.message);
        // If there's more detail from the API, print it
        if (error.response) console.error("API Details:", error.response.data);
        return null;
    }
}

// 2. Analyze Function (Keep as is)
async function analyzePerformance(transcript) {
    // ... (Keep your existing code for this function) ...
    const systemPrompt = `
    You are an AI Supervisor. Analyze this employee's audio report (in Arabic).
    Return a STRICT JSON object with:
    - score: (Number 0-100) based on productivity.
    - details: (String) A summary of the work in Arabic.
    - tasks: (Array) List of specific tasks mentioned.
    `;

    try {
        const completion = await groqClient.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: transcript },
            ],
            response_format: { type: "json_object" },
        });
        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error("❌ Analysis Error:", error.message);
        return { score: 50, details: "فشل التحليل الذكي", tasks: [] };
    }
}

module.exports = { transcribeAudio, analyzePerformance };