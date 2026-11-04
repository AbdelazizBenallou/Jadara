import type { Language } from "@/i18n";

export type LandingCopy = {
  hero: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    description: string;
    join: string;
    explore: string;
    members: string;
    cities: string;
    salon: string;
    archive: string;
    archiveYear: string;
    established: string;
    quote: string;
    source: string;
  };
  about: {
    eyebrow: string;
    title: string;
    body1: string;
    body2: string;
    statRatio: string;
    statRatioLabel: string;
    statHubs: string;
    statHubsLabel: string;
    manifesto: string;
    read: string;
  };
  values: {
    eyebrow: string;
    title: string;
    lead: string;
    items: {
      kicker: string;
      title: string;
      description: string;
      meta: string;
      icon: string;
    }[];
  };
  events: {
    eyebrow: string;
    title: string;
    all: string;
    items: {
      tag: string;
      date: string;
      venue: string;
      title: string;
      description: string;
      cta: string;
      limit?: string;
      tone: "primary" | "secondary";
    }[];
  };
  team: {
    eyebrow: string;
    title: string;
    lead: string;
    caption: string;
    captionNote: string;
    year: string;
    hubs: { city: string; note: string; since: string }[];
    specialists: string;
    wilayas: string;
    cta: string;
  };
  members: {
    eyebrow: string;
    title1: string;
    title2: string;
    lead: string;
    index: string;
    edition: string;
    spotlightTag: string;
    spotlightQuote: string;
    spotlightName: string;
    spotlightRole: string;
    viewProfile: string;
    filterLabel: string;
    categories: { id: string; label: string }[];
    count: string;
    stats: { value: string; suffix: string; label: string; note: string }[];
    drawer: {
      member: string;
      of: string;
      view: string;
      close: string;
      specialties: string;
      connect: string;
      previous: string;
      next: string;
    };
    items: Record<
      MemberId,
      {
        name: string;
        role: string;
        city: string;
        since: string;
        about: string;
        specs: string[];
      }
    >;
  };
  story: {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
    badge: string;
  };
  gallery: {
    eyebrow: string;
    title: string;
    lead: string;
    items: { caption: string; time: string; title: string }[];
  };
  testimonials: {
    eyebrow: string;
    kicker: string;
    lead: string;
    items: { quote: string; name: string; role: string }[];
  };
  join: {
    eyebrow: string;
    title: string;
    body: string;
    note: string;
    cta: string;
    cohort: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    lead: string;
    dialogue: string;
    hello: string;
    emailLabel: string;
    locationLabel: string;
    location: string;
    locationNote: string;
    network: string;
    note: string;
    name: string;
    email: string;
    subject: string;
    subjectPlaceholder: string;
    message: string;
    messagePlaceholder: string;
    required: string;
    invalidEmail: string;
    send: string;
    sending: string;
    confirmation: string;
    successTitle: string;
    successBody: string;
    again: string;
  };
};

export type MemberId =
  | "benallou-abdelaziz"
  | "saouab-karima-nada"
  | "nadjoua-nour-elhouda"
  | "sahraoui-taous"
  | "kadi-tarik"
  | "araria-mohamed-amine"
  | "amira-kaci"
  | "maya-lin"
  | "idris-bouzid"
  | "nadia-rahmani"
  | "karim-belkacem"
  | "tariq-mansouri"
  | "samira-vance"
  | "rim-haddad"
  | "elena-rostova"
  | "yusuf-demir"
  | "salma-benali"
  | "laleh-karimi"
  | "ines-chaabane";

export const memberIndex: {
  id: MemberId;
  num: string;
  category: string;
  image: string;
}[] = [
  {
    id: "saouab-karima-nada" as MemberId,
    num: "001",
    category: "environment",
    image: "/member_info/1/IMG-20261003-WA0003.jpg.jpeg",
  },
  {
    id: "nadjoua-nour-elhouda" as MemberId,
    num: "002",
    category: "media",
    image: "/member_info/2/IMG-20261004-WA0003(1).jpg.jpeg",
  },
  {
    id: "sahraoui-taous" as MemberId,
    num: "003",
    category: "education",
    image: "/member_info/3./IMG-20261009-WA0001(1).jpg.jpeg",
  },
  {
    id: "kadi-tarik" as MemberId,
    num: "004",
    category: "design",
    image: "/member_info/4/PNG.jpg.jpeg",
  },
  {
    id: "araria-mohamed-amine" as MemberId,
    num: "005",
    category: "media",
    image: "/member_info/5/WhatsApp Image 2026-10-26 at 21.47.15.jpeg",
  },
  {
    id: "benallou-abdelaziz" as MemberId,
    num: "006",
    category: "technology",
    image: "/member_info/6/photo_2026-10-26_21-03-01.jpg",
  }
];

export const spotlight = {
  id: "benallou-abdelaziz" as MemberId,
  num: "006",
  category: "technology",
  image: "/member_info/6/photo_2026-10-26_21-03-01.jpg",
};

