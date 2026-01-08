import React, { useMemo, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const NAV_TABS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "prayers", label: "Prayers", icon: "📿" },
  { id: "saints", label: "Saints", icon: "👼" },
  { id: "ourlady", label: "Our Lady", icon: "✶" },
  { id: "sacraments", label: "Sacraments", icon: "🕊️" },
  { id: "guides", label: "Guides", icon: "🧭" },
  { id: "history", label: "Liturgy & History", icon: "📜" }
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "pt", label: "Português" }
];

const MISSION_COPY = {
  heading: "Via Fidei",
  subheading: "A calm Catholic space for prayer, study, and devotion.",
  body: `Via Fidei curates Catholic prayers, saints, sacraments, and guides in a quiet layout that looks great on any device. Enjoy reliable content, graceful typography, and fast offline-friendly performance.`,
  highlights: [
    "Clean navigation with seasonal artwork",
    "Full-text search across prayers, saints, and Marian apparitions",
    "Offline-friendly fallbacks so the page never feels empty"
  ]
};

const PRAYERS = [
  {
    id: "our-father",
    title: "Our Father",
    category: "Daily Prayer",
    language: "en",
    text: "Our Father, who art in heaven, hallowed be thy name; thy kingdom come; thy will be done on earth as it is in heaven..."
  },
  {
    id: "hail-mary",
    title: "Hail Mary",
    category: "Marian",
    language: "en",
    text: "Hail Mary, full of grace, the Lord is with thee; blessed art thou among women..."
  },
  {
    id: "glory-be",
    title: "Glory Be",
    category: "Doxology",
    language: "en",
    text: "Glory be to the Father, and to the Son, and to the Holy Spirit..."
  },
  {
    id: "act-of-contrition",
    title: "Act of Contrition",
    category: "Sacramental",
    language: "en",
    text: "O my God, I am heartily sorry for having offended Thee..."
  }
];

const SAINTS = [
  {
    id: "saint-joseph",
    name: "Saint Joseph",
    feastDay: "March 19",
    title: "Patron of the universal Church",
    summary:
      "Guardian of the Holy Family and model of silent, steadfast faith. Entrust your work and family to his care.",
    virtues: ["humility", "courage"],
    region: "Nazareth"
  },
  {
    id: "saint-therese",
    name: "Saint Thérèse of Lisieux",
    feastDay: "October 1",
    title: "Doctor of the Church",
    summary:
      "The Little Way teaches confidence in God's mercy through hidden acts of love offered with simplicity.",
    virtues: ["trust", "simplicity"],
    region: "Lisieux"
  },
  {
    id: "saint-francis",
    name: "Saint Francis of Assisi",
    feastDay: "October 4",
    title: "Deacon",
    summary:
      "Joyful herald of peace who embraced poverty to follow Christ closely and rebuild the Church.",
    virtues: ["poverty", "joy"],
    region: "Assisi"
  }
];

const APPARITIONS = [
  {
    id: "lourdes",
    title: "Our Lady of Lourdes",
    location: "Lourdes, France",
    year: "1858",
    message: "Mary calls for penance, prayer, and trust in God's healing mercy.",
    focus: ["healing", "penance"]
  },
  {
    id: "guadalupe",
    title: "Our Lady of Guadalupe",
    location: "Tepeyac, Mexico",
    year: "1531",
    message: "The Mother of the Americas consoles the poor and invites all to her Son.",
    focus: ["hope", "mission"]
  },
  {
    id: "fatima",
    title: "Our Lady of Fatima",
    location: "Fatima, Portugal",
    year: "1917",
    message: "Pray the Rosary daily and offer sacrifices for peace and conversion.",
    focus: ["rosary", "peace"]
  }
];

const SACRAMENTS = [
  {
    id: "baptism",
    name: "Baptism",
    summary: "Gateway to the Christian life, washing away sin and welcoming us into God's family.",
    steps: ["Speak with your parish", "Choose godparents", "Attend preparation"],
    scripture: "Matthew 28:19"
  },
  {
    id: "eucharist",
    name: "Eucharist",
    summary: "The true Body and Blood of Christ, source and summit of Christian life.",
    steps: ["Fast for one hour", "Approach with reverence"],
    scripture: "Luke 22:19"
  },
  {
    id: "reconciliation",
    name: "Reconciliation",
    summary: "Christ forgives sins through the priest, restoring grace and friendship with God.",
    steps: ["Examine your conscience", "Be honest and brief", "Pray your penance"],
    scripture: "John 20:23"
  }
];

