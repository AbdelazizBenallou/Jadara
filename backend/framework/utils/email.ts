import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import logger from "../config/logger.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  ...(env.SMTP_USER && env.SMTP_PASS
    ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }
    : {}),
});

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function send(payload: EmailPayload): Promise<void> {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
  logger.info({ to: payload.to, subject: payload.subject }, "Email sent");
}

async function sendSafe(payload: EmailPayload): Promise<boolean> {
  try {
    await send(payload);
    return true;
  } catch (err) {
    logger.error(
      { err, to: payload.to, subject: payload.subject },
      "Failed to send email",
    );
    return false;
  }
}

async function verify(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (err) {
    logger.error({ err }, "SMTP connection failed");
    return false;
  }
}

export const emailUtils = {
  transporter,
  send,
  sendSafe,
  verify,
};
