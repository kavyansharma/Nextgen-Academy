import { NextResponse } from "next/server";

// Stub helper for Google Sheets integration
async function triggerGoogleSheetsHook(fields: Record<string, string>, resumeName: string, resumeSize: number) {
  console.log("=== TRIGGERING GOOGLE SHEETS HOOK ===");
  console.log("Sheet ID target: NEXTGEN_CANDIDATE_REGISTRY");
  console.log("Appended Row Data:", {
    Timestamp: new Date().toISOString(),
    Name: `${fields.firstName} ${fields.lastName}`,
    Gender: fields.gender,
    DOB: fields.dob,
    Email: fields.email,
    Mobile: fields.mobile,
    City: fields.city,
    Company: fields.currentCompany,
    Designation: fields.designation,
    Experience: fields.experience + " Years",
    CTC: fields.currentCtc,
    Degree: fields.degree,
    Institute: fields.institute,
    Function: fields.function,
    Industry: fields.industry,
    Skills: fields.skills,
    ResumeName: resumeName,
    ResumeSize: (resumeSize / 1024).toFixed(2) + " KB"
  });
  console.log("Status: Google Sheets Candidate Row Appended");
  console.log("======================================");
  return true;
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
    console.log(`Successfully parsed resume: ${resumeFile.name} (Size: ${resumeFile.size} bytes)`);

    // Run integrations
    await triggerGoogleSheetsHook(textFields, resumeFile.name, resumeFile.size);
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
