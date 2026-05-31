import { NextResponse } from "next/server";

// Stub helper for Google Sheets integration
// Helper for Google Sheets integration via Google Apps Script Web App
async function triggerGoogleSheetsHook(
  fields: Record<string, string>,
  resumeName: string,
  resumeType: string,
  resumeBase64: string
) {
  const url = process.env.GOOGLE_SHEET_WEBAPP_URL;
  const authSecret = process.env.GOOGLE_SHEET_AUTH_SECRET;

  if (!url || url.includes("placeholder")) {
    console.warn("GOOGLE_SHEET_WEBAPP_URL is not configured or is placeholder. Skipping real Google Sheets insertion.");
    return false;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        formType: "job-seeker",
        authSecret,
        data: fields,
        files: [
          {
            name: resumeName,
            type: resumeType,
            contentBase64: resumeBase64
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Sheets Web App responded with HTTP status ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Unknown error inside Apps Script");
    }

    console.log("Google Sheets Candidate Row Appended successfully for Seeker:", fields.email);
    return true;
  } catch (error: any) {
    console.error("Error sending data to Google Sheets Web App:", error);
    throw new Error("Google Sheets Integration error: " + error.message);
  }
}

// Stub helper for email alerts (attaching resume)
async function triggerEmailNotification(fields: Record<string, string>, resumeFile: File) {
  console.log("=== TRIGGERING SMTP EMAIL NOTIFICATION ===");
  console.log("SMTP Config: smtp.secureserver.net (Port 465)");
  console.log("Mail From: registry@nextgen-consulting.com");
  console.log("Mail To: search@nextgen-consulting.com, cv-inbox@nextgen-consulting.com");
  console.log(`Subject: [Experienced Candidate Profile] ${fields.firstName} ${fields.lastName} - ${fields.designation}`);
  console.log("Body: \n",
    `Dear Recruitment Team,\n\n`,
    `A new experienced candidate has registered in the system:\n\n`,
    `Personal Info:\n`,
    `- Name: ${fields.firstName} ${fields.lastName} (${fields.gender})\n`,
    `- DOB: ${fields.dob}\n`,
    `- Email: ${fields.email}\n`,
    `- Mobile: ${fields.mobile}\n`,
    `- Location: ${fields.city}\n\n`,
    `Employment Info:\n`,
    `- Current Company: ${fields.currentCompany}\n`,
    `- Designation: ${fields.designation}\n`,
    `- Experience: ${fields.experience} Years\n`,
    `- Current CTC: ${fields.currentCtc}\n`,
    `- Function: ${fields.function}\n`,
    `- Industry: ${fields.industry}\n`,
    `- Core Skills: ${fields.skills}\n\n`,
    `Academic Info:\n`,
    `- Degree: ${fields.degree}\n`,
    `- Institute: ${fields.institute}\n\n`,
    `Attachment:\n`,
    `- Resume Name: ${resumeFile.name}\n`,
    `- Resume Size: ${(resumeFile.size / 1024).toFixed(2)} KB\n`
  );
  console.log("SMTP Mail Payload Attachment Setup: [Attaching resumeFile as Buffer]");
  console.log("Status: SMTP Mail with Resume sent successfully (Mock ID: msg_seeker_9001)");
  console.log("==========================================");
  return true;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Extract fields
    const textFields: Record<string, string> = {};
    const fieldKeys = [
      "firstName", "lastName", "gender", "dob", "email", "mobile", "city",
      "currentCompany", "designation", "experience", "currentCtc",
      "degree", "institute", "function", "industry", "skills"
    ];

    for (const key of fieldKeys) {
      const val = formData.get(key);
      if (!val) {
        return NextResponse.json(
          { error: `Missing required field: ${key}` },
          { status: 400 }
        );
      }
      textFields[key] = val.toString();
    }

    const resumeFile = formData.get("resume") as File | null;
    if (!resumeFile) {
      return NextResponse.json(
        { error: "Resume file attachment is required" },
        { status: 400 }
      );
    }

    // Convert file to buffer for processing or saving
    const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
    const resumeBase64 = resumeBuffer.toString("base64");
    console.log(`Successfully parsed resume: ${resumeFile.name} (Size: ${resumeFile.size} bytes)`);

    // Run integrations
    await triggerGoogleSheetsHook(textFields, resumeFile.name, resumeFile.type, resumeBase64);
    await triggerEmailNotification(textFields, resumeFile);

    return NextResponse.json({ success: true, message: "Profile registered successfully" });
  } catch (error: any) {
    console.error("API Error in Job Seeker Form processing:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
