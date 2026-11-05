import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  memberIndex,
  spotlight,
  type LandingCopy,
  type MemberId,
} from "@/features/home/landingCopy";
import membersData from "@/data/members.json";

type MembersCopy = LandingCopy["members"];

const allMembers = [spotlight, ...memberIndex] as Array<
  (typeof memberIndex)[number] & { id: MemberId }
>;

const membersById = new Map<string, any>();
(membersData.members as any[]).forEach((m) => membersById.set(m.id, m));
if ((membersData as any).spotlight?.id) {
  membersById.set((membersData as any).spotlight.id, (membersData as any).spotlight);
}

function getLinkIcon(href: string) {
  const lower = href.toLowerCase();
  if (lower.includes("linkedin")) return "linked_in";
  if (lower.includes("instagram")) return "photo_camera";
  if (lower.includes("facebook") || lower.includes("fb.com")) return "facebook";
  if (lower.includes("github")) return "code";
  if (lower.includes("twitter") || lower.includes("x.com")) return "alternate_email";
  if (lower.includes("vercel") || lower.includes("portfolio") || lower.includes("benallou")) return "language";
  return "link";
}

function getLinkLabel(href: string) {
  const lower = href.toLowerCase();
  if (lower.includes("linkedin")) return "LinkedIn";
  if (lower.includes("instagram")) return "Instagram";
  if (lower.includes("facebook")) return "Facebook";
  if (lower.includes("github")) return "GitHub";
  if (lower.includes("twitter") || lower.includes("x.com")) return "X";
  if (lower.includes("vercel")) return "Portfolio";
  try {
    const url = new URL(href.startsWith("http") ? href : `https://${href}`);
    return url.hostname.replace("www.", "");
  } catch {
    return href;
  }
}

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

