const nodemailer = require("nodemailer");

// Create transport dynamically
const getTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback: Create test account dynamically on Ethereal
    try {
      const testAccount = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      console.warn("Could not establish Ethereal SMTP transporter, falling back to mock logger:", err.message);
      return {
        sendMail: async (mailOptions) => {
          console.log("\n✉️  [MOCK EMAIL SENT] ✉️");
          console.log(`To: ${mailOptions.to}`);
          console.log(`Subject: ${mailOptions.subject}`);
          console.log(`Body: ${mailOptions.html || mailOptions.text}`);
          console.log("───────────────────────────\n");
          return { messageId: "mock-id-" + Date.now() };
        }
      };
    }
  }
};

const sendDigestEmail = async (to, subject, htmlContent) => {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: `"Smart IoT Monitor" <noreply@smartmonitor.com>`,
      to,
      subject,
      html: htmlContent,
    });
    
    // Log preview link if using Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`✨ Email digest sent. Preview URL: ${previewUrl}`);
      return { success: true, previewUrl };
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to send email digest:", error.message);
    throw error;
  }
};

module.exports = { sendDigestEmail };
