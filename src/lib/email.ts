import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "academy@nextgen-consulting.com";

// Helper to wrap content in a premium responsive corporate HTML frame
function wrapInEmailTemplate(title: string, bodyContent: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #0B0F19;
            color: #E2E8F0;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #111827;
            border: 1px solid #1F2937;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
          }
          .header {
            background-color: #0F172A;
            padding: 30px;
            text-align: center;
            border-bottom: 2px solid #F97316;
          }
          .logo {
            font-size: 24px;
            font-weight: 900;
            color: #FFFFFF;
            letter-spacing: -0.025em;
          }
          .orange-text {
            color: #F97316;
          }
          .blue-text {
            color: #3B82F6;
          }
          .content {
            padding: 40px 30px;
            line-height: 1.6;
            color: #CBD5E1;
            font-size: 15px;
          }
          h2 {
            color: #FFFFFF;
            font-size: 20px;
            font-weight: 800;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .btn {
            display: inline-block;
            background-color: #F97316;
            color: #FFFFFF !important;
            padding: 12px 28px;
            font-weight: bold;
            font-size: 13px;
            text-decoration: none;
            border-radius: 10px;
            margin: 25px 0;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .btn-blue {
            background-color: #3B82F6;
          }
          .footer {
            background-color: #0F172A;
            padding: 20px;
            text-align: center;
            font-size: 11px;
            color: #64748B;
            border-top: 1px solid #1F2937;
          }
          .footer a {
            color: #3B82F6;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">NextGen<span class="orange-text">Academy</span></div>
          </div>
          <div class="content">
            ${bodyContent}
          </div>
          <div class="footer">
            <p>&copy; 2026 NextGen Academy & Consulting. All rights reserved.</p>
            <p>1207, Industrial Zone, EV Highway &bull; <a href="https://nextgenacademy.com">Visit Portal</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

interface MailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: MailPayload) {
  if (!resend) {
    console.log(`[Resend Mock Email Warning] resend key missing.`);
    console.log(`[Mock Send] To: ${to} | Subject: ${subject}`);
    return { success: true, mock: true };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (err) {
    console.error("Resend execution failed:", err);
    throw err;
  }
}

// 1. Welcome Email Template
export async function sendWelcomeEmail(to: string, fullName: string) {
  const body = `
    <h2>Welcome to NextGen Academy!</h2>
    <p>Dear ${fullName},</p>
    <p>Thank you for registering at NextGen Academy & Consulting. Your personal learning workspace is active and ready.</p>
    <p>Our platform enables manufacturing executives and plant engineers to build deep, verified industrial credentials in Lean Six Sigma, Automation, and Operational Leadership.</p>
    <p>Get started today by updating your profile and browsing our course catalog:</p>
    <div style="text-align: center;">
      <a href="https://nextgenacademy.com/portal/login" class="btn">Access Dashboard</a>
    </div>
    <p>If you have any questions or require custom corporate training support, feel free to reach out to our team at any time.</p>
    <p>Warm regards,<br/>The NextGen Academy Team</p>
  `;
  return sendEmail({
    to,
    subject: "Welcome to NextGen Academy & Consulting",
    html: wrapInEmailTemplate("Welcome to NextGen Academy", body),
  });
}

// 2. Payment Success Email
export async function sendPaymentSuccessEmail(to: string, fullName: string, paymentId: string, amount: number) {
  const body = `
    <h2>Upgrade Transaction Approved</h2>
    <p>Dear ${fullName},</p>
    <p>We have successfully processed your payment of <strong>₹${(amount / 100).toFixed(2)}</strong> for your Premium membership upgrade.</p>
    <p>Your transaction details are listed below for your records:</p>
    <div style="background-color: #0F172A; padding: 15px; border-radius: 12px; border: 1px solid #1F2937; font-family: monospace; font-size: 12px; margin: 20px 0; color: #94A3B8;">
      <div>Transaction ID: ${paymentId}</div>
      <div>Billing Amount: ₹${(amount / 100).toFixed(2)}</div>
      <div>Payment Status: SUCCESSFUL</div>
      <div>Date: ${new Date().toLocaleDateString()}</div>
    </div>
    <p>Your invoices can be accessed at any time inside your portal settings.</p>
    <p>Thank you for choosing NextGen Academy.</p>
  `;
  return sendEmail({
    to,
    subject: `Payment Successful - Receipt for ${paymentId}`,
    html: wrapInEmailTemplate("Payment Successful", body),
  });
}

// 3. Subscription Activated Email
export async function sendSubscriptionActivatedEmail(to: string, fullName: string, planName: string, expiryDate: string) {
  const body = `
    <h2>Premium Subscription Active</h2>
    <p>Dear ${fullName},</p>
    <p>Congratulations! Your account has been upgraded to the <strong>${planName} Plan</strong>.</p>
    <p>Your profile role is elevated. You now have unrestricted access to:</p>
    <ul>
      <li>All Premium Course Syllabus modules</li>
      <li>Secure Google Cloud Storage video files</li>
      <li>Direct downloads of advanced engineering frameworks and playbooks</li>
      <li>Official credentials generation and verification</li>
    </ul>
    <p>Your validation period is active through: <strong>${new Date(expiryDate).toLocaleDateString()}</strong>.</p>
    <div style="text-align: center;">
      <a href="https://nextgenacademy.com/portal/dashboard" class="btn btn-blue">Start Learning Now</a>
    </div>
  `;
  return sendEmail({
    to,
    subject: "Premium Membership Activated - NextGen Academy",
    html: wrapInEmailTemplate("Subscription Activated", body),
  });
}

// 4. Subscription Expiry Warning
export async function sendSubscriptionExpiryEmail(to: string, fullName: string, daysLeft: number, expiryDate: string) {
  const body = `
    <h2>Membership Expiring in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}</h2>
    <p>Dear ${fullName},</p>
    <p>This is a friendly reminder that your Premium membership at NextGen Academy will expire in <strong>${daysLeft} ${daysLeft === 1 ? "day" : "days"}</strong> on ${new Date(expiryDate).toLocaleDateString()}.</p>
    <p>To avoid any disruption to your course progress, note-taking archives, and resource library access, please renew your plan before expiration.</p>
    <div style="text-align: center;">
      <a href="https://nextgenacademy.com/portal/courses" class="btn">Renew Subscription</a>
    </div>
    <p>If your account expires, your access role will automatically downgrade to the Free learning tier.</p>
  `;
  return sendEmail({
    to,
    subject: `Action Required: Subscription Expiring in ${daysLeft} Days`,
    html: wrapInEmailTemplate("Subscription Expiring", body),
  });
}

// 5. Certificate Earned Email
export async function sendCertificateEarnedEmail(to: string, fullName: string, courseName: string, certId: string, verCode: string) {
  const body = `
    <h2>Congratulations on earning your Certificate!</h2>
    <p>Dear ${fullName},</p>
    <p>We are thrilled to celebrate your achievement! You have successfully completed all modules for <strong>"${courseName}"</strong>.</p>
    <p>Your official certification has been issued and catalogued in our verification registry:</p>
    <div style="background-color: #0F172A; padding: 15px; border-radius: 12px; border: 1px solid #1F2937; font-family: monospace; font-size: 12px; margin: 20px 0; color: #94A3B8; line-height: 1.8;">
      <div>Credential ID: ${certId}</div>
      <div>Verification Code: ${verCode}</div>
      <div>Verify link: <a href="https://nextgenacademy.com/certificate/verify/${verCode}" style="color: #F97316;">https://nextgenacademy.com/certificate/verify/${verCode}</a></div>
    </div>
    <p>You can download the print-ready PDF certificate on the portal's Certificate desk.</p>
    <div style="text-align: center;">
      <a href="https://nextgenacademy.com/portal/certificates" class="btn">Download PDF Certificate</a>
    </div>
  `;
  return sendEmail({
    to,
    subject: `Certificate Earned: ${courseName} - NextGen Academy`,
    html: wrapInEmailTemplate("Certificate Earned", body),
  });
}

// 6. Password Reset Email
export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const body = `
    <h2>Password Recovery Request</h2>
    <p>Hello,</p>
    <p>We received a request to recover your password for your NextGen Academy profile.</p>
    <p>Please click the secure button below to set up a new password. This recovery validation link is valid for 1 hour.</p>
    <div style="text-align: center;">
      <a href="${resetLink}" class="btn">Reset Password</a>
    </div>
    <p>If you did not make this request, you can safely ignore this email; your credentials remain secure.</p>
  `;
  return sendEmail({
    to,
    subject: "Reset Your Password - NextGen Academy",
    html: wrapInEmailTemplate("Password Reset Request", body),
  });
}

// 7. Broadcast Email template
export async function sendBroadcastEmail(to: string, title: string, messageContent: string) {
  const body = `
    <h2>Special Update from NextGen Academy</h2>
    <p>${messageContent.replace(/\n/g, "<br/>")}</p>
  `;
  return sendEmail({
    to,
    subject: title,
    html: wrapInEmailTemplate(title, body),
  });
}
