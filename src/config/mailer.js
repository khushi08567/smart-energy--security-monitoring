const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Smart Energy Monitor" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email send failed:", error.message);
    return { success: false, error: error.message };
  }
};

const sendSecurityAlert = async (event) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc3545;">🚨 Security Alert</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Event Type</b></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${event.event_type}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Severity</b></td>
            <td style="padding: 8px; border: 1px solid #ddd; color: red;">${event.severity}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Room ID</b></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${event.room_id}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Device</b></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${event.device_id}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Description</b></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${event.description}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Time</b></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${new Date(event.timestamp).toLocaleString()}</td></tr>
      </table>
      <p style="color: #666; margin-top: 16px;">Please check the monitoring dashboard immediately.</p>
    </div>
  `;
  return sendEmail({
    to: process.env.ALERT_EMAIL,
    subject: `🚨 [${event.severity}] Security Alert — ${event.event_type}`,
    html,
  });
};

const sendEnergyAlert = async ({ room_id, room_number, total_kwh, threshold_kwh }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #fd7e14;">⚡ Energy Threshold Alert</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Room</b></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${room_number} (ID: ${room_id})</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Current Usage</b></td>
            <td style="padding: 8px; border: 1px solid #ddd; color: red;">${total_kwh} kWh</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Threshold</b></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${threshold_kwh} kWh</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><b>Time</b></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${new Date().toLocaleString()}</td></tr>
      </table>
      <p style="color: #666; margin-top: 16px;">Please investigate unusual energy consumption.</p>
    </div>
  `;
  return sendEmail({
    to: process.env.ALERT_EMAIL,
    subject: `⚡ Energy Alert — Room ${room_number} exceeded threshold`,
    html,
  });
};

module.exports = { sendEmail, sendSecurityAlert, sendEnergyAlert };