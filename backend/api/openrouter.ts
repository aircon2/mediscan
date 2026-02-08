// backend/api/openrouter.ts
// import fetch from "node-fetch";

// export async function analyzeMedicine(imageBase64: string) {
//   try {
//     const userPrompt = `You are an AI that analyzes medicine labels. 
// Given the image of a medicine label, extract all the information and return it in the following JSON format ONLY:

// {
//   "medications": {
//     "med1": {
//       "name": "string",
//       "ingredients": ["string", "string"],
//       "sideEffects": ["string", "string"],
//       "symptomsTreated": ["string", "string"]
//     }
//   },
//   "ingredients": {
//     "ingredient1": {
//       "name": "string",
//       "medications": ["string"],
//       "description": "string"
//     }
//   },
//   "effects": {
//     "effect1": {
//       "name": "string",
//       "medicationsCausingIt": ["string"],
//       "medicationsTreatingIt": ["string"],
//       "description": "string"
//     }
//   }
// }

// Make sure:
// - JSON is valid
// - Only return JSON, no extra text.`;

//     const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
//       },
//       body: JSON.stringify({
//         model: "google/gemini-3-pro-preview",
//         messages: [
//           {
//             role: "user",
//             content: [
//               { type: "input_text", text: userPrompt },
//               { type: "input_image", image_url: imageBase64 }
//             ]
//           }
//         ]
//       })
//     });

//     const data = await response.json();
//     return data;
//   } catch (err) {
//     console.error("OpenRouter API error:", err);
//     throw new Error("Failed to analyze medicine");
//   }
// }
import * as fs from "fs";
import * as path from "path";
import { GoogleGenAI, createUserContent, createPartFromUri } from "@google/genai";
import 'dotenv/config';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function analyzeMedicine(base64Image: string) {
  // 1️⃣ Convert Base64 to a temporary file
  const buffer = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ""), "base64");
  const tempPath = path.join(__dirname, `temp_${Date.now()}.png`);
  fs.writeFileSync(tempPath, buffer);

  try {
    // 2️⃣ Upload file to Gemini
    const uploadedFile = await ai.files.upload({
      file: tempPath,
      config: { mimeType: "image/png" },
    });

    if (!uploadedFile.uri) {
      throw new Error("File upload failed, no URI returned from Gemini.");
    }

    // 3️⃣ Prompt text
    const promptText = `
You are an AI that analyzes medicine labels.
Given the image of a medicine label, extract all the information and return it in the following JSON format ONLY:

{
  "medications": {
    "med1": {
      "name": "string",
      "ingredients": ["string", "string"],
      "sideEffects": ["string", "string"],
      "symptomsTreated": ["string", "string"]
    }
  },
  "ingredients": {
    "ingredient1": {
      "name": "string",
      "medications": ["string"],
      "description": "string"
    }
  },
  "effects": {
    "effect1": {
      "name": "string",
      "medicationsCausingIt": ["string"],
      "medicationsTreatingIt": ["string"],
      "description": "string"
    }
  }
}

Make sure JSON is valid and only return JSON, no extra text.
`;

    // 4️⃣ Build content for Gemini
    const userContent = createUserContent([
      createPartFromUri(uploadedFile.uri, "image/png"),
      promptText,
    ]);

    // 5️⃣ Generate content
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userContent,
    });

    return response.text;
  } catch (err) {
    console.error("Gemini API error:", err);
    throw new Error("Failed to analyze medicine");
  } finally {
    // 6️⃣ Cleanup temp file
    fs.unlinkSync(tempPath);
  }
}