const GUIDES = [
  {
    id: "rosary",
    title: "How to Pray the Rosary",
    duration: "10-12 minutes",
    summary: "Walk through the decades with the Joyful, Sorrowful, Glorious, and Luminous mysteries.",
    anchor: "Beads & Mysteries"
  },
  {
    id: "confession",
    title: "Peaceful Confession",
    duration: "6-8 minutes",
    summary: "Gentle steps for preparing, confessing with clarity, and receiving absolution.",
    anchor: "Mercy"
  },
  {
    id: "ocia",
    title: "OCIA Journey",
    duration: "Seasonal",
    summary: "Stages for adults entering the Catholic Church with prayer, sponsors, and parish life.",
    anchor: "Discipleship"
  }
];

const HISTORY = [
  {
    id: "apostolic",
    era: "Apostolic Age",
    detail: "From the Resurrection to the missionary journeys of the Apostles.",
    color: "gold"
  },
  {
    id: "patristic",
    era: "Councils & Fathers",
    detail: "Early councils and Fathers guard the Creed with clarity and pastoral care.",
    color: "rose"
  },
  {
    id: "modern",
    era: "Contemporary Church",
    detail: "One faith celebrated in every culture with saints for every vocation.",
    color: "blue"
  }
];

const FEATURE_CARDS = [
  {
    id: "library",
    title: "Prayer Library",
    description: "Browse daily prayers, learn Latin side-by-side, and save favorites for quick access.",
    accent: "#7e6bdc"
  },
  {
    id: "saint-profiles",
    title: "Saint Profiles",
    description: "Discover companions for every vocation with short biographies and patronage notes.",
    accent: "#f06292"
  },
  {
    id: "journal",
    title: "Quiet Journal",
    description: "Keep private reflections, goals, and sacramental prep all in one calm place.",
    accent: "#4db6ac"
  }
];

function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    html.setAttribute("data-theme", prefersDark ? "dark" : "light");
    return;
  }
  html.setAttribute("data-theme", theme);
}

function Card({ title, children, eyebrow, actions, tone }) {
  return (
    <article className={`vf-card ${tone ? `vf-card-${tone}` : ""}`}>
      {eyebrow && <p className="vf-card-eyebrow">{eyebrow}</p>}
      <div className="vf-card-header">
        <h3>{title}</h3>
        {actions}
      </div>
      <div className="vf-card-body">{children}</div>
    </article>
  );
}