const en: LandingCopy = {
  hero: {
    eyebrow: "Jadara Club — Community / Culture / Connection",
    title: "Make space for something",
    titleAccent: "meaningful.",
    description:
      "Jadara is an intellectual salon and cultural collective built around people, ideas, craft, and authentic dialogue. We strip away synthetic networking to foster unscripted creative communion.",
    join: "Join the Club",
    explore: "Explore Members",
    members: "+500 members actively creating",
    cities: "Across Algiers, Oran, London & Paris",
    salon: "Salon No. 42",
    archive: "The Architecture of Stillness",
    archiveYear: "2026 Archive",
    established: "Est. 2020",
    quote: '"Curated collisions for the restless mind."',
    source: "— Cultural Gazette",
  },
  about: {
    eyebrow: "01 / Manifest",
    title: "A club built around people, not titles.",
    body1:
      "Jadara brings together people who want to learn, create, connect and contribute. We create physical and conceptual spaces where spontaneous conversations evolve into enduring partnerships, independent publications, and progressive ventures.",
    body2:
      "Through monthly conversational salons, intimate communal dinners, quiet studio residencies, and collaborative showcases, we sustain an ecosystem of radical hospitality and focused intellectual pursuit.",
    statRatio: "100%",
    statRatioLabel: "Curated Curation Ratio",
    statHubs: "04",
    statHubsLabel: "Independent City Hubs",
    manifesto: "The Jadara Manifesto — Vol. IV",
    read: "Read Dispatch",
  },
  values: {
    eyebrow: "Pillars of Practice",
    title: "Our Core Disciplines",
    lead: "A structured environment designed to reject transactional networking in favor of shared friction and deep creative exploration.",
    items: [
      {
        kicker: "01 / Culture",
        title: "Community",
        description:
          "Meet people who share your curiosity, intellectual ambition and constructive energy. No status pretenses; pure collaborative parity.",
        meta: "Cohort Rituals",
        icon: "groups",
      },
      {
        kicker: "02 / Action",
        title: "Creative Energy",
        description:
          "Turn latent concepts into physical publications, installations, collaborative studios, and independent experiments.",
        meta: "Studio Grants",
        icon: "bolt",
      },
      {
        kicker: "03 / Discourse",
        title: "Learning",
        description:
          "Discover unprecedented perspectives through guest salons, masterclasses, and intensive dialectical seminars led by leading practitioners.",
        meta: "Bi-Weekly Masterclasses",
        icon: "menu_book",
      },
      {
        kicker: "04 / Synergy",
        title: "Connection",
        description:
          "Build resilient interpersonal bonds that transcend geographical boundaries and live far beyond the walls of the physical club.",
        meta: "Global Reciprocity",
        icon: "hub",
      },
    ],
  },
  events: {
    eyebrow: "Current Programming",
    title: "Come to the next one.",
    all: "View all seasonal gatherings",
    items: [
      {
        tag: "Art & Concept",
        date: "18 OCT 2026",
        venue: "Jadara Main Salon",
        title: "Creative Night: Latent Forms",
        description:
          "An evening of unscripted ideas, open-source portfolio critiques, and collaborative auditory performance exploring contemporary visual craft.",
        cta: "RSVP Member Pass",
        limit: "Limited to 40 Guests",
        tone: "primary",
      },
      {
        tag: "Gathering",
        date: "26 OCT 2026",
        venue: "The Loft Gallery",
        title: "Community Assembly & Tea Ritual",
        description:
          "Open town hall agenda, rapid-fire project incubators, and our seasonal oolong tea service. Bring an ongoing dilemma to unpack.",
        cta: "Open to Prospective Members",
        tone: "secondary",
      },
      {
        tag: "Workshop",
        date: "02 NOV 2026",
        venue: "Print Studio",
        title: "Masterclass: Print & Post-Digital",
        description:
          "Hands-on physical print layout, micro-typography, and distribution tactics with visiting typographers.",
        cta: "Seats Filling",
        tone: "primary",
      },
    ],
  },
  team: {
    eyebrow: "Global Team",
    title: "One collective, many wilayas.",
    lead: "The people below are the working core of Jadara — the hosts, curators and technicians who keep every salon running, from Tiaret to Adrar.",
    caption: "Collective Portrait",
    captionNote: "Main Salon, after the last session of the season",
    year: "2026",
    hubs: [
      { city: "Tiaret", note: "Salon Mensuel & Studio", since: "Est. 2021" },
      { city: "Adrar", note: "Terrain Residencies", since: "Est. 2022" },
      { city: "Laghout", note: "Arts & Artisanat", since: "Est. 2023" },
      { city: "Constantine", note: "Publishing Desk", since: "Est. 2024" },
    ],
    specialists: "Core Specialists",
    wilayas: "Wilayas Represented",
    cta: "Work with the team",
  },
  members: {
    eyebrow: "The People",
    title1: "Meet the",
    title2: "Community.",
    lead: "Independent practitioners, architects, writers and cultural technologists defining tomorrow's narrative. Filter the index, then open any profile to read their practice in full.",
    index: "Specialists Index",
    edition: "Edition 04",
    spotlightTag: "Member #006 • Backend & DevOps Engineer",
    spotlightQuote:
      "Computer Science graduate specialized in networking, telecommunications, and security, with experience in Linux systems administration and backend/mobile development. Skilled in de...",
    spotlightName: "Benallou Abdelaziz",
    spotlightRole:
      "Backend & DevOps Engineer",
    viewProfile: "View profile",
    filterLabel: "Filter members by specialty",
    categories: [
      { id: "all", label: "All" },
      { id: "technology", label: "Technology" },
      { id: "media", label: "Media" },
      { id: "design", label: "Design" },
      { id: "environment", label: "Environment" },
      { id: "education", label: "Education" },
      { id: "art-culture", label: "Art & Culture" },
      { id: "business", label: "Business" },
    ],
    count: "members shown",
    stats: [
      {
        value: "500",
        suffix: "+",
        label: "Members",
        note: "Curated practitioners globally",
      },
      {
        value: "30",
        suffix: "+",
        label: "Events",
        note: "Salons, workshops and critiques",
      },
      {
        value: "12",
        suffix: "",
        label: "Communities",
        note: "Self-organising guild spaces",
      },
      {
        value: "8",
        suffix: "+",
        label: "Projects",
        note: "Ventures born from conversation",
      },
    ],
    drawer: {
      member: "Member",
      of: "of",
      view: "in view",
      close: "Close profile",
      specialties: "Specialities",
      connect: "Connect",
      previous: "Previous",
      next: "Next",
    },
    items: {
      "saouab-karima-nada": {
        name: "SAOUAB KARIMA NADA",
        role: "Logistics Team Lead",
        city: "Tiaret",
        since: "2026",
        about:
          "Bachelor's graduate in Biology, specializing in Ecology and Environment, passionate about biodiversity conservation, ecosystems, and sustainable development. Experienced in volunteering, event organization, environmental awareness, scientific communication, teamwork, organization, logistics coordination, and workshop facilitation. Initiative-driven with a love for learning and contributing to positive-impact projects.",
        specs: ["Ecology & Environment", "Biodiversity", "Sustainable Development", "Event Organization", "Scientific Communication"],
      },
      "nadjoua-nour-elhouda": {
        name: "Nadjoua Nour elhouda",
        role: "Media & Content Creator",
        city: "Tiaret",
        since: "2026",
        about:
          "Digital Systems student, specializing in Computer Science and Networks. Member of Media Face group. Focused on digital content creation.",
        specs: ["Digital Systems", "Networks", "Content Creation"],
      },
      "sahraoui-taous": {
        name: "SAHRAOUI Taous",
        role: "Secretary & Page Manager",
        city: "Tiaret",
        since: "2026",
        about:
          "Third-year Physiotherapy and Rehabilitation student, passionate about volunteering and impactful social initiatives. Skills: Communication, teamwork, organization, and administrative follow-up. Role at Jadara: Monitoring team tasks, preparing meeting minutes, managing the page and responding to messages and comments.",
        specs: ["Physiotherapy & Rehabilitation", "Communication", "Administration", "Team Coordination"],
      },
      "kadi-tarik": {
        name: "Kadi Tarik",
        role: "Graphic Designer & Video Editor",
        city: "Tiaret",
        since: "2026",
        about:
          "Graphic designer and short form video editor born on 10/10/2000.",
        specs: ["Graphic Design", "Short Form Video Editing"],
      },
      "araria-mohamed-amine": {
        name: "Araria Mohamed Amine",
        role: "Photographer & Media Artist",
        city: "Tiaret",
        since: "2026",
        about:
          "Young multi-talented individual passionate about arts, media and communication. Skilled in photography, acting, voice-over, writing, and event hosting. Member of Smart Academy - Tiaret and active member of Jadara community - Tiaret, official photographer for Jadara activities. Languages: Arabic (native), French, English (B2). Participated in HIPPO International English Language Olympiad and Oxford S.I.L. Olympiad.",
        specs: ["Photography", "Acting", "Voice Over", "Writing", "Event Hosting"],
      },
      "benallou-abdelaziz": {
        name: "Benallou Abdelaziz",
        role: "Backend & DevOps Engineer",
        city: "Tiaret",
        since: "2026",
        about:
          "Computer Science graduate specialized in networking, telecommunications, and security, with experience in Linux systems administration and backend/mobile development. Skilled in designing, securing, and maintaining reliable IT infrastructures as well as developing high-performance software solutions.",
        specs: ["Linux Administration", "Backend Development", "Networking", "Security", "Mobile Development"],
      },
      "amira-kaci": {
        name: "Amira Kaci",
        role: "Editorial Director & Community Catalyst",
        city: "Paris",
        since: "2021",
        about:
          "Founded the editorial desk and still edits the first draft of everything. Amira thinks a community is only as good as its slowest member, and organises accordingly.",
        specs: ["Editorial Strategy", "Community Building", "Partnerships"],
      },
      "maya-lin": {
        name: "Maya Lin",
        role: "Architectural Designer",
        city: "Algiers",
        since: "2021",
        about:
          "Builds housing and civic interiors where structure does the talking. Maya runs the club's architecture reading group and still draws by hand before she ever opens a laptop.",
        specs: [
          "Spatial Systems",
          "Interior Architecture",
          "Material Research",
        ],
      },
      "idris-bouzid": {
        name: "Idris Bouzid",
        role: "Typographer & Type Systems",
        city: "Fez",
        since: "2022",
        about:
          "A print obsessive who still proofs on paper. Idris maintains the club's informal archive of exhibition posters and teaches a monthly letterpress evening.",
        specs: ["Letterform Design", "Type Systems", "Print Craft"],
      },
      "nadia-rahmani": {
        name: "Nadia Rahmani",
        role: "Interactive Installation Artist",
        city: "Tunis",
        since: "2023",
        about:
          "Builds responsive rooms that react to the people inside them. Nadia prototypes with cardboard before code and documents every failed iteration in public.",
        specs: ["Spatial Computing", "Generative Systems", "Realtime Graphics"],
      },
      "karim-belkacem": {
        name: "Karim Belkacem",
        role: "Creative Technologist",
        city: "Casablanca",
        since: "2022",
        about:
          "Writes the small tools that make ambitious work possible. Karim runs the open prototype lab and would rather refactor a workflow than redraw a slide.",
        specs: ["Creative Coding", "Tooling", "Prototype Labs"],
      },
      "tariq-mansouri": {
        name: "Tariq Mansouri",
        role: "Creative Director",
        city: "Oran",
        since: "2020",
        about:
          "Shapes how the club is seen and how it speaks. Tariq believes a campaign should be arguable, and has retired three taglines he wrote himself.",
        specs: ["Editorial Direction", "Brand Films", "Campaign Strategy"],
      },
      "samira-vance": {
        name: "Samira Vance",
        role: "Sound Artist",
        city: "Constantine",
        since: "2023",
        about:
          "Records rooms the way other people photograph them. Samira scores the club's salons and keeps a growing library of door sounds from every city she visits.",
        specs: ["Field Recording", "Sound Design", "Spatial Audio"],
      },
      "rim-haddad": {
        name: "Rim Haddad",
        role: "Documentary Filmmaker",
        city: "Marrakesh",
        since: "2022",
        about:
          "Films conversations rather than events. Rim edits for the pause after someone says the real thing, and has shot more club salons than anyone here.",
        specs: ["Documentary", "Editing", "Sound-led Storytelling"],
      },
      "elena-rostova": {
        name: "Elena Rostova",
        role: "Cultural Curator",
        city: "London",
        since: "2021",
        about:
          "Curates the club's exhibitions and most of its arguments. Elena treats a disagreement as a form of collaboration and keeps the walls labelled in plain language.",
        specs: ["Exhibition Curation", "Artist Relations", "Archive Studies"],
      },
      "yusuf-demir": {
        name: "Yusuf Demir",
        role: "Night Archivist",
        city: "Istanbul",
        since: "2021",
        about:
          "Keeps what the club would otherwise forget. Yusuf catalogues every talk, reading and object the community produces, then makes it searchable.",
        specs: ["Book Conservation", "Digital Archives", "Field Research"],
      },
      "salma-benali": {
        name: "Salma Benali",
        role: "Craft Venture Architect",
        city: "Marrakesh",
        since: "2023",
        about:
          "Helps members turn a good idea into something that pays. Salma structures co-ops, splits equity fairly, and has never once used the word synergy.",
        specs: ["Venture Design", "Producers Networks", "Fair Pricing"],
      },
      "laleh-karimi": {
        name: "Laleh Karimi",
        role: "Philosophy Fellow",
        city: "Beirut",
        since: "2020",
        about:
          "Moderates the club's round-table salons with one rule: no consensus before lunch. Laleh writes the questions nobody wants to answer but everybody needs.",
        specs: ["Dialectic Facilitation", "Ethics", "Seminar Design"],
      },
      "ines-chaabane": {
        name: "Ines Chaabane",
        role: "Learning Designer",
        city: "Lyon",
        since: "2022",
        about:
          "Designs the club's learning paths so nobody has to start from zero. Ines matches mentors by curiosity rather than seniority and measures a cohort by what it attempts.",
        specs: ["Curriculum Design", "Mentorship", "Peer Learning"],
      },
    },
  },
  story: {
    eyebrow: "More Than A Club • Chapter IV",
    title: "The best things start with an unscripted conversation.",
    body: "From spontaneous late-night coffee debriefs to city-wide retrospective exhibitions, every enduring initiative in our collective archives originated not from a polished pitch deck, but over an informal gathering where someone dared to voice an unfinished thought.",
    cta: "Read The Complete Chronicle",
    badge: "Independent • Member Supported",
  },
  gallery: {
    eyebrow: "Visual Dispatch",
    title: "Inside Jadara — A Few Moments.",
    lead: "Fragments of spontaneous work sessions, publication launches, communal dinners, and quiet late afternoons in our reading rooms.",
    items: [
      {
        caption: "Open workspace residency during quarterly print production",
        time: "The Commons • 03:40 PM",
        title: "Work sessions",
      },
      {
        caption: "Seasonal tea reception",
        time: "Ritual • Sunday Morning",
        title: "Tea ritual",
      },
      {
        caption: "The Ethics of Cultural Archives",
        time: "Discourse • Salon Series",
        title: "Round-table salon",
      },
      {
        caption: "Open until the discussion concludes.",
        time: "Nightfall at Jadara Archive",
        title: "Library annex",
      },
    ],
  },
  testimonials: {
    eyebrow: "Voices From Within",
    kicker: "Member stories",
    lead: "First-hand reflections on the people, projects and ideas that shape Jadara.",
    items: [
      {
        quote:
          "Jadara is far more than scheduled gatherings. It is the three or four kindred spirits you meet whose perspectives linger in your sketchbook for months.",
        name: "Sarah K.",
        role: "Visual Anthropologist & Member since 2023",
      },
      {
        quote:
          "In an era where every creative hub has been financialized into co-working real estate, Jadara preserves the sanctity of pure intellectual play.",
        name: "Dr. Omar Z.",
        role: "Philosophy Fellow & Member since 2021",
      },
      {
        quote:
          "The collaborative monograph we published last spring was conceived in twenty minutes over Jadara's communal workbench.",
        name: "Nour Al-Sayed",
        role: "Independent Publisher & Member since 2022",
      },
    ],
  },
  join: {
    eyebrow: "Admissions & Application",
    title: "Find your place at Jadara.",
    body: "We open membership in quarterly cohorts to preserve intimate dynamics and thoughtful conversation. Join a community of people who are curious, creative and ready to build meaningful connections.",
    note: "No pressure. Just good people, good ideas and good conversations.",
    cta: "Apply For Cohort",
    cohort: "Cohort Fall '26 • Closing Nov 15",
  },
  contact: {
    eyebrow: "GET IN TOUCH",
    title: "LET'S START A CONVERSATION.",
    lead: "Have a question, an idea, or want to become part of Jadara? We'd love to hear from you.",
    dialogue: "07 / DIALOGUE",
    hello: "COME SAY HELLO",
    emailLabel: "Direct Dispatch",
    locationLabel: "Current Residence",
    location: "Jadara Club Algeria",
    locationNote: "Hubs in Algiers, Oran & Independent Partners",
    network: "Public Network",
    note: '"No forms for the sake of administration. Every dispatch is read by the curatorial committee."',
    name: "Your Name",
    email: "Email Address",
    subject: "Subject",
    subjectPlaceholder: "What would you like to talk about?",
    message: "Message",
    messagePlaceholder: "Tell us a little more...",
    required: "This field is required.",
    invalidEmail: "Please enter a valid email address.",
    send: "SEND MESSAGE",
    sending: "SENDING...",
    confirmation: "CONFIRMATION",
    successTitle: "MESSAGE SENT",
    successBody: "Thanks for reaching out. We'll get back to you soon.",
    again: "Send another message",
  },
};

