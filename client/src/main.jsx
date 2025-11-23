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

  const [homeData, setHomeData] = useState(null);
  const [loadingHome, setLoadingHome] = useState(true);

  const [prayersSearch, setPrayersSearch] = useState("");
  const [prayersSuggestions, setPrayersSuggestions] = useState([]);
  const [prayersResults, setPrayersResults] = useState([]);

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

        setPrayersSuggestions(data.suggestions || []);
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
      setPrayersResults(data.results || []);
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

        setSaintsSuggestions(data.suggestions || []);
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
        saints: data.resultsSaints || [],
        apparitions: data.resultsApparitions || []
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
              {/* Language selector always visible as requested on Home, but we keep it in header for global clarity */}
              <select
                className="vf-lang-select"
                aria-label="Language"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                {SUPPORTED_LANGS.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>

              <div className="vf-icon-group">
                <div className="vf-icon-wrapper">
                  <button
                    type="button"
                    className="vf-icon-button"
                    aria-haspopup="menu"
                    aria-expanded={accountMenu === ACCOUNT_STATES.OPEN}
                    aria-label="Account"
                    onClick={() =>
                      setAccountMenu(
                        accountMenu === ACCOUNT_STATES.OPEN
                          ? ACCOUNT_STATES.CLOSED
                          : ACCOUNT_STATES.OPEN
                      )
                    }
                  >
                    <span className="vf-icon-avatar" aria-hidden="true" />
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
      return <div className="vf-card">Loading home content…</div>;
    }

    const mission = homeData?.mission;
    const about = homeData?.about;
    const notices = homeData?.notices || [];

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
              <h2 className="vf-card-title">
                {mission?.heading || "Via Fidei"}
              </h2>
              {mission?.subheading && (
                <p className="vf-card-subtitle">{mission.subheading}</p>
              )}
            </header>
            {Array.isArray(mission?.body) && (
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
              {Array.isArray(about?.paragraphs) &&
                about.paragraphs.map((p, idx) => <p key={idx}>{p}</p>)}
              {Array.isArray(about?.quickLinks) && (
                <div className="vf-quick-links">
                  {about.quickLinks.map((link) => (
                    <button
                      key={link.target}
                      type="button"
                      className="vf-chip-link"
                      onClick={() => {
                        if (link.target === "sacraments") setCurrentTab("sacraments");
                        else if (link.target.startsWith("guides")) setCurrentTab("guides");
                        else if (link.target === "guides-confession") setCurrentTab("guides");
                        else if (link.target === "guides-rosary") setCurrentTab("guides");
                        else if (link.target === "guides-ocia") setCurrentTab("guides");
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
              <p>
                This section will present a catechism aligned overview of Church history with
                timelines, key events, and a simple glossary. The pages are designed to be
                print friendly, with clear typography and calm spacing.
              </p>
              <p>
                The client will load history sections from the <code>/api/history</code> endpoint
                and render them in order, from the Apostolic Age to the Contemporary Church.
              </p>
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
                      <p className="vf-prayer-category">{p.category}</p>
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
                              Feast day: {new Date(s.feastDay).toLocaleDateString()}
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
              <p>
                The full client will load sacrament details from <code>/api/sacraments</code> and
                render them with accurate icons and links to Goals and Milestones templates.
              </p>
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
              <p>
                Guides are loaded from <code>/api/guides</code> and can be added directly as
                Goals. Each guide includes an overview, steps, recommended reading, and
                checklist templates.
              </p>
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
          <span>
            © {new Date().getFullYear()} Via Fidei. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<AppShell />);
