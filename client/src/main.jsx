import React, { useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";

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

const ADMIN_ROUTE_PATH = "/admin";

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
    return (
      <div className="vf-sacrament-field">
        <strong>Scripture</strong>
        <ul className="vf-sacrament-list">
          {biblicalFoundation.map((item, idx) => {
            if (!item) return null;
            if (typeof item === "string") {
              return <li key={idx}>{item}</li>;
            }
            return (
              <li key={item.reference || idx}>
                {item.reference && (
                  <span className="vf-sacrament-ref">{item.reference}: </span>
                )}
                {item.text}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  if (typeof biblicalFoundation === "string" && biblicalFoundation.trim()) {
    return (
      <p className="vf-sacrament-field">
        <strong>Biblical foundation:</strong> {biblicalFoundation}
      </p>
    );
  }

  return null;
}

function renderSacramentPreparation(preparation) {
  if (!preparation) return null;

  if (typeof preparation === "string") {
    return (
      <p className="vf-sacrament-field">
        <strong>How to prepare:</strong> {preparation}
      </p>
    );
  }

  const overview = preparation.overview;
  const steps = Array.isArray(preparation.steps) ? preparation.steps : [];

  return (
    <div className="vf-sacrament-field">
      <strong>How to prepare</strong>
      {overview && <p className="vf-sacrament-text">{overview}</p>}
      {steps.length > 0 && (
        <ul className="vf-sacrament-list">
          {steps.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function renderSacramentWhatToExpect(whatToExpect) {
  if (!whatToExpect) return null;

  if (typeof whatToExpect === "string") {
    return (
      <p className="vf-sacrament-field">
        <strong>What to expect:</strong> {whatToExpect}
      </p>
    );
  }

  const short = whatToExpect.short;
  const notes = Array.isArray(whatToExpect.notes) ? whatToExpect.notes : [];

  return (
    <div className="vf-sacrament-field">
      <strong>What to expect</strong>
      {short && <p className="vf-sacrament-text">{short}</p>}
      {notes.length > 0 && (
        <ul className="vf-sacrament-list">
          {notes.map((note, idx) => (
            <li key={idx}>{note}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function renderSacramentQuestions(commonQuestions) {
  if (!Array.isArray(commonQuestions) || commonQuestions.length === 0) {
    return null;
  }

  return (
    <div className="vf-sacrament-qa">
      <h4 className="vf-sacrament-qa-title">Common questions</h4>
      <dl className="vf-sacrament-qa-list">
        {commonQuestions.map((qItem, idx) => {
          if (!qItem) return null;
          if (typeof qItem === "string") {
            return (
              <div key={idx} className="vf-sacrament-qa-item">
                <dd>{qItem}</dd>
              </div>
            );
          }
          return (
            <div key={idx} className="vf-sacrament-qa-item">
              {qItem.question && <dt>{qItem.question}</dt>}
              {qItem.answer && <dd>{qItem.answer}</dd>}
            </div>
          );
        })}
      </dl>
    </div>
  );
}

// Helper for guides body

function renderGuideBodyContent(body) {
  if (!body) return null;

  if (typeof body === "string") {
    return <p className="vf-guide-body">{body}</p>;
  }

  const intro = body.intro;
  const sections = Array.isArray(body.sections) ? body.sections : [];

  return (
    <div className="vf-guide-body">
      {intro && <p>{intro}</p>}
      {sections.map((section, idx) => (
        <section
          key={section.title || idx}
          className="vf-guide-section"
        >
          {section.title && (
            <h4 className="vf-guide-section-title">{section.title}</h4>
          )}
          {Array.isArray(section.paragraphs) &&
            section.paragraphs.map((p, i) => (
              <p key={i} className="vf-guide-paragraph">
                {p}
              </p>
            ))}
          {Array.isArray(section.steps) && section.steps.length > 0 && (
            <ol className="vf-guide-steps">
              {section.steps.map((step, j) => (
                <li key={step.label || j} className="vf-guide-step">
                  <div className="vf-guide-step-main">
                    {step.label && (
                      <span className="vf-guide-step-label">
                        {step.label}
                      </span>
                    )}
                    {step.description && (
                      <span className="vf-guide-step-description">
                        {step.description}
                      </span>
                    )}
                  </div>
                  {step.prayerTitle && step.prayerText && (
                    <div className="vf-guide-step-prayer">
                      <div className="vf-guide-step-prayer-title">
                        {step.prayerTitle}
                      </div>
                      <p className="vf-guide-step-prayer-text">
                        {step.prayerText}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}
    </div>
  );
}

function renderGuideChecklist(checklistTemplate) {
  if (!checklistTemplate) return null;
  const items = Array.isArray(checklistTemplate.items)
    ? checklistTemplate.items
    : [];
  if (items.length === 0) return null;

  return (
    <div className="vf-guide-checklist">
      <h4 className="vf-guide-checklist-title">
        {checklistTemplate.title || "Checklist"}
      </h4>
      <ul>
        {items.map((item, idx) => (
          <li key={idx}>{item.label || String(item)}</li>
        ))}
      </ul>
    </div>
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

  const [isAdminRoute] = useState(() =>
    window.location.pathname.startsWith(ADMIN_ROUTE_PATH)
  );
  const [adminAuthenticated, setAdminAuthenticated] = useState(
    () => window.sessionStorage.getItem("vf_admin_authed") === "yes"
  );
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminAuthError, setAdminAuthError] = useState("");

  // Admin editing state
  const [adminMissionDraft, setAdminMissionDraft] = useState(null);
  const [adminAboutDraft, setAdminAboutDraft] = useState(null);
  const [adminNoticesDraft, setAdminNoticesDraft] = useState([]);
  const [newNoticeTitle, setNewNoticeTitle] = useState("");
  const [newNoticeBody, setNewNoticeBody] = useState("");
  const [adminSavingCopy, setAdminSavingCopy] = useState(false);
  const [adminSavingTheme, setAdminSavingTheme] = useState(false);
  const [collageUploading, setCollageUploading] = useState(false);

  // Home content
  const [homeData, setHomeData] = useState(null);
  const [loadingHome, setLoadingHome] = useState(true);

  // History, Sacraments, Guides
  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const [sacramentItems, setSacramentItems] = useState([]);
  const [loadingSacraments, setLoadingSacraments] = useState(false);
  const [sacramentsLoaded, setSacramentsLoaded] = useState(false);

  const [guideItems, setGuideItems] = useState([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [guidesLoaded, setGuidesLoaded] = useState(false);

  // Prayers search
  const [prayersSearch, setPrayersSearch] = useState("");
  const [prayersSuggestions, setPrayersSuggestions] = useState([]);
  const [prayersResults, setPrayersResults] = useState([]);

  // Saints search
  const [saintsSearch, setSaintsSearch] = useState("");
  const [saintsSuggestions, setSaintsSuggestions] = useState([]);
  const [saintsResults, setSaintsResults] = useState([]);

  // Our Lady search
  const [ourLadySearch, setOurLadySearch] = useState("");
  const [ourLadySuggestions, setOurLadySuggestions] = useState([]);
  const [ourLadyResults, setOurLadyResults] = useState([]);

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
            window.localStorage.setItem("vf_language", data.user.languageOverride);
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

    setSacramentsLoaded(false);
    setSacramentItems([]);

    setGuidesLoaded(false);
    setGuideItems([]);
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

  // Keep admin drafts in sync with home data
  useEffect(() => {
    if (!adminAuthenticated) return;
    const mission = homeData?.mission || FALLBACK_MISSION;
    const about = homeData?.about || FALLBACK_ABOUT;
    const notices = homeData?.notices || [];
    const collage = homeData?.collagePhotos || [];

    setAdminMissionDraft(mission);
    setAdminAboutDraft(about);
    setAdminNoticesDraft(notices);
    if (homeData?.liturgicalTheme) {
      setSeasonTheme(homeData.liturgicalTheme);
    }
    void collage;
  }, [adminAuthenticated, homeData]);

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
  }, [
    currentTab,
    language,
    historyLoaded,
    sacramentsLoaded,
    guidesLoaded,
    loadingHistory,
    loadingSacraments,
    loadingGuides,
    loadHistory,
    loadSacraments,
    loadGuides
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
        return;
      }

      try {
        const params = new URLSearchParams();
        params.set("q", q);
        params.set("mode", "suggest");
        params.set("language", language);

        const res = await fetch(`/api/prayers/search/local?${params.toString()}`);
        const data = await res.json();
        if (cancelled) return;

        setPrayersSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
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

      const res = await fetch(`/api/prayers/search/local?${params.toString()}`);
      const data = await res.json();
      setPrayersResults(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      console.error("Prayers full search failed", err);
    }
  }

  function handlePrayersSuggestionClick(suggestion) {
    setPrayersSearch(suggestion.title || "");
    setPrayersSuggestions([]);
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
        return;
      }

      try {
        const params = new URLSearchParams();
        params.set("q", q);
        params.set("mode", "suggest");
        params.set("type", "saint");
        params.set("language", language);

        const res = await fetch(`/api/saints/search/local?${params.toString()}`);
        const data = await res.json();
        if (cancelled) return;

        setSaintsSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
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

      const res = await fetch(`/api/saints/search/local?${params.toString()}`);
      const data = await res.json();
      const results =
        Array.isArray(data.resultsSaints) && data.resultsSaints.length
          ? data.resultsSaints
          : Array.isArray(data.results)
          ? data.results
          : [];
      setSaintsResults(results);
    } catch (err) {
      console.error("Saints full search failed", err);
    }
  }

  function handleSaintsSuggestionClick(suggestion) {
    setSaintsSearch(suggestion.title || suggestion.name || "");
    setSaintsSuggestions([]);
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
        return;
      }

      try {
        const params = new URLSearchParams();
        params.set("q", q);
        params.set("mode", "suggest");
        params.set("type", "apparition");
        params.set("language", language);

        const res = await fetch(`/api/saints/search/local?${params.toString()}`);
        const data = await res.json();
        if (cancelled) return;

        setOurLadySuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
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

      const res = await fetch(`/api/saints/search/local?${params.toString()}`);
      const data = await res.json();
      const results =
        Array.isArray(data.resultsApparitions) && data.resultsApparitions.length
          ? data.resultsApparitions
          : Array.isArray(data.results)
          ? data.results
          : [];
      setOurLadyResults(results);
    } catch (err) {
      console.error("Our Lady full search failed", err);
    }
  }

  function handleOurLadySuggestionClick(suggestion) {
    setOurLadySearch(suggestion.title || suggestion.name || "");
    setOurLadySuggestions([]);
    submitOurLadySearch();
  }

  // Header layout and menus
  function renderHeader() {
    return (
      <header className="vf-header">
        <div className="vf-header-inner">
          <div
            className={
              "vf-header-banner vf-header-banner-" + (seasonTheme || "normal")
            }
            aria-hidden="true"
          >
            <div className="vf-banner-mark" />
          </div>

          <div className="vf-header-title-block">
            <div className="vf-title-row">
              <span className="vf-logo-cross" aria-hidden="true" />
              <h1 className="vf-site-title">Via Fidei</h1>
            </div>
            <p className="vf-site-subtitle">
              Catholic prayers, saints, sacraments, and guides for spiritual growth
            </p>
          </div>

          <nav className="vf-nav" aria-label="Primary">
            <ul className="vf-nav-list">
              {TABS.map((tab) => (
                <li key={tab.id} className="vf-nav-item">
                  <button
                    type="button"
                    className={
                      "vf-nav-tab" + (currentTab === tab.id ? " vf-nav-tab-active" : "")
                    }
                    onClick={() => setCurrentTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="vf-nav-right">
              <div className="vf-icon-group">
                <div className="vf-icon-wrapper">
                  <button
                    type="button"
                    className="vf-account-button"
                    aria-haspopup="menu"
                    aria-expanded={accountMenu === ACCOUNT_STATES.OPEN}
                    onClick={() =>
                      setAccountMenu(
                        accountMenu === ACCOUNT_STATES.OPEN
                          ? ACCOUNT_STATES.CLOSED
                          : ACCOUNT_STATES.OPEN
                      )
                    }
                  >
                    <span className="vf-account-label">Account</span>
                  </button>
                  {accountMenu === ACCOUNT_STATES.OPEN && (
                    <div className="vf-menu" role="menu">
                      {user ? (
                        <>
                          <button
                            type="button"
                            className="vf-menu-item"
                            role="menuitem"
                            onClick={() => {
                              setCurrentTab("profile");
                              setAccountMenu(ACCOUNT_STATES.CLOSED);
                            }}
                          >
                            Profile
                          </button>
                          <button
                            type="button"
                            className="vf-menu-item"
                            role="menuitem"
                            onClick={() => {
                              setSettingsMenu(SETTINGS_STATES.OPEN);
                              setAccountMenu(ACCOUNT_STATES.CLOSED);
                            }}
                          >
                            Settings
                          </button>
                          <button
                            type="button"
                            className="vf-menu-item vf-menu-item-danger"
                            role="menuitem"
                            onClick={handleLogout}
                          >
                            Logout
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="vf-menu-item"
                          role="menuitem"
                          onClick={() => {
                            setCurrentTab("auth");
                            setAccountMenu(ACCOUNT_STATES.CLOSED);
                          }}
                        >
                          Login
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="vf-icon-wrapper">
                  <button
                    type="button"
                    className="vf-icon-button"
                    aria-haspopup="menu"
                    aria-expanded={settingsMenu === SETTINGS_STATES.OPEN}
                    aria-label="Settings"
                    onClick={() =>
                      setSettingsMenu(
                        settingsMenu === SETTINGS_STATES.OPEN
                          ? SETTINGS_STATES.CLOSED
                          : SETTINGS_STATES.OPEN
                      )
                    }
                  >
                    <span className="vf-icon-gear" aria-hidden="true" />
                  </button>
                  {settingsMenu === SETTINGS_STATES.OPEN && (
                    <div className="vf-menu" role="menu">
                      <div className="vf-menu-group-label">Theme</div>
                      <button
                        type="button"
                        className={
                          "vf-menu-item" + (theme === "light" ? " vf-menu-item-active" : "")
                        }
                        role="menuitem"
                        onClick={() => handleThemeChange("light")}
                      >
                        Light
                      </button>
                      <button
                        type="button"
                        className={
                          "vf-menu-item" + (theme === "dark" ? " vf-menu-item-active" : "")
                        }
                        role="menuitem"
                        onClick={() => handleThemeChange("dark")}
                      >
                        Dark
                      </button>
                      <button
                        type="button"
                        className={
                          "vf-menu-item" +
                          (theme === "system" ? " vf-menu-item-active" : "")
                        }
                        role="menuitem"
                        onClick={() => handleThemeChange("system")}
                      >
                        System
                      </button>

                      <div className="vf-menu-divider" />

                      <div className="vf-menu-group-label">Language</div>
                      <div className="vf-menu-inline-field">
                        <select
                          value={language}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                          className="vf-lang-select"
                        >
                          {SUPPORTED_LANGS.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {isAdminRoute && (
                  <span className="vf-admin-pill" aria-label="Admin mode">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </nav>
        </div>
      </header>
    );
  }

  function renderHome() {
    if (loadingHome) {
      return (
        <main className="vf-main">
          <section className="vf-section">
            <article className="vf-card">
              <div className="vf-card-body">
                <p>Loading home content…</p>
              </div>
            </article>
          </section>
        </main>
      );
    }

    const missionFromApi = homeData?.mission;
    const aboutFromApi = homeData?.about;
    const notices = homeData?.notices || [];
    const collagePhotos = homeData?.collagePhotos || [];

    const mission = missionFromApi || FALLBACK_MISSION;
    const about = aboutFromApi || FALLBACK_ABOUT;

    return (
      <main className="vf-main">
        <section className="vf-section">
          {notices.length > 0 && (
            <div className="vf-notices">
              {notices.map((n) => (
                <article key={n.id} className="vf-notice-card">
                  <h2 className="vf-notice-title">{n.title}</h2>
                  <p className="vf-notice-body">{n.body}</p>
                </article>
              ))}
            </div>
          )}

          <article className="vf-card vf-card-hero">
            <header className="vf-card-header">
              <h2 className="vf-card-title">{mission.heading}</h2>
              {mission.subheading && (
                <p className="vf-card-subtitle">{mission.subheading}</p>
              )}
            </header>
            {Array.isArray(mission.body) && (
              <div className="vf-card-body">
                {mission.body.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            )}
          </article>

          <article className="vf-card">
            <header className="vf-card-header">
              <h3 className="vf-card-title">About Via Fidei</h3>
            </header>
            <div className="vf-card-body">
              {Array.isArray(about.paragraphs) &&
                about.paragraphs.map((p, idx) => <p key={idx}>{p}</p>)}
              {Array.isArray(about.quickLinks) && (
                <div className="vf-quick-links">
                  {about.quickLinks.map((link) => (
                    <button
                      key={link.target}
                      type="button"
                      className="vf-chip-link"
                      onClick={() => {
                        if (link.target === "sacraments") {
                          setCurrentTab("sacraments");
                        } else if (link.target.startsWith("guides")) {
                          setCurrentTab("guides");
                        }
                      }}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </article>

          {collagePhotos.length > 0 && (
            <section className="vf-collage-section">
              <div className="vf-collage-grid">
                {collagePhotos.slice(0, 6).map((photo) => (
                  <figure key={photo.id || photo.url} className="vf-collage-item">
                    <img src={photo.url} alt={photo.alt || "Via Fidei photo"} />
                  </figure>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>
    );
  }

  function renderHistory() {
    return (
      <main className="vf-main">
        <section className="vf-section">
          <article className="vf-card">
            <header className="vf-card-header">
              <h2 className="vf-card-title">Liturgy and History</h2>
              <p className="vf-card-subtitle">
                Apostolic Age, Early Church, Councils, Middle Ages, Reformation, modern era,
                the councils of the last century, and the contemporary life of the Church.
              </p>
            </header>

            <div className="vf-card-body">
              {loadingHistory && historyItems.length === 0 && (
                <p>Loading history overview…</p>
              )}

              {!loadingHistory && historyItems.length === 0 && (
                <p>
                  History sections will appear here as soon as content is available for this
                  language.
                </p>
              )}

              {historyItems.length > 0 && (
                <div className="vf-stack">
                  {historyItems.map((section) => (
                    <section key={section.id} className="vf-history-section">
                      <h3 className="vf-section-subtitle">{section.title}</h3>
                      {section.summary && (
                        <p className="vf-history-summary">{section.summary}</p>
                      )}
                      {section.body && (
                        <p className="vf-history-body">{section.body}</p>
                      )}
                    </section>
                  ))}
                </div>
              )}
            </div>
          </article>
        </section>
      </main>
    );
  }

  function renderPrayers() {
    return (
      <main className="vf-main">
        <section className="vf-section">
          <article className="vf-card">
            <header className="vf-card-header">
              <h2 className="vf-card-title">Prayers</h2>
              <p className="vf-card-subtitle">
                A curated library of approved Catholic prayers in many languages.
              </p>
            </header>

            <form className="vf-search-bar" onSubmit={submitPrayersSearch}>
              <label className="vf-field-label" htmlFor="prayers-search">
                Search prayers
              </label>
              <div className="vf-search-input-wrap">
                <input
                  id="prayers-search"
                  type="search"
                  placeholder="Search prayers by title or text"
                  value={prayersSearch}
                  onChange={(e) => setPrayersSearch(e.target.value)}
                />
                <button type="submit" className="vf-btn vf-btn-blue">
                  Search
                </button>
              </div>
              {prayersSuggestions.length > 0 && (
                <ul className="vf-search-suggestions">
                  {prayersSuggestions.slice(0, 3).map((p) => (
                    <li
                      key={p.id}
                      className="vf-search-suggestion"
                      onClick={() => handlePrayersSuggestionClick(p)}
                    >
                      <span className="vf-search-suggestion-title">{p.title}</span>
                      {p.category && (
                        <span className="vf-search-suggestion-meta">{p.category}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </form>

            <div className="vf-card-body">
              {prayersResults.length === 0 && (
                <p>
                  Begin typing above to see suggestions. Submit the search to see the closest
                  matches from the Via Fidei prayer library in your chosen language.
                </p>
              )}
              {prayersResults.length > 0 && (
                <div className="vf-stack">
                  {prayersResults.map((p) => (
                    <article key={p.id} className="vf-prayer-item">
                      <h3 className="vf-prayer-title">{p.title}</h3>
                      {p.category && (
                        <p className="vf-prayer-category">{p.category}</p>
                      )}
                      <p className="vf-prayer-body">{p.content}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </article>
        </section>
      </main>
    );
  }

  function renderSaints() {
    return (
      <main className="vf-main">
        <section className="vf-section">
          <article className="vf-card">
            <header className="vf-card-header">
              <h2 className="vf-card-title">Saints</h2>
              <p className="vf-card-subtitle">
                Lives of the saints with print friendly About pages, patronages, and prayers.
              </p>
            </header>

            <form className="vf-search-bar" onSubmit={submitSaintsSearch}>
              <label className="vf-field-label" htmlFor="saints-search">
                Search saints
              </label>
              <div className="vf-search-input-wrap">
                <input
                  id="saints-search"
                  type="search"
                  placeholder="Search by name or patronage"
                  value={saintsSearch}
                  onChange={(e) => setSaintsSearch(e.target.value)}
                />
                <button type="submit" className="vf-btn vf-btn-blue">
                  Search
                </button>
              </div>
              {saintsSuggestions.length > 0 && (
                <ul className="vf-search-suggestions">
                  {saintsSuggestions.slice(0, 3).map((s) => (
                    <li
                      key={s.id || s.slug || s.title}
                      className="vf-search-suggestion"
                      onClick={() => handleSaintsSuggestionClick(s)}
                    >
                      <span className="vf-search-suggestion-title">
                        {s.title || s.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </form>

            <div className="vf-card-body">
              {saintsResults.length === 0 && (
                <p>
                  Search above to discover saints. Selecting an entry will show a short
                  biography and essential details.
                </p>
              )}

              {saintsResults.length > 0 && (
                <section className="vf-stack">
                  {saintsResults.map((s) => (
                    <article key={s.id} className="vf-saint-item vf-saint-detail">
                      <div className="vf-saint-header">
                        {s.imageUrl && (
                          <div className="vf-saint-avatar-wrap">
                            <img
                              src={s.imageUrl}
                              alt={s.name}
                              className="vf-saint-avatar"
                            />
                          </div>
                        )}
                        <div>
                          <h4 className="vf-saint-name">{s.name}</h4>
                          {s.feastDay && (
                            <p className="vf-saint-meta">
                              Feast day:{" "}
                              {new Date(s.feastDay).toLocaleDateString()}
                            </p>
                          )}
                          {Array.isArray(s.patronages) && s.patronages.length > 0 && (
                            <p className="vf-saint-meta">
                              Patronage: {s.patronages.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      {s.biography && (
                        <p className="vf-saint-bio">
                          {s.biography}
                        </p>
                      )}
                    </article>
                  ))}
                </section>
              )}
            </div>
          </article>
        </section>
      </main>
    );
  }

  function renderOurLady() {
    return (
      <main className="vf-main">
        <section className="vf-section">
          <article className="vf-card">
            <header className="vf-card-header">
              <h2 className="vf-card-title">Our Lady</h2>
              <p className="vf-card-subtitle">
                Approved Marian apparitions and titles of Mary, Mother of the Church.
              </p>
            </header>

            <section className="vf-card-body vf-mary-about">
              <h3 className="vf-section-subtitle">
                Mary, Mother of God and Mother of the Church
              </h3>
              <p>
                Mary is the Mother of God, the Mother of the Church, and the perfect model of
                discipleship. She leads the faithful to her Son with a heart that is humble,
                obedient, and filled with faith.
              </p>
              <p>
                In the mystery of the Holy Family, Mary and Saint Joseph cared for Jesus with
                reverence and trust in the will of God. Joseph, her chaste spouse, guarded and
                protected the child Jesus and serves as a quiet example of fidelity and hidden
                holiness.
              </p>
              <p>
                Through approved apparitions, Our Lady continues to call the faithful to
                conversion, prayer, and deeper love for Christ and his Church.
              </p>
            </section>

            <form className="vf-search-bar" onSubmit={submitOurLadySearch}>
              <label className="vf-field-label" htmlFor="ourlady-search">
                Search Marian apparitions and titles
              </label>
              <div className="vf-search-input-wrap">
                <input
                  id="ourlady-search"
                  type="search"
                  placeholder="Search by title or location"
                  value={ourLadySearch}
                  onChange={(e) => setOurLadySearch(e.target.value)}
                />
                <button type="submit" className="vf-btn vf-btn-blue">
                  Search
                </button>
              </div>
              {ourLadySuggestions.length > 0 && (
                <ul className="vf-search-suggestions">
                  {ourLadySuggestions.slice(0, 3).map((a) => (
                    <li
                      key={a.id || a.slug || a.title}
                      className="vf-search-suggestion"
                      onClick={() => handleOurLadySuggestionClick(a)}
                    >
                      <span className="vf-search-suggestion-title">
                        {a.title || a.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </form>

            <div className="vf-card-body">
              {ourLadyResults.length === 0 && (
                <p>
                  Search above to discover approved apparitions and Marian titles with their
                  stories, locations, and official prayers.
                </p>
              )}

              {ourLadyResults.length > 0 && (
                <section className="vf-stack vf-stack-apparitions">
                  {ourLadyResults.map((a) => (
                    <article key={a.id} className="vf-saint-item vf-saint-detail">
                      <div className="vf-saint-header">
                        {a.imageUrl && (
                          <div className="vf-saint-avatar-wrap">
                            <img
                              src={a.imageUrl}
                              alt={a.title}
                              className="vf-saint-avatar"
                            />
                          </div>
                        )}
                        <div>
                          <h4 className="vf-saint-name">{a.title}</h4>
                          {a.location && (
                            <p className="vf-saint-meta">Location: {a.location}</p>
                          )}
                          {a.feastDay && (
                            <p className="vf-saint-meta">
                              Feast: {new Date(a.feastDay).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      {a.story && <p className="vf-saint-bio">{a.story}</p>}
                    </article>
                  ))}
                </section>
              )}
            </div>
          </article>
        </section>
      </main>
    );
  }

  function renderSacraments() {
    return (
      <main className="vf-main">
        <section className="vf-section">
          <article className="vf-card">
            <header className="vf-card-header">
              <h2 className="vf-card-title">Sacraments</h2>
              <p className="vf-card-subtitle">
                Meaning, biblical foundation, preparation, what to expect, and common questions
                for each of the seven sacraments.
              </p>
            </header>

            <div className="vf-card-body">
              {loadingSacraments && sacramentItems.length === 0 && (
                <p>Loading sacraments…</p>
              )}

              {!loadingSacraments && sacramentItems.length === 0 && (
                <p>
                  Sacrament details will appear here as soon as content is available for this
                  language.
                </p>
              )}

              {sacramentItems.length > 0 && (
                <div className="vf-stack">
                  {sacramentItems.map((s) => (
                    <section key={s.id} className="vf-sacrament-item">
                      <h3 className="vf-section-subtitle">{s.name}</h3>
                      {s.meaning && (
                        <p className="vf-sacrament-meaning">{s.meaning}</p>
                      )}

                      {renderSacramentBiblicalFoundation(s.biblicalFoundation)}
                      {renderSacramentPreparation(s.preparation)}
                      {renderSacramentWhatToExpect(s.whatToExpect)}
                      {renderSacramentQuestions(s.commonQuestions)}
                    </section>
                  ))}
                </div>
              )}
            </div>
          </article>
        </section>
      </main>
    );
  }

  function renderGuides() {
    return (
      <main className="vf-main">
        <section className="vf-section">
          <article className="vf-card">
            <header className="vf-card-header">
              <h2 className="vf-card-title">Guides</h2>
              <p className="vf-card-subtitle">
                Step by step guides for OCIA, Confession, Rosary, Adoration, consecrations,
                and vocations.
              </p>
            </header>

            <div className="vf-card-body">
              {loadingGuides && guideItems.length === 0 && <p>Loading guides…</p>}

              {!loadingGuides && guideItems.length === 0 && (
                <p>
                  Guides will appear here as soon as content is available for this language.
                </p>
              )}

              {guideItems.length > 0 && (
                <div className="vf-stack">
                  {guideItems.map((g) => (
                    <section key={g.id} className="vf-guide-item">
                      <h3 className="vf-section-subtitle">{g.title}</h3>
                      {g.summary && (
                        <p className="vf-guide-summary">{g.summary}</p>
                      )}
                      {renderGuideBodyContent(g.body)}
                      {renderGuideChecklist(g.checklistTemplate)}
                    </section>
                  ))}
                </div>
              )}
            </div>
          </article>
        </section>
      </main>
    );
  }

  function renderProfile() {
    if (!user) {
      return (
        <main className="vf-main">
          <section className="vf-section">
            <article className="vf-card">
              <header className="vf-card-header">
                <h2 className="vf-card-title">Profile</h2>
              </header>
              <div className="vf-card-body">
                <p>You need to be logged in to view your profile.</p>
              </div>
            </article>
          </section>
        </main>
      );
    }

    return (
      <main className="vf-main">
        <section className="vf-section">
          <article className="vf-card">
            <header className="vf-card-header vf-profile-header">
              <div className="vf-profile-avatar-wrap">
                <div className="vf-profile-avatar">
                  {user.profilePictureUrl ? (
                    <img
                      src={user.profilePictureUrl}
                      alt={`${user.firstName} ${user.lastName}`}
                    />
                  ) : (
                    <span className="vf-profile-initials">
                      {user.firstName?.[0]}
                      {user.lastName?.[0]}
                    </span>
                  )}
                  <button
                    type="button"
                    className="vf-profile-avatar-edit"
                    title="Edit Profile Picture"
                    aria-label="Edit Profile Picture"
                  >
                    <span className="vf-icon-pencil" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div>
                <h2 className="vf-card-title">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="vf-card-subtitle">{user.email}</p>
              </div>
            </header>
            <div className="vf-card-body">
              <p>
                Your profile gathers My Prayers, Journal, Goals, and Milestones, along with
                settings for theme, language, and privacy, so that everything supporting your
                spiritual life stays in one place.
              </p>
            </div>
          </article>
        </section>
      </main>
    );
  }

  function renderAuth() {
    return (
      <main className="vf-main">
        <section className="vf-section vf-auth-layout">
          <article className="vf-card vf-auth-card">
            <header className="vf-card-header">
              <h2 className="vf-card-title">Login</h2>
            </header>
            <div className="vf-card-body">
              <p>
                The authentication forms for Create Account, Login, and Reset Password integrate
                with the Via Fidei account system so that interactive features remain personal
                and private.
              </p>
            </div>
          </article>
        </section>
      </main>
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

  // Admin helpers
  function handleAdminLoginSubmit(e) {
    e.preventDefault();
    const username = adminUsername.trim();
    const password = adminPassword;

    if (username === "Ryan Simonds" && password === "Santidade") {
      setAdminAuthenticated(true);
      window.sessionStorage.setItem("vf_admin_authed", "yes");
      setAdminAuthError("");
    } else {
      setAdminAuthError("Invalid admin credentials.");
    }
  }

  async function handleAdminSaveCopy() {
    if (!adminMissionDraft || !adminAboutDraft) return;
    try {
      setAdminSavingCopy(true);
      await fetch("/api/admin/home", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mission: adminMissionDraft,
          about: adminAboutDraft
        })
      });
      await loadHome(language);
    } catch (err) {
      console.error("Failed to save home copy", err);
    } finally {
      setAdminSavingCopy(false);
    }
  }

  async function handleAdminAddNotice(e) {
    e.preventDefault();
    const title = newNoticeTitle.trim();
    const body = newNoticeBody.trim();
    if (!title || !body) return;

    try {
      await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, body })
      });
      setNewNoticeTitle("");
      setNewNoticeBody("");
      await loadHome(language);
    } catch (err) {
      console.error("Failed to add notice", err);
    }
  }

  async function handleAdminSeasonThemeChange(nextTheme) {
    try {
      setSeasonTheme(nextTheme);
      setAdminSavingTheme(true);
      await fetch("/api/admin/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ liturgicalTheme: nextTheme })
      });
      await loadHome(language);
    } catch (err) {
      console.error("Failed to save liturgical theme", err);
    } finally {
      setAdminSavingTheme(false);
    }
  }

  async function handleAdminCollageUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files)
      .slice(0, 6)
      .forEach((file) => {
        formData.append("images", file);
      });

    try {
      setCollageUploading(true);
      await fetch("/api/admin/collage", {
        method: "POST",
        credentials: "include",
        body: formData
      });
      await loadHome(language);
    } catch (err) {
      console.error("Failed to upload collage photos", err);
    } finally {
      setCollageUploading(false);
      e.target.value = "";
    }
  }

  function renderAdminLogin() {
    return (
      <main className="vf-main">
        <section className="vf-section vf-admin-section">
          <article className="vf-card vf-admin-card">
            <header className="vf-card-header">
              <h2 className="vf-card-title">Admin Login</h2>
              <p className="vf-card-subtitle">
                This area allows updates to the home page, notices, images, and seasonal theme.
              </p>
            </header>
            <div className="vf-card-body">
              <form onSubmit={handleAdminLoginSubmit} className="vf-form">
                <div className="vf-form-row">
                  <label className="vf-field-label" htmlFor="admin-username">
                    Username
                  </label>
                  <input
                    id="admin-username"
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
                <div className="vf-form-row">
                  <label className="vf-field-label" htmlFor="admin-password">
                    Password
                  </label>
                  <input
                    id="admin-password"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                {adminAuthError && (
                  <p className="vf-form-error" role="alert">
                    {adminAuthError}
                  </p>
                )}
                <div className="vf-form-actions">
                  <button type="submit" className="vf-btn vf-btn-blue">
                    Enter Admin
                  </button>
                </div>
              </form>
            </div>
          </article>
        </section>
      </main>
    );
  }

  function renderAdmin() {
    if (!adminAuthenticated) {
      return renderAdminLogin();
    }

    const mission = adminMissionDraft || homeData?.mission || FALLBACK_MISSION;
    const about = adminAboutDraft || homeData?.about || FALLBACK_ABOUT;
    const notices = adminNoticesDraft || homeData?.notices || [];
    const collagePhotos = homeData?.collagePhotos || [];

    return (
      <main className="vf-main vf-admin-main">
        <section className="vf-section">
          <article className="vf-card vf-card-hero vf-admin-hero">
            <header className="vf-card-header">
              <h2 className="vf-card-title">Admin Home</h2>
              <p className="vf-card-subtitle">
                Edit the mission, About section, seasonal theme, notices, and home page photos.
              </p>
            </header>
            <div className="vf-card-body vf-admin-grid">
              <section className="vf-admin-panel">
                <h3 className="vf-section-subtitle">Mission statement</h3>
                <div className="vf-form-row">
                  <label className="vf-field-label" htmlFor="admin-mission-heading">
                    Heading
                  </label>
                  <input
                    id="admin-mission-heading"
                    type="text"
                    value={mission.heading || ""}
                    onChange={(e) =>
                      setAdminMissionDraft({
                        ...mission,
                        heading: e.target.value
                      })
                    }
                  />
                </div>
                <div className="vf-form-row">
                  <label className="vf-field-label" htmlFor="admin-mission-subheading">
                    Subheading
                  </label>
                  <input
                    id="admin-mission-subheading"
                    type="text"
                    value={mission.subheading || ""}
                    onChange={(e) =>
                      setAdminMissionDraft({
                        ...mission,
                        subheading: e.target.value
                      })
                    }
                  />
                </div>
                <div className="vf-form-row">
                  <label className="vf-field-label" htmlFor="admin-mission-body">
                    Body paragraphs
                  </label>
                  <textarea
                    id="admin-mission-body"
                    rows={6}
                    value={Array.isArray(mission.body) ? mission.body.join("\n\n") : ""}
                    onChange={(e) =>
                      setAdminMissionDraft({
                        ...mission,
                        body: e.target.value.split(/\n\s*\n/)
                      })
                    }
                  />
                  <p className="vf-field-help">
                    Separate paragraphs with a blank line. This is exactly what visitors see
                    at the top of the home page.
                  </p>
                </div>
              </section>

              <section className="vf-admin-panel">
                <h3 className="vf-section-subtitle">About Via Fidei</h3>
                <div className="vf-form-row">
                  <label className="vf-field-label" htmlFor="admin-about-body">
                    About paragraphs
                  </label>
                  <textarea
                    id="admin-about-body"
                    rows={8}
                    value={
                      Array.isArray(about.paragraphs)
                        ? about.paragraphs.join("\n\n")
                        : ""
                    }
                    onChange={(e) =>
                      setAdminAboutDraft({
                        ...about,
                        paragraphs: e.target.value.split(/\n\s*\n/)
                      })
                    }
                  />
                  <p className="vf-field-help">
                    Separate paragraphs with a blank line. The content appears in the About
                    card on the home page.
                  </p>
                </div>
                <div className="vf-form-actions">
                  <button
                    type="button"
                    className="vf-btn vf-btn-blue"
                    onClick={handleAdminSaveCopy}
                    disabled={adminSavingCopy}
                  >
                    {adminSavingCopy ? "Saving…" : "Save home text"}
                  </button>
                </div>
              </section>
            </div>
          </article>

          <article className="vf-card vf-admin-card">
            <header className="vf-card-header">
              <h3 className="vf-card-title">Seasonal banner theme</h3>
              <p className="vf-card-subtitle">
                Choose which liturgical theme appears in the top banner across the site.
              </p>
            </header>
            <div className="vf-card-body vf-admin-theme">
              <div className="vf-theme-toggle-group">
                <button
                  type="button"
                  className={
                    "vf-btn" +
                    (seasonTheme === "normal" ? " vf-btn-blue" : " vf-btn-outline")
                  }
                  onClick={() => handleAdminSeasonThemeChange("normal")}
                  disabled={adminSavingTheme}
                >
                  Normal time
                </button>
                <button
                  type="button"
                  className={
                    "vf-btn" +
                    (seasonTheme === "advent" ? " vf-btn-blue" : " vf-btn-outline")
                  }
                  onClick={() => handleAdminSeasonThemeChange("advent")}
                  disabled={adminSavingTheme}
                >
                  Advent
                </button>
                <button
                  type="button"
                  className={
                    "vf-btn" +
                    (seasonTheme === "easter" ? " vf-btn-blue" : " vf-btn-outline")
                  }
                  onClick={() => handleAdminSeasonThemeChange("easter")}
                  disabled={adminSavingTheme}
                >
                  Easter
                </button>
              </div>
              <p className="vf-field-help">
                Normal shows a wooden cross, Advent shows the Holy Family, and Easter shows a
                beautiful crucifix in the site banner.
              </p>
            </div>
          </article>

          <article className="vf-card vf-admin-card">
            <header className="vf-card-header">
              <h3 className="vf-card-title">Homepage notices</h3>
              <p className="vf-card-subtitle">
                Notices appear at the very top of the home page, under the banner and above
                the mission.
              </p>
            </header>
            <div className="vf-card-body vf-admin-notices">
              <form className="vf-form vf-notice-form" onSubmit={handleAdminAddNotice}>
                <div className="vf-form-row">
                  <label className="vf-field-label" htmlFor="notice-title">
                    New notice title
                  </label>
                  <input
                    id="notice-title"
                    type="text"
                    value={newNoticeTitle}
                    onChange={(e) => setNewNoticeTitle(e.target.value)}
                  />
                </div>
                <div className="vf-form-row">
                  <label className="vf-field-label" htmlFor="notice-body">
                    New notice text
                  </label>
                  <textarea
                    id="notice-body"
                    rows={3}
                    value={newNoticeBody}
                    onChange={(e) => setNewNoticeBody(e.target.value)}
                  />
                </div>
                <div className="vf-form-actions">
                  <button type="submit" className="vf-btn vf-btn-blue">
                    Add notice
                  </button>
                </div>
              </form>

              {notices.length > 0 && (
                <div className="vf-stack vf-admin-notices-list">
                  {notices.map((n) => (
                    <article key={n.id} className="vf-notice-card">
                      <h4 className="vf-notice-title">{n.title}</h4>
                      <p className="vf-notice-body">{n.body}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </article>

          <article className="vf-card vf-admin-card">
            <header className="vf-card-header">
              <h3 className="vf-card-title">Home page photos</h3>
              <p className="vf-card-subtitle">
                Add one to six photos that appear as a collage at the bottom of the home page.
              </p>
            </header>
            <div className="vf-card-body">
              <div className="vf-form-row">
                <label className="vf-field-label" htmlFor="collage-upload">
                  Add photos
                </label>
                <input
                  id="collage-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handleAdminCollageUpload}
                />
                <p className="vf-field-help">
                  You can choose Take Photo, Photo Library, or Files from your device. Up to
                  six images will appear in a collage with no background frame.
                </p>
                {collageUploading && <p>Uploading photos…</p>}
              </div>

              {collagePhotos && collagePhotos.length > 0 && (
                <div className="vf-collage-preview">
                  <div className="vf-collage-grid">
                    {collagePhotos.slice(0, 6).map((photo) => (
                      <figure key={photo.id || photo.url} className="vf-collage-item">
                        <img src={photo.url} alt={photo.alt || "Via Fidei photo"} />
                      </figure>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        </section>
      </main>
    );
  }

  return (
    <div className="vf-shell">
      {renderHeader()}
      {isAdminRoute ? renderAdmin() : renderCurrentTab()}
      <footer className="vf-footer">
        <div className="vf-footer-inner">
          <span>© {new Date().getFullYear()} Via Fidei. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<AppShell />);
