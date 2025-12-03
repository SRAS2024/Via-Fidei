import React, { useMemo, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const NAV_TABS = [
  { id: "home", label: "Home" },
  { id: "prayers", label: "Prayers" },
  { id: "saints", label: "Saints" },
  { id: "ourlady", label: "Our Lady" },
  { id: "sacraments", label: "Sacraments" },
  { id: "guides", label: "Guides" },
  { id: "history", label: "Liturgy & History" }
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
  const [season, setSeason] = useState("easter");
  const [searchPrayer, setSearchPrayer] = useState("");
  const [searchSaint, setSearchSaint] = useState("");
  const [searchApparition, setSearchApparition] = useState("");
  const [searchGuide, setSearchGuide] = useState("");

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("vf_theme", theme);
  }, [theme]);

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
        <div className="vf-banner">
          <div className={`vf-banner-mark vf-banner-${season}`}></div>
        </div>
        <div className="vf-header-row">
          <div className="vf-title-block">
            <span className="vf-logo" aria-hidden>
              ✣
            </span>
            <div>
              <p className="vf-kicker">Via Fidei</p>
              <h1>Catholic prayers, saints, sacraments, and guides</h1>
            </div>
          </div>
          <div className="vf-actions">
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
            <div className="vf-toggle">
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
            <select
              className="vf-select"
              aria-label="Seasonal art"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
            >
              <option value="normal">Ordinary</option>
              <option value="advent">Advent</option>
              <option value="easter">Easter</option>
            </select>
          </div>
        </div>
        <nav className="vf-nav" aria-label="Primary">
          <ul>
            {NAV_TABS.map((tab) => (
              <li key={tab.id}>
                <button
                  className={currentTab === tab.id ? "active" : ""}
                  onClick={() => setCurrentTab(tab.id)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
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
