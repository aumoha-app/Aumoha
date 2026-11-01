import https from 'https';
import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'Aumoha Vet Consultations <appointments@aumoha.com>';

  if (smtpHost && smtpUser && smtpPass) {
    console.log(`📤 Sending transactional email via SMTP host ${smtpHost} to ${to}...`);
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort ? Number(smtpPort) : 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        html
      });
      console.log(`✅ Email sent successfully via SMTP! Message ID: ${info.messageId}`);
      return true;
    } catch (e) {
      console.error(`❌ Error sending email via SMTP:`, e);
      // Fall through to other email services on error
    }
  }

  const resendKey = process.env.RESEND_API_KEY;
  const sendgridKey = process.env.SENDGRID_API_KEY;

  if (resendKey) {
    console.log(`📤 Sending transactional email via Resend to ${to}...`);
    return new Promise((resolve) => {
      const data = JSON.stringify({
        from: 'Aumoha Vet Consultations <appointments@aumoha.com>',
        to: [to],
        subject: subject,
        html: html
      });

      const options = {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data, 'utf8')
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ Email sent successfully via Resend! Response: ${body}`);
            resolve(true);
          } else {
            console.error(`❌ Failed to send email via Resend. Status: ${res.statusCode}, Response: ${body}`);
            resolve(false);
          }
        });
      });

      req.on('error', (e) => {
        console.error(`❌ Error sending email via Resend:`, e);
        resolve(false);
      });

      req.setTimeout(10000, () => req.destroy(new Error('Email request timed out')));
      req.write(data);
      req.end();
    });
  }

  if (sendgridKey) {
    console.log(`📤 Sending transactional email via SendGrid to ${to}...`);
    return new Promise((resolve) => {
      const data = JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: 'appointments@aumoha.com', name: 'Aumoha Vet Consultations' },
        subject: subject,
        content: [{ type: 'text/html', value: html }]
      });

      const options = {
        hostname: 'api.sendgrid.com',
        port: 443,
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data, 'utf8')
        }
      };

      const req = https.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Email sent successfully via SendGrid!`);
          resolve(true);
        } else {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            console.error(`❌ Failed to send email via SendGrid. Status: ${res.statusCode}, Response: ${body}`);
            resolve(false);
          });
        }
      });

      req.on('error', (e) => {
        console.error(`❌ Error sending email via SendGrid:`, e);
        resolve(false);
      });

      req.setTimeout(10000, () => req.destroy(new Error('Email request timed out')));
      req.write(data);
      req.end();
    });
  }

  console.warn('Transactional email was not sent: configure an email provider.');
  return false;
}

export function generateBookingEmailHtml(appointment: any, mode: 'confirm' | 'reschedule' | 'cancel'): string {
  const statusLabel = mode === 'confirm' ? 'Confirmed' : mode === 'reschedule' ? 'Rescheduled' : 'Cancelled';
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0ebe1; border-radius: 12px; background-color: #faf6f0;">
      <h2 style="color: #3d5a45; font-family: serif; text-align: center;">Aumoha Vet Consult & Care</h2>
      <hr style="border: 0; border-top: 1px solid #ebe3d5; margin: 20px 0;" />
      <p style="font-size: 14px; color: #4a4a4a;">Hello Pet Parent,</p>
      <p style="font-size: 14px; color: #4a4a4a;">Your appointment with <strong>${appointment.vetName}</strong> is <strong>${statusLabel}</strong>.</p>
      
      <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #ebe3d5; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #888888; font-weight: bold;">Booking ID:</td>
            <td style="padding: 6px 0; text-align: right; color: #3d5a45; font-weight: bold;">${appointment.bookingId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888888; font-weight: bold;">Vet:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: bold;">${appointment.vetName} (${appointment.vetSpecialisation})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888888; font-weight: bold;">Date / Time:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #2e7d32;">${appointment.date} @ ${appointment.time}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888888; font-weight: bold;">Mode:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: bold; text-transform: capitalize;">${appointment.mode}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888888; font-weight: bold;">Pet:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: bold;">${appointment.petName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888888; font-weight: bold;">Consultation Fee:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #e65100;">₹${appointment.fee}</td>
          </tr>
        </table>
      </div>
      
      ${appointment.notes ? `<p style="font-size: 13px; color: #666666; font-style: italic;">Notes: ${appointment.notes}</p>` : ''}
      
      <p style="font-size: 12px; color: #888888; text-align: center; margin-top: 30px;">
        Need to update or cancel? Open the Aumoha app, navigate to Consult & Care > My Appointments.
      </p>
    </div>
  `;
}

export function generateDonationEmailHtml(donation: { amount: number; description: string }): string {
  const receiptNo = `REC-${Math.floor(100000 + Math.random() * 900000)}`;
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0ebe1; border-radius: 12px; background-color: #faf6f0;">
      <h2 style="color: #b68a35; font-family: serif; text-align: center;">Aumoha Moha Circle Donation Receipt</h2>
      <hr style="border: 0; border-top: 1px solid #ebe3d5; margin: 20px 0;" />
      <p style="font-size: 14px; color: #4a4a4a;">Dear Supporter,</p>
      <p style="font-size: 14px; color: #4a4a4a;">Thank you for your generous contribution to support the animals in our community. Your contribution has been processed successfully.</p>
      
      <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #ebe3d5; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #888888; font-weight: bold;">Receipt Number:</td>
            <td style="padding: 6px 0; text-align: right; color: #b68a35; font-weight: bold;">${receiptNo}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888888; font-weight: bold;">Purpose:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: bold;">${donation.description}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888888; font-weight: bold;">Date:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: bold;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888888; font-weight: bold;">Amount Contributed:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #2e7d32; font-size: 16px;">₹${donation.amount}</td>
          </tr>
        </table>
      </div>
      
      <p style="font-size: 13px; color: #666666; font-style: italic; text-align: center; margin: 20px 0;">
        "Every little contribution counts. Together, we make our neighborhood safe and happy for both humans and animals."
      </p>
      
      <p style="font-size: 12px; color: #888888; text-align: center; margin-top: 30px; border-top: 1px solid #ebe3d5; padding-top: 15px;">
        Aumoha - Mohalla of Humans & Animals. Thank you for your support!
      </p>
    </div>
  `;
}

