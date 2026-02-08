// backend/test/testAnalyze.ts
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";

async function testAnalyze() {
  try {
    const filePath = path.join(__dirname, "test.png");

    if (!fs.existsSync(filePath)) {
      console.error("test.png not found in test folder!");
      return;
    }

    // Create form-data and attach the file
    const form = new FormData();
    form.append("image", fs.createReadStream(filePath));

    // Send POST request to backend
    const response = await fetch("http://localhost:5001/api/analyze", {
      method: "POST",
      body: form,
    });

    // Parse JSON result
    const text = await response.text();
    try {
      const result = JSON.parse(text);
      console.log("Analysis result:", JSON.stringify(result, null, 2));
    } catch {
      console.error("Invalid JSON response:", text);
    }
  } catch (err) {
    console.error("Test failed:", err);
  }
}

// Run the test
testAnalyze();
