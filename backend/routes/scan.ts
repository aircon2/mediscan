import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { mergeData } from '../lib/store';
import type { GraphData } from '../types/graph';

const router = Router();

const GEMINI_PROMPT = `You are a pharmaceutical analysis AI. You are given an image of a medication label or packaging.

Analyze the image and extract the following information. Return ONLY valid JSON matching this exact schema — no markdown, no explanation, no wrapping:

{
  "medications": {
    "<medication_name>": {
      "name": "<medication_name>",
      "ingredients": ["ingredient1", "ingredient2"],
      "sideEffects": ["effect1", "effect2"],
      "symptomsTreated": ["symptom1", "symptom2"]
    }
  },
  "ingredients": {
    "<ingredient_name>": {
      "name": "<ingredient_name>",
      "medications": ["<medication_name>"],
      "description": "Brief description of what this ingredient does in 20 words"
    }
  },
  "effects": {
    "<effect_name>": {
      "name": "<effect_name>",
      "medicationsCausingIt": ["<medication_name>"],
      "medicationsTreatingIt": [],
      "description": "Brief description of this effect in 20 words"
    }
  }
}

Rules:
- Use the GENERIC medication/product name, NOT the brand name (e.g. "Tylenol" instead of "Tylenol Extra Strength", "Honey" instead of "No Name Liquid Honey")
- If the product has a well-known generic name (like "Tylenol" for acetaminophen products), use that generic name
- For household items or natural products, use the simplest generic term (e.g. "Honey", not "Liquid Honey" or branded names)
- List ALL active ingredients found on the label
- IMPORTANT: Medication names and ingredient names MUST be distinct. Never use the same name for both a medication and an ingredient (e.g., if the medication is "Ashwagandha Capsules", the ingredient should be "Ashwagandha extract" or "Ashwagandha root", NOT "Ashwagandha")
- List common side effects for the medication (use your pharmaceutical knowledge)
- List symptoms/conditions this medication treats
- For each ingredient, create an entry in "ingredients" with its description
- For each side effect, create an entry in "effects" with medicationsCausingIt containing this medication
- For each symptom treated, create an entry in "effects" with medicationsTreatingIt containing this medication
- Use proper capitalization for names (e.g. "Acetaminophen", "Headache")
- Return ONLY the JSON, no other text`;

router.post('/scan', async (req: Request, res: Response) => {
  try {
    const { image } = req.body as { image?: string };

    if (!image) {
      return res.status(400).json({ error: 'No image provided. Send { image: "<base64 data URL>" }' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[scan] GEMINI_API_KEY not set in environment');
      return res.status(500).json({ error: 'Gemini API key not configured. Set GEMINI_API_KEY in backend/.env' });
    }

    // Extract base64 data from data URL
    const match = image.match(/^data:image\/([\w+]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid image format. Expected base64 data URL.' });
    }

    const mimeType = `image/${match[1]}` as 'image/jpeg' | 'image/png' | 'image/webp';
    const base64Data = match[2];

    console.log('[scan] Sending image to Gemini for analysis...');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent([
      GEMINI_PROMPT,
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    const responseText = result.response.text();
    console.log('[scan] Gemini raw response:', responseText.substring(0, 200) + '...');

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = responseText.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    let parsedData: Partial<GraphData>;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('[scan] Failed to parse Gemini response as JSON:', parseErr);
      return res.status(500).json({
        error: 'Failed to parse Gemini response',
        rawResponse: responseText,
      });
    }

    console.log('[scan] Parsed data:', JSON.stringify(parsedData, null, 2).substring(0, 500));

    // Merge into database using existing store logic
    let updatedStore;
    try {
      updatedStore = mergeData(parsedData);
      console.log('[scan] Data merged into store successfully');
    } catch (mergeErr: any) {
      console.error('[scan] Failed to merge data:', mergeErr);
      return res.status(500).json({
        error: 'Failed to save medication data to database',
        details: mergeErr.message,
      });
    }

    return res.json({
      message: 'Medication scanned and stored successfully',
      data: parsedData,
      medicationCount: Object.keys(updatedStore.medications).length,
      ingredientCount: Object.keys(updatedStore.ingredients).length,
      effectCount: Object.keys(updatedStore.effects).length,
    });
  } catch (err: any) {
    console.error('[scan] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to analyze image' });
  }
});

export default router;
