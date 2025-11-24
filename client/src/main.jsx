import React, { useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";

// Tabs in primary navigation
const TABS = [
  { id: "home", label: "Home" },
  { id: "history", label: "History" },
  { id: "prayers", label: "Prayers" },
  { id: "saints", label: "Saints and Our Lady" },
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

function AppShell() {
  const [currentTab, setCurrentTab] = useState("home");

  const [accountMenu, setAccountMenu] = useState(ACCOUNT_STATES.CLOSED);
  const [settingsMenu, setSettingsMenu] = useState(SETTINGS_STATES.CLOSED);

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [theme, setTheme] = useState("light");
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
  const [saintsResults, setSaintsResults] = useState({
    saints: [],
    apparitions: []
  });

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
      // Persist through settings API
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

  // Local search in Saints and Our Lady
  useEffect(() => {
    let cancelled = false;

    async function runSearch() {
      const q = saintsSearch.trim();
      if (!q) {
        setSaintsSuggestions([]);
        setSaintsResults({ saints: [], apparitions: [] });
        return;
      }

      try {
        const params = new URLSearchParams();
        params.set("q", q);
        params.set("mode", "suggest");
        params.set("type", "all");
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
      params.set("type", "all");
      params.set("language", language);

      const res = await fetch(`/api/saints/search/local?${params.toString()}`);
      const data = await res.json();
      setSaintsResults({
        saints: Array.isArray(data.resultsSaints) ? data.resultsSaints : [],
        apparitions: Array.isArray(data.resultsApparitions) ? data.resultsApparitions : []
      });
    } catch (err) {
      console.error("Saints full search failed", err);
    }
  }

  // Header layout and menus
  function renderHeader() {
    return (
      <header className="vf-header">
        <div className="vf-header-inner">
          <div className="vf-header-banner" aria-hidden="true">
            <div className="vf-banner-mark" />
          </div>

          <div className="vf-header-title-block">
            <h1 className="vf-site-title">Via Fidei</h1>
            <p className="vf-site-subtitle">
              Multilingual Catholic prayers, saints, sacraments, and guides
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

    const fallbackMission = {
      heading: "Via Fidei",
      subheading: "A Catholic space for clarity, beauty, and depth",
      body: [
        "Via Fidei is a quiet and reverent space where the devout faithful can grow in their relationship with God and where those who are searching can encounter trusted Catholic teaching at a gentle pace.",
        "The mission of Via Fidei is to be a place where both the non religious and the faithful alike can find the prayers, saints, sacraments, and guides they need to deepen in faith. It is a tool for spiritual growth, not noise.",
        "All content is curated, catechism aligned, and presented in a way that is readable, calm, and ordered from top to bottom, left to right."
      ]
    };

    const fallbackAbout = {
      paragraphs: [
        "Via Fidei is designed to be simple, symmetrical, and approachable. The interface favors clarity over clutter so that you can focus on prayer, study, and discernment.",
        "Every section is multilingual and carefully localized. Prayers, saints, sacraments, history, and guides are paired with visual elements like icons and artwork so that the whole experience feels rooted in the life of the Church.",
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

    const mission = missionFromApi || fallbackMission;
    const about = aboutFromApi || fallbackAbout;

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

          {/* Always visible language selector for Home */}
          <div className="vf-home-toolbar">
            <label htmlFor="vf-home-language" className="vf-field-label">
              Language
            </label>
            <select
              id="vf-home-language"
              className="vf-lang-select"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              {SUPPORTED_LANGS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

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
              <h2 className="vf-card-title">Church History</h2>
              <p className="vf-card-subtitle">
                Apostolic Age, Early Church, Councils, Middle Ages, Reformation, Modern era,
                Vatican Councils, and the Contemporary Church.
              </p>
            </header>
            <div className="vf-card-body">
              {loadingHistory && historyItems.length === 0 && (
                <p>Loading history overview…</p>
              )}

              {!loadingHistory && historyItems.length === 0 && (
                <p>
                  History sections will appear here as soon as content is seeded for this
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

            {/* Local search bar inside Prayers, not in global header */}
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
                    <li key={p.id} className="vf-search-suggestion">
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
              <h2 className="vf-card-title">Saints and Our Lady</h2>
              <p className="vf-card-subtitle">
                Lives of the saints and approved Marian apparitions with print friendly About pages.
              </p>
            </header>

            {/* Local search bar inside Saints and Our Lady */}
            <form className="vf-search-bar" onSubmit={submitSaintsSearch}>
              <label className="vf-field-label" htmlFor="saints-search">
                Search saints and Marian apparitions
              </label>
              <div className="vf-search-input-wrap">
                <input
                  id="saints-search"
                  type="search"
                  placeholder="Search by name, title, or patronage"
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
                    <li key={`${s.kind}-${s.id}`} className="vf-search-suggestion">
                      <span className="vf-search-suggestion-title">{s.title}</span>
                      <span className="vf-search-suggestion-meta">
                        {s.kind === "saint" ? "Saint" : "Our Lady"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </form>

            <div className="vf-card-body">
              {saintsResults.saints.length === 0 &&
                saintsResults.apparitions.length === 0 && (
                  <p>
                    Search above to discover saints and Marian apparitions. Selecting an entry
                    in the full app will open a dedicated About page with image, story, and
                    official prayer.
                  </p>
                )}

              {saintsResults.saints.length > 0 && (
                <section className="vf-stack">
                  <h3 className="vf-section-subtitle">Saints</h3>
                  {saintsResults.saints.map((s) => (
                    <article key={s.id} className="vf-saint-item">
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
                        </div>
                      </div>
                      <p className="vf-saint-bio">{s.biography}</p>
                    </article>
                  ))}
                </section>
              )}

              {saintsResults.apparitions.length > 0 && (
                <section className="vf-stack vf-stack-apparitions">
                  <h3 className="vf-section-subtitle">Our Lady</h3>
                  {saintsResults.apparitions.map((a) => (
                    <article key={a.id} className="vf-saint-item">
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
                        </div>
                      </div>
                      <p className="vf-saint-bio">{a.story}</p>
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
                  Sacrament details will appear here as soon as content is seeded for this
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
                      {s.biblicalFoundation && (
                        <p className="vf-sacrament-field">
                          <strong>Biblical foundation:</strong> {s.biblicalFoundation}
                        </p>
                      )}
                      {s.preparation && (
                        <p className="vf-sacrament-field">
                          <strong>How to prepare:</strong> {s.preparation}
                        </p>
                      )}
                      {s.whatToExpect && (
                        <p className="vf-sacrament-field">
                          <strong>What to expect:</strong> {s.whatToExpect}
                        </p>
                      )}
                      {Array.isArray(s.commonQuestions) && s.commonQuestions.length > 0 && (
                        <ul className="vf-sacrament-questions">
                          {s.commonQuestions.map((q, idx) => (
                            <li key={idx}>{q}</li>
                          ))}
                        </ul>
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
              {loadingGuides && guideItems.length === 0 && (
                <p>Loading guides…</p>
              )}

              {!loadingGuides && guideItems.length === 0 && (
                <p>
                  Guides will appear here as soon as content is seeded for this language.
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
                      {g.body && <p className="vf-guide-body">{g.body}</p>}
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
                This area will show My Prayers, Journal, Goals, and Milestones, with clear
                confirmations for removal and deletion, plus settings for theme, language,
                and privacy overview.
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
                The full authentication forms will live here, matching the specification for
                Create Account, Login, and Reset Password with the no email reset flow.
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
    if (currentTab === "sacraments") return renderSacraments();
    if (currentTab === "guides") return renderGuides();
    if (currentTab === "profile") return renderProfile();
    if (currentTab === "auth") return renderAuth();
    return renderHome();
  }

  return (
    <div className="vf-shell">
      {renderHeader()}
      {renderCurrentTab()}
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
