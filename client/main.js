// client/main.js
import React, { useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const PAGE_SIZE = 10;

// Tabs in primary navigation
const TABS = [
  { id: "home", label: "Home" },
  { id: "history", label: "Liturgy and History" },
  { id: "prayers", label: "Prayers" },
  { id: "saints", label: "Saints" },
  { id: "ourlady", label: "Our Lady" },
  { id: "sacraments", label: "Sacraments" },
  { id: "guides", label: "Guides" }
];

const SUPPORTED_LANGS = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
  { code: "pl", label: "Polski" },
  { code: "ru", label: "Русский" },
  { code: "uk", label: "Українська" }
];

const GOAL_TYPES = [
  { value: "CUSTOM", label: "Custom" },
  { value: "TEMPLATE_NOVENA", label: "Novena" },
  { value: "TEMPLATE_OCIA", label: "OCIA" },
  { value: "TEMPLATE_CONSECRATION", label: "Consecration" },
  { value: "TEMPLATE_VOCATION", label: "Vocation" }
];

const ACCOUNT_STATES = {
  CLOSED: "closed",
  OPEN: "open"
};

const SETTINGS_STATES = {
  CLOSED: "closed",
  OPEN: "open"
};

const FALLBACK_MISSION = {
  heading: "Via Fidei",
  subheading: "A Catholic space for clarity, beauty, and depth",
  body: [
    "Via Fidei is a quiet and reverent space where the devout faithful can grow in their relationship with God and where those who are searching can encounter trusted Catholic teaching at a gentle pace.",
    "The mission of Via Fidei is to be a place where both the non religious and the faithful alike can find the prayers, saints, sacraments, and guides they need to deepen in faith. It is a tool for spiritual growth, not noise.",
    "All content is curated, catechism aligned, and presented in a way that is readable, calm, and ordered from top to bottom, left to right."
  ]
};

const FALLBACK_ABOUT = {
  paragraphs: [
    "Via Fidei is designed to be simple, symmetrical, and approachable. The interface favors clarity over clutter so that you can focus on prayer, study, and discernment.",
    "Every section is carefully localized and paired with visual elements like icons and artwork so that the whole experience feels rooted in the life of the Church.",
    "All interactive features are personal and private. There is no social feed or messaging, only tools that support your sacramental life, your goals, and your spiritual journal."
  ],
  quickLinks: [
    { label: "Sacraments", target: "sacraments" },
    { label: "OCIA", target: "guides-ocia" },
    { label: "Rosary", target: "guides-rosary" },
    { label: "Confession", target: "guides-confession" },
    { label: "Guides", target: "guides-root" }
  ]
};

const FALLBACK_HISTORY = [
  {
    id: "history-apostolic",
    title: "Apostolic Age",
    summary:
      "From the Resurrection to the missionary journeys of the Apostles and the birth of the early Church.",
    body:
      "Pentecost launches the Church into the world. The Apostles preach, baptize, and form the first Christian communities while enduring persecution with courage and charity."
  },
  {
    id: "history-councils",
    title: "Councils and Fathers",
    summary: "The first councils and the teachings of the early Fathers safeguard the Creed.",
    body:
      "Guided by the Holy Spirit, bishops gather to profess that Jesus Christ is true God and true man. The Church Fathers hand down the faith with clarity, prayer, and pastoral care."
  },
  {
    id: "history-today",
    title: "Contemporary Church",
    summary: "Living the same faith in a global Church that prays and serves in every culture.",
    body:
      "Catholics across the world celebrate the same sacraments and profess the same Creed. The modern saints show that holiness is possible in every vocation and place."
  }
];

const FALLBACK_SACRAMENTS = [
  {
    id: "sacrament-baptism",
    name: "Baptism",
    meaning:
      "The gateway to the Christian life, washing away sin and welcoming us into the family of God.",
    biblicalFoundation: [
      { reference: "Matthew 28:19", text: "Go, therefore, and make disciples of all nations, baptizing them" },
      { reference: "Romans 6:4", text: "We were buried with him through baptism into death so that we might walk in newness of life." }
    ],
    preparation: {
      overview: "Choose godparents, attend a parish preparation session, and set a date with your parish priest.",
      steps: [
        "Speak with your parish to schedule Baptism.",
        "Reflect on the promises you and the godparents will make.",
        "Plan to attend Mass and celebrate with family afterward."
      ]
    },
    whatToExpect:
      "Water is poured three times in the name of the Trinity. You will be anointed with sacred chrism and receive a baptismal candle."
  },
  {
    id: "sacrament-eucharist",
    name: "Eucharist",
    meaning:
      "The true Body and Blood of Christ, the source and summit of the Christian life and the heart of every Mass.",
    biblicalFoundation: [
      { reference: "Luke 22:19", text: "This is my body, which will be given for you; do this in memory of me." }
    ],
    preparation: {
      overview: "Fast for one hour beforehand and approach with faith, reverence, and a heart free from grave sin."
    },
    whatToExpect:
      "You may receive on the tongue or in the hand. After the priest or minister says ‘The Body of Christ,’ respond ‘Amen.’"
  },
  {
    id: "sacrament-reconciliation",
    name: "Reconciliation",
    meaning:
      "Christ forgives sins through the ministry of the priest, restoring grace and renewing friendship with God and the Church.",
    biblicalFoundation: [
      { reference: "John 20:23", text: "Whose sins you forgive are forgiven them." }
    ],
    preparation: {
      overview: "Make an examination of conscience, approach humbly, and be honest and concise in confession."
    },
    whatToExpect:
      "You may go face-to-face or behind a screen. The priest offers counsel, assigns a penance, and prays the words of absolution."
  }
];

const FALLBACK_GUIDES = [
  {
    id: "guide-rosary",
    title: "How to Pray the Rosary",
    description:
      "Step-by-step guide to the decades, mysteries, and prayers that anchor this beloved Marian devotion.",
    summary:
      "Step-by-step guide to the decades, mysteries, and prayers that anchor this beloved Marian devotion.",
    body:
      "Begin with the Sign of the Cross and the Apostles’ Creed, then proceed through five decades of the announced mysteries. Let every bead draw you deeper into the life of Christ with Mary." 
  },
  {
    id: "guide-confession",
    title: "Guide to Confession",
    description:
      "Gentle instructions for preparing, confessing with peace, and receiving absolution confidently.",
    summary:
      "Gentle instructions for preparing, confessing with peace, and receiving absolution confidently.",
    body:
      "Ask the Holy Spirit to illumine your conscience, confess sins clearly and briefly, then pray your penance in gratitude for God’s mercy."
  },
  {
    id: "guide-ocia",
    title: "OCIA Journey",
    description: "An overview of the stages for adults entering the Catholic Church.",
    summary: "An overview of the stages for adults entering the Catholic Church.",
    body:
      "From inquiry to mystagogy, accompany candidates with prayer, good sponsors, and parish life so they can embrace the sacraments with joy."
  }
];

const FALLBACK_PRAYERS = [
  {
    id: "prayer-our-father",
    title: "Our Father",
    content:
      "Our Father, who art in heaven, hallowed be thy name; thy kingdom come; thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.",
    categories: ["daily", "lord's prayer"],
    tags: ["gospel"],
    source: "built-in"
  },
  {
    id: "prayer-hail-mary",
    title: "Hail Mary",
    content:
      "Hail Mary, full of grace, the Lord is with thee; blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.",
    categories: ["marian", "daily"],
    tags: ["rosary"],
    source: "built-in"
  }
];

const FALLBACK_SAINTS = [
  {
    id: "saint-joseph",
    name: "Saint Joseph",
    feastDay: "2024-03-19",
    biography:
      "Guardian of the Holy Family and patron of the universal Church, Saint Joseph models humble strength, purity, and faithful work.",
    officialPrayer:
      "Saint Joseph, foster father of Jesus and spouse of Mary, protect our families and obtain for us a heart like yours, obedient and courageous. Amen.",
    imageUrl: null,
    tags: ["holy family", "patron"]
  },
  {
    id: "saint-therese",
    name: "Saint Thérèse of Lisieux",
    feastDay: "2024-10-01",
    biography:
      "The Little Flower teaches confidence in God’s mercy and finding holiness through the small, hidden acts of daily love.",
    officialPrayer:
      "Saint Thérèse, teach us your Little Way of trust and love. Help us offer every moment for Jesus and for souls. Amen.",
    imageUrl: null,
    tags: ["little way", "doctor of the church"]
  }
];

const FALLBACK_APPARITIONS = [
  {
    id: "apparition-lourdes",
    title: "Our Lady of Lourdes",
    location: "Lourdes, France",
    firstYear: "1858",
    story:
      "Mary appeared to Saint Bernadette with a message of penance and prayer. The spring at Lourdes remains a place of conversion and healing.",
    officialPrayer:
      "Blessed Lady of Lourdes, help us turn our hearts to your Son and receive the healing he desires for us.",
    imageUrl: null
  },
  {
    id: "apparition-guadalupe",
    title: "Our Lady of Guadalupe",
    location: "Tepeyac, Mexico",
    firstYear: "1531",
    story:
      "Mary appeared to Saint Juan Diego as the Mother of the Americas, leaving her image on the tilma as a sign of consolation and hope.",
    officialPrayer:
      "Our Lady of Guadalupe, gentle mother, embrace those who seek your Son and lead us to deeper trust in his mercy.",
    imageUrl: null
  }
];

function sortContentList(items) {
  return (Array.isArray(items) ? [...items] : []).sort((a, b) => {
    const aOrder = Number.isFinite(a?.displayOrder)
      ? Number(a.displayOrder)
      : Number.isFinite(a?.order)
      ? Number(a.order)
      : Number.MAX_SAFE_INTEGER;
    const bOrder = Number.isFinite(b?.displayOrder)
      ? Number(b.displayOrder)
      : Number.isFinite(b?.order)
      ? Number(b.order)
      : Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) return aOrder - bOrder;

    const aTitle = (a?.title || a?.name || "").toString();
    const bTitle = (b?.title || b?.name || "").toString();
    return aTitle.localeCompare(bTitle);
  });
}