const fr: LandingCopy = {
  hero: {
    eyebrow: "Jadara Club — Communauté / Culture / Connexion",
    title: "Faites place à quelque chose de",
    titleAccent: "profond.",
    description:
      "Jadara est un salon intellectuel et un collectif culturel fondé sur les personnes, les idées, l'artisanat et le dialogue authentique. Nous écartons le réseautage artificiel pour favoriser une communion créative spontanée.",
    join: "Rejoindre le Club",
    explore: "Découvrir les membres",
    members: "+500 membres créent activement",
    cities: "Entre Alger, Oran, Londres et Paris",
    salon: "Salon n° 42",
    archive: "L'architecture du calme",
    archiveYear: "Archives 2026",
    established: "Depuis 2020",
    quote: "« Des collisions choisies pour les esprits agités. »",
    source: "— Cultural Gazette",
  },
  about: {
    eyebrow: "01 / Manifeste",
    title: "Un club construit autour des personnes, pas des titres.",
    body1:
      "Jadara réunit celles et ceux qui veulent apprendre, créer, se rencontrer et contribuer. Nous créons des espaces physiques et conceptuels où les conversations spontanées deviennent des partenariats durables, des publications indépendantes et des projets audacieux.",
    body2:
      "À travers des salons mensuels, des dîners communautaires intimistes, des résidences d'atelier et des vitrines collaboratives, nous entretenons un écosystème d'hospitalité radicale et de recherche intellectuelle exigeante.",
    statRatio: "100%",
    statRatioLabel: "Ratio de curation",
    statHubs: "04",
    statHubsLabel: "Pôles urbains indépendants",
    manifesto: "Le Manifeste Jadara — Vol. IV",
    read: "Lire la dépêche",
  },
  values: {
    eyebrow: "Piliers de pratique",
    title: "Nos disciplines essentielles",
    lead: "Un environnement structuré qui refuse le réseautage transactionnel au profit du frottement collectif et de l'exploration créative profonde.",
    items: [
      {
        kicker: "01 / Culture",
        title: "Communauté",
        description:
          "Rencontrez des personnes qui partagent votre curiosité, votre ambition intellectuelle et votre énergie constructive. Sans faux-semblant de statut, dans une véritable égalité collaborative.",
        meta: "Rituels de cohorte",
        icon: "groups",
      },
      {
        kicker: "02 / Action",
        title: "Énergie créative",
        description:
          "Transformez les concepts latents en publications physiques, installations, ateliers collaboratifs et expérimentations indépendantes.",
        meta: "Bourses d'atelier",
        icon: "bolt",
      },
      {
        kicker: "03 / Discours",
        title: "Apprentissage",
        description:
          "Découvrez des perspectives inédites grâce aux salons invités, aux masterclasses et aux séminaires dialectiques menés par des praticiens de premier plan.",
        meta: "Masterclasses bimensuelles",
        icon: "menu_book",
      },
      {
        kicker: "04 / Synergie",
        title: "Connexion",
        description:
          "Tissez des liens interpersonnels solides qui dépassent les frontières géographiques et vivent bien au-delà des murs du club.",
        meta: "Réciprocité globale",
        icon: "hub",
      },
    ],
  },
  events: {
    eyebrow: "Programmation actuelle",
    title: "Venez au prochain rendez-vous.",
    all: "Voir toutes les rencontres de la saison",
    items: [
      {
        tag: "Art & Concept",
        date: "18 OCT 2026",
        venue: "Salon principal Jadara",
        title: "Nuit créative : formes latentes",
        description:
          "Une soirée d'idées libres, de critiques de portfolios ouvertes et de performances auditives collaboratives autour de l'artisanat visuel contemporain.",
        cta: "Réserver un pass membre",
        limit: "Limité à 40 invités",
        tone: "primary",
      },
      {
        tag: "Rencontre",
        date: "26 OCT 2026",
        venue: "La galerie Loft",
        title: "Assemblée communautaire & rituel du thé",
        description:
          "Ordre du jour ouvert, incubateurs de projets express et notre service de thé oolong de saison. Apportez un dilemme en cours à explorer.",
        cta: "Ouvert aux futurs membres",
        tone: "secondary",
      },
      {
        tag: "Atelier",
        date: "02 NOV 2026",
        venue: "Atelier d'impression",
        title: "Masterclass : imprimé & post-digital",
        description:
          "Mise en page physique, micro-typographie et stratégies de diffusion avec des typographes invités.",
        cta: "Places limitées",
        tone: "primary",
      },
    ],
  },
  team: {
    eyebrow: "Équipe globale",
    title: "Un collectif, plusieurs wilayas.",
    lead: "Les personnes ci-dessous forment le cœur actif de Jadara — les hôtes, curateurs et techniciens qui font vivre chaque salon, de Tiaret à Adrar.",
    caption: "Portrait collectif",
    captionNote: "Salon principal, après la dernière session de la saison",
    year: "2026",
    hubs: [
      { city: "Tiaret", note: "Salon mensuel & Studio", since: "Depuis 2021" },
      { city: "Adrar", note: "Résidences de terrain", since: "Depuis 2022" },
      { city: "Laghout", note: "Arts & Artisanat", since: "Depuis 2023" },
      { city: "Constantine", note: "Bureau éditorial", since: "Depuis 2024" },
    ],
    specialists: "Spécialistes du cœur",
    wilayas: "Wilayas représentées",
    cta: "Travailler avec l'équipe",
  },
  members: {
    eyebrow: "Les personnes",
    title1: "Rencontrez la",
    title2: "Communauté.",
    lead: "Praticiens indépendants, architectes, écrivains et technologues culturels qui définissent le récit de demain. Filtrez l'index, puis ouvrez un profil pour découvrir leur pratique.",
    index: "Index des spécialistes",
    edition: "Édition 04",
    spotlightTag:
      "Membre #006 • Ingénieur Backend & DevOps",
    spotlightQuote:
      "Diplômé en Informatique spécialisé en Réseaux, Télécommunications et Sécurité, avec de l'expérience en administration Linux et en développement backend/mobile. Expert dans la conce...",
    spotlightName: "Benallou Abdelaziz",
    spotlightRole:
      "Ingénieur Backend & DevOps",
    viewProfile: "Voir le profil",
    filterLabel: "Filtrer les membres par spécialité",
    categories: [
      { id: "all", label: "Tous" },
      { id: "technology", label: "Technologie" },
      { id: "media", label: "Médias" },
      { id: "design", label: "Design" },
      { id: "environment", label: "Environnement" },
      { id: "education", label: "Éducation" },
      { id: "art-culture", label: "Art & Culture" },
      { id: "business", label: "Entreprise" },
    ],
    count: "membres affichés",
    stats: [
      {
        value: "500",
        suffix: "+",
        label: "Membres",
        note: "Praticiens sélectionnés dans le monde",
      },
      {
        value: "30",
        suffix: "+",
        label: "Événements",
        note: "Salons, ateliers et critiques",
      },
      {
        value: "12",
        suffix: "",
        label: "Communautés",
        note: "Espaces de guildes autonomes",
      },
      {
        value: "8",
        suffix: "+",
        label: "Projets",
        note: "Ventures nées de conversations",
      },
    ],
    drawer: {
      member: "Membre",
      of: "sur",
      view: "affichés",
      close: "Fermer le profil",
      specialties: "Spécialités",
      connect: "Contacter",
      previous: "Précédent",
      next: "Suivant",
    },
    items: {
      "saouab-karima-nada": {
        name: "SAOUAB KARIMA NADA",
        role: "Responsable Équipe Logistique",
        city: "Tiaret",
        since: "2026",
        about:
          "Diplômée en Licence Biologie, spécialisation Écologie et Environnement, passionnée par la protection de la biodiversité, des écosystèmes et du développement durable. Expérimentée dans le bénévolat, l'organisation d'événements, la sensibilisation environnementale, avec des compétences en communication scientifique, travail d'équipe, organisation, coordination logistique et animation d'ateliers. Dotée d'un esprit d'initiative et d'une volonté d'apprendre et de contribuer à des projets à impact positif.",
        specs: ["Écologie & Environnement", "Biodiversité", "Développement Durable", "Organisation d'Événements", "Communication Scientifique"],
      },
      "nadjoua-nour-elhouda": {
        name: "Nadjoua Nour elhouda",
        role: "Média & Créatrice de Contenu",
        city: "Tiaret",
        since: "2026",
        about:
          "Étudiante en Systèmes Numériques, option Informatique et Réseaux. Membre du groupe Media Face. Spécialisée dans la création de contenu digital.",
        specs: ["Systèmes Numériques", "Réseaux", "Création de Contenu"],
      },
      "sahraoui-taous": {
        name: "SAHRAOUI Taous",
        role: "Secrétaire & Gestionnaire de Page",
        city: "Tiaret",
        since: "2026",
        about:
          "Étudiante en troisième année de Kinésithérapie et Rééducation, passionnée par le bénévolat et les initiatives sociales à impact. Compétences: Communication, travail d'équipe, organisation et suivi administratif. Rôle au sein de Jadara: Suivi des tâches de l'équipe, rédaction des comptes-rendus de réunion, gestion de la page et réponse aux messages et commentaires.",
        specs: ["Kinésithérapie & Rééducation", "Communication", "Administration", "Coordination d'Équipe"],
      },
      "kadi-tarik": {
        name: "Kadi Tarik",
        role: "Graphiste & Monteur Vidéo",
        city: "Tiaret",
        since: "2026",
        about:
          "Graphiste et monteur vidéo short-form né le 10/10/2000.",
        specs: ["Graphisme", "Montage Vidéo Court Format"],
      },
      "araria-mohamed-amine": {
        name: "Araria Mohamed Amine",
        role: "Photographe & Artiste Média",
        city: "Tiaret",
        since: "2026",
        about:
          "Jeune talent polyvalent passionné par les arts, les médias et la communication. Compétences en photographie, théâtre, voix off, écriture et animation d'événements. Membre de Smart Academy - Tiaret et membre actif de la communauté Jadara - Tiaret, photographe officiel des activités Jadara. Langues: Arabe (langue maternelle), Français, Anglais (B2). Participation aux Olympiades HIPPO et Oxford S.I.L.",
        specs: ["Photographie", "Théâtre", "Voix Off", "Écriture", "Animation d'Événements"],
      },
      "benallou-abdelaziz": {
        name: "Benallou Abdelaziz",
        role: "Ingénieur Backend & DevOps",
        city: "Tiaret",
        since: "2026",
        about:
          "Diplômé en Informatique spécialisé en Réseaux, Télécommunications et Sécurité, avec de l'expérience en administration Linux et en développement backend/mobile. Expert dans la conception, la sécurisation et la maintenance d'infrastructures informatiques fiables ainsi que dans le développement de solutions logicielles performantes.",
        specs: ["Administration Linux", "Développement Backend", "Réseaux", "Sécurité", "Développement Mobile"],
      },
      "amira-kaci": {
        name: "Amira Kaci",
        role: "Directrice éditoriale & Catalyseuse communautaire",
        city: "Paris",
        since: "2021",
        about:
          "Fondatrice du bureau éditorial, elle retouche encore le premier brouillon de tout. Amira pense qu'une communauté vaut ce que vaut son membre le plus lent, et s'organise en conséquence.",
        specs: [
          "Stratégie éditoriale",
          "Construction communautaire",
          "Partenariats",
        ],
      },
      "maya-lin": {
        name: "Maya Lin",
        role: "Designer architecturale",
        city: "Alger",
        since: "2021",
        about:
          "Conçoit des logements et des intérieurs civiques où la structure parle d'elle-même. Maya anime le groupe de lecture d'architecture du club et dessine toujours à la main avant d'ouvrir un ordinateur.",
        specs: [
          "Systèmes spatiaux",
          "Architecture intérieure",
          "Recherche matérielle",
        ],
      },
      "idris-bouzid": {
        name: "Idris Bouzid",
        role: "Typographe & Systèmes typographiques",
        city: "Fès",
        since: "2022",
        about:
          "Un obsédé de l'imprimé qui corrige encore sur papier. Idris entretient les archives informelles d'affiches d'exposition du club et anime un atelier de letterpress chaque mois.",
        specs: [
          "Design de caractères",
          "Systèmes typographiques",
          "Artisanat de l'imprimé",
        ],
      },
      "nadia-rahmani": {
        name: "Nadia Rahmani",
        role: "Artiste en installations interactives",
        city: "Tunis",
        since: "2023",
        about:
          "Crée des pièces réactives qui répondent aux personnes qui les habitent. Nadia prototype en carton avant de coder et documente publiquement chaque itération ratée.",
        specs: [
          "Informatique spatiale",
          "Systèmes génératifs",
          "Graphismes temps réel",
        ],
      },
      "karim-belkacem": {
        name: "Karim Belkacem",
        role: "Technologue créatif",
        city: "Casablanca",
        since: "2022",
        about:
          "Écrit les petits outils qui rendent possible le travail ambitieux. Karim dirige l'atelier de prototypage ouvert et préfère refactoriser un flux de travail que redessiner une présentation.",
        specs: ["Code créatif", "Outils", "Ateliers de prototypage"],
      },
      "tariq-mansouri": {
        name: "Tariq Mansouri",
        role: "Directeur de création",
        city: "Oran",
        since: "2020",
        about:
          "Façonne la manière dont le club est vu et dont il parle. Tariq croit qu'une campagne doit pouvoir être discutée, et a retiré trois slogans qu'il avait lui-même écrits.",
        specs: [
          "Direction éditoriale",
          "Films de marque",
          "Stratégie de campagne",
        ],
      },
      "samira-vance": {
        name: "Samira Vance",
        role: "Artiste sonore",
        city: "Constantine",
        since: "2023",
        about:
          "Enregistre les pièces comme d'autres les photographient. Samira compose le son des salons du club et conserve une bibliothèque croissante de sons de portes de chaque ville visitée.",
        specs: ["Enregistrement de terrain", "Design sonore", "Audio spatial"],
      },
      "rim-haddad": {
        name: "Rim Haddad",
        role: "Documentariste",
        city: "Marrakech",
        since: "2022",
        about:
          "Filme les conversations plutôt que les événements. Rim monte pour capter la pause après qu'une personne a dit l'essentiel, et a filmé plus de salons que quiconque ici.",
        specs: ["Documentaire", "Montage", "Récit sonore"],
      },
      "elena-rostova": {
        name: "Elena Rostova",
        role: "Curatrice culturelle",
        city: "Londres",
        since: "2021",
        about:
          "Cure les expositions du club et la plupart de ses débats. Elena traite le désaccord comme une forme de collaboration et garde les murs étiquetés en langage clair.",
        specs: [
          "Curation d'exposition",
          "Relations artistes",
          "Études d'archives",
        ],
      },
      "yusuf-demir": {
        name: "Yusuf Demir",
        role: "Archiviste de nuit",
        city: "Istanbul",
        since: "2021",
        about:
          "Conserve ce que le club oublierait autrement. Yusuf catalogue chaque conférence, lecture et objet produits par la communauté, puis les rend consultables.",
        specs: [
          "Conservation du livre",
          "Archives numériques",
          "Recherche de terrain",
        ],
      },
      "salma-benali": {
        name: "Salma Benali",
        role: "Architecte de ventures artisanales",
        city: "Marrakech",
        since: "2023",
        about:
          "Aide les membres à transformer une bonne idée en projet viable. Salma structure les coopératives, partage équitablement le capital et n'a jamais employé le mot synergie.",
        specs: [
          "Design de venture",
          "Réseaux de producteurs",
          "Prix équitables",
        ],
      },
      "laleh-karimi": {
        name: "Laleh Karimi",
        role: "Fellow en philosophie",
        city: "Beyrouth",
        since: "2020",
        about:
          "Modère les salons en table ronde du club avec une règle : pas de consensus avant le déjeuner. Laleh écrit les questions que personne ne veut poser mais dont tout le monde a besoin.",
        specs: ["Facilitation dialectique", "Éthique", "Design de séminaire"],
      },
      "ines-chaabane": {
        name: "Ines Chaabane",
        role: "Designer pédagogique",
        city: "Lyon",
        since: "2022",
        about:
          "Conçoit les parcours d'apprentissage du club pour que personne ne parte de zéro. Ines associe les mentors selon la curiosité plutôt que l'ancienneté et mesure une cohorte à ce qu'elle tente.",
        specs: ["Design de programme", "Mentorat", "Apprentissage pair"],
      },
    },
  },
  story: {
    eyebrow: "Plus qu'un club • Chapitre IV",
    title: "Les plus belles choses commencent par une conversation improvisée.",
    body: "Des débriefs spontanés autour d'un café tardif aux rétrospectives à l'échelle de la ville, chaque initiative durable de nos archives n'est pas née d'un pitch soigné, mais d'une rencontre informelle où quelqu'un a osé exprimer une pensée inachevée.",
    cta: "Lire la chronique complète",
    badge: "Indépendant • Soutenu par ses membres",
  },
  gallery: {
    eyebrow: "Dépêche visuelle",
    title: "Dans Jadara — quelques instants.",
    lead: "Des fragments de sessions de travail spontanées, de lancements de publications, de dîners communautaires et d'après-midis calmes dans nos salles de lecture.",
    items: [
      {
        caption:
          "Résidence d'espace de travail pendant la production trimestrielle",
        time: "Les Communs • 15h40",
        title: "Sessions de travail",
      },
      {
        caption: "Réception de thé de saison",
        time: "Rituel • Dimanche matin",
        title: "Rituel du thé",
      },
      {
        caption: "L'éthique des archives culturelles",
        time: "Discours • Série de salons",
        title: "Salon en table ronde",
      },
      {
        caption: "Ouvert jusqu'à la fin de la discussion.",
        time: "Crépuscule aux archives Jadara",
        title: "Annexe de la bibliothèque",
      },
    ],
  },
  testimonials: {
    eyebrow: "Voix de l'intérieur",
    kicker: "Récits de membres",
    lead: "Des témoignages directs sur les personnes, les projets et les idées qui font vivre Jadara.",
    items: [
      {
        quote:
          "Jadara est bien plus que des rencontres programmées. Ce sont les trois ou quatre esprits apparentés que vous rencontrez et dont les perspectives restent dans votre carnet pendant des mois.",
        name: "Sarah K.",
        role: "Anthropologue visuelle & Membre depuis 2023",
      },
      {
        quote:
          "À une époque où chaque lieu créatif a été financiarisé en immobilier de coworking, Jadara préserve la sainteté du jeu intellectuel pur.",
        name: "Dr. Omar Z.",
        role: "Fellow en philosophie & Membre depuis 2021",
      },
      {
        quote:
          "La monographie collaborative que nous avons publiée au printemps est née en vingt minutes autour de l'établi commun de Jadara.",
        name: "Nour Al-Sayed",
        role: "Éditeur indépendant & Membre depuis 2022",
      },
    ],
  },
  join: {
    eyebrow: "Admissions & candidature",
    title: "Trouvez votre place à Jadara.",
    body: "Nous ouvrons les adhésions par cohortes trimestrielles afin de préserver une dynamique intime et des conversations réfléchies. Rejoignez une communauté de personnes curieuses, créatives et prêtes à bâtir des liens sincères.",
    note: "Aucune pression. Juste des gens bien, de bonnes idées et de bonnes conversations.",
    cta: "Candidater pour la cohorte",
    cohort: "Cohorte Automne '26 • Clôture le 15 nov.",
  },
  contact: {
    eyebrow: "PRENONS CONTACT",
    title: "COMMENÇONS UNE CONVERSATION.",
    lead: "Une question, une idée, ou l'envie de rejoindre Jadara ? Nous serions ravis de vous lire.",
    dialogue: "07 / DIALOGUE",
    hello: "VENEZ NOUS DIRE BONJOUR",
    emailLabel: "Envoi direct",
    locationLabel: "Résidence actuelle",
    location: "Jadara Club Algérie",
    locationNote: "Pôles à Alger, Oran & partenaires indépendants",
    network: "Réseau public",
    note: "« Pas de formulaires pour l'administration. Chaque message est lu par le comité de curation. »",
    name: "Votre nom",
    email: "Adresse e-mail",
    subject: "Objet",
    subjectPlaceholder: "De quoi souhaitez-vous parler ?",
    message: "Message",
    messagePlaceholder: "Dites-nous en un peu plus...",
    required: "Ce champ est obligatoire.",
    invalidEmail: "Veuillez saisir une adresse e-mail valide.",
    send: "ENVOYER LE MESSAGE",
    sending: "ENVOI...",
    confirmation: "CONFIRMATION",
    successTitle: "MESSAGE ENVOYÉ",
    successBody:
      "Merci de nous avoir écrit. Nous reviendrons vers vous bientôt.",
    again: "Envoyer un autre message",
  },
};

