import { NextResponse } from "next/server";
import { sendToWebhook } from "@/utils/webhook";

// Stub helper for email alerts
async function triggerEmailNotification(data: any) {
  console.log("=== TRIGGERING SMTP EMAIL NOTIFICATION ===");
  console.log("SMTP Config: smtp.secureserver.net (Port 465)");
  console.log("Mail From: appointments@nextgen-consulting.com");
  console.log("Mail To: scheduling@nextgen-consulting.com");
  console.log("Subject: [New Appointment Booked] " + data.name + " - " + data.companyName);
  console.log("Body: \n", 
    `Dear Team,\n\n`,
    `A new discovery consultation has been booked:\n\n`,
    `- Contact Name: ${data.name}\n`,
    `- Company: ${data.companyName}\n`,
    `- Email: ${data.email}\n`,
    `- Discussion Topic: ${data.topic}\n`,
    `- Scheduled Date: ${data.date}\n`,
    `- Scheduled Time: ${data.time}\n\n`,
    `Please follow up immediately.`
  );
  console.log("Status: SMTP Mail Sent Successfully (Mock ID: msg_book_7721)");
  console.log("==========================================");
  return true;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, companyName, topic, date, time } = body;

    // Backend Validation
    if (!name || !email || !companyName || !topic || !date || !time) {
      return NextResponse.json(
        { error: "Missing required booking details (make sure date and time are selected)" },
        { status: 400 }
      );
    }

    // Run integrations
    await sendToWebhook({
      formType: "Discovery Calls",
      name,
      email,
      phone: "",
      company: companyName,
      message: `Discussion Topic: ${topic}, Date: ${date}, Time: ${time}`,
      resumeLink: "",
      projectReportLink: ""
    });
    
    await triggerEmailNotification({ name, email, companyName, topic, date, time });

    return NextResponse.json({ success: true, message: "Booking slot confirmed successfully" });
  } catch (error: any) {
    console.error("API Error in Call Booking processing:", error);
    return NextResponse.json(
      { error: "Internal server error occurred: " + error.message },
      { status: 500 }
    );
  }
}