function applyTheme(theme) {
  const html = document.documentElement;
  if (!theme || theme === "system") {
    html.removeAttribute("data-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    html.setAttribute("data-theme", prefersDark ? "dark" : "light");
    return;
  }
  html.setAttribute("data-theme", theme);
}

// Helpers for sacraments rendering

function renderSacramentBiblicalFoundation(biblicalFoundation) {
  if (!biblicalFoundation) return null;

  if (Array.isArray(biblicalFoundation) && biblicalFoundation.length > 0) {
    return React.createElement(
      "div",
      { className: "vf-sacrament-field" },
      React.createElement("strong", null, "Scripture"),
      React.createElement(
        "ul",
        { className: "vf-sacrament-list" },
        biblicalFoundation.map((item, idx) => {
          if (!item) return null;
          if (typeof item === "string") {
            return React.createElement("li", { key: idx }, item);
          }
          return React.createElement(
            "li",
            { key: item.reference || idx },
            item.reference
              ? React.createElement(
                  React.Fragment,
                  null,
                  React.createElement(
                    "span",
                    { className: "vf-sacrament-ref" },
                    item.reference + ": "
                  ),
                  item.text
                )
              : item.text
          );
        })
      )
    );
  }

  if (typeof biblicalFoundation === "string" && biblicalFoundation.trim()) {
    return React.createElement(
      "p",
      { className: "vf-sacrament-field" },
      React.createElement("strong", null, "Biblical foundation:"),
      " ",
      biblicalFoundation
    );
  }

  return null;
}

function renderSacramentPreparation(preparation) {
  if (!preparation) return null;

  if (typeof preparation === "string") {
    return React.createElement(
      "p",
      { className: "vf-sacrament-field" },
      React.createElement("strong", null, "How to prepare:"),
      " ",
      preparation
    );
  }

  const overview = preparation.overview;
  const steps = Array.isArray(preparation.steps) ? preparation.steps : [];

  return React.createElement(
    "div",
    { className: "vf-sacrament-field" },
    React.createElement("strong", null, "How to prepare"),
    overview
      ? React.createElement(
          "p",
          { className: "vf-sacrament-text" },
          overview
        )
      : null,
    steps.length > 0
      ? React.createElement(
          "ul",
          { className: "vf-sacrament-list" },
          steps.map((step, idx) =>
            React.createElement("li", { key: idx }, step)
          )
        )
      : null
  );
}

function renderSacramentWhatToExpect(whatToExpect) {
  if (!whatToExpect) return null;

  if (typeof whatToExpect === "string") {
    return React.createElement(
      "p",
      { className: "vf-sacrament-field" },
      React.createElement("strong", null, "What to expect:"),
      " ",
      whatToExpect
    );
  }

  const short = whatToExpect.short;
  const notes = Array.isArray(whatToExpect.notes) ? whatToExpect.notes : [];

  return React.createElement(
    "div",
    { className: "vf-sacrament-field" },
    React.createElement("strong", null, "What to expect"),
    short
      ? React.createElement(
          "p",
          { className: "vf-sacrament-text" },
          short
        )
      : null,
    notes.length > 0
      ? React.createElement(
          "ul",
          { className: "vf-sacrament-list" },
          notes.map((note, idx) =>
            React.createElement("li", { key: idx }, note)
          )
        )
      : null
  );
}

function renderSacramentQuestions(commonQuestions) {
  if (!Array.isArray(commonQuestions) || commonQuestions.length === 0) {
    return null;
  }

  return React.createElement(
    "div",
    { className: "vf-sacrament-qa" },
    React.createElement(
      "h4",
      { className: "vf-sacrament-qa-title" },
      "Common questions"
    ),
    React.createElement(
      "dl",
      { className: "vf-sacrament-qa-list" },
      commonQuestions.map((qItem, idx) => {
        if (!qItem) return null;
        if (typeof qItem === "string") {
          return React.createElement(
            "div",
            { key: idx, className: "vf-sacrament-qa-item" },
            React.createElement("dd", null, qItem)
          );
        }
        return React.createElement(
          "div",
          { key: idx, className: "vf-sacrament-qa-item" },
          qItem.question
            ? React.createElement("dt", null, qItem.question)
            : null,
          qItem.answer
            ? React.createElement("dd", null, qItem.answer)
            : null
        );
      })
    )
  );
}

// Helper for guides body

function renderGuideBodyContent(body) {
  if (!body) return null;

  if (typeof body === "string") {
    return React.createElement(
      "p",
      { className: "vf-guide-body" },
      body
    );
  }

  const intro = body.intro;
  const sections = Array.isArray(body.sections) ? body.sections : [];

  return React.createElement(
    "div",
    { className: "vf-guide-body" },
    intro ? React.createElement("p", null, intro) : null,
    sections.map((section, idx) =>
      React.createElement(
        "section",
        { key: section.title || idx, className: "vf-guide-section" },
        section.title
          ? React.createElement(
              "h4",
              { className: "vf-guide-section-title" },
              section.title
            )
          : null,
        Array.isArray(section.paragraphs)
          ? section.paragraphs.map((p, i) =>
              React.createElement(
                "p",
                { key: i, className: "vf-guide-paragraph" },
                p
              )
            )
          : null,
        Array.isArray(section.steps) && section.steps.length > 0
          ? React.createElement(
              "ol",
              { className: "vf-guide-steps" },
              section.steps.map((step, j) =>
                React.createElement(
                  "li",
                  { key: step.label || j, className: "vf-guide-step" },
                  React.createElement(
                    "div",
                    { className: "vf-guide-step-main" },
                    step.label
                      ? React.createElement(
                          "span",
                          { className: "vf-guide-step-label" },
                          step.label
                        )
                      : null,
                    step.description
                      ? React.createElement(
                          "span",
                          { className: "vf-guide-step-description" },
                          step.description
                        )
                      : null
                  ),
                  step.prayerTitle && step.prayerText
                    ? React.createElement(
                        "div",
                        { className: "vf-guide-step-prayer" },
                        React.createElement(
                          "div",
                          { className: "vf-guide-step-prayer-title" },
                          step.prayerTitle
                        ),
                        React.createElement(
                          "p",
                          { className: "vf-guide-step-prayer-text" },
                          step.prayerText
                        )
                      )
                    : null
                )
              )
            )
          : null
      )
    )
  );
}

function renderGuideChecklist(checklistTemplate) {
  if (!checklistTemplate) return null;
  const items = Array.isArray(checklistTemplate.items)
    ? checklistTemplate.items
    : [];
  if (items.length === 0) return null;

  return React.createElement(
    "div",
    { className: "vf-guide-checklist" },
    React.createElement(
      "h4",
      { className: "vf-guide-checklist-title" },
      checklistTemplate.title || "Checklist"
    ),
    React.createElement(
      "ul",
      null,
      items.map((item, idx) =>
        React.createElement(
          "li",
          { key: idx },
          item.label || String(item)
        )
      )
    )
  );
}

function renderPagination(currentPage, totalPages, onPageChange, idPrefix) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  for (let page = 1; page <= totalPages; page += 1) {
    const isActive = page === currentPage;
    pages.push(
      React.createElement(
        "li",
        { key: `${idPrefix}-${page}`, className: "vf-page-item" },
        React.createElement(
          "button",
          {
            type: "button",
            className:
              "vf-page-button" +
              (isActive ? " vf-page-button-active" : ""),
            onClick: () => onPageChange(page),
            "aria-current": isActive ? "page" : undefined
          },
          page
        )
      )
    );
  }

  return React.createElement(
    "nav",
    { className: "vf-pagination", "aria-label": "Pagination" },
    React.createElement("ul", { className: "vf-pagination-list" }, pages)
  );
}

