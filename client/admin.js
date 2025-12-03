// client/admin.js
import React, { useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";

const h = React.createElement;

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

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem("vf_theme", theme);
  }, [theme]);

  useEffect(() => {
    const season = seasonTheme || "normal";
    document.documentElement.setAttribute("data-season", season);
  }, [seasonTheme]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateAdminSession() {
      try {
        const res = await fetch("/api/admin/status", {
          credentials: "include"
        });
        const data = await res.json();

        if (cancelled) return;

        if (data?.authenticated) {
          setAdminAuthenticated(true);
          window.sessionStorage.setItem("vf_admin_authed", "yes");
        } else {
          setAdminAuthenticated(false);
          window.sessionStorage.removeItem("vf_admin_authed");
        }
      } catch (err) {
        console.error("Admin status check failed", err);
      }
    }

    hydrateAdminSession();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleThemeChange(nextTheme) {
    setTheme(nextTheme);
  }

  function handleLanguageChange(nextLang) {
    setLanguage(nextLang);
    window.localStorage.setItem("vf_language", nextLang);
  }

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

  useEffect(() => {
    if (!adminAuthenticated) return;

    const mission = homeData && homeData.mission ? homeData.mission : FALLBACK_MISSION;
    const about = homeData && homeData.about ? homeData.about : FALLBACK_ABOUT;
    const notices = homeData && homeData.notices ? homeData.notices : [];
    const collage = homeData && homeData.collagePhotos ? homeData.collagePhotos : [];

    setAdminMissionDraft(mission);
    setAdminAboutDraft(about);
    setAdminNoticesDraft(notices);
    if (homeData && homeData.liturgicalTheme) {
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

    const settingsMenuOpen = settingsMenu === SETTINGS_STATES.OPEN;

    return h(
      "header",
      { className: "vf-header" },
      h(
        "div",
        { className: "vf-header-inner" },
        h(
          "div",
          {
            className: "vf-header-banner vf-header-banner-" + currentSeason,
            "aria-hidden": "true"
          },
          h("div", { className: "vf-banner-mark" })
        ),
        h(
          "div",
          { className: "vf-header-title-block" },
          h(
            "div",
            { className: "vf-title-row" },
            h("span", { className: logoClass, "aria-hidden": "true" }),
            h("h1", { className: "vf-site-title" }, "Via Fidei Admin")
          ),
          h(
            "p",
            { className: "vf-site-subtitle" },
            "Mission, About, notices, seasonal theme, and home page photos"
          )
        ),
        h(
          "nav",
          { className: "vf-nav", "aria-label": "Admin" },
          h(
            "div",
            { className: "vf-nav-right" },
            h(
              "div",
              { className: "vf-icon-group" },
              h(
                "div",
                { className: "vf-icon-wrapper" },
                h(
                  "button",
                  {
                    type: "button",
                    className: "vf-icon-button",
                    "aria-haspopup": "menu",
                    "aria-expanded": settingsMenuOpen,
                    "aria-label": "Settings",
                    onClick: () =>
                      setSettingsMenu(
                        settingsMenuOpen
                          ? SETTINGS_STATES.CLOSED
                          : SETTINGS_STATES.OPEN
                      )
                  },
                  h("span", {
                    className: "vf-icon-gear",
                    "aria-hidden": "true"
                  })
                ),
                settingsMenuOpen
                  ? h(
                      "div",
                      { className: "vf-menu", role: "menu" },
                      h(
                        "div",
                        { className: "vf-menu-group-label" },
                        "Theme"
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          className:
                            "vf-menu-item" +
                            (theme === "light" ? " vf-menu-item-active" : ""),
                          role: "menuitem",
                          onClick: () => handleThemeChange("light")
                        },
                        "Light"
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          className:
                            "vf-menu-item" +
                            (theme === "dark" ? " vf-menu-item-active" : ""),
                          role: "menuitem",
                          onClick: () => handleThemeChange("dark")
                        },
                        "Dark"
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          className:
                            "vf-menu-item" +
                            (theme === "system" ? " vf-menu-item-active" : ""),
                          role: "menuitem",
                          onClick: () => handleThemeChange("system")
                        },
                        "System"
                      ),
                      h("div", { className: "vf-menu-divider" }),
                      h(
                        "div",
                        { className: "vf-menu-group-label" },
                        "Language"
                      ),
                      h(
                        "div",
                        { className: "vf-menu-inline-field" },
                        h(
                          "select",
                          {
                            value: language,
                            onChange: (e) =>
                              handleLanguageChange(e.target.value),
                            className: "vf-lang-select"
                          },
                          SUPPORTED_LANGS.map((lang) =>
                            h(
                              "option",
                              { key: lang.code, value: lang.code },
                              lang.label
                            )
                          )
                        )
                      )
                    )
                  : null
              ),
              h(
                "span",
                { className: "vf-admin-pill", "aria-label": "Admin mode" },
                "Admin"
              )
            )
          )
        )
      )
    );
  }

  function renderAdminLogin() {
    return h(
      "main",
      { className: "vf-main" },
      h(
        "section",
        { className: "vf-section vf-admin-section" },
        h(
          "article",
          { className: "vf-card vf-admin-card" },
          h(
            "header",
            { className: "vf-card-header" },
            h("h2", { className: "vf-card-title" }, "Admin Login"),
            h(
              "p",
              { className: "vf-card-subtitle" },
              "This area allows updates to the home page, notices, images, and seasonal theme."
            )
          ),
          h(
            "div",
            { className: "vf-card-body" },
            h(
              "form",
              { onSubmit: handleAdminLoginSubmit, className: "vf-form" },
              h(
                "div",
                { className: "vf-form-row" },
                h(
                  "label",
                  {
                    className: "vf-field-label",
                    htmlFor: "admin-username"
                  },
                  "Username"
                ),
                h("input", {
                  id: "admin-username",
                  type: "text",
                  value: adminUsername,
                  onChange: (e) => setAdminUsername(e.target.value),
                  autoComplete: "username"
                })
              ),
              h(
                "div",
                { className: "vf-form-row" },
                h(
                  "label",
                  {
                    className: "vf-field-label",
                    htmlFor: "admin-password"
                  },
                  "Password"
                ),
                h("input", {
                  id: "admin-password",
                  type: "password",
                  value: adminPassword,
                  onChange: (e) => setAdminPassword(e.target.value),
                  autoComplete: "current-password"
                })
              ),
              adminAuthError
                ? h(
                    "p",
                    { className: "vf-form-error", role: "alert" },
                    adminAuthError
                  )
                : null,
              h(
                "div",
                { className: "vf-form-actions" },
                h(
                  "button",
                  { type: "submit", className: "vf-btn vf-btn-blue" },
                  "Enter Admin"
                )
              )
            )
          )
        )
      )
    );
  }

  function renderAdminContent() {
    if (loadingHome && !homeData) {
      return h(
        "main",
        { className: "vf-main" },
        h(
          "section",
          { className: "vf-section vf-admin-section" },
          h(
            "article",
            { className: "vf-card vf-admin-card" },
            h(
              "header",
              { className: "vf-card-header" },
              h("h2", { className: "vf-card-title" }, "Admin Home")
            ),
            h(
              "div",
              { className: "vf-card-body" },
              h("p", null, "Loading home content…")
            )
          )
        )
      );
    }

    const mission =
      adminMissionDraft || (homeData && homeData.mission) || FALLBACK_MISSION;
    const about =
      adminAboutDraft || (homeData && homeData.about) || FALLBACK_ABOUT;
    const notices =
      adminNoticesDraft || (homeData && homeData.notices) || [];
    const collagePhotos =
      (homeData && homeData.collagePhotos) || [];

    return h(
      "main",
      { className: "vf-main vf-admin-main" },
      h(
        "section",
        { className: "vf-section" },
        // Hero card
        h(
          "article",
          { className: "vf-card vf-card-hero vf-admin-hero" },
          h(
            "header",
            { className: "vf-card-header" },
            h("h2", { className: "vf-card-title" }, "Admin Home"),
            h(
              "p",
              { className: "vf-card-subtitle" },
              "Edit the mission, About section, seasonal theme, notices, and home page photos."
            )
          ),
          h(
            "div",
            { className: "vf-card-body vf-admin-grid" },
            // Mission panel
            h(
              "section",
              { className: "vf-admin-panel" },
              h(
                "h3",
                { className: "vf-section-subtitle" },
                "Mission statement"
              ),
              h(
                "div",
                { className: "vf-form-row" },
                h(
                  "label",
                  {
                    className: "vf-field-label",
                    htmlFor: "admin-mission-heading"
                  },
                  "Heading"
                ),
                h("input", {
                  id: "admin-mission-heading",
                  type: "text",
                  value: mission.heading || "",
                  onChange: (e) =>
                    setAdminMissionDraft({
                      ...mission,
                      heading: e.target.value
                    })
                })
              ),
              h(
                "div",
                { className: "vf-form-row" },
                h(
                  "label",
                  {
                    className: "vf-field-label",
                    htmlFor: "admin-mission-subheading"
                  },
                  "Subheading"
                ),
                h("input", {
                  id: "admin-mission-subheading",
                  type: "text",
                  value: mission.subheading || "",
                  onChange: (e) =>
                    setAdminMissionDraft({
                      ...mission,
                      subheading: e.target.value
                    })
                })
              ),
              h(
                "div",
                { className: "vf-form-row" },
                h(
                  "label",
                  {
                    className: "vf-field-label",
                    htmlFor: "admin-mission-body"
                  },
                  "Body paragraphs"
                ),
                h("textarea", {
                  id: "admin-mission-body",
                  rows: 6,
                  value: Array.isArray(mission.body)
                    ? mission.body.join("\n\n")
                    : "",
                  onChange: (e) =>
                    setAdminMissionDraft({
                      ...mission,
                      body: e.target.value.split(/\n\s*\n/)
                    })
                }),
                h(
                  "p",
                  { className: "vf-field-help" },
                  "Separate paragraphs with a blank line. This is exactly what visitors see at the top of the home page."
                )
              )
            ),
            // About panel
            h(
              "section",
              { className: "vf-admin-panel" },
              h(
                "h3",
                { className: "vf-section-subtitle" },
                "About Via Fidei"
              ),
              h(
                "div",
                { className: "vf-form-row" },
                h(
                  "label",
                  {
                    className: "vf-field-label",
                    htmlFor: "admin-about-body"
                  },
                  "About paragraphs"
                ),
                h("textarea", {
                  id: "admin-about-body",
                  rows: 8,
                  value: Array.isArray(about.paragraphs)
                    ? about.paragraphs.join("\n\n")
                    : "",
                  onChange: (e) =>
                    setAdminAboutDraft({
                      ...about,
                      paragraphs: e.target.value.split(/\n\s*\n/)
                    })
                }),
                h(
                  "p",
                  { className: "vf-field-help" },
                  "Separate paragraphs with a blank line. The content appears in the About card on the home page."
                )
              ),
              h(
                "div",
                { className: "vf-form-actions" },
                h(
                  "button",
                  {
                    type: "button",
                    className: "vf-btn vf-btn-blue",
                    onClick: handleAdminSaveCopy,
                    disabled: adminSavingCopy
                  },
                  adminSavingCopy ? "Saving…" : "Save home text"
                )
              )
            )
          )
        ),
        // Seasonal theme card
        h(
          "article",
          { className: "vf-card vf-admin-card" },
          h(
            "header",
            { className: "vf-card-header" },
            h(
              "h3",
              { className: "vf-card-title" },
              "Seasonal banner theme"
            ),
            h(
              "p",
              { className: "vf-card-subtitle" },
              "Choose which liturgical theme appears in the top banner across the site."
            )
          ),
          h(
            "div",
            { className: "vf-card-body vf-admin-theme" },
            h(
              "div",
              { className: "vf-theme-toggle-group" },
              h(
                "button",
                {
                  type: "button",
                  className:
                    "vf-btn" +
                    (seasonTheme === "normal"
                      ? " vf-btn-blue"
                      : " vf-btn-outline"),
                  onClick: () => handleAdminSeasonThemeChange("normal"),
                  disabled: adminSavingTheme
                },
                "Normal"
              ),
              h(
                "button",
                {
                  type: "button",
                  className:
                    "vf-btn" +
                    (seasonTheme === "advent"
                      ? " vf-btn-blue"
                      : " vf-btn-outline"),
                  onClick: () => handleAdminSeasonThemeChange("advent"),
                  disabled: adminSavingTheme
                },
                "Advent"
              ),
              h(
                "button",
                {
                  type: "button",
                  className:
                    "vf-btn" +
                    (seasonTheme === "easter"
                      ? " vf-btn-blue"
                      : " vf-btn-outline"),
                  onClick: () => handleAdminSeasonThemeChange("easter"),
                  disabled: adminSavingTheme
                },
                "Easter"
              )
            ),
            h(
              "p",
              { className: "vf-field-help" },
              "Normal shows a wooden cross with a tan and gray banner, Advent shows the Holy Family with a gray and red banner, and Easter shows a crucifix with blue, gray, and gold accents."
            )
          )
        ),
        // Notices card
        h(
          "article",
          { className: "vf-card vf-admin-card" },
          h(
            "header",
            { className: "vf-card-header" },
            h(
              "h3",
              { className: "vf-card-title" },
              "Homepage notices"
            ),
            h(
              "p",
              { className: "vf-card-subtitle" },
              "Notices appear at the very top of the home page, under the banner and above the mission."
            )
          ),
          h(
            "div",
            { className: "vf-card-body vf-admin-notices" },
            h(
              "form",
              {
                className: "vf-form vf-notice-form",
                onSubmit: handleAdminAddNotice
              },
              h(
                "div",
                { className: "vf-form-row" },
                h(
                  "label",
                  {
                    className: "vf-field-label",
                    htmlFor: "notice-title"
                  },
                  "New notice title"
                ),
                h("input", {
                  id: "notice-title",
                  type: "text",
                  value: newNoticeTitle,
                  onChange: (e) => setNewNoticeTitle(e.target.value)
                })
              ),
              h(
                "div",
                { className: "vf-form-row" },
                h(
                  "label",
                  {
                    className: "vf-field-label",
                    htmlFor: "notice-body"
                  },
                  "New notice text"
                ),
                h("textarea", {
                  id: "notice-body",
                  rows: 3,
                  value: newNoticeBody,
                  onChange: (e) => setNewNoticeBody(e.target.value)
                })
              ),
              h(
                "div",
                { className: "vf-form-actions" },
                h(
                  "button",
                  { type: "submit", className: "vf-btn vf-btn-blue" },
                  "Add notice"
                )
              )
            ),
            notices && notices.length > 0
              ? h(
                  "div",
                  { className: "vf-stack vf-admin-notices-list" },
                  notices.map((n) =>
                    h(
                      "article",
                      { key: n.id, className: "vf-notice-card" },
                      h(
                        "h4",
                        { className: "vf-notice-title" },
                        n.title
                      ),
                      h("p", { className: "vf-notice-body" }, n.body)
                    )
                  )
                )
              : null
          )
        ),
        // Photos card
        h(
          "article",
          { className: "vf-card vf-admin-card" },
          h(
            "header",
            { className: "vf-card-header" },
            h(
              "h3",
              { className: "vf-card-title" },
              "Home page photos"
            ),
            h(
              "p",
              { className: "vf-card-subtitle" },
              "Add one to six photos that appear as a collage at the bottom of the home page."
            )
          ),
          h(
            "div",
            { className: "vf-card-body" },
            h(
              "div",
              { className: "vf-form-row" },
              h(
                "label",
                {
                  className: "vf-field-label",
                  htmlFor: "collage-upload"
                },
                "Add photos"
              ),
              h("input", {
                id: "collage-upload",
                type: "file",
                accept: "image/*",
                multiple: true,
                capture: "environment",
                onChange: handleAdminCollageUpload
              }),
              h(
                "p",
                { className: "vf-field-help" },
                "You can choose Take Photo, Photo Library, or Files from your device. Up to six images will appear in a collage with no background frame."
              ),
              collageUploading ? h("p", null, "Uploading photos…") : null
            ),
            collagePhotos && collagePhotos.length > 0
              ? h(
                  "div",
                  { className: "vf-collage-preview" },
                  h(
                    "div",
                    { className: "vf-collage-grid" },
                    collagePhotos.slice(0, 6).map((photo) =>
                      h(
                        "figure",
                        {
                          key: photo.id || photo.url,
                          className: "vf-collage-item"
                        },
                        h("img", {
                          src: photo.url,
                          alt: photo.alt || "Via Fidei photo"
                        })
                      )
                    )
                  )
                )
              : null
          )
        )
      )
    );
  }

  return h(
    "div",
    { className: "vf-shell" },
    renderHeader(),
    adminAuthenticated ? renderAdminContent() : renderAdminLogin(),
    h(
      "footer",
      { className: "vf-footer" },
      h(
        "div",
        { className: "vf-footer-inner" },
        h(
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
  root.render(h(AdminShell));
}
