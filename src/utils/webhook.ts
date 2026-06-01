import { writeFile, mkdir } from "fs/promises";
import path from "path";

const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwM-fZSqSCPjuy6RR_nbwPuUt39YoFyH_1BKqwDR9yJo4yDfH97sTPhjVVd34Tw5X0/exec";

export interface WebhookPayload {
  formType: "Hiring" | "Job Seeker" | "Freshers" | "Discovery Calls";
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  resumeLink: string;
  projectReportLink: string;
}

// Function to handle file uploads and save them locally
export async function handleFileUpload(file: File, origin: string): Promise<string> {
  return saveFileLocally(file, origin);
}

// Function to save a file locally in public/uploads/ and return its public URL
export async function saveFileLocally(file: File, origin: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const uniqueFilename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
  const filePath = path.join(uploadDir, uniqueFilename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // Return the public URL
  return `${origin}/uploads/${uniqueFilename}`;
}

// Function to send data to the Google Sheets Apps Script Webhook
export async function sendToWebhook(payload: WebhookPayload) {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Apps Script webhook responded with status: ${response.status}`);
    }

    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { success: true, message: responseText };
    }

    return result;
  } catch (error: any) {
    console.error("Error in webhook submission:", error);
    throw new Error(`Webhook submission failed: ${error.message}`);
  }
}
