import { NextResponse } from "next/server";
import { handleFileUpload, sendToWebhook } from "@/utils/webhook";

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

    // Upload to Google Drive (with local storage fallback)
    const origin = new URL(request.url).origin;
    const resumeLink = await handleFileUpload(resumeFile, origin);
    console.log(`Uploaded resume: ${resumeLink}`);

    // Map fields to JSON webhook structure
    const fullName = `${textFields.firstName} ${textFields.lastName}`;
    const detailedMessage = `Gender: ${textFields.gender}, DOB: ${textFields.dob}, City: ${textFields.city}, Designation: ${textFields.designation}, Experience: ${textFields.experience} Years, Current CTC: ${textFields.currentCtc}, Degree: ${textFields.degree}, Institute: ${textFields.institute}, Function: ${textFields.function}, Industry: ${textFields.industry}, Skills: ${textFields.skills}`;

    // Send to Google Sheets Apps Script Webhook
    await sendToWebhook({
      formType: "Job Seeker",
      name: fullName,
      email: textFields.email,
      phone: textFields.mobile,
      company: textFields.currentCompany,
      message: detailedMessage,
      resumeLink,
      projectReportLink: ""
    });

    // Run email notification
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
