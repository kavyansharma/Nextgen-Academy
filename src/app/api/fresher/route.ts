import { NextResponse } from "next/server";

// Helper for Google Sheets integration via Google Apps Script Web App
async function triggerGoogleSheetsHook(
  fields: Record<string, string>,
  resumeName: string,
  resumeType: string,
  resumeBase64: string,
  reportName: string,
  reportType: string,
  reportBase64: string
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
        formType: "fresher",
        authSecret,
        data: fields,
        files: [
          {
            name: resumeName,
            type: resumeType,
            contentBase64: resumeBase64
          },
          {
            name: reportName,
            type: reportType,
            contentBase64: reportBase64
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

    console.log("Google Sheets Academy Row Appended successfully for Fresher:", fields.email);
    return true;
  } catch (error: any) {
    console.error("Error sending data to Google Sheets Web App:", error);
    throw new Error("Google Sheets Integration error: " + error.message);
  }
}

// Stub helper for email alerts with attachments
async function triggerEmailNotification(
  fields: Record<string, string>, 
  resumeFile: File, 
  reportFile: File
) {
  console.log("=== TRIGGERING SMTP EMAIL NOTIFICATION ===");
  console.log("SMTP Config: smtp.secureserver.net (Port 465)");
  console.log("Mail From: academy@nextgen-consulting.com");
  console.log("Mail To: academy-enroll@nextgen-consulting.com");
  console.log(`Subject: [Academy Application] ${fields.firstName} ${fields.lastName} - ${fields.degree}`);
  console.log("Body: \n",
    `Dear Academy Admissions Team,\n\n`,
    `A new fresher has applied for NextGen Academy enrollment:\n\n`,
    `Personal Details:\n`,
    `- Name: ${fields.firstName} ${fields.lastName} (${fields.gender})\n`,
    `- Date of Birth: ${fields.dob}\n`,
    `- Email: ${fields.email}\n`,
    `- Mobile: ${fields.mobile}\n`,
    `- Location: ${fields.city}\n\n`,
    `Academic Details:\n`,
    `- Degree & Specialization: ${fields.degree}\n`,
    `- Institute/University: ${fields.institute}\n\n`,
    `Industrial Project Summary:\n`,
    `${fields.industrialProject}\n\n`,
    `Attachments:\n`,
    `1. Resume: ${resumeFile.name} (${(resumeFile.size / 1024).toFixed(2)} KB)\n`,
    `2. Project Report: ${reportFile.name} (${(reportFile.size / 1024).toFixed(2)} KB)\n`
  );
  console.log("SMTP Mail Payload Attachment Setup: [Attaching resumeFile and reportFile as Buffers]");
  console.log("Status: SMTP Mail with double attachments sent successfully (Mock ID: msg_fresh_1010)");
  console.log("==========================================");
  return true;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Extract text fields
    const textFields: Record<string, string> = {};
    const fieldKeys = [
      "firstName", "lastName", "gender", "dob", "email", "mobile", "city",
      "degree", "institute", "industrialProject"
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

    // Extract files
    const resumeFile = formData.get("resume") as File | null;
    const reportFile = formData.get("projectReport") as File | null;

    if (!resumeFile || !reportFile) {
      return NextResponse.json(
        { error: "Both resume and project report uploads are required" },
        { status: 400 }
      );
    }

    // Process files to buffers (e.g. for storage or email attachment)
    const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
    const resumeBase64 = resumeBuffer.toString("base64");
    const reportBuffer = Buffer.from(await reportFile.arrayBuffer());
    const reportBase64 = reportBuffer.toString("base64");

    console.log(`Successfully parsed Fresher Documents:\n- Resume: ${resumeFile.name}\n- Report: ${reportFile.name}`);

    // Trigger integrations
    await triggerGoogleSheetsHook(
      textFields, 
      resumeFile.name, 
      resumeFile.type, 
      resumeBase64, 
      reportFile.name, 
      reportFile.type, 
      reportBase64
    );
    await triggerEmailNotification(textFields, resumeFile, reportFile);

    return NextResponse.json({ success: true, message: "Academy enrollment application received" });
  } catch (error: any) {
    console.error("API Error in Fresher Form processing:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