function SearchBar({ label, placeholder, value, onChange }) {
  return (
    <label className="vf-search">
      <span>{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Pill({ children }) {
  return <span className="vf-pill">{children}</span>;
}

function Section({ title, subtitle, children, id }) {
  return (
    <section className="vf-section" id={id}>
      <div className="vf-section-heading">
        <div>
          <p className="vf-section-kicker">{subtitle}</p>
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function useSearch(items, term, fields) {
  return useMemo(() => {
    const query = term.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      fields.some((field) =>
        item[field]?.toLowerCase().includes(query)
      )
    );
  }, [items, term, fields]);
}

function App() {
  const [currentTab, setCurrentTab] = useState("home");
  const [theme, setTheme] = useState(() => localStorage.getItem("vf_theme") || "light");
  const [language, setLanguage] = useState(() => localStorage.getItem("vf_language") || "en");
  const [season, setSeason] = useState("normal");
  const [navOpen, setNavOpen] = useState(false);
  const [searchPrayer, setSearchPrayer] = useState("");
  const [searchSaint, setSearchSaint] = useState("");
  const [searchApparition, setSearchApparition] = useState("");
  const [searchGuide, setSearchGuide] = useState("");

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("vf_theme", theme);
  }, [theme]);

  useEffect(() => {
    setNavOpen(false);
  }, [currentTab]);

  useEffect(() => {
    document.documentElement.setAttribute("data-season", season);
  }, [season]);

  useEffect(() => {
    localStorage.setItem("vf_language", language);
  }, [language]);

  const filteredPrayers = useSearch(PRAYERS, searchPrayer, ["title", "category", "text"]);
  const filteredSaints = useSearch(SAINTS, searchSaint, ["name", "summary", "region"]);
  const filteredApparitions = useSearch(APPARITIONS, searchApparition, ["title", "message", "location"]);
  const filteredGuides = useSearch(GUIDES, searchGuide, ["title", "summary", "anchor"]);

  function renderHeader() {
    return (
      <header className="vf-header">
        <div className={`vf-banner vf-banner-${season}`}>
          <div className="vf-logo-block">
            <SacredSymbol season={season} />
            <div className="vf-logo-text">
              <span className="vf-logo-wordmark">Via Fidei</span>
              <span className="vf-logo-sub">Catholic prayers, saints, sacraments, guides</span>
            </div>
          </div>
        </div>

        <div className="vf-nav-row">
          <button
            className="vf-menu-toggle"
            aria-label="Toggle navigation"
            onClick={() => setNavOpen(!navOpen)}
          >
            ☰
          </button>

          <nav className={`vf-nav ${navOpen ? "vf-nav-open" : ""}`} aria-label="Primary">
            <ul>
              {NAV_TABS.map((tab) => (
                <li key={tab.id}>
                  <button
                    className={currentTab === tab.id ? "active" : ""}
                    onClick={() => setCurrentTab(tab.id)}
                  >
                    <span className="vf-nav-icon" aria-hidden>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="vf-secondary-actions">
            <button className="vf-account">Account</button>
            <button className="vf-gear" aria-label="Settings">
              ⚙️
            </button>
          </div>
        </div>

        <div className="vf-controls-row">
          <div className="vf-control-group">
            <label className="vf-inline-label">
              <span>Language</span>
              <select
                className="vf-select"
                aria-label="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="vf-inline-label">
              <span>Theme</span>
              <select
                className="vf-select"
                aria-label="Visual theme"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
              >
                <option value="normal">Standard</option>
                <option value="christmas">Christmas</option>
                <option value="easter">Easter</option>
              </select>
            </label>
          </div>
          <div className="vf-toggle" role="group" aria-label="Color theme">
            <button
              className={theme === "light" ? "active" : ""}
              onClick={() => setTheme("light")}
              type="button"
            >
              Light
            </button>
            <button
              className={theme === "dark" ? "active" : ""}
              onClick={() => setTheme("dark")}
              type="button"
            >
              Dark
            </button>
            <button
              className={theme === "system" ? "active" : ""}
              onClick={() => setTheme("system")}
              type="button"
            >
              System
            </button>
          </div>
        </div>
      </header>
    );
  }

  function renderHome() {
    return (
      <main className="vf-main">
        <Section
          id="hero"
          title={MISSION_COPY.heading}
          subtitle="Welcoming layout"
        >
          <div className="vf-hero">
            <div className="vf-hero-copy">
              <p className="vf-subheading">{MISSION_COPY.subheading}</p>
              <p className="vf-body">{MISSION_COPY.body}</p>
              <div className="vf-highlight-list">
                {MISSION_COPY.highlights.map((item) => (
                  <div key={item} className="vf-highlight-item">
                    <span aria-hidden>•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="vf-cta-row">
                <button className="vf-button">Start praying</button>
                <button className="vf-button ghost">Explore guides</button>
              </div>
            </div>
            <div className="vf-hero-pane">
              <div className="vf-pane-card">
                <p className="vf-card-eyebrow">Seasonal art direction</p>
                <h3>Gentle gradients with sacred iconography</h3>
                <p>
                  Switch the season selector to preview Advent or Easter artwork.
                  The background, banner, and accent glows adapt instantly.
                </p>
                <div className="vf-mini-grid">
                  {FEATURE_CARDS.map((card) => (
                    <div key={card.id} className="vf-mini" style={{ borderColor: card.accent }}>
                      <p>{card.title}</p>
                      <small>{card.description}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="feature-grid"
          title="Featured tools"
          subtitle="Calm, polished, and fully responsive"
        >
          <div className="vf-grid three">
            {FEATURE_CARDS.map((card) => (
              <Card key={card.id} title={card.title} tone="muted">
                <p>{card.description}</p>
                <div className="vf-chip" style={{ background: card.accent }}></div>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          id="sacrament-preview"
          title="Sacramental life"
          subtitle="Know what to expect"
        >
          <div className="vf-grid three">
            {SACRAMENTS.map((item) => (
              <Card key={item.id} title={item.name} eyebrow={item.scripture}>
                <p>{item.summary}</p>
                <div className="vf-pill-row">
                  {item.steps.map((step) => (
                    <Pill key={step}>{step}</Pill>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </Section>
      </main>
    );
  }

  function renderPrayers() {
    return (
      <main className="vf-main">
        <Section
          id="prayers"
          title="Prayer library"
          subtitle="Searchable and multilingual-ready"
        >
          <div className="vf-toolbar">
            <SearchBar
              label="Search prayers"
              placeholder="Rosary, Our Father, contrition..."
              value={searchPrayer}
              onChange={setSearchPrayer}
            />
            <span className="vf-meta">{filteredPrayers.length} prayers</span>
          </div>
          <div className="vf-grid two">
            {filteredPrayers.map((prayer) => (
              <Card
                key={prayer.id}
                title={prayer.title}
                eyebrow={prayer.category}
                actions={<Pill>{prayer.language.toUpperCase()}</Pill>}
              >
                <p>{prayer.text}</p>
              </Card>
            ))}
          </div>
        </Section>
      </main>
    );
  }

  function renderSaints() {
    return (
      <main className="vf-main">
        <Section
          id="saints"
          title="Communion of Saints"
          subtitle="Find patrons and companions"
        >
          <div className="vf-toolbar">
            <SearchBar
              label="Search saints"
              placeholder="Joseph, Thérèse, Francis..."
              value={searchSaint}
              onChange={setSearchSaint}
            />
            <span className="vf-meta">{filteredSaints.length} saints</span>
          </div>
          <div className="vf-grid three">
            {filteredSaints.map((saint) => (
              <Card key={saint.id} title={saint.name} eyebrow={saint.title}>
                <p>{saint.summary}</p>
                <div className="vf-pill-row">
                  <Pill>{saint.feastDay}</Pill>
                  <Pill>{saint.region}</Pill>
                  {saint.virtues.map((v) => (
                    <Pill key={v}>{v}</Pill>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </Section>
      </main>
    );
  }

  function renderOurLady() {
    return (
      <main className="vf-main">
        <Section
          id="our-lady"
          title="Apparitions"
          subtitle="Marian encounters with clear summaries"
        >
          <div className="vf-toolbar">
            <SearchBar
              label="Search apparitions"
              placeholder="Lourdes, Fatima, Guadalupe..."
              value={searchApparition}
              onChange={setSearchApparition}
            />
            <span className="vf-meta">{filteredApparitions.length} entries</span>
          </div>
          <div className="vf-grid three">
            {filteredApparitions.map((item) => (
              <Card key={item.id} title={item.title} eyebrow={`${item.location} · ${item.year}`}>
                <p>{item.message}</p>
                <div className="vf-pill-row">
                  {item.focus.map((f) => (
                    <Pill key={f}>{f}</Pill>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </Section>
      </main>
    );
  }

  function renderSacraments() {
    return (
      <main className="vf-main">
        <Section
          id="sacraments"
          title="Sacraments"
          subtitle="Step-by-step overviews"
        >
          <div className="vf-grid two">
            {SACRAMENTS.map((item) => (
              <Card key={item.id} title={item.name} eyebrow={item.scripture}>
                <p>{item.summary}</p>
                <div className="vf-pill-row">
                  {item.steps.map((step) => (
                    <Pill key={step}>{step}</Pill>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </Section>
      </main>
    );
  }

  function renderGuides() {
    return (
      <main className="vf-main">
        <Section id="guides" title="Guides" subtitle="Practical walkthroughs">
          <div className="vf-toolbar">
            <SearchBar
              label="Search guides"
              placeholder="Rosary, confession..."
              value={searchGuide}
              onChange={setSearchGuide}
            />
            <span className="vf-meta">{filteredGuides.length} guides</span>
          </div>
          <div className="vf-grid three">
            {filteredGuides.map((guide) => (
              <Card key={guide.id} title={guide.title} eyebrow={guide.duration}>
                <p>{guide.summary}</p>
                <div className="vf-pill-row">
                  <Pill>{guide.anchor}</Pill>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      </main>
    );
  }

  function renderHistory() {
    return (
      <main className="vf-main">
        <Section
          id="history"
          title="Liturgy & History"
          subtitle="A brief, reverent timeline"
        >
          <div className="vf-grid three">
            {HISTORY.map((era) => (
              <Card key={era.id} title={era.era} eyebrow="Sacred rhythm">
                <p>{era.detail}</p>
                <div className={`vf-chip vf-chip-${era.color}`}></div>
              </Card>
            ))}
          </div>
          <Card
            title="Sacred rhythm of the day"
            eyebrow="Daily structure"
            tone="muted"
            actions={<Pill>Lectio · Lauds · Vespers</Pill>}
          >
            <p>
              Begin with a brief Lectio reading, pause at midday for the Angelus, and end with Compline. The interface keeps each
              moment uncluttered so you can stay prayerful.
            </p>
          </Card>
        </Section>
      </main>
    );
  }

  let view = renderHome();
  if (currentTab === "prayers") view = renderPrayers();
  else if (currentTab === "saints") view = renderSaints();
  else if (currentTab === "ourlady") view = renderOurLady();
  else if (currentTab === "sacraments") view = renderSacraments();
  else if (currentTab === "guides") view = renderGuides();
  else if (currentTab === "history") view = renderHistory();

  return (
    <div className="vf-shell">
      {renderHeader()}
      {view}
      <footer className="vf-footer">
        <div>
          <p>© {new Date().getFullYear()} Via Fidei. Crafted for clarity, beauty, and depth.</p>
        </div>
      </footer>
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
  function SacredSymbol({ season }) {
    // Christmas Theme - Stunning Holy Family
    if (season === "christmas") {
      return (
        <svg className="vf-sacred-mark" viewBox="0 0 120 120" role="img" aria-label="Holy Family">
          <defs>
            <linearGradient id="holyFamilyGlow" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#fff8e8" />
              <stop offset="50%" stopColor="#ffd700" />
              <stop offset="100%" stopColor="#b8860b" />
            </linearGradient>
            <linearGradient id="maryRobe" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#4169e1" />
              <stop offset="100%" stopColor="#1e3a6e" />
            </linearGradient>
            <linearGradient id="josephRobe" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8b6914" />
              <stop offset="100%" stopColor="#5d4a0c" />
            </linearGradient>
            <radialGradient id="haloGold" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff8dc" />
              <stop offset="60%" stopColor="#ffd700" />
              <stop offset="100%" stopColor="#daa520" stopOpacity="0.3" />
            </radialGradient>
            <radialGradient id="starBurst" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffacd" />
              <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
            </radialGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Background warm glow */}
          <circle cx="60" cy="60" r="56" fill="url(#holyFamilyGlow)" opacity="0.15" />
          {/* Bethlehem Star */}
          <circle cx="60" cy="15" r="8" fill="url(#starBurst)" filter="url(#softGlow)" />
          <path d="M60 8 L62 13 L67 13 L63 17 L65 22 L60 19 L55 22 L57 17 L53 13 L58 13 Z"
                fill="#fffacd" filter="url(#softGlow)" />
          {/* Joseph - left figure */}
          <ellipse cx="35" cy="32" rx="10" ry="11" fill="#f5deb3" /> {/* Head */}
          <path d="M35 22 Q42 18 38 28 Q35 32 32 28 Q28 18 35 22" fill="#8b4513" /> {/* Hair/beard */}
          <circle cx="35" cy="18" r="6" fill="url(#haloGold)" opacity="0.5" /> {/* Halo */}
          <path d="M22 95 Q25 55 35 43 Q45 55 48 95 Z" fill="url(#josephRobe)" /> {/* Robe */}
          <path d="M28 60 Q35 65 42 60" fill="none" stroke="#6b4c0a" strokeWidth="2" /> {/* Robe detail */}
          {/* Mary - right figure */}
          <ellipse cx="75" cy="35" rx="9" ry="10" fill="#faebd7" /> {/* Head */}
          <path d="M66 30 Q75 20 84 30 Q84 38 75 42 Q66 38 66 30" fill="#4169e1" /> {/* Veil */}
          <circle cx="75" cy="22" r="7" fill="url(#haloGold)" opacity="0.6" /> {/* Halo */}
          <path d="M62 95 Q65 55 75 45 Q85 55 88 95 Z" fill="url(#maryRobe)" /> {/* Robe */}
          <path d="M68 65 Q75 70 82 65" fill="none" stroke="#1e3a6e" strokeWidth="2" /> {/* Robe detail */}
          {/* Baby Jesus in manger - center */}
          <ellipse cx="55" cy="78" rx="18" ry="8" fill="#deb887" /> {/* Manger */}
          <path d="M37 78 L40 85 L70 85 L73 78" fill="#8b7355" /> {/* Manger base */}
          <ellipse cx="55" cy="72" rx="12" ry="6" fill="#fffff0" /> {/* Swaddling */}
          <circle cx="55" cy="68" r="5" fill="#faebd7" /> {/* Baby head */}
          <circle cx="55" cy="62" r="8" fill="url(#haloGold)" opacity="0.7" /> {/* Baby halo */}
          {/* Hay details */}
          <path d="M38 76 Q42 72 46 76 M64 76 Q68 72 72 76" stroke="#daa520" strokeWidth="1.5" fill="none" />
        </svg>
      );
    }

    // Easter Theme - Silver Crucifix with Golden Radiance
    if (season === "easter") {
      return (
        <svg className="vf-sacred-mark" viewBox="0 0 120 120" role="img" aria-label="Silver Crucifix">
          <defs>
            <linearGradient id="silverMetal" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#f0f0f5" />
              <stop offset="25%" stopColor="#d8d8e0" />
              <stop offset="50%" stopColor="#c0c0c8" />
              <stop offset="75%" stopColor="#a8a8b0" />
              <stop offset="100%" stopColor="#909098" />
            </linearGradient>
            <linearGradient id="silverShine" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#e8e8f0" />
              <stop offset="100%" stopColor="#c8c8d0" />
            </linearGradient>
            <linearGradient id="goldRadiance" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#fff8dc" />
              <stop offset="50%" stopColor="#ffd700" />
              <stop offset="100%" stopColor="#daa520" />
            </linearGradient>
            <radialGradient id="divineLight" cx="50%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#fff8e1" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#ffd54f" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffb300" stopOpacity="0" />
            </radialGradient>
            <filter id="crucifixGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="innerShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feOffset dx="1" dy="1" />
              <feGaussianBlur stdDeviation="1" result="shadow" />
              <feComposite in="SourceGraphic" in2="shadow" operator="over" />
            </filter>
          </defs>
          {/* Divine radiance background */}
          <circle cx="60" cy="52" r="50" fill="url(#divineLight)" />
          {/* Rays of light */}
          <g opacity="0.3" stroke="#ffd700" strokeWidth="1.5">
            <line x1="60" y1="10" x2="60" y2="2" />
            <line x1="85" y1="20" x2="92" y2="13" />
            <line x1="100" y1="45" x2="108" y2="45" />
            <line x1="85" y1="70" x2="92" y2="77" />
            <line x1="35" y1="20" x2="28" y2="13" />
            <line x1="20" y1="45" x2="12" y2="45" />
            <line x1="35" y1="70" x2="28" y2="77" />
          </g>
          {/* Main crucifix - vertical beam */}
          <rect x="52" y="15" width="16" height="90" rx="3" fill="url(#silverMetal)" filter="url(#innerShadow)" />
          {/* Vertical beam highlight */}
          <rect x="54" y="17" width="4" height="86" rx="2" fill="url(#silverShine)" opacity="0.6" />
          {/* Horizontal beam */}
          <rect x="25" y="38" width="70" height="14" rx="3" fill="url(#silverMetal)" filter="url(#innerShadow)" />
          {/* Horizontal beam highlight */}
          <rect x="27" y="40" width="66" height="4" rx="2" fill="url(#silverShine)" opacity="0.6" />
          {/* INRI plaque */}
          <rect x="48" y="20" width="24" height="10" rx="2" fill="url(#goldRadiance)" />
          <text x="60" y="28" textAnchor="middle" fontSize="7" fontFamily="serif" fontWeight="bold" fill="#5d4e0c">INRI</text>
          {/* Decorative finials */}
          <circle cx="60" cy="12" r="5" fill="url(#silverMetal)" />
          <circle cx="60" cy="12" r="3" fill="url(#goldRadiance)" />
          <circle cx="22" cy="45" r="4" fill="url(#silverMetal)" />
          <circle cx="98" cy="45" r="4" fill="url(#silverMetal)" />
          <circle cx="60" cy="108" r="4" fill="url(#silverMetal)" />
          {/* Center medallion */}
          <circle cx="60" cy="45" r="10" fill="url(#goldRadiance)" filter="url(#crucifixGlow)" />
          <circle cx="60" cy="45" r="6" fill="#fff8dc" />
        </svg>
      );
    }

    // Standard Theme - Beautiful Wooden Cross with detailed wood grain
    return (
      <svg className="vf-sacred-mark" viewBox="0 0 120 120" role="img" aria-label="Wooden Cross">
        <defs>
          <linearGradient id="woodGrain1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#a67c52" />
            <stop offset="20%" stopColor="#8b6914" />
            <stop offset="40%" stopColor="#9a7b4f" />
            <stop offset="60%" stopColor="#7a5c30" />
            <stop offset="80%" stopColor="#8d6e40" />
            <stop offset="100%" stopColor="#6b4423" />
          </linearGradient>
          <linearGradient id="woodGrain2" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#9a7b4f" />
            <stop offset="25%" stopColor="#7a5c30" />
            <stop offset="50%" stopColor="#8d6e40" />
            <stop offset="75%" stopColor="#6b4423" />
            <stop offset="100%" stopColor="#8b6914" />
          </linearGradient>
          <linearGradient id="woodHighlight" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#c4a574" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#dbb896" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#c4a574" stopOpacity="0" />
          </linearGradient>
          <pattern id="grainPattern" patternUnits="userSpaceOnUse" width="4" height="8">
            <path d="M0 0 Q2 4 0 8 M4 0 Q2 4 4 8" stroke="#5d4a30" strokeWidth="0.5" fill="none" opacity="0.3" />
          </pattern>
          <filter id="woodShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.25" />
          </filter>
          <radialGradient id="grayBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#b0b0b0" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#808080" stopOpacity="0.15" />
          </radialGradient>
        </defs>
        {/* Subtle gray background circle */}
        <circle cx="60" cy="60" r="54" fill="url(#grayBg)" />
        {/* Main vertical beam */}
        <rect x="48" y="12" width="24" height="96" rx="4" fill="url(#woodGrain1)" filter="url(#woodShadow)" />
        {/* Wood grain texture overlay on vertical */}
        <rect x="48" y="12" width="24" height="96" rx="4" fill="url(#grainPattern)" />
        {/* Vertical beam highlight */}
        <rect x="50" y="14" width="6" height="92" rx="3" fill="url(#woodHighlight)" />
        {/* Main horizontal beam */}
        <rect x="18" y="36" width="84" height="22" rx="4" fill="url(#woodGrain2)" filter="url(#woodShadow)" />
        {/* Wood grain texture overlay on horizontal */}
        <rect x="18" y="36" width="84" height="22" rx="4" fill="url(#grainPattern)" />
        {/* Horizontal beam highlight */}
        <rect x="20" y="38" width="80" height="5" rx="2" fill="url(#woodHighlight)" />
        {/* Center joint detail */}
        <circle cx="60" cy="47" r="8" fill="none" stroke="#5d4a30" strokeWidth="1.5" opacity="0.4" />
        {/* Nail holes - subtle details */}
        <circle cx="60" cy="47" r="2" fill="#3d2a1a" />
        <circle cx="26" cy="47" r="1.5" fill="#3d2a1a" opacity="0.7" />
        <circle cx="94" cy="47" r="1.5" fill="#3d2a1a" opacity="0.7" />
        {/* Wood edge details */}
        <path d="M48 15 Q46 60 48 105" stroke="#5d4a30" strokeWidth="1" fill="none" opacity="0.3" />
        <path d="M72 15 Q74 60 72 105" stroke="#5d4a30" strokeWidth="1" fill="none" opacity="0.3" />
        {/* Subtle wood knots */}
        <ellipse cx="55" cy="75" rx="3" ry="4" fill="#6b4423" opacity="0.4" />
        <ellipse cx="65" cy="28" rx="2" ry="3" fill="#6b4423" opacity="0.3" />
      </svg>
    );
  }
