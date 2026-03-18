import { env } from "../../config/env";
import { isMailConfigured, mailTransporter } from "../../config/nodemailer";

type AuthMailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type VerificationMailPayload = {
  email: string;
  name?: string | null;
  verificationUrl: string;
};

type ResetPasswordMailPayload = {
  email: string;
  name?: string | null;
  resetUrl: string;
};

const resolveGreetingName = (name?: string | null) => name?.trim() || "there";

const sendAuthMail = async ({ to, subject, html, text }: AuthMailPayload) => {
  if (isMailConfigured && mailTransporter) {
    await mailTransporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
      text,
    });
    return;
  }

  console.warn(`[auth-mail disabled] ${subject} -> ${to}
${text}`);
};

export const sendVerificationEmailMessage = async ({ email, name, verificationUrl }: VerificationMailPayload) => {
  const greetingName = resolveGreetingName(name);

  await sendAuthMail({
    to: email,
    subject: "Verify your XYZ Tech Club account",
    text: `Hi ${greetingName},

Please verify your email address to activate your XYZ Tech Club account:
${verificationUrl}

If you did not create this account, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #0f172a; max-width: 640px; margin: 0 auto;">
        <h2 style="margin-bottom: 12px; color: #0f4cbd;">Verify your email</h2>
        <p>Hi ${greetingName},</p>
        <p>Please verify your email address to activate your XYZ Tech Club account.</p>
        <p style="margin: 24px 0;">
          <a href="${verificationUrl}" style="display: inline-block; background: #0f4cbd; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 12px; font-weight: 600;">
            Verify email address
          </a>
        </p>
        <p>If the button does not work, open this link:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  });
};

export const sendResetPasswordEmailMessage = async ({ email, name, resetUrl }: ResetPasswordMailPayload) => {
  const greetingName = resolveGreetingName(name);

  await sendAuthMail({
    to: email,
    subject: "Reset your XYZ Tech Club password",
    text: `Hi ${greetingName},

We received a request to reset your password. Use the link below to set a new password:
${resetUrl}

If you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #0f172a; max-width: 640px; margin: 0 auto;">
        <h2 style="margin-bottom: 12px; color: #0f4cbd;">Reset your password</h2>
        <p>Hi ${greetingName},</p>
        <p>We received a request to reset your XYZ Tech Club account password.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #0f4cbd; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 12px; font-weight: 600;">
            Reset password
          </a>
        </p>
        <p>If the button does not work, open this link:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
};
