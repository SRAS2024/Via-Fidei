// client/admin.js
import React, { useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";

const h = React.createElement;

const SETTINGS_STATES = {
  CLOSED: "closed",
  OPEN: "open"
};

const ADMIN_NAV = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "history", label: "History", icon: "📜" },
  { id: "prayers", label: "Prayers", icon: "📿" },
  { id: "saints", label: "Saints", icon: "👼" },
  { id: "ourlady", label: "Our Lady", icon: "✶" },
  { id: "sacraments", label: "Sacraments", icon: "🕊️" },
  { id: "guides", label: "Guides", icon: "🧭" }
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
  const [navOpen, setNavOpen] = useState(false);

  const [language, setLanguage] = useState(
    window.localStorage.getItem("vf_language") || "en"
  );

  const [homeData, setHomeData] = useState(null);
  const [loadingHome, setLoadingHome] = useState(true);
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState("");
  const [loadingOverview, setLoadingOverview] = useState(false);

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

  function SacredSymbol({ season }) {
    if (season === "advent") {
      return h(
        "svg",
        { className: "vf-sacred-mark", viewBox: "0 0 120 120", role: "img", "aria-label": "Holy Family" },
        h(
          "defs",
          null,
          h(
            "linearGradient",
            { id: "adminHolyFamily", x1: "0", x2: "1", y1: "0", y2: "1" },
            h("stop", { offset: "0%", stopColor: "#f6d7ae" }),
            h("stop", { offset: "100%", stopColor: "#a33c3b" })
          )
        ),
        h("circle", { cx: 60, cy: 60, r: 52, fill: "url(#adminHolyFamily)", opacity: 0.16 }),
        h("path", {
          d: "M35 82c4-12 10-22 20-29 10 7 17 17 21 29",
          fill: "none",
          stroke: "#ead6c2",
          strokeWidth: 6,
          strokeLinecap: "round"
        }),
        h("path", {
          d: "M60 38c0 6-4 10-10 10s-10-4-10-10 4-10 10-10 10 4 10 10Zm28 10c0 5.5-4.5 10-10 10s-10-4.5-10-10 4.5-10 10-10 10 4.5 10 10Z",
          fill: "#f7f1e8"
        }),
        h("path", {
          d: "M52 48c3 6 8 10 14 10 6 0 11-4 14-10",
          fill: "none",
          stroke: "#f7f1e8",
          strokeWidth: 5,
          strokeLinecap: "round"
        })
      );
    }

    if (season === "easter") {
      return h(
        "svg",
        { className: "vf-sacred-mark", viewBox: "0 0 120 120", role: "img", "aria-label": "Crucifix" },
        h(
          "defs",
          null,
          h(
            "linearGradient",
            { id: "adminCrucifix", x1: "0", x2: "1", y1: "0", y2: "1" },
            h("stop", { offset: "0%", stopColor: "#f2d98c" }),
            h("stop", { offset: "100%", stopColor: "#5b7ec5" })
          ),
          h(
            "linearGradient",
            { id: "adminCrucifixWood", x1: "0", x2: "0", y1: "0", y2: "1" },
            h("stop", { offset: "0%", stopColor: "#d8b980" }),
            h("stop", { offset: "100%", stopColor: "#7a5a32" })
          )
        ),
        h("circle", { cx: 60, cy: 60, r: 54, fill: "url(#adminCrucifix)", opacity: 0.24 }),
        h("rect", { x: 52, y: 18, width: 16, height: 86, rx: 7, fill: "url(#adminCrucifixWood)", stroke: "#674c2c", strokeWidth: 1.4 }),
        h("rect", { x: 26, y: 44, width: 68, height: 18, rx: 9, fill: "url(#adminCrucifixWood)", stroke: "#674c2c", strokeWidth: 1.2 }),
        h("path", { d: "M60 28c-3 6-4 14-4 20 0 9 1 17 4 24", stroke: "#f7e6bb", strokeWidth: 2, strokeLinecap: "round", fill: "none" }),
        h(
          "g",
          { fill: "#f6efe1", stroke: "#d3b775", strokeWidth: 1.2, strokeLinecap: "round", strokeLinejoin: "round" },
          h("path", { d: "M52 52c3-6 6-10 8-10s5 4 8 10c3 6 4 16 4 26-3 3-8 5-12 5s-9-2-12-5c0-10 1-20 4-26Z" }),
          h("path", { d: "M60 46c3 0 5-2 5-5s-2-5-5-5-5 2-5 5 2 5 5 5Z" }),
          h("path", { d: "M46 52c4 2 9 4 14 4s10-2 14-4" })
        ),
        h("path", { d: "M40 44c6 3 12 4 20 4s14-1 20-4", fill: "none", stroke: "#f4e4b3", strokeWidth: 2 })
      );
    }

    return h(
      "svg",
      { className: "vf-sacred-mark", viewBox: "0 0 120 120", role: "img", "aria-label": "Wooden cross" },
      h(
        "defs",
        null,
        h(
          "linearGradient",
          { id: "adminCross", x1: "0", x2: "1", y1: "0", y2: "1" },
          h("stop", { offset: "0%", stopColor: "#b68455" }),
          h("stop", { offset: "100%", stopColor: "#5d3d26" })
        )
      ),
      h("circle", { cx: 60, cy: 60, r: 54, fill: "#f6eadd", opacity: 0.6 }),
      h("rect", { x: 50, y: 16, width: 20, height: 88, rx: 10, fill: "url(#adminCross)", stroke: "#2f1b10", strokeWidth: 1.4 }),
      h("rect", { x: 23, y: 44, width: 74, height: 20, rx: 10, fill: "url(#adminCross)", stroke: "#2f1b10", strokeWidth: 1.2 }),
      h("path", { d: "M36 48c6 8 16 13 24 13s18-5 24-13", fill: "none", stroke: "#e8d7c0", strokeWidth: 3, strokeLinecap: "round" }),
      h("path", { d: "M60 22c-6 10-6 26 0 38", fill: "none", stroke: "#d2b28c", strokeWidth: 2, strokeLinecap: "round" }),
      h("path", { d: "M60 46c-8 0-12 2-18 6m36 0c-6-4-10-6-18-6", fill: "none", stroke: "#e5cba9", strokeWidth: 1.6 })
    );
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
        if (!res.ok) {
          throw new Error(`Home request failed: ${res.status}`);
        }
        const data = await res.json();
        setHomeData(data);
        if (data && data.liturgicalTheme) {
          setSeasonTheme(data.liturgicalTheme);
        }
      } catch (err) {
        console.error("Failed to load home content", err);
        setHomeData({
          mission: FALLBACK_MISSION,
          about: FALLBACK_ABOUT,
          notices: [],
          collagePhotos: []
        });
      } finally {
        setLoadingHome(false);
      }
    },
    []
  );

  const loadOverview = useCallback(
    async (lang) => {
      if (!adminAuthenticated) return;
      try {
        setLoadingOverview(true);
        setOverviewError("");
        const params = new URLSearchParams();
        if (lang) {
          params.set("language", lang);
        }
        const res = await fetch(`/api/admin/overview?${params.toString()}`, {
          credentials: "include"
        });
        if (res.status === 401) {
          setAdminAuthenticated(false);
          window.sessionStorage.removeItem("vf_admin_authed");
          throw new Error("Admin session expired");
        }
        if (!res.ok) {
          throw new Error(`Overview request failed: ${res.status}`);
        }
        const data = await res.json();
        setOverview(data);
      } catch (err) {
        console.error("Failed to load admin overview", err);
        setOverviewError(
          "Overview counts are unavailable right now. Try refreshing after a moment."
        );
      } finally {
        setLoadingOverview(false);
      }
    },
    [adminAuthenticated]
  );

  useEffect(() => {
    loadHome(language);
  }, [language, loadHome]);

  useEffect(() => {
    if (!adminAuthenticated) return;
    loadOverview(language);
  }, [adminAuthenticated, language, loadOverview]);

  useEffect(() => {
    if (adminAuthenticated) return;
    setOverview(null);
    setOverviewError("");
    setLoadingOverview(false);
  }, [adminAuthenticated]);

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
    const settingsMenuOpen = settingsMenu === SETTINGS_STATES.OPEN;

    return h(
      "header",
      { className: "vf-header" },
      h(
        "div",
        { className: "vf-banner vf-banner-" + currentSeason },
        h(
          "div",
          { className: "vf-logo-block" },
          h(SacredSymbol, { season: currentSeason }),
          h(
            "div",
            { className: "vf-logo-text" },
            h("span", { className: "vf-logo-wordmark" }, "Via Fidei Admin"),
            h(
              "span",
              { className: "vf-logo-sub" },
              "Live preview for mission, notices, and seasonal theme"
            )
          )
        )
      ),
      h(
        "div",
        { className: "vf-nav-row" },
        h(
          "button",
          {
            className: "vf-menu-toggle",
            "aria-label": "Toggle navigation",
            onClick: () => setNavOpen((open) => !open)
          },
          "☰"
        ),
        h(
          "nav",
          {
            className: "vf-nav" + (navOpen ? " vf-nav-open" : ""),
            "aria-label": "Admin sections"
          },
          h(
            "ul",
            null,
            ADMIN_NAV.map((item) =>
              h(
                "li",
                { key: item.id },
                h(
                  "button",
                  {
                    className: "",
                    onClick: () => {
                      const el = document.getElementById(item.id);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth" });
                      }
                      setNavOpen(false);
                    }
                  },
                  h("span", { className: "vf-nav-icon", "aria-hidden": true }, item.icon),
                  h("span", null, item.label)
                )
              )
            )
          )
        ),
        h(
          "div",
          { className: "vf-secondary-actions" },
          h(
            "button",
            { className: "vf-account", type: "button" },
            "Account"
          ),
          h(
            "div",
            { className: "vf-icon-wrapper" },
            h(
              "button",
              {
                type: "button",
                className: "vf-icon-button vf-gear",
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
              "⚙️"
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
                  h(
                    "div",
                    { className: "vf-menu-group-label" },
                    "Liturgical theme"
                  ),
                  h(
                    "button",
                    {
                      type: "button",
                      className:
                        "vf-menu-item" +
                        (seasonTheme === "normal"
                          ? " vf-menu-item-active"
                          : ""),
                      role: "menuitem",
                      onClick: () => setSeasonTheme("normal")
                    },
                    "Ordinary"
                  ),
                  h(
                    "button",
                    {
                      type: "button",
                      className:
                        "vf-menu-item" +
                        (seasonTheme === "advent"
                          ? " vf-menu-item-active"
                          : ""),
                      role: "menuitem",
                      onClick: () => setSeasonTheme("advent")
                    },
                    "Advent"
                  ),
                  h(
                    "button",
                    {
                      type: "button",
                      className:
                        "vf-menu-item" +
                        (seasonTheme === "easter"
                          ? " vf-menu-item-active"
                          : ""),
                      role: "menuitem",
                      onClick: () => setSeasonTheme("easter")
                    },
                    "Easter"
                  )
                )
              : null
          )
        )
      ),
      h(
        "div",
        { className: "vf-controls-row" },
        h(
          "div",
          { className: "vf-control-group" },
          h(
            "label",
            { className: "vf-inline-label" },
            h("span", null, "Language"),
            h(
              "select",
              {
                value: language,
                className: "vf-select",
                onChange: (e) => handleLanguageChange(e.target.value)
              },
              SUPPORTED_LANGS.map((lang) =>
                h(
                  "option",
                  { key: lang.code, value: lang.code },
                  lang.label
                )
              )
            )
          ),
          h(
            "label",
            { className: "vf-inline-label" },
            h("span", null, "Season"),
            h(
              "select",
              {
                value: seasonTheme,
                className: "vf-select",
                onChange: (e) => setSeasonTheme(e.target.value)
              },
              h("option", { value: "normal" }, "Ordinary"),
              h("option", { value: "advent" }, "Advent"),
              h("option", { value: "easter" }, "Easter")
            )
          )
        ),
        h(
          "div",
          { className: "vf-toggle", role: "group", "aria-label": "Color theme" },
          h(
            "button",
            {
              className: theme === "light" ? "active" : "",
              onClick: () => handleThemeChange("light"),
              type: "button"
            },
            "Light"
          ),
          h(
            "button",
            {
              className: theme === "dark" ? "active" : "",
              onClick: () => handleThemeChange("dark"),
              type: "button"
            },
            "Dark"
          ),
          h(
            "button",
            {
              className: theme === "system" ? "active" : "",
              onClick: () => handleThemeChange("system"),
              type: "button"
            },
            "System"
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
        // Overview card
        h(
          "article",
          { className: "vf-card vf-admin-card" },
          h(
            "header",
            { className: "vf-card-header" },
            h("h3", { className: "vf-card-title" }, "Data overview"),
            h(
              "p",
              { className: "vf-card-subtitle" },
              "Confirm seeds, counts, and language before making edits."
            )
          ),
          h(
            "div",
            { className: "vf-card-body" },
            overviewError
              ? h(
                  "p",
                  { className: "vf-inline-alert" },
                  overviewError
                )
              : null,
            loadingOverview
              ? h("p", null, "Loading overview…")
              : null,
            overview && overview.counts
              ? h(
                  "div",
                  { className: "vf-admin-stats" },
                  [
                    { key: "prayers", label: "Prayers" },
                    { key: "saints", label: "Saints" },
                    { key: "apparitions", label: "Our Lady" },
                    { key: "sacraments", label: "Sacraments" },
                    { key: "historySections", label: "History" },
                    { key: "guides", label: "Guides" },
                    { key: "notices", label: "Notices" }
                  ].map((stat) =>
                    h(
                      "div",
                      { key: stat.key, className: "vf-admin-stat" },
                      h("span", { className: "vf-admin-stat-label" }, stat.label),
                      h(
                        "strong",
                        { className: "vf-admin-stat-value" },
                        overview.counts[stat.key] ?? "—"
                      )
                    )
                  )
                )
              : null,
            h(
              "div",
              { className: "vf-form-actions" },
              h(
                "button",
                {
                  type: "button",
                  className: "vf-btn vf-btn-outline",
                  onClick: () => loadOverview(language),
                  disabled: loadingOverview
                },
                loadingOverview ? "Refreshing…" : "Refresh overview"
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
