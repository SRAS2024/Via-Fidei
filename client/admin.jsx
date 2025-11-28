// client/admin.js
import React, { useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";

const SETTINGS_STATES = {
  CLOSED: "closed",
  OPEN: "open"
};

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
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    html.setAttribute("data-theme", prefersDark ? "dark" : "light");
    return;
  }
  html.setAttribute("data-theme", theme);
}

function AdminShell() {
  const [theme, setTheme] = useState(
    window.localStorage.getItem("vf_theme") || "light"
  );
  const [seasonTheme, setSeasonTheme] = useState("normal");
  const [settingsMenu, setSettingsMenu] = useState(SETTINGS_STATES.CLOSED);

  const [language, setLanguage] = useState(
    window.localStorage.getItem("vf_language") || "en"
  );

  const [homeData, setHomeData] = useState(null);
  const [loadingHome, setLoadingHome] = useState(true);

  const [adminAuthenticated, setAdminAuthenticated] = useState(
    () => window.sessionStorage.getItem("vf_admin_authed") === "yes"
  );
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminAuthError, setAdminAuthError] = useState("");

  const [adminMissionDraft, setAdminMissionDraft] = useState(null);
  const [adminAboutDraft, setAdminAboutDraft] = useState(null);
  const [adminNoticesDraft, setAdminNoticesDraft] = useState([]);
  const [newNoticeTitle, setNewNoticeTitle] = useState("");
  const [newNoticeBody, setNewNoticeBody] = useState("");
  const [adminSavingCopy, setAdminSavingCopy] = useState(false);
  const [adminSavingTheme, setAdminSavingTheme] = useState(false);
  const [collageUploading, setCollageUploading] = useState(false);

  // Apply theme
  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem("vf_theme", theme);
  }, [theme]);

  function handleThemeChange(nextTheme) {
    setTheme(nextTheme);
  }

  function handleLanguageChange(nextLang) {
    setLanguage(nextLang);
    window.localStorage.setItem("vf_language", nextLang);
  }

  // Fetch home content for the chosen language
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

  // Keep admin drafts in sync with home data once authenticated
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

  async function handleAdminLoginSubmit(e) {
    e.preventDefault();
    const username = adminUsername.trim();
    const password = adminPassword;

    if (!username || !password) {
      setAdminAuthError("Username and password are required.");
      return;
    }

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setAdminAuthenticated(false);
        window.sessionStorage.removeItem("vf_admin_authed");
        setAdminAuthError(data.error || "Invalid admin credentials.");
        return;
      }

      setAdminAuthenticated(true);
      window.sessionStorage.setItem("vf_admin_authed", "yes");
      setAdminAuthError("");
    } catch (err) {
      console.error("Admin login failed", err);
      setAdminAuthError("Admin login failed. Please try again.");
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

  function renderHeader() {
    const currentSeason = seasonTheme || "normal";
    const logoClass =
      currentSeason === "advent"
        ? "vf-logo-holy-family"
        : currentSeason === "easter"
        ? "vf-logo-crucifix"
        : "vf-logo-cross";

    return (
      <header className="vf-header">
        <div className="vf-header-inner">
          <div
            className={"vf-header-banner vf-header-banner-" + currentSeason}
            aria-hidden="true"
          >
            <div className="vf-banner-mark" />
          </div>

          <div className="vf-header-title-block">
            <div className="vf-title-row">
              <span className={logoClass} aria-hidden="true" />
              <h1 className="vf-site-title">Via Fidei Admin</h1>
            </div>
            <p className="vf-site-subtitle">
              Mission, About, notices, seasonal theme, and home page photos
            </p>
          </div>

          <nav className="vf-nav" aria-label="Admin">
            <div className="vf-nav-right">
              <div className="vf-icon-group">
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
                          "vf-menu-item" +
                          (theme === "light" ? " vf-menu-item-active" : "")
                        }
                        role="menuitem"
                        onClick={() => handleThemeChange("light")}
                      >
                        Light
                      </button>
                      <button
                        type="button"
                        className={
                          "vf-menu-item" +
                          (theme === "dark" ? " vf-menu-item-active" : "")
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
                          onChange={(e) =>
                            handleLanguageChange(e.target.value)
                          }
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

                <span className="vf-admin-pill" aria-label="Admin mode">
                  Admin
                </span>
              </div>
            </div>
          </nav>
        </div>
      </header>
    );
  }

  function renderAdminLogin() {
    return (
      <main className="vf-main">
        <section className="vf-section vf-admin-section">
          <article className="vf-card vf-admin-card">
            <header className="vf-card-header">
              <h2 className="vf-card-title">Admin Login</h2>
              <p className="vf-card-subtitle">
                This area allows updates to the home page, notices,
                images, and seasonal theme.
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
                    onChange={(e) =>
                      setAdminUsername(e.target.value)
                    }
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
                    onChange={(e) =>
                      setAdminPassword(e.target.value)
                    }
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

  function renderAdminContent() {
    if (loadingHome && !homeData) {
      return (
        <main className="vf-main">
          <section className="vf-section vf-admin-section">
            <article className="vf-card vf-admin-card">
              <header className="vf-card-header">
                <h2 className="vf-card-title">Admin Home</h2>
              </header>
              <div className="vf-card-body">
                <p>Loading home content…</p>
              </div>
            </article>
          </section>
        </main>
      );
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
                Edit the mission, About section, seasonal theme, notices,
                and home page photos.
              </p>
            </header>
            <div className="vf-card-body vf-admin-grid">
              <section className="vf-admin-panel">
                <h3 className="vf-section-subtitle">Mission statement</h3>
                <div className="vf-form-row">
                  <label
                    className="vf-field-label"
                    htmlFor="admin-mission-heading"
                  >
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
                  <label
                    className="vf-field-label"
                    htmlFor="admin-mission-subheading"
                  >
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
                  <label
                    className="vf-field-label"
                    htmlFor="admin-mission-body"
                  >
                    Body paragraphs
                  </label>
                  <textarea
                    id="admin-mission-body"
                    rows={6}
                    value={
                      Array.isArray(mission.body)
                        ? mission.body.join("\n\n")
                        : ""
                    }
                    onChange={(e) =>
                      setAdminMissionDraft({
                        ...mission,
                        body: e.target.value.split(/\n\s*\n/)
                      })
                    }
                  />
                  <p className="vf-field-help">
                    Separate paragraphs with a blank line. This is exactly
                    what visitors see at the top of the home page.
                  </p>
                </div>
              </section>

              <section className="vf-admin-panel">
                <h3 className="vf-section-subtitle">About Via Fidei</h3>
                <div className="vf-form-row">
                  <label
                    className="vf-field-label"
                    htmlFor="admin-about-body"
                  >
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
                    Separate paragraphs with a blank line. The content
                    appears in the About card on the home page.
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
                Choose which liturgical theme appears in the top banner
                across the site.
              </p>
            </header>
            <div className="vf-card-body vf-admin-theme">
              <div className="vf-theme-toggle-group">
                <button
                  type="button"
                  className={
                    "vf-btn" +
                    (seasonTheme === "normal"
                      ? " vf-btn-blue"
                      : " vf-btn-outline")
                  }
                  onClick={() => handleAdminSeasonThemeChange("normal")}
                  disabled={adminSavingTheme}
                >
                  Normal
                </button>
                <button
                  type="button"
                  className={
                    "vf-btn" +
                    (seasonTheme === "advent"
                      ? " vf-btn-blue"
                      : " vf-btn-outline")
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
                    (seasonTheme === "easter"
                      ? " vf-btn-blue"
                      : " vf-btn-outline")
                  }
                  onClick={() => handleAdminSeasonThemeChange("easter")}
                  disabled={adminSavingTheme}
                >
                  Easter
                </button>
              </div>
              <p className="vf-field-help">
                Normal shows a wooden cross with a tan and gray banner,
                Advent shows the Holy Family with a gray and red banner,
                and Easter shows a crucifix with blue, gray, and gold
                accents.
              </p>
            </div>
          </article>

          <article className="vf-card vf-admin-card">
            <header className="vf-card-header">
              <h3 className="vf-card-title">Homepage notices</h3>
              <p className="vf-card-subtitle">
                Notices appear at the very top of the home page, under the
                banner and above the mission.
              </p>
            </header>
            <div className="vf-card-body vf-admin-notices">
              <form
                className="vf-form vf-notice-form"
                onSubmit={handleAdminAddNotice}
              >
                <div className="vf-form-row">
                  <label
                    className="vf-field-label"
                    htmlFor="notice-title"
                  >
                    New notice title
                  </label>
                  <input
                    id="notice-title"
                    type="text"
                    value={newNoticeTitle}
                    onChange={(e) =>
                      setNewNoticeTitle(e.target.value)
                    }
                  />
                </div>
                <div className="vf-form-row">
                  <label
                    className="vf-field-label"
                    htmlFor="notice-body"
                  >
                    New notice text
                  </label>
                  <textarea
                    id="notice-body"
                    rows={3}
                    value={newNoticeBody}
                    onChange={(e) =>
                      setNewNoticeBody(e.target.value)
                    }
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
                    <article
                      key={n.id}
                      className="vf-notice-card"
                    >
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
                Add one to six photos that appear as a collage at the
                bottom of the home page.
              </p>
            </header>
            <div className="vf-card-body">
              <div className="vf-form-row">
                <label
                  className="vf-field-label"
                  htmlFor="collage-upload"
                >
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
                  You can choose Take Photo, Photo Library, or Files from
                  your device. Up to six images will appear in a collage
                  with no background frame.
                </p>
                {collageUploading && <p>Uploading photos…</p>}
              </div>

              {collagePhotos && collagePhotos.length > 0 && (
                <div className="vf-collage-preview">
                  <div className="vf-collage-grid">
                    {collagePhotos.slice(0, 6).map((photo) => (
                      <figure
                        key={photo.id || photo.url}
                        className="vf-collage-item"
                      >
                        <img
                          src={photo.url}
                          alt={photo.alt || "Via Fidei photo"}
                        />
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
      {adminAuthenticated ? renderAdminContent() : renderAdminLogin()}
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
if (container) {
  const root = createRoot(container);
  root.render(<AdminShell />);
}
