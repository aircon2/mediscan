import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { mergeData } from '../lib/store';
import type { GraphData } from '../types/graph';

const router = Router();

const GEMINI_PROMPT = `You are a pharmaceutical analysis AI trained to identify medications from images.

⚠️ STEP 1 - CRITICAL VALIDATION:
Examine the image carefully. Does it show a medication, pharmaceutical product, supplement, or vitamin?

If NO (the image shows food, beverages, household items, electronics, unclear/blurry content, or anything other than medication):
→ Respond with EXACTLY this JSON (nothing else): {"error": "not_a_medication"}

If YES (you can clearly see medication packaging or labeling):
→ Proceed to STEP 2

STEP 2 - EXTRACT MEDICATION DATA:
Return ONLY valid JSON matching this schema (no markdown, no explanations):

{
  "medications": {
    "<brand_name>": {
      "name": "<brand_name>",
      "ingredients": ["ingredient1", "ingredient2"],
      "sideEffects": ["effect1", "effect2"],
      "symptomsTreated": ["symptom1", "symptom2"]
    }
  },
  "ingredients": {
    "<ingredient_name>": {
      "name": "<ingredient_name>",
      "medications": ["<brand_name>"],
      "description": "Brief description (20 words max)"
    }
  },
  "effects": {
    "<effect_name>": {
      "name": "<effect_name>",
      "medicationsCausingIt": ["<brand_name>"],
      "medicationsTreatingIt": [],
      "description": "Brief description (20 words max)"
    }
  }
}

EXTRACTION RULES:
- NEVER return empty objects for medications, ingredients, or effects
- If you cannot identify a medication clearly, return {"error": "not_a_medication"} instead
- Use BRAND NAME as medication name (e.g., "Tylenol" not "Acetaminophen", "Advil" not "Ibuprofen")
- Brand name = largest text on packaging; active ingredients go in "ingredients" array
- Simplify brand names ("Tylenol" not "Tylenol Extra Strength")
- For natural products: simplest generic term ("Honey" not "Liquid Honey")
- List ALL active ingredients from the label
- Medication name ≠ ingredient name (if med is "Ashwagandha Capsules", ingredient is "Ashwagandha extract")
- Include common side effects (use pharmaceutical knowledge)
- Include symptoms/conditions the medication treats
- Create ingredient entries with descriptions
- Create effect entries linking to medications
- Use proper capitalization ("Acetaminophen", "Headache")
- Return ONLY JSON, no markdown, no explanations

REMEMBER: If not a medication → {"error": "not_a_medication"}
If medication but unclear → {"error": "not_a_medication"}
Do NOT return empty objects!`;

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

    let parsedData: Partial<GraphData> & { error?: string };
    try {
      parsedData = JSON.parse(jsonStr);
      console.log('[scan] Parsed JSON structure:', {
        hasError: !!parsedData.error,
        errorValue: parsedData.error,
        hasMedications: !!parsedData.medications,
        medicationCount: parsedData.medications ? Object.keys(parsedData.medications).length : 0,
      });
    } catch (parseErr) {
      console.error('[scan] Failed to parse Gemini response as JSON:', parseErr);
      return res.status(500).json({
        error: 'Failed to parse Gemini response',
        rawResponse: responseText,
      });
    }

    // Check if Gemini identified the image as not a medication
    if (parsedData.error === 'not_a_medication') {
      console.log('[scan] Gemini returned error: not_a_medication');
      return res.status(400).json({
        error: 'not_a_medication',
        message: 'The scanned item does not appear to be a medication. Please try again with a medication label.',
      });
    }

    // Check for empty/invalid medication data
    const hasMedications = parsedData.medications && typeof parsedData.medications === 'object';
    const medicationCount = hasMedications ? Object.keys(parsedData.medications!).length : 0;
    
    console.log('[scan] Validation check:', { hasMedications, medicationCount });
    
    if (!hasMedications || medicationCount === 0) {
      console.log('[scan] No medications found in response (empty or missing)');
      return res.status(400).json({
        error: 'not_a_medication',
        message: 'No medication could be identified in the image. Please try again with a clearer medication label.',
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
