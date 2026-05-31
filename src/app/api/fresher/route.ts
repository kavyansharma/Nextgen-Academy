import { NextResponse } from "next/server";

// Stub helper for Google Sheets integration
async function triggerGoogleSheetsHook(
  fields: Record<string, string>, 
  resumeName: string, 
  reportName: string
) {
  console.log("=== TRIGGERING GOOGLE SHEETS HOOK ===");
  console.log("Sheet ID target: NEXTGEN_ACADEMY_APPLICANTS");
  console.log("Appended Row Data:", {
    Timestamp: new Date().toISOString(),
    Name: `${fields.firstName} ${fields.lastName}`,
    Gender: fields.gender,
    DOB: fields.dob,
    Email: fields.email,
    Mobile: fields.mobile,
    City: fields.city,
    Degree: fields.degree,
    Institute: fields.institute,
    IndustrialProject: fields.industrialProject.substring(0, 100) + "...",
    ResumeName: resumeName,
    ProjectReportName: reportName
  });
  console.log("Status: Google Sheets Academy Row Appended Successfully");
  console.log("======================================");
  return true;
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
    const reportBuffer = Buffer.from(await reportFile.arrayBuffer());

    console.log(`Successfully parsed Fresher Documents:\n- Resume: ${resumeFile.name}\n- Report: ${reportFile.name}`);

    // Trigger integrations
    await triggerGoogleSheetsHook(textFields, resumeFile.name, reportFile.name);
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