const ar: LandingCopy = {
  hero: {
    eyebrow: "نادي جدارة — مجتمع / ثقافة / تواصل",
    title: "اصنع مساحة لشيء",
    titleAccent: "ذي معنى.",
    description:
      "جدارة صالون فكري ومجموعة ثقافية تقوم على الناس والأفكار والحرفة والحوار الحقيقي. نزيل شبكات العلاقات المصطنعة لنصنع لقاءً إبداعياً تلقائياً.",
    join: "انضم إلى النادي",
    explore: "استكشف الأعضاء",
    members: "+500 عضو يصنعون وينتجون",
    cities: "بين الجزائر ووهران ولندن وباريس",
    salon: "الصالون رقم 42",
    archive: "هندسة السكون",
    archiveYear: "أرشيف 2026",
    established: "تأسس 2020",
    quote: "«لقاءات منتقاة للعقل القلق.»",
    source: "— المجلة الثقافية",
  },
  about: {
    eyebrow: "01 / البيان",
    title: "نادٍ يُبنى حول الناس، لا حول الألقاب.",
    body1:
      "تجمع جدارة من يريدون التعلّم والإبداع والتواصل والمساهمة. نصنع مساحات مادية وفكرية تتحول فيها الأحاديث العفوية إلى شراكات دائمة وإصدارات مستقلة ومشاريع طموحة.",
    body2:
      "عبر صالونات شهرية، وعشاءات مجتمعية حميمة، وإقامات هادئة في الاستوديو، وعروض تعاونية، نحافظ على منظومة من الضيافة الجذرية والبحث الفكري المركّز.",
    statRatio: "100%",
    statRatioLabel: "نسبة الانتقاء",
    statHubs: "04",
    statHubsLabel: "مراكز مدينية مستقلة",
    manifesto: "بيان جدارة — المجلد الرابع",
    read: "اقرأ البيان",
  },
  values: {
    eyebrow: "أعمدة الممارسة",
    title: "تخصصاتنا الأساسية",
    lead: "بيئة منظمة ترفض العلاقات التجارية لصالح الاحتكاك المشترك والاستكشاف الإبداعي العميق.",
    items: [
      {
        kicker: "01 / الثقافة",
        title: "المجتمع",
        description:
          "تعرّف على من يشاركونك الفضول والطموح الفكري والطاقة البنّاءة. بلا مظاهر مكانة، وبمساواة تعاونية خالصة.",
        meta: "طقوس الدفعة",
        icon: "groups",
      },
      {
        kicker: "02 / الفعل",
        title: "الطاقة الإبداعية",
        description:
          "حوّل الأفكار الكامنة إلى إصدارات مادية وتجهيزات واستوديوهات تعاونية وتجارب مستقلة.",
        meta: "منح الاستوديو",
        icon: "bolt",
      },
      {
        kicker: "03 / الحوار",
        title: "التعلّم",
        description:
          "اكتشف منظورات غير مسبوقة عبر صالونات الضيوف والدروس المتقدمة والندوات الجدلية المكثفة مع ممارسين بارزين.",
        meta: "دروس كل أسبوعين",
        icon: "menu_book",
      },
      {
        kicker: "04 / التكامل",
        title: "التواصل",
        description:
          "ابنِ علاقات إنسانية صلبة تتجاوز الحدود الجغرافية وتعيش أبعد من جدران النادي.",
        meta: "تبادل عالمي",
        icon: "hub",
      },
    ],
  },
  events: {
    eyebrow: "البرنامج الحالي",
    title: "تعال إلى اللقاء القادم.",
    all: "عرض كل لقاءات الموسم",
    items: [
      {
        tag: "فن ومفهوم",
        date: "18 أكتوبر 2026",
        venue: "الصالون الرئيسي لجدارة",
        title: "الليلة الإبداعية: الأشكال الكامنة",
        description:
          "أمسية من الأفكار العفوية ونقد الملفات المفتوحة والعروض الصوتية التعاونية التي تستكشف الحرفة البصرية المعاصرة.",
        cta: "احجز بطاقة عضو",
        limit: "محدود بـ40 ضيفاً",
        tone: "primary",
      },
      {
        tag: "لقاء",
        date: "26 أكتوبر 2026",
        venue: "معرض لوفت",
        title: "جمعية المجتمع وطقس الشاي",
        description:
          "جدول أعمال مفتوح، وحاضنات مشاريع سريعة، وخدمة شاي الأولونغ الموسمية. أحضر معضلة مستمرة لنناقشها.",
        cta: "مفتوح للأعضاء المحتملين",
        tone: "secondary",
      },
      {
        tag: "ورشة",
        date: "02 نوفمبر 2026",
        venue: "استوديو الطباعة",
        title: "درس متقدم: الطباعة وما بعد الرقمنة",
        description:
          "تنسيق طباعة مادي وتايبوغرافيا دقيقة وتكتيكات توزيع مع خطاطين زائرين.",
        cta: "المقاعد تُملأ",
        tone: "primary",
      },
    ],
  },
  team: {
    eyebrow: "الفريق العالمي",
    title: "مجموعة واحدة، ولايات كثيرة.",
    lead: "الأشخاص أدناه هم النواة العاملة في جدارة — المضيفون والقيّمون والتقنيون الذين يبقون كل صالون حاضراً، من تيارت إلى أدرار.",
    caption: "صورة جماعية",
    captionNote: "الصالون الرئيسي، بعد آخر جلسة في الموسم",
    year: "2026",
    hubs: [
      { city: "تيارت", note: "صالون شهري واستوديو", since: "تأسس 2021" },
      { city: "أدرار", note: "إقامات ميدانية", since: "تأسس 2022" },
      { city: "الأغواط", note: "فنون وحرف", since: "تأسس 2023" },
      { city: "قسنطينة", note: "مكتب النشر", since: "تأسس 2024" },
    ],
    specialists: "متخصصون أساسيون",
    wilayas: "ولايات ممثلة",
    cta: "اعمل مع الفريق",
  },
  members: {
    eyebrow: "الناس",
    title1: "تعرّف على",
    title2: "المجتمع.",
    lead: "ممارسون مستقلون ومعماريون وكتّاب وتقنيون ثقافيون يصوغون حكاية الغد. رشّح الفهرس، ثم افتح أي ملف لقراءة ممارسته كاملة.",
    index: "فهرس المتخصصين",
    edition: "الإصدار 04",
    spotlightTag: "عضو #006 • مهندس خلفية وأنظمة",
    spotlightQuote:
      "خريج في الإعلام الآلي متخصص في الشبكات، الاتصالات السلكية واللاسلكية وأمن الشبكات، مع خبرة في إدارة أنظمة لينكس وتطوير البرمجيات. خبير في تصميم وتأمين...",
    spotlightName: "بن علو عبد العزيز",
    spotlightRole:
      "مهندس خلفية وأنظمة",
    viewProfile: "عرض الملف",
    filterLabel: "ترشيح الأعضاء حسب التخصص",
    categories: [
      { id: "all", label: "الكل" },
      { id: "technology", label: "التقنية" },
      { id: "media", label: "الإعلام" },
      { id: "design", label: "التصميم" },
      { id: "environment", label: "البيئة" },
      { id: "education", label: "التعليم" },
      { id: "art-culture", label: "الفن والثقافة" },
      { id: "business", label: "الأعمال" },
    ],
    count: "عضواً معروضاً",
    stats: [
      {
        value: "500",
        suffix: "+",
        label: "أعضاء",
        note: "ممارسون منتقون عالمياً",
      },
      { value: "30", suffix: "+", label: "فعالية", note: "صالونات وورش ونقد" },
      {
        value: "12",
        suffix: "",
        label: "مجتمعات",
        note: "مساحات نقابات ذاتية التنظيم",
      },
      {
        value: "8",
        suffix: "+",
        label: "مشاريع",
        note: "مبادرات وُلدت من الحوار",
      },
    ],
    drawer: {
      member: "عضو",
      of: "من",
      view: "معروض",
      close: "إغلاق الملف",
      specialties: "التخصصات",
      connect: "تواصل",
      previous: "السابق",
      next: "التالي",
    },
    items: {
      "saouab-karima-nada": {
        name: "صواب كريمة ندى",
        role: "مسؤولة عن فريق اللوجستيك",
        city: "تيارت",
        since: "2026",
        about:
          "خريجة ليسانس في البيولوجيا، تخصص الإيكولوجيا والبيئة، شغوفة بحماية التنوع البيولوجي والنظم البيئية والتنمية المستدامة. لدي خبرة في العمل التطوعي وتنظيم الفعاليات والتوعية البيئية، مع مهارات في التواصل العلمي، العمل الجماعي، التنظيم والتنسيق اللوجستي. أتميز بروح المبادرة وحب التعلم والمساهمة في مشاريع ذات أثر إيجابي.",
        specs: ["الإيكولوجيا والبيئة", "التنوع البيولوجي", "التنمية المستدامة", "تنظيم الفعاليات", "التواصل العلمي"],
      },
      "nadjoua-nour-elhouda": {
        name: "نجوى نور الهدى",
        role: "إعلام وصانعة محتوى",
        city: "تيارت",
        since: "2026",
        about:
          "طالبة في الأنظمة الرقمية، خيار الإعلام الآلي والشبكات. عضوة في مجموعة ميديا فايس. متخصصة في إنشاء المحتوى الرقمي.",
        specs: ["الأنظمة الرقمية", "الشبكات", "إنشاء المحتوى"],
      },
      "sahraoui-taous": {
        name: "صحراوي طاوس",
        role: "أمينة سر ومديرة الصفحة",
        city: "تيارت",
        since: "2026",
        about:
          "طالبة سنة ثالثة تخصص العلاج الفيزيائي وإعادة التأهيل، مهتمة بالعمل التطوعي والمبادرات الاجتماعية الهادفة. المهارات: التواصل، العمل الجماعي، التنظيم والمتابعة الإدارية. الدور في جدارة: متابعة مهام الفريق، إعداد محاضر الاجتماعات، وإدارة الصفحة والرد على الرسائل والتعليقات.",
        specs: ["العلاج الفيزيائي وإعادة التأهيل", "التواصل", "الإدارة", "تنسيق الفريق"],
      },
      "kadi-tarik": {
        name: "قاضي طارق",
        role: "مصمم جرافيك ومحرر فيديو",
        city: "تيارت",
        since: "2026",
        about:
          "مصمم جرافيك ومحرر فيديو قصير، مواليد 10/10/2000.",
        specs: ["التصميم الجرافيكي", "تحرير الفيديو القصير"],
      },
      "araria-mohamed-amine": {
        name: "عرارية محمد أمين",
        role: "مصور فني ومبدع إعلامي",
        city: "تيارت",
        since: "2026",
        about:
          "موهبة شابة متعددة المواهب، شغوف بالفنون والإعلام والتواصل، أمتلك مهارات في التصوير الفوتوغرافي، التمثيل، الأداء الصوتي، الكتابة والتنشيط. عضو في Smart Academy – تيارت، وعضو فعّال في مجتمع Jadara – تيارت، ومصوّر رسمي ضمن أنشطة مجتمع Jadara. اللغات: العربية، الفرنسية، الإنجليزية بمستوى B2.",
        specs: ["التصوير الفوتوغرافي", "التمثيل", "الأداء الصوتي", "الكتابة", "تنشيط الفعاليات"],
      },
      "benallou-abdelaziz": {
        name: "بن علو عبد العزيز",
        role: "مهندس خلفية وأنظمة",
        city: "تيارت",
        since: "2026",
        about:
          "خريج في الإعلام الآلي متخصص في الشبكات، الاتصالات السلكية واللاسلكية وأمن الشبكات، مع خبرة في إدارة أنظمة لينكس وتطوير البرمجيات. خبير في تصميم وتأمين وصيانة البنية التحتية الرقمية، وتطوير الحلول البرمجية والتطبيقات عالية الكفاءة.",
        specs: ["إدارة لينكس", "تطوير خلفية", "الشبكات", "الأمن السيبراني", "تطوير تطبيقات"],
      },
      "amira-kaci": {
        name: "أميرة قاسي",
        role: "مديرة تحرير ومحفّزة مجتمعية",
        city: "باريس",
        since: "2021",
        about:
          "أسست المكتب التحريري ولا تزال تحرر المسودة الأولى من كل شيء. ترى أميرة أن المجتمع بقدر أبطأ أعضائه، وتنظّم على هذا الأساس.",
        specs: ["الاستراتيجية التحريرية", "بناء المجتمع", "الشراكات"],
      },
      "maya-lin": {
        name: "مايا لين",
        role: "مصممة معمارية",
        city: "الجزائر",
        since: "2021",
        about:
          "تبني مساكن وفضاءات مدنية تتحدث فيها البنية عن نفسها. تدير مايا مجموعة قراءة العمارة في النادي ولا تزال ترسم يدوياً قبل أن تفتح حاسوبها.",
        specs: ["الأنظمة المكانية", "العمارة الداخلية", "بحث المواد"],
      },
      "idris-bouzid": {
        name: "إدريس بوزيد",
        role: "خطاط وأنظمة حروف",
        city: "فاس",
        since: "2022",
        about:
          "مهووس بالطباعة ولا يزال يصحح على الورق. يحافظ إدريس على أرشيف غير رسمي لملصقات المعارض في النادي ويدرّس أمسية حروف طباعية كل شهر.",
        specs: ["تصميم الحروف", "أنظمة الخطوط", "حرفة الطباعة"],
      },
      "nadia-rahmani": {
        name: "نادية رحماني",
        role: "فنانة تجهيزات تفاعلية",
        city: "تونس",
        since: "2023",
        about:
          "تبني غرفاً تفاعلية تستجيب لمن داخلها. تصنع نادية نماذج من الكرتون قبل الكتابة البرمجية وتوثّق كل تجربة فاشلة علناً.",
        specs: ["الحوسبة المكانية", "الأنظمة التوليدية", "الرسوم الفورية"],
      },
      "karim-belkacem": {
        name: "كريم بلقاسم",
        role: "تقني إبداعي",
        city: "الدار البيضاء",
        since: "2022",
        about:
          "يكتب الأدوات الصغيرة التي تجعل العمل الطموح ممكناً. يدير كريم مختبر النماذج المفتوح ويفضل إعادة هيكلة سير العمل على إعادة رسم عرض تقديمي.",
        specs: ["البرمجة الإبداعية", "الأدوات", "مختبرات النماذج"],
      },
      "tariq-mansouri": {
        name: "طارق منصوري",
        role: "مدير إبداعي",
        city: "وهران",
        since: "2020",
        about:
          "يشكّل كيف يُرى النادي وكيف يتحدث. يؤمن طارق بأن الحملة يجب أن تكون قابلة للنقاش، وقد تقاعد عن ثلاثة شعارات كتبها بنفسه.",
        specs: ["الإدارة التحريرية", "أفلام العلامة", "استراتيجية الحملات"],
      },
      "samira-vance": {
        name: "سميرة فانس",
        role: "فنانة صوت",
        city: "قسنطينة",
        since: "2023",
        about:
          "تسجل الغرف كما يصورها الآخرون. تؤلف سميرة صوت صالونات النادي وتحتفظ بمكتبة متنامية لأصوات الأبواب في كل مدينة تزورها.",
        specs: ["التسجيل الميداني", "تصميم الصوت", "الصوت المكاني"],
      },
      "rim-haddad": {
        name: "ريم حداد",
        role: "مخرجة أفلام وثائقية",
        city: "مراكش",
        since: "2022",
        about:
          "تصور الحوارات لا الفعاليات. تقطع ريم لتحافظ على الصمت بعد أن يقول أحدهم الحقيقة، وقد صوّرت صالونات أكثر من أي شخص هنا.",
        specs: ["الوثائقي", "المونتاج", "السرد الصوتي"],
      },
      "elena-rostova": {
        name: "إيلينا روستوفا",
        role: "قيّمة ثقافية",
        city: "لندن",
        since: "2021",
        about:
          "تقيّم معارض النادي ومعظم جدالاته. تعامل إيلينا الخلاف كشكل من التعاون وتحرص على أن تكون الجدران موسومة بلغة واضحة.",
        specs: ["تقييم المعارض", "علاقات الفنانين", "دراسات الأرشيف"],
      },
      "yusuf-demir": {
        name: "يوسف دمير",
        role: "أمين أرشيف ليلي",
        city: "إسطنبول",
        since: "2021",
        about:
          "يحفظ ما قد ينساه النادي. يفهرس يوسف كل محادثة وقراءة وقطعة ينتجها المجتمع، ثم يجعلها قابلة للبحث.",
        specs: ["حفظ الكتب", "الأرشيف الرقمي", "البحث الميداني"],
      },
      "salma-benali": {
        name: "سلمى بن علي",
        role: "مهندسة مبادرات حرفية",
        city: "مراكش",
        since: "2023",
        about:
          "تساعد الأعضاء على تحويل الفكرة الجيدة إلى شيء يعود بالنفع. تبني سلمى التعاونيات وتقسم الحصص بعدل، ولم تستخدم كلمة تكامل مرة واحدة.",
        specs: ["تصميم المبادرات", "شبكات المنتجين", "التسعير العادل"],
      },
      "laleh-karimi": {
        name: "لاله كريمي",
        role: "زميلة فلسفة",
        city: "بيروت",
        since: "2020",
        about:
          "تدير صالونات المائدة المستديرة بقاعدة واحدة: لا إجماع قبل الغداء. تكتب لاله الأسئلة التي لا يريد أحد الإجابة عنها لكن الجميع يحتاجها.",
        specs: ["تيسير الجدل", "الأخلاق", "تصميم الندوات"],
      },
      "ines-chaabane": {
        name: "إيناس شعبان",
        role: "مصممة تعلّم",
        city: "ليون",
        since: "2022",
        about:
          "تصمم مسارات تعلّم النادي كي لا يبدأ أحد من الصفر. تربط إيناس المرشدين بالفضول لا بالأقدمية وتقيس الدفعة بما تحاول إنجازه.",
        specs: ["تصميم المناهج", "الإرشاد", "التعلّم بين الأقران"],
      },
    },
  },
  story: {
    eyebrow: "أكثر من نادٍ • الفصل الرابع",
    title: "أجمل الأشياء تبدأ بمحادثة غير مكتوبة.",
    body: "من جلسات القهوة المتأخرة العفوية إلى المعارض الاستعادية على مستوى المدينة، كل مبادرة باقية في أرشيفنا لم تبدأ من عرض تقديمي مصقول، بل من لقاء غير رسمي تجرأ فيه أحدهم على قول فكرة غير مكتملة.",
    cta: "اقرأ السجل الكامل",
    badge: "مستقل • بدعم الأعضاء",
  },
  gallery: {
    eyebrow: "إرسال بصري",
    title: "داخل جدارة — لحظات قليلة.",
    lead: "شذرات من جلسات عمل عفوية وإطلاقات إصدارات وعشاءات مجتمعية وأمسيات هادئة في قاعات القراءة.",
    items: [
      {
        caption: "إقامة مساحة عمل مفتوحة خلال الإنتاج الطباعي الفصلي",
        time: "الفضاء المشترك • 03:40 مساءً",
        title: "جلسات العمل",
      },
      {
        caption: "استقبال الشاي الموسمي",
        time: "طقس • صباح الأحد",
        title: "طقس الشاي",
      },
      {
        caption: "أخلاقيات الأرشيف الثقافي",
        time: "حوار • سلسلة صالونات",
        title: "صالون المائدة المستديرة",
      },
      {
        caption: "مفتوح حتى ينتهي النقاش.",
        time: "الغروب في أرشيف جدارة",
        title: "ملحق المكتبة",
      },
    ],
  },
  testimonials: {
    eyebrow: "أصوات من الداخل",
    kicker: "قصص الأعضاء",
    lead: "شهادات مباشرة عن الأشخاص والمشاريع والأفكار التي تصنع جدارة.",
    items: [
      {
        quote:
          "جدارة أكثر بكثير من لقاءات مجدولة. إنها الأرواح الثلاث أو الأربع التي تلتقيها وتبقى منظوراتها في دفترك لأشهر.",
        name: "سارة ك.",
        role: "أنثروبولوجية بصرية وعضو منذ 2023",
      },
      {
        quote:
          "في عصر حوّل كل مركز إبداعي إلى عقار مشترك، تحافظ جدارة على قدسية اللعب الفكري الخالص.",
        name: "د. عمر ز.",
        role: "زميل فلسفة وعضو منذ 2021",
      },
      {
        quote:
          "الكتاب التعاوني الذي نشرناه الربيع الماضي وُلد في عشرين دقيقة فوق طاولة عمل جدارة المشتركة.",
        name: "نور السيد",
        role: "ناشرة مستقلة وعضو منذ 2022",
      },
    ],
  },
  join: {
    eyebrow: "القبول والتقديم",
    title: "اعثر على مكانك في جدارة.",
    body: "نفتح العضوية في دفعات فصلية للحفاظ على ديناميكية حميمة وحوار مدروس. انضم إلى مجتمع من الأشخاص الفضوليين والمبدعين والمستعدين لبناء علاقات ذات معنى.",
    note: "بلا ضغط. فقط أشخاص جيدون وأفكار جيدة وأحاديث جيدة.",
    cta: "تقدّم للدفعة",
    cohort: "دفعة خريف '26 • الإغلاق 15 نوفمبر",
  },
  contact: {
    eyebrow: "تواصل معنا",
    title: "لنبدأ حواراً.",
    lead: "لديك سؤال أو فكرة أو ترغب في أن تصبح جزءاً من جدارة؟ يسعدنا أن نسمع منك.",
    dialogue: "07 / الحوار",
    hello: "تعال وقل مرحباً",
    emailLabel: "إرسال مباشر",
    locationLabel: "المقر الحالي",
    location: "نادي جدارة الجزائر",
    locationNote: "مراكز في الجزائر ووهران وشركاء مستقلون",
    network: "الشبكة العامة",
    note: "«لا نماذج من أجل الإدارة فقط. كل رسالة يقرأها لجنة التقييم.»",
    name: "اسمك",
    email: "البريد الإلكتروني",
    subject: "الموضوع",
    subjectPlaceholder: "عن ماذا تريد أن تتحدث؟",
    message: "الرسالة",
    messagePlaceholder: "أخبرنا بالمزيد...",
    required: "هذا الحقل مطلوب.",
    invalidEmail: "يرجى إدخال بريد إلكتروني صالح.",
    send: "أرسل الرسالة",
    sending: "جارٍ الإرسال...",
    confirmation: "تأكيد",
    successTitle: "تم إرسال الرسالة",
    successBody: "شكراً لتواصلك. سنعود إليك قريباً.",
    again: "أرسل رسالة أخرى",
  },
};

export const landingCopy: Record<Language, LandingCopy> = { en, fr, ar };