export function MembersSection({ copy }: { copy: MembersCopy }) {
  const { direction } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<MemberId | null>(null);
  const [cardsVisible, setCardsVisible] = useState(false);

  const visibleMembers = useMemo(
    () =>
      filter === "all"
        ? memberIndex
        : memberIndex.filter((member) => member.category === filter),
    [filter],
  );

  const selectedMember = useMemo(() => {
    if (!selectedId) return null;
    const index = allMembers.find((member) => member.id === selectedId);
    if (!index) return null;
    const extra = membersById.get(selectedId);
    return { ...index, ...copy.items[selectedId], links: extra?.links || [] };
  }, [copy.items, selectedId]);

  const browseList = useMemo(() => {
    if (!selectedId) return visibleMembers;
    return visibleMembers.some((member) => member.id === selectedId)
      ? visibleMembers
      : allMembers;
  }, [selectedId, visibleMembers]);

  const selectedIndex = selectedMember
    ? browseList.findIndex((member) => member.id === selectedMember.id)
    : -1;

  const categoryLabel =
    copy.categories.find((category) => category.id === selectedMember?.category)
      ?.label ?? "";

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    section.classList.add("jd-enhanced");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add("jd-on");
          observer.unobserve(section);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setCardsVisible(false);
    const frame = window.requestAnimationFrame(() => setCardsVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, [filter]);

  useEffect(() => {
    if (!selectedId) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedId(null);
      } else if (event.key === "ArrowRight") {
        const next = browseList[(selectedIndex + 1) % browseList.length];
        if (next) setSelectedId(next.id);
      } else if (event.key === "ArrowLeft") {
        const prev =
          browseList[
            (selectedIndex - 1 + browseList.length) % browseList.length
          ];
        if (prev) setSelectedId(prev.id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [browseList, selectedId, selectedIndex]);

  const openMember = (id: MemberId) => setSelectedId(id);
  const move = (step: number) => {
    if (selectedIndex < 0) return;
    const next =
      browseList[
        (selectedIndex + step + browseList.length) % browseList.length
      ];
    if (next) setSelectedId(next.id);
  };

  const spotlightCopy = copy.items[spotlight.id];

  return (
    <>
      <section
        ref={sectionRef}
        className="jd-members landing-section"
        id="members"
        data-jd-members
      >
        <div className="jd-head">
          <span className="jd-eyebrow">{copy.eyebrow}</span>
          <h2 className="jd-title">
            <span className="jd-title__line">
              <span className="jd-title__inner">{copy.title1}</span>
            </span>
            <span className="jd-title__line">
              <span className="jd-title__inner">{copy.title2}</span>
            </span>
          </h2>
          <span className="jd-rule" aria-hidden="true" />
          <div className="jd-head__foot">
            <p className="jd-lead">{copy.lead}</p>
            <span className="jd-index">
              {copy.index} — <b>{copy.edition}</b>
            </span>
          </div>
        </div>

        <div className="jd-spotlight">
          <div className="jd-spotlight__grid">
            <div className="jd-spotlight__media jd-photo">
              <img
                src={spotlight.image}
                alt={spotlightCopy.name}
                loading="lazy"
                decoding="async"
              />
              <span className="jd-spotlight__tag">{copy.spotlightTag}</span>
            </div>
            <div className="jd-spotlight__body">
              <div>
                <Icon
                  name="format_quote"
                  className="jd-spotlight__quote-icon"
                />
                <blockquote className="jd-quote">
                  {copy.spotlightQuote}
                </blockquote>
              </div>
              <div className="jd-spotlight__foot">
                <div>
                  <h3 className="jd-spotlight__name">{copy.spotlightName}</h3>
                  <p className="jd-spotlight__role">{copy.spotlightRole}</p>
                </div>
                <button
                  className="jd-spotlight__cta"
                  type="button"
                  onClick={() => openMember(spotlight.id)}
                >
                  {copy.viewProfile} <Icon name="arrow_forward" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="jd-filterbar">
          <div
            className="jd-filter"
            role="group"
            aria-label={copy.filterLabel}
            data-jd-filter
          >
            {copy.categories.map((category) => {
              const active = filter === category.id;
              return (
                <button
                  key={category.id}
                  className={`jd-filter__item${active ? " is-active" : ""}`}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(category.id)}
                >
                  {category.label}
                </button>
              );
            })}
            <span className="jd-filter__indicator" aria-hidden="true" />
          </div>
          <p className="jd-count">
            <b>{visibleMembers.length}</b> {copy.count}
          </p>
        </div>

        <div className="jd-grid" role="list" data-jd-grid>
          {memberIndex.map((member) => {
            const item = copy.items[member.id];
            const shown = filter === "all" || member.category === filter;
            const index = visibleMembers.findIndex(
              (entry) => entry.id === member.id,
            );
            return (
              <article
                key={member.id}
                className={`jd-card${shown && cardsVisible ? " is-in" : ""}`}
                role="listitem"
                hidden={!shown}
                style={{ ["--cd" as string]: `${Math.max(index, 0) * 55}ms` }}
              >
                <div className="jd-card__frame jd-photo">
                  <img
                    className="jd-card__img"
                    src={member.image}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    width="600"
                    height="800"
                  />
                  <span className="jd-card__tint" />
                  <span className="jd-card__num">{member.num}</span>
                  <span className="jd-card__arrow">
                    <Icon name="arrow_forward" />
                  </span>
                </div>
                <div className="jd-card__meta">
                  <h3 className="jd-card__name">{item.name}</h3>
                  <p className="jd-card__role">
                    {item.role} • {item.city}
                  </p>
                  <span className="jd-card__accent" />
                </div>
                <button
                  className="jd-card__hit"
                  type="button"
                  aria-label={`${copy.viewProfile}: ${item.name}`}
                  onClick={() => openMember(member.id)}
                >
                  <span className="jd-sr">{copy.viewProfile}</span>
                </button>
              </article>
            );
          })}
        </div>

        <div className="jd-stats" data-jd-stats>
          {copy.stats.map((stat) => (
            <div className="jd-stat" key={stat.label}>
              <div className="jd-stat__figure">
                <span className="jd-stat__value">{stat.value}</span>
                {stat.suffix ? (
                  <span className="jd-stat__suffix">{stat.suffix}</span>
                ) : null}
              </div>
              <span className="jd-stat__label">{stat.label}</span>
              <span className="jd-stat__note">{stat.note}</span>
            </div>
          ))}
        </div>
      </section>

      <div
        className={`jd-drawer-root${selectedMember ? " is-active is-open" : ""}`}
        aria-hidden={!selectedMember}
        data-jd-drawer-root
        dir={direction}
      >
        <div
          className="jd-drawer__overlay"
          data-jd-overlay
          onClick={() => setSelectedId(null)}
        />
        <aside
          className={`jd-drawer${selectedMember ? " is-open" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="jd-drawer-name"
          aria-describedby="jd-drawer-about"
          data-jd-drawer
        >
          <span className="jd-drawer__handle" aria-hidden="true" />
          <header className="jd-drawer__bar">
            <span className="jd-drawer__index">
              {copy.drawer.member}{" "}
              <b>#{selectedMember?.num ?? spotlight.num}</b>{" "}
              <span>
                {copy.drawer.of} {browseList.length} {copy.drawer.view}
              </span>
            </span>
            <button
              className="jd-drawer__close"
              type="button"
              data-jd-close
              aria-label={copy.drawer.close}
              onClick={() => setSelectedId(null)}
            >
              <Icon name="close" />
            </button>
          </header>
          <div className="jd-drawer__scroll">
            <figure className="jd-drawer__figure">
              <img
                data-jd-dimg
                src={selectedMember?.image ?? spotlight.image}
                alt={selectedMember?.name ?? ""}
                decoding="async"
              />
              <figcaption data-jd-dcaption>
                {copy.drawer.member} #{selectedMember?.num ?? spotlight.num}
              </figcaption>
            </figure>
            <div className="jd-drawer__body">
              <p className="jd-drawer__category jd-stage" data-jd-dcat>
                {categoryLabel.toUpperCase()}
              </p>
              <h3
                className="jd-drawer__name jd-stage"
                id="jd-drawer-name"
                data-jd-dname
              >
                {selectedMember?.name ?? ""}
              </h3>
              <p className="jd-drawer__role jd-stage" data-jd-drole>
                {selectedMember
                  ? `${selectedMember.role} • ${selectedMember.city}`
                  : ""}
              </p>
              <p
                className="jd-drawer__about jd-stage"
                id="jd-drawer-about"
                data-jd-dabout
              >
                {selectedMember?.about ?? ""}
              </p>
              <div className="jd-drawer__specs jd-stage">
                <p className="jd-drawer__specs-label">
                  {copy.drawer.specialties}
                </p>
                <ol data-jd-dspecs>
                  {selectedMember?.specs.map((spec, index) => (
                    <li className="jd-spec" key={spec}>
                      <span className="jd-spec__num">0{index + 1}</span>
                      <span className="jd-spec__text">{spec}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="jd-drawer__connect jd-stage">
                {selectedMember?.links && selectedMember.links.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    <p className="jd-drawer__specs-label">Links</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedMember.links.map((href: string) => (
                        <a
                          key={href}
                          className="group inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[#1e1a26] transition-colors hover:text-[#4d1b65]"
                          href={href.startsWith("http") ? href : `https://${href}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={getLinkLabel(href)}
                        >
                          <Icon
                            name={getLinkIcon(href)}
                            className="text-xl text-[#1e1a26] transition-colors group-hover:text-[#4d1b65]"
                          />
                          <span className="font-medium">{getLinkLabel(href)}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <a
                    className="jd-connect"
                    href="#contact"
                    onClick={() => setSelectedId(null)}
                  >
                    {copy.drawer.connect} <Icon name="arrow_forward" />
                  </a>
                )}
              </div>
            </div>
          </div>
          <nav className="jd-drawer__nav" aria-label={copy.filterLabel}>
            <button
              className="jd-drawer__navbtn"
              type="button"
              data-jd-prev
              data-dir="prev"
              onClick={() => move(-1)}
            >
              <Icon name="arrow_back" /> {copy.drawer.previous}
            </button>
            <button
              className="jd-drawer__navbtn"
              type="button"
              data-jd-next
              data-dir="next"
              onClick={() => move(1)}
            >
              {copy.drawer.next} <Icon name="arrow_forward" />
            </button>
          </nav>
        </aside>
      </div>
    </>
  );
}
