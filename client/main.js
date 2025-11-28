// client/main.js
import React, { useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";

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

  const [theme, setTheme] = useState("light");
  const [seasonTheme, setSeasonTheme] = useState("normal");

  const [language, setLanguage] = useState(
    window.localStorage.getItem("vf_language") || "en"
  );

  // Home content
  const [homeData, setHomeData] = useState(null);
  const [loadingHome, setLoadingHome] = useState(true);

  // History, Sacraments, Guides
  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  const [sacramentItems, setSacramentItems] = useState([]);
  const [loadingSacraments, setLoadingSacraments] = useState(false);
  const [sacramentsLoaded, setSacramentsLoaded] = useState(false);
  const [sacramentsPage, setSacramentsPage] = useState(1);

  const [guideItems, setGuideItems] = useState([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [guidesLoaded, setGuidesLoaded] = useState(false);
  const [guidesPage, setGuidesPage] = useState(1);

  // Prayers search and library
  const [prayersSearch, setPrayersSearch] = useState("");
  const [prayersSuggestions, setPrayersSuggestions] = useState([]);
  const [prayersResults, setPrayersResults] = useState([]);
  const [prayersList, setPrayersList] = useState([]);
  const [loadingPrayers, setLoadingPrayers] = useState(false);
  const [prayersPage, setPrayersPage] = useState(1);

  // Saints search and library
  const [saintsSearch, setSaintsSearch] = useState("");
  const [saintsSuggestions, setSaintsSuggestions] = useState([]);
  const [saintsResults, setSaintsResults] = useState([]);
  const [saintsList, setSaintsList] = useState([]);
  const [loadingSaints, setLoadingSaints] = useState(false);
  const [saintsPage, setSaintsPage] = useState(1);

  // Our Lady search and library
  const [ourLadySearch, setOurLadySearch] = useState("");
  const [ourLadySuggestions, setOurLadySuggestions] = useState([]);
  const [ourLadyResults, setOurLadyResults] = useState([]);
  const [apparitionsList, setApparitionsList] = useState([]);
  const [loadingApparitions, setLoadingApparitions] = useState(false);
  const [ourLadyPage, setOurLadyPage] = useState(1);

  // Fetch current user and settings
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        setLoadingUser(true);
        const res = await fetch("/api/auth/me", {
          credentials: "include"
        });
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
          const storedTheme = window.localStorage.getItem("vf_theme");
          const storedLang = window.localStorage.getItem("vf_language");
          if (storedTheme) {
            setTheme(storedTheme);
          }
          if (storedLang) {
            setLanguage(storedLang);
          }
        }
      } catch (err) {
        console.error("Failed to load current user", err);
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

  // When language changes, mark language dependent sections as needing reload
  useEffect(() => {
    setHistoryLoaded(false);
    setHistoryItems([]);
    setHistoryPage(1);

    setSacramentsLoaded(false);
    setSacramentItems([]);
    setSacramentsPage(1);

    setGuidesLoaded(false);
    setGuideItems([]);
    setGuidesPage(1);

    setPrayersList([]);
    setPrayersResults([]);
    setPrayersSuggestions([]);
    setPrayersPage(1);

    setSaintsList([]);
    setSaintsResults([]);
    setSaintsSuggestions([]);
    setSaintsPage(1);

    setApparitionsList([]);
    setOurLadyResults([]);
    setOurLadySuggestions([]);
    setOurLadyPage(1);
  }, [language]);

  // Fetch home content
  const loadHome = useCallback(
    async (lang) => {
      try {
        setLoadingHome(true);
        const params = new URLSearchParams();
        if (lang) {
          params.set("language", lang);
        }
        const res = await fetch(`/api/home?${params.toString()}`);
        const data = await res.json();
        setHomeData(data);

        if (data && data.liturgicalTheme) {
          setSeasonTheme(data.liturgicalTheme);
        }
      } catch (err) {
        console.error("Failed to load home content", err);
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
        const params = new URLSearchParams();
        if (lang) {
          params.set("language", lang);
        }
        const res = await fetch(`/api/history?${params.toString()}`);
        const data = await res.json();
        setHistoryItems(Array.isArray(data.items) ? data.items : []);
        setHistoryLoaded(true);
      } catch (err) {
        console.error("Failed to load history sections", err);
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
        const params = new URLSearchParams();
        if (lang) {
          params.set("language", lang);
        }
        const res = await fetch(`/api/sacraments?${params.toString()}`);
        const data = await res.json();
        setSacramentItems(Array.isArray(data.items) ? data.items : []);
        setSacramentsLoaded(true);
      } catch (err) {
        console.error("Failed to load sacraments", err);
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
        const params = new URLSearchParams();
        if (lang) {
          params.set("language", lang);
        }
        const res = await fetch(`/api/guides?${params.toString()}`);
        const data = await res.json();
        setGuideItems(Array.isArray(data.items) ? data.items : []);
        setGuidesLoaded(true);
      } catch (err) {
        console.error("Failed to load guides", err);
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
        const params = new URLSearchParams();
        if (lang) {
          params.set("language", lang);
        }
        params.set("take", "100");
        const res = await fetch(`/api/prayers?${params.toString()}`);
        const data = await res.json();
        setPrayersList(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        console.error("Failed to load prayers library", err);
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
        const params = new URLSearchParams();
        if (lang) {
          params.set("language", lang);
        }
        params.set("take", "100");
        const res = await fetch(`/api/saints/saints?${params.toString()}`);
        const data = await res.json();
        setSaintsList(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        console.error("Failed to load saints library", err);
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
        const params = new URLSearchParams();
        if (lang) {
          params.set("language", lang);
        }
        params.set("take", "100");
        const res = await fetch(
          `/api/saints/apparitions?${params.toString()}`
        );
        const data = await res.json();
        setApparitionsList(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        console.error("Failed to load Marian apparitions library", err);
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

  // Account actions
  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      setUser(null);
      setAccountMenu(ACCOUNT_STATES.CLOSED);
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
              "vf-header-banner vf-header-banner-" + currentSeason
          },
          { "aria-hidden": "true" },
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
                        : null
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
                        )
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
        { className: "vf-section" },
        React.createElement(
          "article",
          { className: "vf-card" },
          React.createElement(
            "header",
            {
              className: "vf-card-header vf-profile-header"
            },
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
                    ),
                React.createElement(
                  "button",
                  {
                    type: "button",
                    className: "vf-profile-avatar-edit",
                    title: "Edit Profile Picture",
                    "aria-label": "Edit Profile Picture"
                  },
                  React.createElement("span", {
                    className: "vf-icon-pencil",
                    "aria-hidden": "true"
                  })
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
              )
            )
          ),
          React.createElement(
            "div",
            { className: "vf-card-body" },
            React.createElement(
              "p",
              null,
              "Your profile gathers My Prayers, Journal, Goals, and Milestones, along with settings for theme, language, and privacy, so that everything supporting your spiritual life stays in one place."
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
              "Login"
            )
          ),
          React.createElement(
            "div",
            { className: "vf-card-body" },
            React.createElement(
              "p",
              null,
              "The authentication forms for Create Account, Login, and Reset Password integrate with the Via Fidei account system so that interactive features remain personal and private."
            )
          )
        )
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
const root = createRoot(container);
root.render(React.createElement(AppShell));