function AppShell() {
  const [currentTab, setCurrentTab] = useState("home");

  const [accountMenu, setAccountMenu] = useState(ACCOUNT_STATES.CLOSED);
  const [settingsMenu, setSettingsMenu] = useState(SETTINGS_STATES.CLOSED);

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [theme, setTheme] = useState(
    () => window.localStorage.getItem("vf_theme") || "light"
  );
  const [seasonTheme, setSeasonTheme] = useState("normal");

  const [language, setLanguage] = useState(
    () => window.localStorage.getItem("vf_language") || "en"
  );

  // Home content
  const [homeData, setHomeData] = useState(null);
  const [loadingHome, setLoadingHome] = useState(true);
  const [homeError, setHomeError] = useState("");

  // History, Sacraments, Guides
  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyError, setHistoryError] = useState("");

  const [sacramentItems, setSacramentItems] = useState([]);
  const [loadingSacraments, setLoadingSacraments] = useState(false);
  const [sacramentsLoaded, setSacramentsLoaded] = useState(false);
  const [sacramentsPage, setSacramentsPage] = useState(1);
  const [sacramentsError, setSacramentsError] = useState("");

  const [guideItems, setGuideItems] = useState([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [guidesLoaded, setGuidesLoaded] = useState(false);
  const [guidesPage, setGuidesPage] = useState(1);
  const [guidesError, setGuidesError] = useState("");

  // Profile data
  const [profileOverview, setProfileOverview] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [savedPrayers, setSavedPrayers] = useState([]);
  const [loadingSavedPrayers, setLoadingSavedPrayers] = useState(false);
  const [savedPrayersError, setSavedPrayersError] = useState("");

  const [journalEntries, setJournalEntries] = useState([]);
  const [journalView, setJournalView] = useState("active");
  const [journalForm, setJournalForm] = useState({
    title: "",
    body: "",
    isFavorite: false
  });
  const [journalSubmitting, setJournalSubmitting] = useState(false);
  const [journalError, setJournalError] = useState("");

  const [goalForm, setGoalForm] = useState({
    title: "",
    description: "",
    goalType: "CUSTOM",
    dueDate: "",
    checklist: null
  });
  const [goals, setGoals] = useState([]);
  const [goalsError, setGoalsError] = useState("");
  const [goalsLoading, setGoalsLoading] = useState(false);

  const [milestones, setMilestones] = useState([]);
  const [milestonesError, setMilestonesError] = useState("");
  const [milestonesLoading, setMilestonesLoading] = useState(false);

  const [profileNotice, setProfileNotice] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Deep detail drawer
  const [detailView, setDetailView] = useState({
    open: false,
    type: null,
    item: null
  });

  // Auth forms
  const [authMode, setAuthMode] = useState("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    passwordConfirm: ""
  });
  const [resetForm, setResetForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    newPassword: ""
  });
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Prayers search and library
  const [prayersSearch, setPrayersSearch] = useState("");
  const [prayersSuggestions, setPrayersSuggestions] = useState([]);
  const [prayersResults, setPrayersResults] = useState([]);
  const [prayersList, setPrayersList] = useState([]);
  const [loadingPrayers, setLoadingPrayers] = useState(false);
  const [prayersPage, setPrayersPage] = useState(1);
  const [prayersError, setPrayersError] = useState("");

  // Saints search and library
  const [saintsSearch, setSaintsSearch] = useState("");
  const [saintsSuggestions, setSaintsSuggestions] = useState([]);
  const [saintsResults, setSaintsResults] = useState([]);
  const [saintsList, setSaintsList] = useState([]);
  const [loadingSaints, setLoadingSaints] = useState(false);
  const [saintsPage, setSaintsPage] = useState(1);
  const [saintsError, setSaintsError] = useState("");

  // Our Lady search and library
  const [ourLadySearch, setOurLadySearch] = useState("");
  const [ourLadySuggestions, setOurLadySuggestions] = useState([]);
  const [ourLadyResults, setOurLadyResults] = useState([]);
  const [apparitionsList, setApparitionsList] = useState([]);
  const [loadingApparitions, setLoadingApparitions] = useState(false);
  const [ourLadyPage, setOurLadyPage] = useState(1);
  const [apparitionsError, setApparitionsError] = useState("");

  // Fetch current user and settings
  useEffect(() => {
    let cancelled = false;

    function applyStoredPreferences() {
      if (cancelled) return;
      const storedTheme = window.localStorage.getItem("vf_theme");
      const storedLang = window.localStorage.getItem("vf_language");
      if (storedTheme) {
        setTheme(storedTheme);
      }
      if (storedLang) {
        setLanguage(storedLang);
      }
    }

    async function loadUser() {
      try {
        setLoadingUser(true);
        const res = await fetch("/api/auth/me", {
          credentials: "include"
        });
        if (!res.ok) {
          applyStoredPreferences();
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        if (data.user) {
          setUser(data.user);
          if (data.user.themePreference) {
            setTheme(data.user.themePreference);
          }
          if (data.user.languageOverride) {
            setLanguage(data.user.languageOverride);
            window.localStorage.setItem(
              "vf_language",
              data.user.languageOverride
            );
          }
        } else {
          applyStoredPreferences();
        }
      } catch (err) {
        console.error("Failed to load current user", err);
        applyStoredPreferences();
      } finally {
        if (!cancelled) {
          setLoadingUser(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem("vf_theme", theme);
  }, [theme]);

  useEffect(() => {
    const season = seasonTheme || "normal";
    document.documentElement.setAttribute("data-season", season);
  }, [seasonTheme]);

  useEffect(() => {
    setAvatarUrl(user?.profilePictureUrl || "");
    if (!user) {
      setProfileOverview(null);
      setSavedPrayers([]);
      setJournalEntries([]);
      setGoals([]);
      setMilestones([]);
      setProfileNotice("");
      setProfileError("");
    }
  }, [user]);

  useEffect(() => {
    setDetailView({ open: false, type: null, item: null });
  }, [currentTab]);

  // When language changes, mark language dependent sections as needing reload
  useEffect(() => {
    setHistoryLoaded(false);
    setHistoryItems([]);
    setHistoryPage(1);
    setHistoryError("");

    setSacramentsLoaded(false);
    setSacramentItems([]);
    setSacramentsPage(1);
    setSacramentsError("");

    setGuidesLoaded(false);
    setGuideItems([]);
    setGuidesPage(1);
    setGuidesError("");

    setPrayersList([]);
    setPrayersResults([]);
    setPrayersSuggestions([]);
    setPrayersPage(1);
    setPrayersError("");

    setSaintsList([]);
    setSaintsResults([]);
    setSaintsSuggestions([]);
    setSaintsPage(1);
    setSaintsError("");

    setApparitionsList([]);
    setOurLadyResults([]);
    setOurLadySuggestions([]);
    setOurLadyPage(1);
    setApparitionsError("");
    setHomeError("");

    setDetailView({ open: false, type: null, item: null });
  }, [language]);

  function openDetail(type, item) {
    if (!item) return;
    setAccountMenu(ACCOUNT_STATES.CLOSED);
    setSettingsMenu(SETTINGS_STATES.CLOSED);
    setDetailView({ open: true, type, item });
  }

  function closeDetail() {
    setDetailView({ open: false, type: null, item: null });
  }

  // Fetch home content
  const loadHome = useCallback(
    async (lang) => {
      const fallback = {
        mission: FALLBACK_MISSION,
        about: FALLBACK_ABOUT,
        notices: [],
        collagePhotos: [],
        liturgicalTheme: "normal"
      };
      try {
        setLoadingHome(true);
        setHomeError("");
        const params = new URLSearchParams();
        if (lang) {
          params.set("language", lang);
        }
        const res = await fetch(`/api/home?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Home request failed: ${res.status}`);
        }
        const data = await res.json();
        const safeHome = {
          ...fallback,
          ...(data && typeof data === "object" ? data : {})
        };
        safeHome.mission = data?.mission || FALLBACK_MISSION;
        safeHome.about = data?.about || FALLBACK_ABOUT;
        safeHome.notices = Array.isArray(data?.notices) ? data.notices : [];
        safeHome.collagePhotos = Array.isArray(data?.collagePhotos)
          ? data.collagePhotos
          : [];

        setHomeData(safeHome);

        if (safeHome && safeHome.liturgicalTheme) {
          setSeasonTheme(safeHome.liturgicalTheme);
        }
      } catch (err) {
        console.error("Failed to load home content", err);
        setHomeError(
          "We could not reach the server, so a curated offline home experience is shown."
        );
        setHomeData(fallback);
      } finally {
        setLoadingHome(false);
      }
    },
    []
  );

  useEffect(() => {
    loadHome(language);
  }, [language, loadHome]);

  // Fetch history sections on demand
  const loadHistory = useCallback(
    async (lang) => {
      try {
        setLoadingHistory(true);
        setHistoryError("");
        const params = new URLSearchParams();
        if (lang) {
          params.set("language", lang);
        }
        const res = await fetch(`/api/history?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`History request failed: ${res.status}`);
        }
        const data = await res.json();
        const normalized = sortContentList(
          Array.isArray(data.items) ? data.items : []
        );
        const nextItems = normalized.length ? normalized : FALLBACK_HISTORY;
        if (!normalized.length) {
          setHistoryError(
            "Showing a curated overview while the live history feed reconnects."
          );
        }
        setHistoryItems(nextItems);
        setHistoryLoaded(true);
      } catch (err) {
        console.error("Failed to load history sections", err);
        setHistoryItems(FALLBACK_HISTORY);
        setHistoryError(
          "History is temporarily offline. A concise overview is shown until the server responds."
        );
      } finally {
        setLoadingHistory(false);
      }
    },
    []
  );

  // Fetch sacraments on demand
  const loadSacraments = useCallback(
    async (lang) => {
      try {
        setLoadingSacraments(true);
        setSacramentsError("");
        const params = new URLSearchParams();
        if (lang) {
          params.set("language", lang);
        }
        const res = await fetch(`/api/sacraments?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Sacraments request failed: ${res.status}`);
        }
        const data = await res.json();
        const normalized = sortContentList(
          Array.isArray(data.items) ? data.items : []
        );
        const nextItems = normalized.length ? normalized : FALLBACK_SACRAMENTS;
        if (!normalized.length) {
          setSacramentsError(
            "Using the curated sacrament overview until the live data loads."
          );
        }
        setSacramentItems(nextItems);
        setSacramentsLoaded(true);
      } catch (err) {
        console.error("Failed to load sacraments", err);
        setSacramentItems(FALLBACK_SACRAMENTS);
        setSacramentsError(
          "Sacrament details are shown from the offline library until the connection stabilizes."
        );
      } finally {
        setLoadingSacraments(false);
      }
    },
    []
  );

  // Fetch guides on demand
  const loadGuides = useCallback(
    async (lang) => {
      try {
        setLoadingGuides(true);
        setGuidesError("");
        const params = new URLSearchParams();
        if (lang) {
          params.set("language", lang);
        }
        const res = await fetch(`/api/guides?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Guides request failed: ${res.status}`);
        }
        const data = await res.json();
        const normalized = sortContentList(
          Array.isArray(data.items) ? data.items : []
        );
        const nextItems = normalized.length ? normalized : FALLBACK_GUIDES;
        if (!normalized.length) {
          setGuidesError(
            "Showing starter guides until the full library finishes loading."
          );
        }
        setGuideItems(nextItems);
        setGuidesLoaded(true);
      } catch (err) {
        console.error("Failed to load guides", err);
        setGuideItems(FALLBACK_GUIDES);
        setGuidesError(
          "Guides are offline, so curated quickstarts are displayed temporarily."
        );
      } finally {
        setLoadingGuides(false);
      }
    },
    []
  );

  // Fetch prayers library on demand
  const loadPrayers = useCallback(
    async (lang) => {
      try {
        setLoadingPrayers(true);
        setPrayersError("");
        const params = new URLSearchParams();
        if (lang) {
          params.set("language", lang);
        }
        params.set("take", "100");
        const res = await fetch(`/api/prayers?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Prayers request failed: ${res.status}`);
        }
        const data = await res.json();
        const normalized = sortContentList(
          Array.isArray(data.items) ? data.items : []
        );
        const nextItems = normalized.length ? normalized : FALLBACK_PRAYERS;
        if (!normalized.length) {
          setPrayersError(
            "Prayers are shown from the built-in library while the live catalog loads."
          );
        }
        setPrayersList(nextItems);
      } catch (err) {
        console.error("Failed to load prayers library", err);
        setPrayersList(FALLBACK_PRAYERS);
        setPrayersError(
          "Prayers are offline. A core set is available until the connection is restored."
        );
      } finally {
        setLoadingPrayers(false);
      }
    },
    []
  );

  // Fetch saints library on demand
  const loadSaints = useCallback(
    async (lang) => {
      try {
        setLoadingSaints(true);
        setSaintsError("");
        const params = new URLSearchParams();
        if (lang) {
          params.set("language", lang);
        }
        params.set("take", "100");
        const res = await fetch(`/api/saints?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Saints request failed: ${res.status}`);
        }
        const data = await res.json();
        const normalized = sortContentList(
          Array.isArray(data.items) ? data.items : []
        );
        const nextItems = normalized.length ? normalized : FALLBACK_SAINTS;
        if (!normalized.length) {
          setSaintsError(
            "Showing a featured set of saints while the full library connects."
          );
        }
        setSaintsList(nextItems);
      } catch (err) {
        console.error("Failed to load saints library", err);
        setSaintsList(FALLBACK_SAINTS);
        setSaintsError(
          "Saints are temporarily unavailable; a small featured set is displayed for now."
        );
      } finally {
        setLoadingSaints(false);
      }
    },
    []
  );

  // Fetch Marian apparitions library on demand
  const loadApparitions = useCallback(
    async (lang) => {
      try {
        setLoadingApparitions(true);
        setApparitionsError("");
        const params = new URLSearchParams();
        if (lang) {
          params.set("language", lang);
        }
        params.set("take", "100");
        const res = await fetch(
          `/api/saints/apparitions?${params.toString()}`
        );
        if (!res.ok) {
          throw new Error(`Apparitions request failed: ${res.status}`);
        }
        const data = await res.json();
        const normalized = sortContentList(
          Array.isArray(data.items) ? data.items : []
        );
        const nextItems = normalized.length
          ? normalized
          : FALLBACK_APPARITIONS;
        if (!normalized.length) {
          setApparitionsError(
            "Displaying trusted Marian apparitions while reconnecting to the full archive."
          );
        }
        setApparitionsList(nextItems);
      } catch (err) {
        console.error("Failed to load Marian apparitions library", err);
        setApparitionsList(FALLBACK_APPARITIONS);
        setApparitionsError(
          "Our Lady section is offline. Core apparitions are shown until the service responds."
        );
      } finally {
        setLoadingApparitions(false);
      }
    },
    []
  );

  // Trigger language dependent loads when tab is opened for the first time
  useEffect(() => {
    if (currentTab === "history" && !historyLoaded && !loadingHistory) {
      loadHistory(language);
    }
    if (currentTab === "sacraments" && !sacramentsLoaded && !loadingSacraments) {
      loadSacraments(language);
    }
    if (currentTab === "guides" && !guidesLoaded && !loadingGuides) {
      loadGuides(language);
    }
    if (currentTab === "prayers" && !loadingPrayers && prayersList.length === 0) {
      loadPrayers(language);
    }
    if (currentTab === "saints" && !loadingSaints && saintsList.length === 0) {
      loadSaints(language);
    }
    if (
      currentTab === "ourlady" &&
      !loadingApparitions &&
      apparitionsList.length === 0
    ) {
      loadApparitions(language);
    }
  }, [
    currentTab,
    language,
    historyLoaded,
    sacramentsLoaded,
    guidesLoaded,
    loadingHistory,
    loadingSacraments,
    loadingGuides,
    loadingPrayers,
    loadingSaints,
    loadingApparitions,
    prayersList,
    saintsList,
    apparitionsList,
    loadHistory,
    loadSacraments,
    loadGuides,
    loadPrayers,
    loadSaints,
    loadApparitions
  ]);

  useEffect(() => {
    if (currentTab === "profile" && user) {
      loadProfileOverview();
      loadSavedPrayers();
      loadJournalEntries(journalView);
      loadGoals();
      loadMilestones();
    }
  }, [currentTab, user, journalView]);

  // Account actions
  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      setUser(null);
      setAccountMenu(ACCOUNT_STATES.CLOSED);
      setProfileOverview(null);
      setProfileLoading(false);
      setProfileError("");
      setProfileNotice("");
      setAvatarUrl("");
      setSavedPrayers([]);
      setLoadingSavedPrayers(false);
      setSavedPrayersError("");
      setJournalEntries([]);
      setJournalView("active");
      setJournalForm({ title: "", body: "", isFavorite: false });
      setJournalSubmitting(false);
      setJournalError("");
      setGoalForm({
        title: "",
        description: "",
        goalType: "CUSTOM",
        dueDate: "",
        checklist: null
      });
      setGoals([]);
      setGoalsError("");
      setGoalsLoading(false);
      setMilestones([]);
      setMilestonesError("");
      setMilestonesLoading(false);
      setCurrentTab("home");
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  function handleThemeChange(nextTheme) {
    setTheme(nextTheme);
    if (user) {
      fetch("/api/profile/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ themePreference: nextTheme })
      }).catch((err) => {
        console.error("Failed to save theme preference", err);
      });
    }
  }

  function handleLanguageChange(nextLang) {
    setLanguage(nextLang);
    window.localStorage.setItem("vf_language", nextLang);
    if (user) {
      fetch("/api/profile/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ languageOverride: nextLang })
      }).catch((err) => {
        console.error("Failed to save language preference", err);
      });
    }
  }

  // Auth actions
  function resetAuthState() {
    setAuthError("");
    setAuthSuccess("");
    setAuthSubmitting(false);
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    resetAuthState();
    setAuthSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Login failed");
      }
      setUser(data.user || null);
      setCurrentTab("profile");
      setAccountMenu(ACCOUNT_STATES.CLOSED);
      setAuthSuccess("Welcome back. You are now signed in.");
    } catch (err) {
      setAuthError(err.message || "Login failed");
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    resetAuthState();
    setAuthSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(registerForm)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Registration failed");
      }
      setUser(data.user || null);
      setCurrentTab("profile");
      setAuthSuccess("Account created. You are now signed in.");
    } catch (err) {
      setAuthError(err.message || "Registration failed");
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleResetSubmit(event) {
    event.preventDefault();
    resetAuthState();
    setAuthSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...resetForm,
          newPassword: resetForm.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Password reset failed");
      }
      setAuthSuccess("Password reset. You can log in with the new password.");
      setAuthMode("login");
    } catch (err) {
      setAuthError(err.message || "Password reset failed");
    } finally {
      setAuthSubmitting(false);
    }
  }

  // Logged-in features
  function requireAuth() {
    if (!user) {
      setCurrentTab("auth");
      setAuthMode("login");
      setAuthError("Please log in to use this feature.");
      return false;
    }
    return true;
  }

  async function loadProfileOverview() {
    if (!user) return;
    try {
      setProfileLoading(true);
      setProfileError("");
      const res = await fetch("/api/profile", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load profile");
      }
      setProfileOverview(data.overview || null);
    } catch (err) {
      setProfileError(err.message || "Profile load failed");
    } finally {
      setProfileLoading(false);
    }
  }

  async function loadSavedPrayers() {
    if (!user) return;
    try {
      setLoadingSavedPrayers(true);
      setSavedPrayersError("");
      const res = await fetch("/api/profile/my-prayers", {
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load saved prayers");
      }
      setSavedPrayers(data.items || []);
    } catch (err) {
      setSavedPrayersError(err.message || "Unable to load saved prayers");
    } finally {
      setLoadingSavedPrayers(false);
    }
  }

  async function removeSavedPrayer(prayerId) {
    if (!requireAuth()) return;
    try {
      const res = await fetch(`/api/profile/my-prayers/${prayerId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to remove saved prayer");
      }
      setSavedPrayers((prev) => prev.filter((p) => p.prayerId !== prayerId));
      setProfileNotice("Removed from My Prayers.");
      loadProfileOverview();
    } catch (err) {
      setSavedPrayersError(err.message || "Unable to remove saved prayer");
    }
  }

  async function loadJournalEntries(view = journalView) {
    if (!user) return;
    try {
      setJournalError("");
      const res = await fetch(`/api/profile/journal?view=${view}`, {
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load journal entries");
      }
      setJournalEntries(data.items || []);
    } catch (err) {
      setJournalError(err.message || "Unable to load journal");
    }
  }

  async function submitJournal(event) {
    event.preventDefault();
    if (!requireAuth()) return;
    setJournalSubmitting(true);
    setJournalError("");
    try {
      const res = await fetch("/api/profile/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(journalForm)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save journal entry");
      }
      setJournalForm({ title: "", body: "", isFavorite: false });
      setProfileNotice("Journal entry added.");
      loadJournalEntries(journalView);
      loadProfileOverview();
    } catch (err) {
      setJournalError(err.message || "Unable to save journal entry");
    } finally {
      setJournalSubmitting(false);
    }
  }

  async function updateJournalEntry(id, payload) {
    if (!requireAuth()) return;
    try {
      const res = await fetch(`/api/profile/journal/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update journal entry");
      }
      setJournalEntries((prev) =>
        prev.map((entry) => (entry.id === id ? data.entry : entry))
      );
      setProfileNotice("Journal updated.");
      loadProfileOverview();
    } catch (err) {
      setJournalError(err.message || "Unable to update journal entry");
    }
  }

  async function deleteJournalEntry(id) {
    if (!requireAuth()) return;
    try {
      const res = await fetch(`/api/profile/journal/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to delete journal entry");
      }
      setJournalEntries((prev) => prev.filter((entry) => entry.id !== id));
      setProfileNotice("Journal entry deleted.");
      loadProfileOverview();
    } catch (err) {
      setJournalError(err.message || "Unable to delete journal entry");
    }
  }

  async function loadGoals() {
    if (!user) return;
    try {
      setGoalsLoading(true);
      setGoalsError("");
      const res = await fetch("/api/profile/goals", {
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load goals");
      }
      setGoals(data.items || []);
    } catch (err) {
      setGoalsError(err.message || "Unable to load goals");
    } finally {
      setGoalsLoading(false);
    }
  }

  async function submitGoal(event) {
    event.preventDefault();
    if (!requireAuth()) return;
    setGoalsError("");
    try {
      const res = await fetch("/api/profile/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(goalForm)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to create goal");
      }
      setGoalForm({ title: "", description: "", goalType: "CUSTOM", dueDate: "", checklist: null });
      setProfileNotice("Goal added.");
      loadGoals();
      loadMilestones();
      loadProfileOverview();
    } catch (err) {
      setGoalsError(err.message || "Unable to create goal");
    }
  }

  async function updateGoal(id, payload) {
    if (!requireAuth()) return;
    try {
      const res = await fetch(`/api/profile/goals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update goal");
      }
      setGoals((prev) => prev.map((g) => (g.id === id ? data.goal : g)));
      setProfileNotice("Goal updated.");
      loadMilestones();
      loadProfileOverview();
    } catch (err) {
      setGoalsError(err.message || "Unable to update goal");
    }
  }

  async function deleteGoal(id) {
    if (!requireAuth()) return;
    try {
      const res = await fetch(`/api/profile/goals/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to delete goal");
      }
      setGoals((prev) => prev.filter((g) => g.id !== id));
      setProfileNotice("Goal removed.");
      loadMilestones();
      loadProfileOverview();
    } catch (err) {
      setGoalsError(err.message || "Unable to delete goal");
    }
  }

  async function loadMilestones() {
    if (!user) return;
    try {
      setMilestonesLoading(true);
      setMilestonesError("");
      const res = await fetch("/api/profile/milestones", {
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load milestones");
      }
      setMilestones(data.items || []);
    } catch (err) {
      setMilestonesError(err.message || "Unable to load milestones");
    } finally {
      setMilestonesLoading(false);
    }
  }

  async function saveAvatar(event) {
    event.preventDefault();
    if (!requireAuth()) return;
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profilePictureUrl: avatarUrl })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update profile picture");
      }
      if (data.user) {
        setUser(data.user);
      }
      setProfileNotice("Profile picture updated.");
    } catch (err) {
      setProfileError(err.message || "Unable to update profile picture");
    }
  }

    async function savePrayer(prayerId) {
      if (!requireAuth()) return;
      try {
        const res = await fetch(`/api/prayers/${prayerId}/save`, {
          method: "POST",
          credentials: "include"
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to save prayer");
        }
        setProfileNotice("Prayer added to your library.");
        loadSavedPrayers();
        loadProfileOverview();
      } catch (err) {
        setPrayersError(err.message || "Unable to save prayer");
      }
    }

    async function saveSaint(saintId) {
      if (!requireAuth()) return;
      try {
        const res = await fetch(`/api/saints/${saintId}/save`, {
          method: "POST",
          credentials: "include"
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to save saint");
        }
        setSaintsError(null);
        setProfileNotice("Saint saved to your account.");
        loadProfileOverview();
      } catch (err) {
        setSaintsError(err.message || "Unable to save saint");
      }
    }

    async function saveApparition(apparitionId) {
      if (!requireAuth()) return;
      try {
        const res = await fetch(`/api/saints/apparitions/${apparitionId}/save`, {
          method: "POST",
          credentials: "include"
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to save apparition");
        }
        setApparitionsError(null);
        setProfileNotice("Apparition saved to your account.");
        loadProfileOverview();
      } catch (err) {
        setApparitionsError(err.message || "Unable to save apparition");
      }
    }

  // Local search in Prayers
  useEffect(() => {
    let cancelled = false;

    async function runSearch() {
      const q = prayersSearch.trim();
      if (!q) {
        setPrayersSuggestions([]);
        setPrayersResults([]);
        setPrayersPage(1);
        return;
      }

      try {
        const params = new URLSearchParams();
        params.set("q", q);
        params.set("mode", "suggest");
        params.set("language", language);

        const res = await fetch(
          `/api/prayers/search/local?${params.toString()}`
        );
        const data = await res.json();
        if (cancelled) return;

        setPrayersSuggestions(
          Array.isArray(data.suggestions) ? data.suggestions : []
        );
      } catch (err) {
        console.error("Prayers suggest search failed", err);
      }
    }

    const id = setTimeout(runSearch, 200);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [prayersSearch, language]);

  async function submitPrayersSearch(e) {
    if (e) e.preventDefault();
    const q = prayersSearch.trim();
    if (!q) return;

    try {
      const params = new URLSearchParams();
      params.set("q", q);
      params.set("mode", "full");
      params.set("language", language);

      const res = await fetch(
        `/api/prayers/search/local?${params.toString()}`
      );
      const data = await res.json();
      setPrayersResults(Array.isArray(data.results) ? data.results : []);
      setPrayersPage(1);
    } catch (err) {
      console.error("Prayers full search failed", err);
    }
  }

  function handlePrayersSuggestionClick(suggestion) {
    setPrayersSearch(suggestion.title || "");
    setPrayersSuggestions([]);
    setPrayersPage(1);
    submitPrayersSearch();
  }

  // Local search in Saints
  useEffect(() => {
    let cancelled = false;

    async function runSearch() {
      const q = saintsSearch.trim();
      if (!q) {
        setSaintsSuggestions([]);
        setSaintsResults([]);
        setSaintsPage(1);
        return;
      }

      try {
        const params = new URLSearchParams();
        params.set("q", q);
        params.set("mode", "suggest");
        params.set("type", "saint");
        params.set("language", language);

        const res = await fetch(
          `/api/saints/search/local?${params.toString()}`
        );
        const data = await res.json();
        if (cancelled) return;

        setSaintsSuggestions(
          Array.isArray(data.suggestions) ? data.suggestions : []
        );
      } catch (err) {
        console.error("Saints suggest search failed", err);
      }
    }

    const id = setTimeout(runSearch, 200);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [saintsSearch, language]);

  async function submitSaintsSearch(e) {
    if (e) e.preventDefault();
    const q = saintsSearch.trim();
    if (!q) return;

    try {
      const params = new URLSearchParams();
      params.set("q", q);
      params.set("mode", "full");
      params.set("type", "saint");
      params.set("language", language);

      const res = await fetch(
        `/api/saints/search/local?${params.toString()}`
      );
      const data = await res.json();
      const results =
        Array.isArray(data.resultsSaints) && data.resultsSaints.length
          ? data.resultsSaints
          : Array.isArray(data.results)
          ? data.results
          : [];
      setSaintsResults(results);
      setSaintsPage(1);
    } catch (err) {
      console.error("Saints full search failed", err);
    }
  }

  function handleSaintsSuggestionClick(suggestion) {
    setSaintsSearch(suggestion.title || suggestion.name || "");
    setSaintsSuggestions([]);
    setSaintsPage(1);
    submitSaintsSearch();
  }

  // Local search in Our Lady
  useEffect(() => {
    let cancelled = false;

    async function runSearch() {
      const q = ourLadySearch.trim();
      if (!q) {
        setOurLadySuggestions([]);
        setOurLadyResults([]);
        setOurLadyPage(1);
        return;
      }

      try {
        const params = new URLSearchParams();
        params.set("q", q);
        params.set("mode", "suggest");
        params.set("type", "apparition");
        params.set("language", language);

        const res = await fetch(
          `/api/saints/search/local?${params.toString()}`
        );
        const data = await res.json();
        if (cancelled) return;

        setOurLadySuggestions(
          Array.isArray(data.suggestions) ? data.suggestions : []
        );
      } catch (err) {
        console.error("Our Lady suggest search failed", err);
      }
    }

    const id = setTimeout(runSearch, 200);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [ourLadySearch, language]);

  async function submitOurLadySearch(e) {
    if (e) e.preventDefault();
    const q = ourLadySearch.trim();
    if (!q) return;

    try {
      const params = new URLSearchParams();
      params.set("q", q);
      params.set("mode", "full");
      params.set("type", "apparition");
      params.set("language", language);

      const res = await fetch(
        `/api/saints/search/local?${params.toString()}`
      );
      const data = await res.json();
      const results =
        Array.isArray(data.resultsApparitions) &&
        data.resultsApparitions.length
          ? data.resultsApparitions
          : Array.isArray(data.results)
          ? data.results
          : [];
      setOurLadyResults(results);
      setOurLadyPage(1);
    } catch (err) {
      console.error("Our Lady full search failed", err);
    }
  }

  function handleOurLadySuggestionClick(suggestion) {
    setOurLadySearch(suggestion.title || suggestion.name || "");
    setOurLadySuggestions([]);
    setOurLadyPage(1);
    submitOurLadySearch();
  }

  // Header layout and menus
  function renderHeader() {
    const currentSeason = seasonTheme || "normal";
    const logoClass =
      currentSeason === "advent"
        ? "vf-logo-holy-family"
        : currentSeason === "easter"
        ? "vf-logo-crucifix"
        : "vf-logo-cross";

    return React.createElement(
      "header",
      { className: "vf-header" },
      React.createElement(
        "div",
        { className: "vf-header-inner" },
        React.createElement(
          "div",
          {
            className:
              "vf-header-banner vf-header-banner-" + currentSeason,
            "aria-hidden": "true"
          },
          React.createElement("div", { className: "vf-banner-mark" })
        ),
        React.createElement(
          "div",
          { className: "vf-header-title-block" },
          React.createElement(
            "div",
            { className: "vf-title-row" },
            React.createElement("span", {
              className: logoClass,
              "aria-hidden": "true"
            }),
            React.createElement(
              "h1",
              { className: "vf-site-title" },
              "Via Fidei"
            )
          ),
          React.createElement(
            "p",
            { className: "vf-site-subtitle" },
            "Catholic prayers, saints, sacraments, and guides for spiritual growth"
          )
        ),
        React.createElement(
          "nav",
          { className: "vf-nav", "aria-label": "Primary" },
          React.createElement(
            "ul",
            { className: "vf-nav-list" },
            TABS.map((tab) =>
              React.createElement(
                "li",
                { key: tab.id, className: "vf-nav-item" },
                React.createElement(
                  "button",
                  {
                    type: "button",
                    className:
                      "vf-nav-tab" +
                      (currentTab === tab.id
                        ? " vf-nav-tab-active"
                        : ""),
                    onClick: () => setCurrentTab(tab.id)
                  },
                  tab.label
                )
              )
            )
          ),
          React.createElement(
            "div",
            { className: "vf-nav-right" },
            React.createElement(
              "div",
              { className: "vf-icon-group" },
              // Account
              React.createElement(
                "div",
                { className: "vf-icon-wrapper" },
                React.createElement(
                  "button",
                  {
                    type: "button",
                    className: "vf-account-button",
                    "aria-haspopup": "menu",
                    "aria-expanded":
                      accountMenu === ACCOUNT_STATES.OPEN,
                    onClick: () =>
                      setAccountMenu(
                        accountMenu === ACCOUNT_STATES.OPEN
                          ? ACCOUNT_STATES.CLOSED
                          : ACCOUNT_STATES.OPEN
                      )
                  },
                  React.createElement(
                    "span",
                    { className: "vf-account-label" },
                    "Account"
                  )
                ),
                accountMenu === ACCOUNT_STATES.OPEN
                  ? React.createElement(
                      "div",
                      { className: "vf-menu", role: "menu" },
                      user
                        ? React.createElement(
                            React.Fragment,
                            null,
                            React.createElement(
                              "button",
                              {
                                type: "button",
                                className: "vf-menu-item",
                                role: "menuitem",
                                onClick: () => {
                                  setCurrentTab("profile");
                                  setAccountMenu(ACCOUNT_STATES.CLOSED);
                                }
                              },
                              "Profile"
                            ),
                            React.createElement(
                              "button",
                              {
                                type: "button",
                                className: "vf-menu-item",
                                role: "menuitem",
                                onClick: () => {
                                  setSettingsMenu(SETTINGS_STATES.OPEN);
                                  setAccountMenu(ACCOUNT_STATES.CLOSED);
                                }
                              },
                              "Settings"
                            ),
                            React.createElement(
                              "button",
                              {
                                type: "button",
                                className:
                                  "vf-menu-item vf-menu-item-danger",
                                role: "menuitem",
                                onClick: handleLogout
                              },
                              "Logout"
                            )
                          )
                        : React.createElement(
                            "button",
                            {
                              type: "button",
                              className: "vf-menu-item",
                              role: "menuitem",
                              onClick: () => {
                                setCurrentTab("auth");
                                setAccountMenu(ACCOUNT_STATES.CLOSED);
                              }
                            },
                            "Login"
                          )
                    )
                  : null
              ),
              // Settings
              React.createElement(
                "div",
                { className: "vf-icon-wrapper" },
                React.createElement(
                  "button",
                  {
                    type: "button",
                    className: "vf-icon-button",
                    "aria-haspopup": "menu",
                    "aria-expanded":
                      settingsMenu === SETTINGS_STATES.OPEN,
                    "aria-label": "Settings",
                    onClick: () =>
                      setSettingsMenu(
                        settingsMenu === SETTINGS_STATES.OPEN
                          ? SETTINGS_STATES.CLOSED
                          : SETTINGS_STATES.OPEN
                      )
                  },
                  React.createElement("span", {
                    className: "vf-icon-gear",
                    "aria-hidden": "true"
                  })
                ),
                settingsMenu === SETTINGS_STATES.OPEN
                  ? React.createElement(
                      "div",
                      { className: "vf-menu", role: "menu" },
                      React.createElement(
                        "div",
                        { className: "vf-menu-group-label" },
                        "Theme"
                      ),
                      React.createElement(
                        "button",
                        {
                          type: "button",
                          className:
                            "vf-menu-item" +
                            (theme === "light"
                              ? " vf-menu-item-active"
                              : ""),
                          role: "menuitem",
                          onClick: () => handleThemeChange("light")
                        },
                        "Light"
                      ),
                      React.createElement(
                        "button",
                        {
                          type: "button",
                          className:
                            "vf-menu-item" +
                            (theme === "dark"
                              ? " vf-menu-item-active"
                              : ""),
                          role: "menuitem",
                          onClick: () => handleThemeChange("dark")
                        },
                        "Dark"
                      ),
                      React.createElement(
                        "button",
                        {
                          type: "button",
                          className:
                            "vf-menu-item" +
                            (theme === "system"
                              ? " vf-menu-item-active"
                              : ""),
                          role: "menuitem",
                          onClick: () => handleThemeChange("system")
                        },
                        "System"
                      ),
                      React.createElement("div", {
                        className: "vf-menu-divider"
                      }),
                      React.createElement(
                        "div",
                        { className: "vf-menu-group-label" },
                        "Language"
                      ),
                      React.createElement(
                        "div",
                        { className: "vf-menu-inline-field" },
                        React.createElement(
                          "select",
                          {
                            value: language,
                            onChange: (e) =>
                              handleLanguageChange(e.target.value),
                            className: "vf-lang-select"
                          },
                          SUPPORTED_LANGS.map((lang) =>
                            React.createElement(
                              "option",
                              {
                                key: lang.code,
                                value: lang.code
                              },
                              lang.label
                            )
                          )
                        )
                      )
                    )
                  : null
              )
            )
          )
        )
      )
    );
  }

  function renderHome() {
    if (loadingHome) {
      return React.createElement(
        "main",
        { className: "vf-main" },
        React.createElement(
          "section",
          { className: "vf-section" },
          React.createElement(
            "article",
            { className: "vf-card" },
            React.createElement(
              "div",
              { className: "vf-card-body" },
              React.createElement("p", null, "Loading home content…")
            )
          )
        )
      );
    }

    const missionFromApi = homeData?.mission;
    const aboutFromApi = homeData?.about;
    const notices = homeData?.notices || [];
    const collagePhotos = homeData?.collagePhotos || [];

    const mission = missionFromApi || FALLBACK_MISSION;
    const about = aboutFromApi || FALLBACK_ABOUT;

    return React.createElement(
      "main",
      { className: "vf-main" },
      React.createElement(
        "section",
        { className: "vf-section" },
        homeError
          ? React.createElement(
              "div",
              { className: "vf-inline-alert" },
              homeError
            )
          : null,
        notices.length > 0
          ? React.createElement(
              "div",
              { className: "vf-notices" },
              notices.map((n) =>
                React.createElement(
                  "article",
                  { key: n.id, className: "vf-notice-card" },
                  React.createElement(
                    "h2",
                    { className: "vf-notice-title" },
                    n.title
                  ),
                  React.createElement(
                    "p",
                    { className: "vf-notice-body" },
                    n.body
                  )
                )
              )
            )
          : null,
        React.createElement(
          "article",
          { className: "vf-card vf-card-hero" },
          React.createElement(
            "header",
            { className: "vf-card-header" },
            React.createElement(
              "h2",
              { className: "vf-card-title" },
              mission.heading
            ),
            mission.subheading
              ? React.createElement(
                  "p",
                  { className: "vf-card-subtitle" },
                  mission.subheading
                )
              : null
          ),
          Array.isArray(mission.body)
            ? React.createElement(
                "div",
                { className: "vf-card-body" },
                mission.body.map((p, idx) =>
                  React.createElement("p", { key: idx }, p)
                )
              )
            : null
        ),
        React.createElement(
          "article",
          { className: "vf-card" },
          React.createElement(
            "header",
            { className: "vf-card-header" },
            React.createElement(
              "h3",
              { className: "vf-card-title" },
              "About Via Fidei"
            )
          ),
          React.createElement(
            "div",
            { className: "vf-card-body" },
            Array.isArray(about.paragraphs)
              ? about.paragraphs.map((p, idx) =>
                  React.createElement("p", { key: idx }, p)
                )
              : null,
            Array.isArray(about.quickLinks)
              ? React.createElement(
                  "div",
                  { className: "vf-quick-links" },
                  about.quickLinks.map((link) =>
                    React.createElement(
                      "button",
                      {
                        key: link.target,
                        type: "button",
                        className: "vf-chip-link",
                        onClick: () => {
                          if (link.target === "sacraments") {
                            setCurrentTab("sacraments");
                          } else if (
                            link.target &&
                            link.target.indexOf("guides") === 0
                          ) {
                            setCurrentTab("guides");
                          }
                        }
                      },
                      link.label
                    )
                  )
                )
              : null
          )
        ),
        collagePhotos.length > 0
          ? React.createElement(
              "section",
              { className: "vf-collage-section" },
              React.createElement(
                "div",
                { className: "vf-collage-grid" },
                collagePhotos.slice(0, 6).map((photo) =>
                  React.createElement(
                    "figure",
                    {
                      key: photo.id || photo.url,
                      className: "vf-collage-item"
                    },
                    React.createElement("img", {
                      src: photo.url,
                      alt: photo.alt || "Via Fidei photo"
                    })
                  )
                )
              )
            )
          : null
      )
    );
  }

  function renderHistory() {
    const totalPages = Math.max(
      1,
      Math.ceil(historyItems.length / PAGE_SIZE)
    );
    const safePage = Math.min(historyPage, totalPages);
    const startIndex = (safePage - 1) * PAGE_SIZE;
    const pagedItems = historyItems.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );

    return React.createElement(
      "main",
      { className: "vf-main" },
      React.createElement(
        "section",
        { className: "vf-section" },
        React.createElement(
          "article",
          { className: "vf-card" },
          React.createElement(
            "header",
            { className: "vf-card-header" },
            React.createElement(
              "h2",
              { className: "vf-card-title" },
              "Liturgy and History"
            ),
            React.createElement(
              "p",
              { className: "vf-card-subtitle" },
              "Apostolic Age, Early Church, Councils, Middle Ages, Reformation, modern era, the councils of the last century, and the contemporary life of the Church."
            )
          ),
          React.createElement(
            "div",
            { className: "vf-card-body" },
            historyError
              ? React.createElement(
                  "p",
                  { className: "vf-inline-alert" },
                  historyError
                )
              : null,
            loadingHistory && historyItems.length === 0
              ? React.createElement(
                  "p",
                  null,
                  "Loading history overview…"
                )
              : null,
            !loadingHistory && historyItems.length === 0
              ? React.createElement(
                  "p",
                  null,
                  "No history sections are available yet in this language."
                )
              : null,
            pagedItems.length > 0
              ? React.createElement(
                  "div",
                  { className: "vf-stack" },
                  pagedItems.map((section) =>
                    React.createElement(
                      "section",
                      {
                        key: section.id,
                        className: "vf-history-section"
                      },
                      React.createElement(
                        "h3",
                        { className: "vf-section-subtitle" },
                        section.title
                      ),
                      section.summary
                        ? React.createElement(
                            "p",
                            { className: "vf-history-summary" },
                            section.summary
                          )
                        : null,
                      section.body
                        ? React.createElement(
                            "p",
                            { className: "vf-history-body" },
                            section.body
                          )
                        : null,
                      React.createElement(
                        "div",
                        { className: "vf-card-actions" },
                        React.createElement(
                          "button",
                          {
                            type: "button",
                            className: "vf-btn vf-btn-ghost",
                            onClick: () => openDetail("History", section)
                          },
                          "Open details"
                        )
                      )
                    )
                  )
                )
              : null,
            renderPagination(
              safePage,
              totalPages,
              setHistoryPage,
              "history"
            )
          )
        )
      )
    );
  }

  function renderPrayers() {
    const activePrayers =
      prayersResults.length > 0 ? prayersResults : prayersList;

    const totalPages = Math.max(
      1,
      Math.ceil(activePrayers.length / PAGE_SIZE)
    );
    const safePage = Math.min(prayersPage, totalPages);
    const startIndex = (safePage - 1) * PAGE_SIZE;
    const pagedPrayers = activePrayers.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );
    const showingSearchResults = prayersResults.length > 0;

    return React.createElement(
      "main",
      { className: "vf-main" },
      React.createElement(
        "section",
        { className: "vf-section" },
        React.createElement(
          "article",
          { className: "vf-card" },
          React.createElement(
            "header",
            { className: "vf-card-header" },
            React.createElement(
              "h2",
              { className: "vf-card-title" },
              "Prayers"
            ),
            React.createElement(
              "p",
              { className: "vf-card-subtitle" },
              "A curated library of approved Catholic prayers in many languages."
            )
          ),
          React.createElement(
            "form",
            {
              className: "vf-search-bar",
              onSubmit: submitPrayersSearch
            },
            React.createElement(
              "label",
              { className: "vf-field-label", htmlFor: "prayers-search" },
              "Search prayers"
            ),
            React.createElement(
              "div",
              { className: "vf-search-input-wrap" },
              React.createElement("input", {
                id: "prayers-search",
                type: "search",
                placeholder: "Search prayers by title or text",
                value: prayersSearch,
                onChange: (e) => setPrayersSearch(e.target.value)
              }),
              React.createElement(
                "button",
                { type: "submit", className: "vf-btn vf-btn-blue" },
                "Search"
              )
            ),
            prayersSuggestions.length > 0
              ? React.createElement(
                  "ul",
                  { className: "vf-search-suggestions" },
                  prayersSuggestions.slice(0, 3).map((p) =>
                    React.createElement(
                      "li",
                      {
                        key: p.id,
                        className: "vf-search-suggestion",
                        onClick: () =>
                          handlePrayersSuggestionClick(p)
                      },
                      React.createElement(
                        "span",
                        { className: "vf-search-suggestion-title" },
                        p.title
                      ),
                      p.category
                        ? React.createElement(
                            "span",
                            { className: "vf-search-suggestion-meta" },
                            p.category
                          )
                        : null
                    )
                  )
                )
              : null
          ),
          React.createElement(
            "div",
            { className: "vf-card-body" },
            prayersError
              ? React.createElement(
                  "p",
                  { className: "vf-inline-alert" },
                  prayersError
                )
              : null,
            loadingPrayers && activePrayers.length === 0
              ? React.createElement(
                  "p",
                  null,
                  "Loading prayers…"
                )
              : null,
            !loadingPrayers && activePrayers.length === 0
              ? React.createElement(
                  "p",
                  null,
                  "No prayers are available yet in this language."
                )
              : null,
            pagedPrayers.length > 0
              ? React.createElement(
                  React.Fragment,
                  null,
                  showingSearchResults
                    ? React.createElement(
                        "p",
                        { className: "vf-search-results-label" },
                        "Showing ",
                        pagedPrayers.length,
                        " of ",
                        activePrayers.length,
                        " matching prayers"
                      )
                    : null,
                  React.createElement(
                    "div",
                    { className: "vf-stack" },
                    pagedPrayers.map((p) =>
                      React.createElement(
                        "article",
                        {
                          key: p.id,
                          className: "vf-prayer-item"
                        },
                        React.createElement(
                          "h3",
                          { className: "vf-prayer-title" },
                          p.title
                        ),
                        p.category
                          ? React.createElement(
                              "p",
                              { className: "vf-prayer-category" },
                              p.category
                            )
                          : null,
                        React.createElement(
                          "p",
                          { className: "vf-prayer-body" },
                          p.content
                        ),
                        React.createElement(
                          "div",
                          { className: "vf-item-actions" },
                          React.createElement(
                            "button",
                            {
                              type: "button",
                              className: "vf-btn vf-btn-ghost",
                              onClick: () => openDetail("Prayer", p)
                            },
                            "Open details"
                          )
                        ),
                        user
                          ? React.createElement(
                              "div",
                              { className: "vf-item-actions" },
                              React.createElement(
                                "button",
                                {
                                  type: "button",
                                  className: "vf-btn vf-btn-ghost",
                                  onClick: () => savePrayer(p.id)
                                },
                                "Save to profile"
                              )
                            )
                          : null
                      )
                    )
                  )
                )
              : null,
            renderPagination(
              safePage,
              totalPages,
              setPrayersPage,
              "prayers"
            )
          )
        )
      )
    );
  }

  function renderSaints() {
    const activeSaints =
      saintsResults.length > 0 ? saintsResults : saintsList;

    const totalPages = Math.max(
      1,
      Math.ceil(activeSaints.length / PAGE_SIZE)
    );
    const safePage = Math.min(saintsPage, totalPages);
    const startIndex = (safePage - 1) * PAGE_SIZE;
    const pagedSaints = activeSaints.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );
    const showingSearchResults = saintsResults.length > 0;

    return React.createElement(
      "main",
      { className: "vf-main" },
      React.createElement(
        "section",
        { className: "vf-section" },
        React.createElement(
          "article",
          { className: "vf-card" },
          React.createElement(
            "header",
            { className: "vf-card-header" },
            React.createElement(
              "h2",
              { className: "vf-card-title" },
              "Saints"
            ),
            React.createElement(
              "p",
              { className: "vf-card-subtitle" },
              "Lives of the saints with print friendly About pages, patronages, and prayers."
            )
          ),
          React.createElement(
            "form",
            {
              className: "vf-search-bar",
              onSubmit: submitSaintsSearch
            },
            React.createElement(
              "label",
              { className: "vf-field-label", htmlFor: "saints-search" },
              "Search saints"
            ),
            React.createElement(
              "div",
              { className: "vf-search-input-wrap" },
              React.createElement("input", {
                id: "saints-search",
                type: "search",
                placeholder: "Search by name or patronage",
                value: saintsSearch,
                onChange: (e) => setSaintsSearch(e.target.value)
              }),
              React.createElement(
                "button",
                { type: "submit", className: "vf-btn vf-btn-blue" },
                "Search"
              )
            ),
            saintsSuggestions.length > 0
              ? React.createElement(
                  "ul",
                  { className: "vf-search-suggestions" },
                  saintsSuggestions.slice(0, 3).map((s) =>
                    React.createElement(
                      "li",
                      {
                        key: s.id || s.slug || s.title,
                        className: "vf-search-suggestion",
                        onClick: () =>
                          handleSaintsSuggestionClick(s)
                      },
                      React.createElement(
                        "span",
                        { className: "vf-search-suggestion-title" },
                        s.title || s.name
                      )
                    )
                  )
                )
              : null
          ),
          React.createElement(
            "div",
            { className: "vf-card-body" },
            saintsError
              ? React.createElement(
                  "p",
                  { className: "vf-inline-alert" },
                  saintsError
                )
              : null,
            loadingSaints && activeSaints.length === 0
              ? React.createElement("p", null, "Loading saints…")
              : null,
            !loadingSaints && activeSaints.length === 0
              ? React.createElement(
                  "p",
                  null,
                  "No saints are available yet in this language."
                )
              : null,
            pagedSaints.length > 0
              ? React.createElement(
                  React.Fragment,
                  null,
                  showingSearchResults
                    ? React.createElement(
                        "p",
                        { className: "vf-search-results-label" },
                        "Showing ",
                        pagedSaints.length,
                        " of ",
                        activeSaints.length,
                        " matching saints"
                      )
                    : null,
                  React.createElement(
                    "section",
                    { className: "vf-stack" },
                    pagedSaints.map((s) =>
                      React.createElement(
                        "article",
                        {
                          key: s.id,
                          className: "vf-saint-item vf-saint-detail"
                        },
                        React.createElement(
                          "div",
                          { className: "vf-saint-header" },
                          s.imageUrl
                            ? React.createElement(
                                "div",
                                { className: "vf-saint-avatar-wrap" },
                                React.createElement("img", {
                                  src: s.imageUrl,
                                  alt: s.name,
                                  className: "vf-saint-avatar"
                                })
                              )
                            : null,
                          React.createElement(
                            "div",
                            null,
                            React.createElement(
                              "h4",
                              { className: "vf-saint-name" },
                              s.name
                            ),
                            s.feastDay
                              ? React.createElement(
                                  "p",
                                  { className: "vf-saint-meta" },
                                  "Feast day: ",
                                  new Date(
                                    s.feastDay
                                  ).toLocaleDateString()
                                )
                              : null,
                            Array.isArray(s.patronages) &&
                            s.patronages.length > 0
                              ? React.createElement(
                                  "p",
                                  { className: "vf-saint-meta" },
                                  "Patronage: ",
                                  s.patronages.join(", ")
                                )
                              : null
                          )
                        ),
                        s.biography
                          ? React.createElement(
                              "p",
                              { className: "vf-saint-bio" },
                              s.biography
                            )
                          : null,
                        React.createElement(
                          "div",
                          { className: "vf-item-actions" },
                          React.createElement(
                            "button",
                            {
                              type: "button",
                              className: "vf-btn vf-btn-ghost",
                              onClick: () => openDetail("Saint", s)
                            },
                            "Open details"
                          )
                        ),
                        user
                          ? React.createElement(
                              "div",
                              { className: "vf-item-actions" },
                              React.createElement(
                                "button",
                                {
                                  type: "button",
                                  className: "vf-btn vf-btn-ghost",
                                  onClick: () => saveSaint(s.id)
                                },
                                "Save this saint"
                              )
                            )
                          : null
                      )
                    )
                  )
                )
              : null,
            renderPagination(
              safePage,
              totalPages,
              setSaintsPage,
              "saints"
            )
          )
        )
      )
    );
  }

  function renderOurLady() {
    const activeApparitions =
      ourLadyResults.length > 0 ? ourLadyResults : apparitionsList;

    const totalPages = Math.max(
      1,
      Math.ceil(activeApparitions.length / PAGE_SIZE)
    );
    const safePage = Math.min(ourLadyPage, totalPages);
    const startIndex = (safePage - 1) * PAGE_SIZE;
    const pagedApparitions = activeApparitions.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );
    const showingSearchResults = ourLadyResults.length > 0;

    return React.createElement(
      "main",
      { className: "vf-main" },
      React.createElement(
        "section",
        { className: "vf-section" },
        React.createElement(
          "article",
          { className: "vf-card" },
          React.createElement(
            "header",
            { className: "vf-card-header" },
            React.createElement(
              "h2",
              { className: "vf-card-title" },
              "Our Lady"
            ),
            React.createElement(
              "p",
              { className: "vf-card-subtitle" },
              "Approved Marian apparitions and titles of Mary, Mother of the Church."
            )
          ),
          React.createElement(
            "section",
            { className: "vf-card-body vf-mary-about" },
            React.createElement(
              "h3",
              { className: "vf-section-subtitle" },
              "Mary, Mother of God and Mother of the Church"
            ),
            React.createElement(
              "p",
              null,
              "Mary is the Mother of God, the Mother of the Church, and the perfect model of discipleship. She leads the faithful to her Son with a heart that is humble, obedient, and filled with faith."
            ),
            React.createElement(
              "p",
              null,
              "In the mystery of the Holy Family, Mary and Saint Joseph cared for Jesus with reverence and trust in the will of God. Joseph, her chaste spouse, guarded and protected the child Jesus and serves as a quiet example of fidelity and hidden holiness."
            ),
            React.createElement(
              "p",
              null,
              "Through approved apparitions, Our Lady continues to call the faithful to conversion, prayer, and deeper love for Christ and his Church."
            )
          ),
          React.createElement(
            "form",
            {
              className: "vf-search-bar",
              onSubmit: submitOurLadySearch
            },
            React.createElement(
              "label",
              { className: "vf-field-label", htmlFor: "ourlady-search" },
              "Search Marian apparitions and titles"
            ),
            React.createElement(
              "div",
              { className: "vf-search-input-wrap" },
              React.createElement("input", {
                id: "ourlady-search",
                type: "search",
                placeholder: "Search by title or location",
                value: ourLadySearch,
                onChange: (e) => setOurLadySearch(e.target.value)
              }),
              React.createElement(
                "button",
                { type: "submit", className: "vf-btn vf-btn-blue" },
                "Search"
              )
            ),
            ourLadySuggestions.length > 0
              ? React.createElement(
                  "ul",
                  { className: "vf-search-suggestions" },
                  ourLadySuggestions.slice(0, 3).map((a) =>
                    React.createElement(
                      "li",
                      {
                        key: a.id || a.slug || a.title,
                        className: "vf-search-suggestion",
                        onClick: () =>
                          handleOurLadySuggestionClick(a)
                      },
                      React.createElement(
                        "span",
                        { className: "vf-search-suggestion-title" },
                        a.title || a.name
                      )
                    )
                  )
                )
              : null
          ),
          React.createElement(
            "div",
            { className: "vf-card-body" },
            apparitionsError
              ? React.createElement(
                  "p",
                  { className: "vf-inline-alert" },
                  apparitionsError
                )
              : null,
            loadingApparitions && activeApparitions.length === 0
              ? React.createElement(
                  "p",
                  null,
                  "Loading Marian titles and apparitions…"
                )
              : null,
            !loadingApparitions && activeApparitions.length === 0
              ? React.createElement(
                  "p",
                  null,
                  "No Marian titles or apparitions are available yet in this language."
                )
              : null,
            pagedApparitions.length > 0
              ? React.createElement(
                  React.Fragment,
                  null,
                  showingSearchResults
                    ? React.createElement(
                        "p",
                        { className: "vf-search-results-label" },
                        "Showing ",
                        pagedApparitions.length,
                        " of ",
                        activeApparitions.length,
                        " matching entries"
                      )
                    : null,
                  React.createElement(
                    "section",
                    { className: "vf-stack vf-stack-apparitions" },
                    pagedApparitions.map((a) =>
                      React.createElement(
                        "article",
                        {
                          key: a.id,
                          className: "vf-saint-item vf-saint-detail"
                        },
                        React.createElement(
                          "div",
                          { className: "vf-saint-header" },
                          a.imageUrl
                            ? React.createElement(
                                "div",
                                { className: "vf-saint-avatar-wrap" },
                                React.createElement("img", {
                                  src: a.imageUrl,
                                  alt: a.title,
                                  className: "vf-saint-avatar"
                                })
                              )
                            : null,
                          React.createElement(
                            "div",
                            null,
                            React.createElement(
                              "h4",
                              { className: "vf-saint-name" },
                              a.title
                            ),
                            a.location
                              ? React.createElement(
                                  "p",
                                  { className: "vf-saint-meta" },
                                  "Location: ",
                                  a.location
                                )
                              : null,
                            a.feastDay
                              ? React.createElement(
                                  "p",
                                  { className: "vf-saint-meta" },
                                  "Feast: ",
                                  new Date(
                                    a.feastDay
                                  ).toLocaleDateString()
                                )
                              : null
                          )
                        ),
                        a.story
                          ? React.createElement(
                              "p",
                              { className: "vf-saint-bio" },
                              a.story
                            )
                          : null,
                        React.createElement(
                          "div",
                          { className: "vf-item-actions" },
                          React.createElement(
                            "button",
                            {
                              type: "button",
                              className: "vf-btn vf-btn-ghost",
                              onClick: () => openDetail("Our Lady", a)
                            },
                            "Open details"
                          )
                        ),
                        user
                          ? React.createElement(
                              "div",
                              { className: "vf-item-actions" },
                              React.createElement(
                                "button",
                                {
                                  type: "button",
                                  className: "vf-btn vf-btn-ghost",
                                  onClick: () => saveApparition(a.id)
                                },
                                "Save this apparition"
                              )
                            )
                          : null
                      )
                    )
                  )
                )
              : null,
            renderPagination(
              safePage,
              totalPages,
              setOurLadyPage,
              "ourlady"
            )
          )
        )
      )
    );
  }

  function renderSacraments() {
    const totalPages = Math.max(
      1,
      Math.ceil(sacramentItems.length / PAGE_SIZE)
    );
    const safePage = Math.min(sacramentsPage, totalPages);
    const startIndex = (safePage - 1) * PAGE_SIZE;
    const pagedSacraments = sacramentItems.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );

    return React.createElement(
      "main",
      { className: "vf-main" },
      React.createElement(
        "section",
        { className: "vf-section" },
        React.createElement(
          "article",
          { className: "vf-card" },
          React.createElement(
            "header",
            { className: "vf-card-header" },
            React.createElement(
              "h2",
              { className: "vf-card-title" },
              "Sacraments"
            ),
            React.createElement(
              "p",
              { className: "vf-card-subtitle" },
              "Meaning, biblical foundation, preparation, what to expect, and common questions for each of the seven sacraments."
            )
          ),
          React.createElement(
            "div",
            { className: "vf-card-body" },
            sacramentsError
              ? React.createElement(
                  "p",
                  { className: "vf-inline-alert" },
                  sacramentsError
                )
              : null,
            loadingSacraments && sacramentItems.length === 0
              ? React.createElement(
                  "p",
                  null,
                  "Loading sacraments…"
                )
              : null,
            !loadingSacraments && sacramentItems.length === 0
              ? React.createElement(
                  "p",
                  null,
                  "No sacrament details are available yet in this language."
                )
              : null,
            pagedSacraments.length > 0
              ? React.createElement(
                  "div",
                  { className: "vf-stack" },
                  pagedSacraments.map((s) =>
                    React.createElement(
                      "section",
                      {
                        key: s.id,
                        className: "vf-sacrament-item"
                      },
                      React.createElement(
                        "h3",
                        { className: "vf-section-subtitle" },
                        s.name
                      ),
                      s.meaning
                        ? React.createElement(
                            "p",
                            { className: "vf-sacrament-meaning" },
                            s.meaning
                          )
                        : null,
                      React.createElement(
                        "div",
                        { className: "vf-item-actions" },
                        React.createElement(
                          "button",
                          {
                            type: "button",
                            className: "vf-btn vf-btn-ghost",
                            onClick: () => openDetail("Sacrament", s)
                          },
                          "Open details"
                        )
                      ),
                      renderSacramentBiblicalFoundation(
                        s.biblicalFoundation
                      ),
                      renderSacramentPreparation(s.preparation),
                      renderSacramentWhatToExpect(s.whatToExpect),
                      renderSacramentQuestions(s.commonQuestions)
                    )
                  )
                )
              : null,
            renderPagination(
              safePage,
              totalPages,
              setSacramentsPage,
              "sacraments"
            )
          )
        )
      )
    );
  }

  function renderGuides() {
    const totalPages = Math.max(
      1,
      Math.ceil(guideItems.length / PAGE_SIZE)
    );
    const safePage = Math.min(guidesPage, totalPages);
    const startIndex = (safePage - 1) * PAGE_SIZE;
    const pagedGuides = guideItems.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );

    return React.createElement(
      "main",
      { className: "vf-main" },
      React.createElement(
        "section",
        { className: "vf-section" },
        React.createElement(
          "article",
          { className: "vf-card" },
          React.createElement(
            "header",
            { className: "vf-card-header" },
            React.createElement(
              "h2",
              { className: "vf-card-title" },
              "Guides"
            ),
            React.createElement(
              "p",
              { className: "vf-card-subtitle" },
              "Step by step guides for OCIA, Confession, Rosary, Adoration, consecrations, and vocations."
            )
          ),
          React.createElement(
            "div",
            { className: "vf-card-body" },
            guidesError
              ? React.createElement(
                  "p",
                  { className: "vf-inline-alert" },
                  guidesError
                )
              : null,
            loadingGuides && guideItems.length === 0
              ? React.createElement("p", null, "Loading guides…")
              : null,
            !loadingGuides && guideItems.length === 0
              ? React.createElement(
                  "p",
                  null,
                  "No guides are available yet in this language."
                )
              : null,
            pagedGuides.length > 0
              ? React.createElement(
                  "div",
                  { className: "vf-stack" },
                  pagedGuides.map((g) =>
                    React.createElement(
                      "section",
                      {
                        key: g.id,
                        className: "vf-guide-item"
                      },
                      React.createElement(
                        "h3",
                        { className: "vf-section-subtitle" },
                        g.title
                      ),
                      g.summary
                        ? React.createElement(
                            "p",
                            { className: "vf-guide-summary" },
                            g.summary
                          )
                        : null,
                      React.createElement(
                        "div",
                        { className: "vf-item-actions" },
                        React.createElement(
                          "button",
                          {
                            type: "button",
                            className: "vf-btn vf-btn-ghost",
                            onClick: () => openDetail("Guide", g)
                          },
                          "Open details"
                        )
                      ),
                      renderGuideBodyContent(g.body),
                      renderGuideChecklist(g.checklistTemplate)
                    )
                  )
                )
              : null,
            renderPagination(
              safePage,
              totalPages,
              setGuidesPage,
              "guides"
            )
          )
        )
      )
    );
  }

  function renderProfile() {
    if (!user) {
      return React.createElement(
        "main",
        { className: "vf-main" },
        React.createElement(
          "section",
          { className: "vf-section" },
          React.createElement(
            "article",
            { className: "vf-card" },
            React.createElement(
              "header",
              { className: "vf-card-header" },
              React.createElement(
                "h2",
                { className: "vf-card-title" },
                "Profile"
              )
            ),
            React.createElement(
              "div",
              { className: "vf-card-body" },
              React.createElement(
                "p",
                null,
                "You need to be logged in to view your profile."
              )
            )
          )
        )
      );
    }

    return React.createElement(
      "main",
      { className: "vf-main" },
      React.createElement(
        "section",
        { className: "vf-section vf-profile-grid" },
        React.createElement(
          "article",
          { className: "vf-card vf-profile-card" },
          React.createElement(
            "header",
            { className: "vf-card-header vf-profile-header" },
            React.createElement(
              "div",
              { className: "vf-profile-avatar-wrap" },
              React.createElement(
                "div",
                { className: "vf-profile-avatar" },
                user.profilePictureUrl
                  ? React.createElement("img", {
                      src: user.profilePictureUrl,
                      alt: `${user.firstName} ${user.lastName}`
                    })
                  : React.createElement(
                      "span",
                      { className: "vf-profile-initials" },
                      user.firstName?.[0],
                      user.lastName?.[0]
                    )
              ),
              React.createElement(
                "form",
                { className: "vf-inline-form", onSubmit: saveAvatar },
                React.createElement("input", {
                  type: "url",
                  placeholder: "Avatar image URL",
                  value: avatarUrl,
                  onChange: (e) => setAvatarUrl(e.target.value)
                }),
                React.createElement(
                  "button",
                  { type: "submit", className: "vf-btn vf-btn-blue" },
                  "Save"
                )
              )
            ),
            React.createElement(
              "div",
              null,
              React.createElement(
                "h2",
                { className: "vf-card-title" },
                user.firstName,
                " ",
                user.lastName
              ),
              React.createElement(
                "p",
                { className: "vf-card-subtitle" },
                user.email
              ),
              profileError
                ? React.createElement(
                    "p",
                    { className: "vf-inline-alert" },
                    profileError
                  )
                : null,
              profileNotice
                ? React.createElement(
                    "p",
                    { className: "vf-inline-success" },
                    profileNotice
                  )
                : null
            )
          ),
          React.createElement(
            "div",
            { className: "vf-card-body" },
            React.createElement(
              "p",
              { className: "vf-lede" },
              "Your account keeps prayers, saints, apparitions, journal notes, goals, and milestones together so that your devotion stays organized."
            ),
            profileLoading
              ? React.createElement("p", null, "Loading profile…")
              : null,
            profileOverview
              ? React.createElement(
                  "div",
                  { className: "vf-metrics" },
                  [
                    {
                      label: "Saved Prayers",
                      value: profileOverview.savedPrayersCount
                    },
                    { label: "Saved Saints", value: profileOverview.savedSaintsCount },
                    {
                      label: "Saved Apparitions",
                      value: profileOverview.savedApparitionsCount
                    },
                    { label: "Journal Entries", value: profileOverview.journalCount },
                    {
                      label: "Archived Journal",
                      value: profileOverview.journalArchivedCount
                    },
                    { label: "Goals", value: profileOverview.goalsCount },
                    { label: "Active Goals", value: profileOverview.goalsActiveCount },
                    { label: "Overdue Goals", value: profileOverview.goalsOverdueCount },
                    { label: "Milestones", value: profileOverview.milestonesCount }
                  ].map((metric) =>
                    React.createElement(
                      "div",
                      { key: metric.label, className: "vf-metric" },
                      React.createElement(
                        "p",
                        { className: "vf-metric-label" },
                        metric.label
                      ),
                      React.createElement(
                        "p",
                        { className: "vf-metric-value" },
                        metric.value ?? 0
                      )
                    )
                  )
                )
              : null
          )
        ),
        React.createElement(
          "article",
          { className: "vf-card" },
          React.createElement(
            "header",
            { className: "vf-card-header" },
            React.createElement(
              "div",
              { className: "vf-card-title-row" },
              React.createElement("h3", { className: "vf-card-title" }, "My Prayers"),
              React.createElement(
                "span",
                { className: "vf-chip" },
                savedPrayers.length,
                " saved"
              )
            )
          ),
          React.createElement(
            "div",
            { className: "vf-card-body" },
            savedPrayersError
              ? React.createElement(
                  "p",
                  { className: "vf-inline-alert" },
                  savedPrayersError
                )
              : null,
            loadingSavedPrayers
              ? React.createElement("p", null, "Loading saved prayers…")
              : null,
            savedPrayers.length === 0 && !loadingSavedPrayers
              ? React.createElement(
                  "p",
                  null,
                  "Save any prayer from the library to keep it close."
                )
              : null,
            savedPrayers.length > 0
              ? React.createElement(
                  "ul",
                  { className: "vf-list" },
                  savedPrayers.map((item) =>
                    React.createElement(
                      "li",
                      { key: item.id, className: "vf-list-row" },
                      React.createElement(
                        "div",
                        null,
                        React.createElement(
                          "p",
                          { className: "vf-list-title" },
                          item.prayer.title
                        ),
                        React.createElement(
                          "p",
                          { className: "vf-list-subtitle" },
                          new Date(item.savedAt).toLocaleDateString(),
                          " · ",
                          item.prayer.category || "Prayer"
                        )
                      ),
                      React.createElement(
                        "button",
                        {
                          type: "button",
                          className: "vf-btn vf-btn-ghost",
                          onClick: () => removeSavedPrayer(item.prayerId)
                        },
                        "Remove"
                      )
                    )
                  )
                )
              : null
          )
        ),
        React.createElement(
          "article",
          { className: "vf-card" },
          React.createElement(
            "header",
            { className: "vf-card-header" },
            React.createElement("h3", { className: "vf-card-title" }, "Journal"),
            React.createElement(
              "div",
              { className: "vf-pill-group" },
              [
                { id: "active", label: "Active" },
                { id: "archived", label: "Archived" },
                { id: "all", label: "All" }
              ].map((view) =>
                React.createElement(
                  "button",
                  {
                    key: view.id,
                    type: "button",
                    className:
                      "vf-pill" + (journalView === view.id ? " vf-pill-active" : ""),
                    onClick: () => {
                      setJournalView(view.id);
                      loadJournalEntries(view.id);
                    }
                  },
                  view.label
                )
              )
            )
          ),
          React.createElement(
            "div",
            { className: "vf-card-body" },
            journalError
              ? React.createElement(
                  "p",
                  { className: "vf-inline-alert" },
                  journalError
                )
              : null,
            React.createElement(
              "form",
              { className: "vf-form vf-stacked-form", onSubmit: submitJournal },
              React.createElement(
                "label",
                { className: "vf-field" },
                React.createElement("span", null, "Title"),
                React.createElement("input", {
                  type: "text",
                  value: journalForm.title,
                  onChange: (e) =>
                    setJournalForm((prev) => ({ ...prev, title: e.target.value }))
                })
              ),
              React.createElement(
                "label",
                { className: "vf-field" },
                React.createElement("span", null, "Entry"),
                React.createElement("textarea", {
                  required: true,
                  value: journalForm.body,
                  rows: 3,
                  onChange: (e) =>
                    setJournalForm((prev) => ({ ...prev, body: e.target.value }))
                })
              ),
              React.createElement(
                "label",
                { className: "vf-checkbox" },
                React.createElement("input", {
                  type: "checkbox",
                  checked: journalForm.isFavorite,
                  onChange: (e) =>
                    setJournalForm((prev) => ({
                      ...prev,
                      isFavorite: e.target.checked
                    }))
                }),
                React.createElement("span", null, "Mark as favorite")
              ),
              React.createElement(
                "button",
                { type: "submit", className: "vf-btn vf-btn-blue", disabled: journalSubmitting },
                journalSubmitting ? "Saving…" : "Add entry"
              )
            ),
            journalEntries.length > 0
              ? React.createElement(
                  "div",
                  { className: "vf-stack" },
                  journalEntries.map((entry) =>
                    React.createElement(
                      "article",
                      { key: entry.id, className: "vf-note" },
                      React.createElement(
                        "div",
                        { className: "vf-note-head" },
                        React.createElement(
                          "h4",
                          { className: "vf-note-title" },
                          entry.title || "Untitled"
                        ),
                        React.createElement(
                          "div",
                          { className: "vf-note-actions" },
                          React.createElement(
                            "button",
                            {
                              type: "button",
                              className:
                                "vf-chip" + (entry.isFavorite ? " vf-chip-green" : ""),
                              onClick: () =>
                                updateJournalEntry(entry.id, {
                                  isFavorite: !entry.isFavorite
                                })
                            },
                            entry.isFavorite ? "Favorite" : "Mark favorite"
                          ),
                          React.createElement(
                            "button",
                            {
                              type: "button",
                              className: "vf-btn vf-btn-ghost",
                              onClick: () =>
                                updateJournalEntry(entry.id, {
                                  isArchived: !entry.isArchived
                                })
                            },
                            entry.isArchived ? "Unarchive" : "Archive"
                          ),
                          React.createElement(
                            "button",
                            {
                              type: "button",
                              className: "vf-btn vf-btn-ghost",
                              onClick: () => deleteJournalEntry(entry.id)
                            },
                            "Delete"
                          )
                        )
                      ),
                      React.createElement(
                        "p",
                        { className: "vf-note-date" },
                        new Date(entry.createdAt).toLocaleString()
                      ),
                      React.createElement("p", null, entry.body)
                    )
                  )
                )
              : React.createElement(
                  "p",
                  { className: "vf-empty" },
                  "No journal entries yet."
                )
          )
        ),
        React.createElement(
          "article",
          { className: "vf-card" },
          React.createElement(
            "header",
            { className: "vf-card-header" },
            React.createElement("h3", { className: "vf-card-title" }, "Goals"),
            goalsError
              ? React.createElement(
                  "p",
                  { className: "vf-inline-alert" },
                  goalsError
                )
              : null
          ),
          React.createElement(
            "div",
            { className: "vf-card-body" },
            React.createElement(
              "form",
              { className: "vf-form vf-goal-form", onSubmit: submitGoal },
              React.createElement(
                "label",
                { className: "vf-field" },
                React.createElement("span", null, "Title"),
                React.createElement("input", {
                  required: true,
                  value: goalForm.title,
                  onChange: (e) =>
                    setGoalForm((prev) => ({ ...prev, title: e.target.value }))
                })
              ),
              React.createElement(
                "label",
                { className: "vf-field" },
                React.createElement("span", null, "Description"),
                React.createElement("textarea", {
                  value: goalForm.description,
                  rows: 2,
                  onChange: (e) =>
                    setGoalForm((prev) => ({
                      ...prev,
                      description: e.target.value
                    }))
                })
              ),
              React.createElement(
                "label",
                { className: "vf-field" },
                React.createElement("span", null, "Goal type"),
                React.createElement(
                  "select",
                  {
                    value: goalForm.goalType,
                    onChange: (e) =>
                      setGoalForm((prev) => ({
                        ...prev,
                        goalType: e.target.value
                      }))
                  },
                  GOAL_TYPES.map((type) =>
                    React.createElement(
                      "option",
                      { key: type.value, value: type.value },
                      type.label
                    )
                  )
                )
              ),
              React.createElement(
                "label",
                { className: "vf-field" },
                React.createElement("span", null, "Due date"),
                React.createElement("input", {
                  type: "date",
                  value: goalForm.dueDate,
                  onChange: (e) =>
                    setGoalForm((prev) => ({ ...prev, dueDate: e.target.value }))
                })
              ),
              React.createElement(
                "button",
                { type: "submit", className: "vf-btn vf-btn-blue" },
                "Create goal"
              )
            ),
            goalsLoading
              ? React.createElement("p", null, "Loading goals…")
              : null,
            goals.length > 0
              ? React.createElement(
                  "div",
                  { className: "vf-stack" },
                  goals.map((goal) =>
                    React.createElement(
                      "article",
                      { key: goal.id, className: "vf-goal" },
                      React.createElement(
                        "div",
                        { className: "vf-goal-head" },
                        React.createElement(
                          "div",
                          null,
                          React.createElement(
                            "p",
                            { className: "vf-goal-title" },
                            goal.title
                          ),
                          React.createElement(
                            "p",
                            { className: "vf-goal-meta" },
                            goal.goalType,
                            goal.dueDate
                              ? ` · Due ${new Date(goal.dueDate).toLocaleDateString()}`
                              : ""
                          )
                        ),
                        React.createElement(
                          "div",
                          { className: "vf-goal-actions" },
                          React.createElement(
                            "span",
                            {
                              className:
                                "vf-pill vf-status-pill" +
                                (goal.status === "COMPLETED"
                                  ? " vf-pill-green"
                                  : goal.status === "OVERDUE"
                                  ? " vf-pill-red"
                                  : "")
                            },
                            goal.status
                          ),
                          React.createElement(
                            "button",
                            {
                              type: "button",
                              className: "vf-btn vf-btn-ghost",
                              onClick: () =>
                                updateGoal(goal.id, { status: "COMPLETED" })
                            },
                            "Mark complete"
                          ),
                          goal.status !== "ACTIVE"
                            ? React.createElement(
                                "button",
                                {
                                  type: "button",
                                  className: "vf-btn vf-btn-ghost",
                                  onClick: () =>
                                    updateGoal(goal.id, { status: "ACTIVE" })
                                },
                                "Move to active"
                              )
                            : null,
                          React.createElement(
                            "button",
                            {
                              type: "button",
                              className: "vf-btn vf-btn-ghost",
                              onClick: () => deleteGoal(goal.id)
                            },
                            "Delete"
                          )
                        )
                      ),
                      goal.description
                        ? React.createElement(
                            "p",
                            { className: "vf-goal-desc" },
                            goal.description
                          )
                        : null
                    )
                  )
                )
              : React.createElement(
                  "p",
                  { className: "vf-empty" },
                  "Add a goal to begin tracking your next spiritual milestone."
                )
          )
        ),
        React.createElement(
          "article",
          { className: "vf-card" },
          React.createElement(
            "header",
            { className: "vf-card-header" },
            React.createElement(
              "h3",
              { className: "vf-card-title" },
              "Milestones"
            )
          ),
          React.createElement(
            "div",
            { className: "vf-card-body" },
            milestonesError
              ? React.createElement(
                  "p",
                  { className: "vf-inline-alert" },
                  milestonesError
                )
              : null,
            milestonesLoading
              ? React.createElement("p", null, "Loading milestones…")
              : null,
            milestones.length > 0
              ? React.createElement(
                  "div",
                  { className: "vf-stack" },
                  milestones.map((m) =>
                    React.createElement(
                      "div",
                      { key: m.id, className: "vf-milestone" },
                      React.createElement(
                        "div",
                        { className: "vf-milestone-head" },
                        React.createElement(
                          "p",
                          { className: "vf-milestone-title" },
                          m.title
                        ),
                        React.createElement(
                          "span",
                          { className: "vf-chip" },
                          m.milestoneType
                        )
                      ),
                      m.sacrament
                        ? React.createElement(
                            "p",
                            { className: "vf-milestone-meta" },
                            "Sacrament: ",
                            m.sacrament.name
                          )
                        : null,
                      m.goal
                        ? React.createElement(
                            "p",
                            { className: "vf-milestone-meta" },
                            "Goal: ",
                            m.goal.title
                          )
                        : null,
                      m.description
                        ? React.createElement(
                            "p",
                            { className: "vf-milestone-desc" },
                            m.description
                          )
                        : null
                    )
                  )
                )
              : React.createElement(
                  "p",
                  { className: "vf-empty" },
                  "Complete a goal or sacrament to see milestones here."
                )
          )
        )
      )
    );
  }

  function renderAuth() {
    return React.createElement(
      "main",
      { className: "vf-main" },
      React.createElement(
        "section",
        { className: "vf-section vf-auth-layout" },
        React.createElement(
          "article",
          { className: "vf-card vf-auth-card" },
          React.createElement(
            "header",
            { className: "vf-card-header" },
            React.createElement(
              "h2",
              { className: "vf-card-title" },
              authMode === "login"
                ? "Login"
                : authMode === "register"
                ? "Create Account"
                : "Reset Password"
            )
          ),
          React.createElement(
            "div",
            { className: "vf-card-body" },
            React.createElement(
              "div",
              { className: "vf-auth-tabs" },
              [
                { id: "login", label: "Login" },
                { id: "register", label: "Register" },
                { id: "reset", label: "Reset" }
              ].map((mode) =>
                React.createElement(
                  "button",
                  {
                    key: mode.id,
                    type: "button",
                    className:
                      "vf-pill" +
                      (authMode === mode.id ? " vf-pill-active" : ""),
                    onClick: () => {
                      setAuthMode(mode.id);
                      resetAuthState();
                    }
                  },
                  mode.label
                )
              )
            ),
            authError
              ? React.createElement(
                  "p",
                  { className: "vf-inline-alert" },
                  authError
                )
              : null,
            authSuccess
              ? React.createElement(
                  "p",
                  { className: "vf-inline-success" },
                  authSuccess
                )
              : null,
            authMode === "login"
              ? React.createElement(
                  "form",
                  { className: "vf-form", onSubmit: handleLoginSubmit },
                  React.createElement(
                    "label",
                    { className: "vf-field" },
                    React.createElement("span", null, "Email"),
                    React.createElement("input", {
                      type: "email",
                      required: true,
                      value: loginEmail,
                      onChange: (e) => setLoginEmail(e.target.value)
                    })
                  ),
                  React.createElement(
                    "label",
                    { className: "vf-field" },
                    React.createElement("span", null, "Password"),
                    React.createElement("input", {
                      type: "password",
                      required: true,
                      value: loginPassword,
                      onChange: (e) => setLoginPassword(e.target.value)
                    })
                  ),
                  React.createElement(
                    "button",
                    {
                      type: "submit",
                      className: "vf-button",
                      disabled: authSubmitting
                    },
                    authSubmitting ? "Signing in…" : "Login"
                  )
                )
              : null,
            authMode === "register"
              ? React.createElement(
                  "form",
                  { className: "vf-form", onSubmit: handleRegisterSubmit },
                  React.createElement(
                    "div",
                    { className: "vf-field-grid" },
                    React.createElement(
                      "label",
                      { className: "vf-field" },
                      React.createElement("span", null, "First name"),
                      React.createElement("input", {
                        type: "text",
                        required: true,
                        value: registerForm.firstName,
                        onChange: (e) =>
                          setRegisterForm((prev) => ({
                            ...prev,
                            firstName: e.target.value
                          }))
                      })
                    ),
                    React.createElement(
                      "label",
                      { className: "vf-field" },
                      React.createElement("span", null, "Last name"),
                      React.createElement("input", {
                        type: "text",
                        required: true,
                        value: registerForm.lastName,
                        onChange: (e) =>
                          setRegisterForm((prev) => ({
                            ...prev,
                            lastName: e.target.value
                          }))
                      })
                    )
                  ),
                  React.createElement(
                    "label",
                    { className: "vf-field" },
                    React.createElement("span", null, "Email"),
                    React.createElement("input", {
                      type: "email",
                      required: true,
                      value: registerForm.email,
                      onChange: (e) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          email: e.target.value
                        }))
                    })
                  ),
                  React.createElement(
                    "label",
                    { className: "vf-field" },
                    React.createElement("span", null, "Password"),
                    React.createElement("input", {
                      type: "password",
                      required: true,
                      value: registerForm.password,
                      onChange: (e) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          password: e.target.value
                        }))
                    })
                  ),
                  React.createElement(
                    "label",
                    { className: "vf-field" },
                    React.createElement("span", null, "Confirm password"),
                    React.createElement("input", {
                      type: "password",
                      required: true,
                      value: registerForm.passwordConfirm,
                      onChange: (e) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          passwordConfirm: e.target.value
                        }))
                    })
                  ),
                  React.createElement(
                    "button",
                    {
                      type: "submit",
                      className: "vf-button",
                      disabled: authSubmitting
                    },
                    authSubmitting ? "Creating account…" : "Create account"
                  )
                )
              : null,
            authMode === "reset"
              ? React.createElement(
                  "form",
                  { className: "vf-form", onSubmit: handleResetSubmit },
                  React.createElement(
                    "label",
                    { className: "vf-field" },
                    React.createElement("span", null, "First name"),
                    React.createElement("input", {
                      type: "text",
                      required: true,
                      value: resetForm.firstName,
                      onChange: (e) =>
                        setResetForm((prev) => ({
                          ...prev,
                          firstName: e.target.value
                        }))
                    })
                  ),
                  React.createElement(
                    "label",
                    { className: "vf-field" },
                    React.createElement("span", null, "Last name"),
                    React.createElement("input", {
                      type: "text",
                      required: true,
                      value: resetForm.lastName,
                      onChange: (e) =>
                        setResetForm((prev) => ({
                          ...prev,
                          lastName: e.target.value
                        }))
                    })
                  ),
                  React.createElement(
                    "label",
                    { className: "vf-field" },
                    React.createElement("span", null, "Email"),
                    React.createElement("input", {
                      type: "email",
                      required: true,
                      value: resetForm.email,
                      onChange: (e) =>
                        setResetForm((prev) => ({
                          ...prev,
                          email: e.target.value
                        }))
                    })
                  ),
                  React.createElement(
                    "label",
                    { className: "vf-field" },
                    React.createElement("span", null, "New password"),
                    React.createElement("input", {
                      type: "password",
                      required: true,
                      value: resetForm.newPassword,
                      onChange: (e) =>
                        setResetForm((prev) => ({
                          ...prev,
                          newPassword: e.target.value
                        }))
                    })
                  ),
                  React.createElement(
                    "button",
                    {
                      type: "submit",
                      className: "vf-button",
                      disabled: authSubmitting
                    },
                    authSubmitting ? "Resetting…" : "Reset password"
                  )
                )
              : null
          )
        )
      )
    );
  }

  function renderDetailPanel() {
    if (!detailView.open || !detailView.item) return null;

    const item = detailView.item;
    const detailTitle = item.title || item.name || "Detail";
    const detailLead =
      item.summary || item.subtitle || item.description || item.meaning || "";
    const detailBody =
      item.body || item.content || item.bio || item.story || item.explanation;

    const meta = [];
    if (item.date) meta.push({ label: "Date", value: item.date });
    if (item.origin) meta.push({ label: "Origin", value: item.origin });
    if (item.location) meta.push({ label: "Location", value: item.location });
    if (item.language) meta.push({ label: "Language", value: item.language });
    if (item.category) meta.push({ label: "Category", value: item.category });
    if (Array.isArray(item.categories))
      meta.push({ label: "Categories", value: item.categories.join(", ") });
    if (Array.isArray(item.tags))
      meta.push({ label: "Tags", value: item.tags.join(", ") });
    if (item.feastDay) meta.push({ label: "Feast day", value: item.feastDay });
    if (item.birthYear)
      meta.push({ label: "Born", value: item.birthYear.toString() });
    if (item.deathYear)
      meta.push({ label: "Died", value: item.deathYear.toString() });
    if (item.patronage)
      meta.push({ label: "Patronage", value: item.patronage });
    if (item.goalType)
      meta.push({ label: "Type", value: item.goalType.replace("_", " ") });

    const detailImage = item.imageUrl || item.artwork || item.photoUrl || null;

    const longform = Array.isArray(item.body)
      ? item.body
      : detailBody
      ? [detailBody]
      : [];

    return React.createElement(
      "div",
      { className: "vf-detail-overlay", role: "dialog", "aria-modal": true },
      React.createElement("div", { className: "vf-detail-panel" },
        React.createElement(
          "div",
          { className: "vf-detail-header" },
          React.createElement(
            "div",
            { className: "vf-detail-title-block" },
            React.createElement("p", { className: "vf-detail-kicker" }, detailView.type || "Item"),
            React.createElement("h2", { className: "vf-detail-title" }, detailTitle),
            detailLead
              ? React.createElement(
                  "p",
                  { className: "vf-detail-lead" },
                  detailLead
                )
              : null
          ),
          React.createElement(
            "button",
            {
              type: "button",
              className: "vf-icon-button vf-detail-close",
              onClick: closeDetail,
              "aria-label": "Close detail"
            },
            "×"
          )
        ),
        meta.length > 0
          ? React.createElement(
              "dl",
              { className: "vf-detail-meta" },
              meta.map((entry) =>
                React.createElement(
                  React.Fragment,
                  { key: entry.label },
                  React.createElement(
                    "dt",
                    { className: "vf-detail-term" },
                    entry.label
                  ),
                  React.createElement(
                    "dd",
                    { className: "vf-detail-definition" },
                    entry.value
                  )
                )
              )
            )
          : null,
        detailImage
          ? React.createElement("div", { className: "vf-detail-hero" },
              React.createElement("div", { className: "vf-detail-hero-img", style: { backgroundImage: `url(${detailImage})` } }),
              item.imageCredit
                ? React.createElement(
                    "p",
                    { className: "vf-detail-credit" },
                    item.imageCredit
                  )
                : null
            )
          : null,
        longform.length > 0
          ? React.createElement(
              "div",
              { className: "vf-detail-body" },
              longform.map((block, idx) =>
                React.createElement(
                  "p",
                  { key: idx, className: "vf-detail-paragraph" },
                  block
                )
              )
            )
          : null
      )
    );
  }

  function renderCurrentTab() {
    if (currentTab === "home") return renderHome();
    if (currentTab === "history") return renderHistory();
    if (currentTab === "prayers") return renderPrayers();
    if (currentTab === "saints") return renderSaints();
    if (currentTab === "ourlady") return renderOurLady();
    if (currentTab === "sacraments") return renderSacraments();
    if (currentTab === "guides") return renderGuides();
    if (currentTab === "profile") return renderProfile();
    if (currentTab === "auth") return renderAuth();
    return renderHome();
  }

  return React.createElement(
    "div",
    { className: "vf-shell" },
    renderHeader(),
    renderCurrentTab(),
    renderDetailPanel(),
    React.createElement(
      "footer",
      { className: "vf-footer" },
      React.createElement(
        "div",
        { className: "vf-footer-inner" },
        React.createElement(
          "span",
          null,
          "© ",
          new Date().getFullYear(),
          " Via Fidei. All rights reserved."
        )
      )
    )
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(AppShell));
}
