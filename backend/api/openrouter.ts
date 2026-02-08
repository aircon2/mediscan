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
import { OpenRouter } from "@openrouter/sdk";
import * as fs from "fs";

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

async function encodeImageToBase64(filePath: string): Promise<string> {
  const imageBuffer = await fs.promises.readFile(filePath);
  return `data:image/png;base64,${imageBuffer.toString("base64")}`;
}

export async function analyzeMedicine(filePath: string) {
  try {
    const base64Image = await encodeImageToBase64(filePath);

    const result = await openRouter.chat.sendMessage({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an AI that analyzes medicine labels.
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

Make sure JSON is valid and only return JSON, no extra text.`,
            },
            {
              type: "image_url",
              image_url: base64Image, // Base64 image works
            },
          ],
        },
      ],
      stream: false,
    });

    return result;
  } catch (err) {
    console.error("OpenRouter API error:", err);
    throw new Error("Failed to analyze medicine");
  }
}
