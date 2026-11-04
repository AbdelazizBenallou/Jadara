import { useState } from "react";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import type { LandingCopy } from "@/features/home/landingCopy";

type ContactCopy = LandingCopy["contact"];
type FieldName = "name" | "email" | "subject" | "message";

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`material-icons-round leading-none ${className}`}
    >
      {name}
    </span>
  );
}

export function ContactSection({ copy }: { copy: ContactCopy }) {
  const [values, setValues] = useState<Record<FieldName, string>>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>(
    {},
  );
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const errorFor = (field: FieldName) => {
    if (!values[field].trim()) return copy.required;
    if (
      field === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[field])
    ) {
      return copy.invalidEmail;
    }
    return "";
  };

  const hasError = (field: FieldName) =>
    Boolean(touched[field] && errorFor(field));

  const update = (field: FieldName, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields: FieldName[] = ["name", "email", "subject", "message"];
    setTouched({ name: true, email: true, subject: true, message: true });
    if (fields.some((field) => errorFor(field))) return;

    setSending(true);
    const subject = encodeURIComponent(values.subject);
    const body = encodeURIComponent(
      `${copy.name}: ${values.name}\n${copy.email}: ${values.email}\n\n${values.message}`,
    );
    window.location.href = `mailto:jadara.dz.2026@gmail.com?subject=${subject}&body=${body}`;
    window.setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 450);
  };

  const reset = () => {
    setValues({ name: "", email: "", subject: "", message: "" });
    setTouched({});
    setSent(false);
  };

  const fields: {
    id: FieldName;
    label: string;
    type: "text" | "email" | "textarea";
    placeholder?: string;
  }[] = [
    { id: "name", label: copy.name, type: "text" },
    { id: "email", label: copy.email, type: "email" },
    {
      id: "subject",
      label: copy.subject,
      type: "text",
      placeholder: copy.subjectPlaceholder,
    },
    {
      id: "message",
      label: copy.message,
      type: "textarea",
      placeholder: copy.messagePlaceholder,
    },
  ];

  return (
    <section
      id="contact"
      className="landing-section w-full bg-[#f9f1ff] px-5 py-20 md:px-10 lg:px-16 lg:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-16">
          <span className="landing-eyebrow mb-3">{copy.eyebrow}</span>
          <h2 className="landing-display text-4xl font-semibold uppercase leading-[1.04] text-[#1e1a26] sm:text-5xl lg:text-6xl">
            {copy.title}
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-[#484456]">
            {copy.lead}
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-12">
          <div className="flex h-full flex-col justify-between lg:col-span-5">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="h-[2px] w-8 bg-[#4d1b65]" />
                <span className="landing-eyebrow font-bold">
                  {copy.dialogue}
                </span>
              </div>
              <h3 className="landing-display mb-8 text-3xl font-medium uppercase tracking-tight text-[#1e1a26]">
                {copy.hello}
              </h3>
              <div className="flex flex-col gap-7 text-[#1e1a26]">
                <a
                  className="group flex items-start gap-3 transition-colors hover:text-[#4d1b65]"
                  href="mailto:jadara.dz.2026@gmail.com"
                >
                  <Icon
                    name="mail"
                    className="text-2xl text-[#4d1b65] transition-transform group-hover:scale-110"
                  />
                  <span className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#484456]">
                      {copy.emailLabel}
                    </span>
                    <span className="landing-display text-xl font-semibold">
                      jadara.dz.2026@gmail.com
                    </span>
                  </span>
                </a>
                <div className="flex items-start gap-3">
                  <Icon
                    name="location_on"
                    className="text-2xl text-[#4d1b65]"
                  />
                  <span className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#484456]">
                      {copy.locationLabel}
                    </span>
                    <span className="landing-display text-xl font-semibold">
                      {copy.location}
                    </span>
                    <span className="text-sm leading-5 text-[#484456]">
                      {copy.locationNote}
                    </span>
                  </span>
                </div>
                <div className="flex flex-col gap-3 border-t border-[#cac3d9]/50 pt-5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#484456]">
                    {copy.network}
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      className="inline-flex items-center gap-2 rounded-lg bg-[#f4eafc] px-3 py-2 text-sm font-semibold text-[#1e1a26] shadow-sm transition-all hover:-translate-y-0.5 hover:text-[#4d1b65]"
                      href="https://www.instagram.com/jadara.dz"
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="Instagram"
                    >
                      <Instagram className="h-5 w-5" /> Instagram
                    </a>
                    <a
                      className="inline-flex items-center gap-2 rounded-lg bg-[#f4eafc] px-3 py-2 text-sm font-semibold text-[#1e1a26] shadow-sm transition-all hover:-translate-y-0.5 hover:text-[#4d1b65]"
                      href="https://www.facebook.com/profile.php?id=61569257160690"
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="Facebook"
                    >
                      <Facebook className="h-5 w-5" /> Facebook
                    </a>
                    <a
                      className="inline-flex items-center gap-2 rounded-lg bg-[#f4eafc] px-3 py-2 text-sm font-semibold text-[#1e1a26] shadow-sm transition-all hover:-translate-y-0.5 hover:text-[#4d1b65]"
                      href="https://www.linkedin.com"
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="h-5 w-5" /> LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-12 hidden rounded-lg border border-[#ddd8e5] bg-white p-4 lg:block">
              <p className="text-xs leading-5 text-[#484456]">{copy.note}</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-[#ddd8e5] bg-white p-6 shadow-sm md:p-10 lg:col-span-7">
            {sent ? (
              <div className="landing-success flex flex-col items-center justify-center px-4 py-16 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#e6deff] text-[#4d1b65]">
                  <Icon name="done" className="text-3xl" />
                </div>
                <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4d1b65]">
                  {copy.confirmation}
                </span>
                <h3 className="landing-display mb-2 text-4xl font-semibold uppercase tracking-tight text-[#1e1a26]">
                  {copy.successTitle}
                </h3>
                <p className="mb-7 max-w-md text-lg leading-7 text-[#484456]">
                  {copy.successBody}
                </p>
                <button
                  className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4d1b65] hover:underline"
                  type="button"
                  onClick={reset}
                >
                  {copy.again} →
                </button>
              </div>
            ) : (
              <form
                className="flex flex-col gap-4"
                onSubmit={handleSubmit}
                noValidate
              >
                {fields.map((field) => {
                  const error = hasError(field.id) ? errorFor(field.id) : "";
                  const valid = touched[field.id] && !errorFor(field.id);
                  return (
                    <div
                      className={`landing-form-field flex flex-col gap-1.5${error ? " is-invalid" : ""}${valid ? " is-valid" : ""}`}
                      key={field.id}
                    >
                      <label
                        className="text-sm font-semibold text-[#1e1a26]"
                        htmlFor={`contact-${field.id}`}
                      >
                        {field.label} <span className="text-[#4d1b65]">*</span>
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          className="w-full resize-y rounded border border-[#ddd8e5] bg-white px-4 py-3 text-[15px] text-[#1e1a26] outline-none placeholder:text-[#484456]/50 focus:border-[#4d1b65] focus:ring-2 focus:ring-[#4d1b65]/20"
                          id={`contact-${field.id}`}
                          name={field.id}
                          placeholder={field.placeholder}
                          required
                          rows={4}
                          value={values[field.id]}
                          onChange={(event) =>
                            update(field.id, event.target.value)
                          }
                          onBlur={() =>
                            setTouched((current) => ({
                              ...current,
                              [field.id]: true,
                            }))
                          }
                        />
                      ) : (
                        <input
                          className="w-full rounded border border-[#ddd8e5] bg-white px-4 py-3 text-[15px] text-[#1e1a26] outline-none placeholder:text-[#484456]/50 focus:border-[#4d1b65] focus:ring-2 focus:ring-[#4d1b65]/20"
                          id={`contact-${field.id}`}
                          name={field.id}
                          type={field.type}
                          placeholder={field.placeholder}
                          required
                          value={values[field.id]}
                          onChange={(event) =>
                            update(field.id, event.target.value)
                          }
                          onBlur={() =>
                            setTouched((current) => ({
                              ...current,
                              [field.id]: true,
                            }))
                          }
                        />
                      )}
                      {error ? (
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-[#ba1a1a]">
                          <Icon name="error" className="text-xs" /> {error}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
                <div className="pt-1">
                  <button
                    className="jd-btn group inline-flex w-full cursor-pointer items-center justify-center gap-2 bg-[#4d1b65] px-8 py-4 text-sm font-bold text-white transition-all hover:bg-[#3b144f] disabled:cursor-wait disabled:opacity-80 sm:w-auto"
                    type="submit"
                    disabled={sending}
                  >
                    {sending ? copy.sending : copy.send}
                    <Icon
                      name="arrow_forward"
                      className="text-sm transition-transform group-hover:translate-x-1"
                    />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
