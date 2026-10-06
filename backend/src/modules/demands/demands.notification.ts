import { env } from "../../../framework/config/env.js";
import { emailUtils } from "../../../framework/utils/email.js";
import { demandRepository } from "./demands.repository.js";

type MailableDemand = NonNullable<
  Awaited<ReturnType<typeof demandRepository.findById>>
>;

const BRAND = "Jadara";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Prefers the live profile, then the snapshot taken at submission time so a
// decision email can still be sent after the account is gone.
function applicantName(demand: MailableDemand): string {
  const first = demand.applicant?.profiles?.first_name ?? demand.applicant_first_name;
  return first ? first.trim() : "there";
}

function applicantEmail(demand: MailableDemand): string | null {
  return demand.applicant?.email ?? demand.applicant_email ?? null;
}

function domainNames(demand: MailableDemand): string[] {
  return demand.demand_domains.map((dd) => dd.domains.name);
}

function organizationName(demand: MailableDemand): string | null {
  const details = demand.details;
  if (details === null || typeof details !== "object") return null;
  const name = (details as Record<string, unknown>).name;
  return typeof name === "string" && name.trim() !== "" ? name.trim() : null;
}

function layout(options: {
  heading: string;
  intro: string;
  domains?: string[];
  organization?: string | null;
  note?: string | null;
  cta?: { label: string; url: string };
  closing: string;
}): string {
  const domainsBlock =
    options.domains && options.domains.length > 0
      ? `<tr>
          <td style="padding:0 32px 24px 32px;">
            <p style="margin:0 0 8px 0;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#6b7280;">Requested domains</p>
            <ul style="margin:0;padding-left:18px;font-size:15px;line-height:24px;color:#374151;">
              ${options.domains.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}
            </ul>
          </td>
        </tr>`
      : "";

  const organizationBlock = options.organization
    ? `<tr>
        <td style="padding:0 32px 24px 32px;">
          <p style="margin:0 0 8px 0;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#6b7280;">Organization</p>
          <p style="margin:0;font-size:15px;line-height:24px;color:#374151;">${escapeHtml(options.organization)}</p>
        </td>
      </tr>`
    : "";

  const noteBlock = options.note
    ? `<tr>
        <td style="padding:0 32px 24px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-left:3px solid #d1d5db;border-radius:4px;">
            <tr>
              <td style="padding:16px 18px;">
                <p style="margin:0 0 6px 0;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#6b7280;">Review note</p>
                <p style="margin:0;font-size:15px;line-height:24px;color:#374151;white-space:pre-wrap;">${escapeHtml(options.note)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : "";

  const ctaBlock = options.cta
    ? `<tr>
        <td style="padding:0 32px 28px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background:#111827;border-radius:6px;">
                <a href="${escapeHtml(options.cta.url)}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(options.cta.label)}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(options.heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #e5e7eb;">
                <span style="font-size:18px;font-weight:700;letter-spacing:-0.01em;color:#111827;">${BRAND}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 24px 32px;">
                <h1 style="margin:0 0 16px 0;font-size:22px;line-height:30px;font-weight:700;color:#111827;">${escapeHtml(options.heading)}</h1>
                <p style="margin:0;font-size:15px;line-height:24px;color:#374151;">${options.intro}</p>
              </td>
            </tr>
            ${domainsBlock}
            ${organizationBlock}
            ${noteBlock}
            ${ctaBlock}
            <tr>
              <td style="padding:0 32px 32px 32px;">
                <p style="margin:0;font-size:15px;line-height:24px;color:#374151;">${options.closing}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;line-height:18px;color:#9ca3af;">You are receiving this message because an account was registered with this address on ${BRAND}.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function plainText(lines: string[]): string {
  return lines.join("\n\n");
}

export const demandNotification = {
  async sendApproved(demand: MailableDemand, note?: string): Promise<boolean> {
    const to = applicantEmail(demand);
    if (!to) return false;

    const name = applicantName(demand);
    const role = demand.roles.name;
    const domains = domainNames(demand);
    const organization = organizationName(demand);
    const loginUrl = env.FRONTEND_URL ? `${env.FRONTEND_URL}/login` : null;

    return emailUtils.sendSafe({
      to,
      subject: `Your ${BRAND} ${role} account has been approved`,
      text: plainText([
        `Hello ${name},`,
        `Your ${BRAND} ${role} application has been approved. You can now sign in with the email address and password you registered with.`,
        ...(organization ? [`Organization: ${organization}`] : []),
        ...(loginUrl ? [`Sign in: ${loginUrl}`] : []),
        ...(note ? [`Review note: ${note}`] : []),
      ]),
      html: layout({
        heading: `Welcome to ${BRAND}, ${name}`,
        intro: `Your application to join ${BRAND} as a <strong>${escapeHtml(role)}</strong> has been reviewed and approved. Your account is now active and you can sign in with the email address and password you registered with.`,
        domains,
        organization,
        note,
        cta: loginUrl ? { label: "Sign in", url: loginUrl } : undefined,
        closing: "If you did not expect this message or need help getting started, simply reply to this email.",
      }),
    });
  },

  async sendRejected(demand: MailableDemand, note?: string): Promise<boolean> {
    const to = applicantEmail(demand);
    if (!to) return false;

    const name = applicantName(demand);
    const role = demand.roles.name;

    return emailUtils.sendSafe({
      to,
      subject: `Your ${BRAND} ${role} application was not approved`,
      text: plainText([
        `Hello ${name},`,
        `Thank you for applying to join ${BRAND} as a ${role}. After review, we are unable to approve your application at this time.`,
        ...(note ? [`Reason: ${note}`] : []),
        `You are welcome to submit a new application in the future.`,
      ]),
      html: layout({
        heading: `Update on your ${BRAND} application`,
        intro: `Thank you for applying to join ${BRAND} as a <strong>${escapeHtml(role)}</strong>. After reviewing your application and documents, we are unable to approve it at this time.`,
        domains: domainNames(demand),
        organization: organizationName(demand),
        note,
        closing: "You are welcome to submit a new application in the future. If you believe this was a mistake, reply to this email and we will take another look.",
      }),
    });
  },
};