import { NextResponse } from "next/server";
import { sendToWebhook } from "@/utils/webhook";

// Stub helper for email alerts
async function triggerEmailNotification(data: any) {
  console.log("=== TRIGGERING SMTP EMAIL NOTIFICATION ===");
  console.log("SMTP Config: smtp.secureserver.net (Port 465)");
  console.log("Mail From: notifications@nextgen-consulting.com");
  console.log("Mail To: admissions@nextgen-consulting.com, search@nextgen-consulting.com");
  console.log("Subject: [New Recruiter Query] " + data.companyName);
  console.log("Body: \n", 
    `Dear Team,\n\n`,
    `A new recruiter lead has submitted their details:\n\n`,
    `- Contact Name: ${data.name}\n`,
    `- Company: ${data.companyName}\n`,
    `- Email: ${data.email}\n`,
    `- Mobile: ${data.mobile}\n`,
    `- Message: ${data.message}\n\n`,
    `Please follow up immediately.`
  );
  console.log("Status: SMTP Mail Sent Successfully (Mock ID: msg_rec_8832)");
  console.log("==========================================");
  return true;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, mobile, email, companyName, message } = body;

    // Backend Validation
    if (!name || !mobile || !email || !companyName || !message) {
      return NextResponse.json(
        { error: "Missing required fields on submission" },
        { status: 400 }
      );
    }

    // Run integrations
    await sendToWebhook({
      formType: "Hiring",
      name,
      email,
      phone: mobile,
      company: companyName,
      message,
      resumeLink: "",
      projectReportLink: ""
    });
    await triggerEmailNotification({ name, mobile, email, companyName, message });

    return NextResponse.json({ success: true, message: "Recruiter requirement received" });
  } catch (error: any) {
    console.error("API Error in Recruiter Form processing:", error);
    return NextResponse.json(
      { error: "Internal server error occurred: " + error.message },
      { status: 500 }
    );
  }
}
