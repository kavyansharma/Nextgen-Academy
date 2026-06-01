import { NextResponse } from "next/server";
import { sendToWebhook } from "@/utils/webhook";
import { uploadToGoogleDrive } from "@/utils/googleDrive";

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

    // 1. Upload Resume to Google Drive (under "Fresher Resumes")
    console.log(`Uploading resume "${resumeFile.name}" to Google Drive folder "Fresher Resumes"...`);
    let resumeLink: string;
    try {
      resumeLink = await uploadToGoogleDrive(resumeFile, "Fresher Resumes");
      console.log(`Resume uploaded successfully. Google Drive URL: ${resumeLink}`);
    } catch (uploadError: any) {
      console.error("Resume Google Drive upload failed:", uploadError);
      return NextResponse.json(
        { error: `Google Drive Resume upload failed: ${uploadError.message}. Please configure credentials or try again.` },
        { status: 500 }
      );
    }

    // 2. Upload Project Report to Google Drive (under "Project Reports")
    console.log(`Uploading project report "${reportFile.name}" to Google Drive folder "Project Reports"...`);
    let projectReportLink: string;
    try {
      projectReportLink = await uploadToGoogleDrive(reportFile, "Project Reports");
      console.log(`Project Report uploaded successfully. Google Drive URL: ${projectReportLink}`);
    } catch (uploadError: any) {
      console.error("Project Report Google Drive upload failed:", uploadError);
      return NextResponse.json(
        { error: `Google Drive Project Report upload failed: ${uploadError.message}. Please configure credentials or try again.` },
        { status: 500 }
      );
    }

    // Map fields to JSON structure
    const fullName = `${textFields.firstName} ${textFields.lastName}`;
    const detailedMessage = `Gender: ${textFields.gender}, DOB: ${textFields.dob}, City: ${textFields.city}, Degree: ${textFields.degree}, Industrial Project Summary: ${textFields.industrialProject}`;

    // Send to Google Sheets Apps Script Webhook
    try {
      await sendToWebhook({
        formType: "Freshers",
        name: fullName,
        email: textFields.email,
        phone: textFields.mobile,
        company: textFields.institute,
        message: detailedMessage,
        resumeLink,
        projectReportLink
      });
    } catch (webhookError: any) {
      console.error("Google Sheets webhook post failed:", webhookError);
      return NextResponse.json(
        { error: `Google Sheets integration failed: ${webhookError.message}` },
        { status: 500 }
      );
    }

    // Trigger email notification
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
