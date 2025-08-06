// Import necessary libraries
const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const winston = require('winston');
require('dotenv').config({ path: path.resolve(__dirname, '.env') }); // Load environment variables from .env file

// --- CONFIGURATION ---
const app = express();
const port = 5001; // The port our server will run on

// --- LOGGER SETUP ---
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'backend.log' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'exceptions.log' })
  ]
});

// --- MIDDLEWARE ---
// Enable CORS to allow our frontend to make requests to this server
app.use(cors({ origin: 'http://localhost:3000' })); // Explicitly allow the React dev server

// Middleware to handle file uploads. We'll store uploaded files in a temporary 'uploads' directory.
const upload = multer({ dest: 'uploads/' });

// --- AI SETUP ---
// Initialize the Google Generative AI client with the API key from our .env file
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in the .env file.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// This is the core instruction for the AI model.
// It tells the AI exactly what to analyze and how to format the response.
const analysisPrompt = `
You are an expert HR analyst and communication coach.
Analyze the candidate in the provided video based on the following criteria: English speaking ability, confidence level, and humility.

Your analysis must be fair, unbiased, and constructive. Do not comment on physical appearance, clothing, or background objects. Focus strictly on verbal and non-verbal communication cues relevant to a professional interview context.

Provide your final output in a clean, stringified JSON format. Do not include any text or markdown formatting before or after the JSON object.

The JSON object must follow this exact structure:
{
  "english_speaking": {
    "score": "A numerical score from 1 (poor) to 10 (excellent).",
    "reasoning": "A detailed analysis of their fluency, pronunciation, grammar, and vocabulary usage. Mention specific examples if possible."
  },
  "confidence": {
    "score": "A numerical score from 1 (low) to 10 (high).",
    "reasoning": "Analyze their body language (posture, eye contact), vocal tone (steadiness, volume), and clarity of speech. Note any signs of nervousness or self-assurance."
  },
  "humility": {
    "score": "A numerical score from 1 (arrogant) to 10 (humble).",
    "reasoning": "Evaluate how they present their skills and accomplishments. Do they sound collaborative and open, or boastful? Is their tone grounded and self-aware?"
  },
  "overall_summary": "Provide a concise, 2-4 sentence summary of the candidate's communication style and key strengths or areas for improvement."
}
`;

// Helper function to upload a file to the Gemini API
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

// Helper function to upload a file to the Gemini API
async function uploadFileToGemini(filePath, mimeType) {
  const uploadResult = await fileManager.uploadFile(filePath, {
    mimeType,
    displayName: path.basename(filePath),
  });
  logger.info(`Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.name}`);

  let file = uploadResult.file;
  while (file.state === "PROCESSING") {
    logger.info(`File ${file.displayName} is still processing. Waiting...`);
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    file = await fileManager.getFile(file.name);
  }

  if (file.state === "FAILED") {
    throw new Error(`File processing failed for ${file.displayName}`);
  }

  logger.info(`File ${file.displayName} is now ACTIVE.`);
  return file;
}

// --- API ENDPOINT ---
// This is the main route that our frontend will call.
app.post('/analyze', upload.single('video'), async (req, res) => {
  // Check if a file was actually uploaded
  if (!req.file) {
    return res.status(400).json({ error: 'No video file uploaded.' });
  }

  const tempFilePath = req.file.path;
  logger.info(`Received file: ${req.file.originalname}, saved to ${tempFilePath}`);

  try {
    // 1. Upload the video file to the Gemini API's storage
    const videoFile = await uploadFileToGemini(tempFilePath, req.file.mimetype);

    // 2. Initialize the specific Gemini model we want to use (1.5 Pro is great for video)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // 3. Send the prompt and the uploaded file reference to the model
    logger.info('Sending analysis request to Gemini...');
    const result = await model.generateContent([analysisPrompt, { fileData: { mimeType: videoFile.mimeType, fileUri: videoFile.uri } }]);
    const response = await result.response;
    const analysisText = response.text();
    
    // Extract JSON from the Markdown code block
    const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch || !jsonMatch[1]) {
      throw new Error("Could not extract JSON from AI response.");
    }
    const rawJson = jsonMatch[1];

    logger.info('Received analysis from Gemini.');

    // 4. Parse the JSON response from the model
    const analysisJson = JSON.parse(rawJson);

    // 5. Send the successful analysis back to the frontend
    res.status(200).json(analysisJson);

    // 6. Clean up by deleting the file from Gemini's storage
    await fileManager.deleteFile(videoFile.name);
    logger.info(`Deleted file ${videoFile.name} from Gemini storage.`);

  } catch (error) {
    logger.error('Error during AI analysis:', error);
    res.status(500).json({ error: 'Failed to analyze the video. Please check the server logs.' });
  } finally {
    // 7. Always clean up the temporary file from our server's disk
    fs.unlinkSync(tempFilePath);
    logger.info(`Deleted temporary file: ${tempFilePath}`);
  }
});

// --- START SERVER ---
app.listen(port, () => {
  logger.info(`Backend server is running at http://localhost:${port}`);
});

