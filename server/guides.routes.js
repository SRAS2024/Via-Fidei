// server/guides.routes.js
// Guides for Catholic life, practice, discernment, and vocation
// Database first, then optional external JSON, then built in canonical guides.

const express = require("express");
const { requireAuth } = require("./auth.routes");

const router = express.Router();

const SUPPORTED_LANGS = ["en", "es", "pt", "fr", "it", "de", "pl", "ru", "uk"];

// Simple cache for external guides
const externalGuidesCache = new Map();

function getPrisma(req) {
  if (!req.prisma) {
    throw new Error("Prisma client not attached to request");
  }
  return req.prisma;
}

/**
 * Resolve the active language for the request.
 * Priority:
 *   1. Authenticated user preference
 *   2. Explicit query param ?language= or ?lang=
 *   3. DEFAULT_LANGUAGE env
 *   4. Accept Language header
 *   5. English
 */
function resolveLanguage(req) {
  const tryLang = (value) => {
    if (!value) return null;
    const lower = String(value).toLowerCase();
    return SUPPORTED_LANGS.includes(lower) ? lower : null;
  };

  const userPref = req.user && req.user.languageOverride;
  const queryPref = req.query && (req.query.language || req.query.lang);
  const envPref = process.env.DEFAULT_LANGUAGE;

  const fromUser = tryLang(userPref);
  if (fromUser) return fromUser;

  const fromQuery = tryLang(queryPref);
  if (fromQuery) return fromQuery;

  const fromEnv = tryLang(envPref);
  if (fromEnv) return fromEnv;

  const header = req.headers && req.headers["accept-language"];
  if (typeof header === "string" && header.length > 0) {
    const first = header.split(",")[0].trim().toLowerCase();
    if (SUPPORTED_LANGS.includes(first)) return first;
    const base = first.split("-")[0];
    if (SUPPORTED_LANGS.includes(base)) return base;
  }

  return "en";
}

function publicGuide(g) {
  return {
    id: g.id,
    language: g.language,
    slug: g.slug,
    title: g.title,
    summary: g.summary,
    body: g.body,
    guideType: g.guideType,
    checklistTemplate: g.checklistTemplate,
    tags: g.tags || [],
    source: g.source || null,
    sourceUrl: g.sourceUrl || null,
    sourceAttribution: g.sourceAttribution || null,
    updatedAt: g.updatedAt
  };
}

// Built in English guides for core areas
function builtInGuides(language) {
  if (language !== "en") return [];

  const now = new Date();

  // Rosary prayers
  const signOfCross =
    "In the name of the Father, and of the Son, and of the Holy Spirit. Amen.";

  const apostlesCreed =
    "I believe in God, the Father almighty, Creator of heaven and earth, and in Jesus Christ, His only Son, our Lord, " +
    "who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died " +
    "and was buried; He descended into hell; on the third day He rose again from the dead; He ascended into heaven, " +
    "and is seated at the right hand of God the Father almighty; from there He will come to judge the living and the dead. " +
    "I believe in the Holy Spirit, the holy Catholic Church, the communion of saints, the forgiveness of sins, " +
    "the resurrection of the body, and life everlasting. Amen.";

  const ourFather =
    "Our Father, who art in heaven, hallowed be Thy name; Thy kingdom come; Thy will be done on earth as it is in heaven. " +
    "Give us this day our daily bread; and forgive us our trespasses, as we forgive those who trespass against us; " +
    "and lead us not into temptation, but deliver us from evil. Amen.";

  const hailMary =
    "Hail Mary, full of grace, the Lord is with thee; blessed art thou among women, " +
    "and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, " +
    "now and at the hour of our death. Amen.";

  const gloryBe =
    "Glory be to the Father, and to the Son, and to the Holy Spirit, " +
    "as it was in the beginning, is now, and ever shall be, world without end. Amen.";

  const fatimaPrayer =
    "O my Jesus, forgive us our sins, save us from the fires of hell, " +
    "lead all souls to heaven, especially those in most need of Thy mercy. Amen.";

  const hailHolyQueen =
    "Hail, holy Queen, Mother of mercy, our life, our sweetness, and our hope. " +
    "To thee do we cry, poor banished children of Eve; to thee do we send up our sighs, " +
    "mourning and weeping in this valley of tears. Turn, then, most gracious advocate, " +
    "thine eyes of mercy toward us, and after this, our exile, show unto us the blessed fruit of thy womb, Jesus. " +
    "O clement, O loving, O sweet Virgin Mary.\n\n" +
    "Pray for us, O holy Mother of God, that we may be made worthy of the promises of Christ.";

  const rosaryClosingPrayer =
    "O God, whose only begotten Son, by His life, death, and resurrection, " +
    "has purchased for us the rewards of eternal life, grant, we beseech Thee, " +
    "that while meditating on these mysteries of the most holy Rosary of the Blessed Virgin Mary, " +
    "we may imitate what they contain and obtain what they promise, through the same Christ our Lord. Amen.";

  const guides = [
    {
      slug: "entering-the-church-ocia",
      title: "Entering the Church OCIA",
      summary:
        "A gentle overview of the Order of Christian Initiation of Adults, with stages, practices, and questions to bring to your parish.",
      guideType: "OCIA",
      body: {
        intro:
          "The Order of Christian Initiation of Adults is the ordinary way the Church welcomes adults into full communion with Christ and His Church. " +
          "This guide offers a calm, step by step overview of the journey, from first inquiry to the Easter sacraments.",
        sections: [
          {
            title: "1. Inquiry and first conversation",
            paragraphs: [
              "Begin by speaking with your local parish priest or OCIA coordinator. Share your story, your questions, and what has drawn you toward the Catholic faith.",
              "This is a time for listening, asking honest questions, and discerning together how the Lord is working in your life."
            ]
          },
          {
            title: "2. Catechesis and formation",
            paragraphs: [
              "You will attend regular sessions that introduce Scripture, the Creed, sacraments, moral life, and prayer. These gatherings are not exams but invitations to deeper understanding and trust.",
              "The official Catechism of the Catholic Church is a primary reference. Your parish may also recommend accessible introductions to the faith."
            ]
          },
          {
            title: "3. The sacraments of initiation",
            paragraphs: [
              "At the proper time, and after a period of discernment, you may be received into the Church through Baptism if not yet baptized, Confirmation, and Holy Eucharist.",
              "The parish will accompany you with prayer and practical support as you approach these sacraments, often at the Easter Vigil."
            ]
          }
        ]
      },
      checklistTemplate: {
        title: "OCIA journey checklist",
        items: [
          {
            label: "Contact local parish and schedule an initial conversation",
            done: false
          },
          {
            label: "Attend regular OCIA formation sessions",
            done: false
          },
          { label: "Begin daily prayer and Scripture reading", done: false },
          {
            label: "Review the Catechism of the Catholic Church introduction",
            done: false
          },
          {
            label: "Discern readiness for the sacraments of initiation",
            done: false
          }
        ]
      },
      tags: ["ocia", "rcia", "initiation", "catechesis"],
      source: "built-in",
      sourceUrl: null,
      sourceAttribution: "General OCIA practice in the Catholic Church",
      updatedAt: now
    },
    {
      slug: "guide-to-confession",
      title: "Guide to Confession",
      summary:
        "A simple guide for making a good confession, from preparation and examination of conscience to thanksgiving after absolution.",
      guideType: "CONFESSION",
      body: {
        intro:
          "The sacrament of Reconciliation is a meeting with Christ, who forgives, heals, and restores us to grace. " +
          "This guide walks calmly through the steps of making a good confession.",
        sections: [
          {
            title: "1. Prepare before you go",
            paragraphs: [
              "Begin with prayer, asking the Holy Spirit to help you remember your sins and to trust in God’s mercy.",
              "Use a reliable examination of conscience based on the Ten Commandments and the Beatitudes. Be honest, concrete, and hopeful."
            ]
          },
          {
            title: "2. During confession",
            paragraphs: [
              "Kneel or sit, make the Sign of the Cross, and say, Father, bless me, for I have sinned. It has been [time] since my last confession.",
              "Confess your sins with humility and clarity, without unnecessary details. Listen to the priest’s counsel and accept the penance he gives.",
              "Pray an Act of Contrition with sincere sorrow and a desire to avoid sin in the future."
            ]
          },
          {
            title: "3. After confession",
            paragraphs: [
              "Complete your penance as soon as possible, uniting it with Christ’s love for you and for the Church.",
              "Give thanks to God for His mercy and consider how you might grow in the virtues that heal the roots of your sins."
            ]
          }
        ]
      },
      checklistTemplate: {
        title: "Confession preparation checklist",
        items: [
          { label: "Pray and ask the Holy Spirit for light", done: false },
          { label: "Make an examination of conscience", done: false },
          {
            label: "Confess all serious sins in kind and number",
            done: false
          },
          { label: "Pray an Act of Contrition sincerely", done: false },
          {
            label: "Complete the penance given by the priest",
            done: false
          }
        ]
      },
      tags: ["confession", "reconciliation", "mercy"],
      source: "built-in",
      sourceUrl: null,
      sourceAttribution:
        "Traditional Catholic practice of the sacrament of Reconciliation",
      updatedAt: now
    },
    {
      slug: "how-to-pray-the-holy-rosary",
      title: "How to Pray the Holy Rosary",
      summary:
        "A complete, step by step guide for praying the holy Rosary, including the correct prayers at each bead and the flow of the decades.",
      guideType: "ROSARY",
      body: {
        intro:
          "The holy Rosary is a contemplative prayer that leads us to meditate on the life, death, and resurrection of Jesus through the eyes of Mary. " +
          "Each bead is a gentle rhythm of love, and every decade holds a mystery of Christ’s saving work.",
        sections: [
          {
            title: "1. Preparation",
            paragraphs: [
              "Hold the crucifix, quiet your heart, and place yourself in the presence of God. Offer the Rosary for a particular intention, person, or need.",
              "You may choose the set of mysteries according to the day of the week or according to a particular devotion."
            ],
            steps: [
              {
                label: "On the crucifix",
                description:
                  "Make the Sign of the Cross and pray the Apostles Creed.",
                prayerTitle: "Sign of the Cross",
                prayerText: signOfCross
              },
              {
                label: "On the crucifix",
                description: "Pray the Apostles Creed.",
                prayerTitle: "Apostles Creed",
                prayerText: apostlesCreed
              }
            ]
          },
          {
            title: "2. The introductory beads",
            paragraphs: [
              "On the first large bead after the crucifix, pray the Our Father.",
              "On the next three small beads, pray three Hail Marys, traditionally for an increase in faith, hope, and charity.",
              "On the chain or space after the three Hail Marys, pray the Glory Be."
            ],
            steps: [
              {
                label: "First large bead",
                description: "Pray the Our Father.",
                prayerTitle: "Our Father",
                prayerText: ourFather
              },
              {
                label: "Three small beads",
                description:
                  "Pray three Hail Marys, asking for growth in faith, hope, and charity.",
                prayerTitle: "Hail Mary",
                prayerText: hailMary
              },
              {
                label: "Next space or chain",
                description: "Pray the Glory Be.",
                prayerTitle: "Glory Be",
                prayerText: gloryBe
              }
            ]
          },
          {
            title: "3. The five decades",
            paragraphs: [
              "Each decade begins on a large bead and continues through ten small beads. Before each decade, announce the mystery and take a moment of quiet to contemplate it.",
              "As you pray the Hail Marys, keep the mystery gently in mind, allowing the words to become a rhythm of trust and love."
            ],
            steps: [
              {
                label: "Before each decade",
                description:
                  "Announce the mystery and pause briefly to meditate on it. Then pray the Our Father on the large bead.",
                prayerTitle: "Our Father",
                prayerText: ourFather
              },
              {
                label: "Ten small beads of each decade",
                description:
                  "Pray ten Hail Marys while meditating on the mystery.",
                prayerTitle: "Hail Mary",
                prayerText: hailMary
              },
              {
                label: "End of each decade",
                description:
                  "Pray the Glory Be, and, if you wish, the Fatima Prayer, O my Jesus.",
                prayerTitle: "Glory Be and Fatima Prayer",
                prayerText: gloryBe + "\n\n" + fatimaPrayer
              }
            ]
          },
          {
            title: "4. Closing prayers",
            paragraphs: [
              "After completing all five decades, honor Mary as Mother and Queen by praying the Hail Holy Queen.",
              "You may then pray the closing prayer and finish with the Sign of the Cross."
            ],
            steps: [
              {
                label: "After the five decades",
                description: "Pray the Hail Holy Queen.",
                prayerTitle: "Hail Holy Queen",
                prayerText: hailHolyQueen
              },
              {
                label: "Final closing prayer",
                description:
                  "Pray the concluding prayer and then make the Sign of the Cross.",
                prayerTitle: "Closing Prayer and Sign of the Cross",
                prayerText: rosaryClosingPrayer + "\n\n" + signOfCross
              }
            ]
          },
          {
            title: "5. The mysteries of the Rosary",
            paragraphs: [
              "The Joyful Mysteries: The Annunciation, The Visitation, The Nativity, The Presentation in the Temple, The Finding in the Temple.",
              "The Sorrowful Mysteries: The Agony in the Garden, The Scourging at the Pillar, The Crowning with Thorns, The Carrying of the Cross, The Crucifixion.",
              "The Glorious Mysteries: The Resurrection, The Ascension, The Descent of the Holy Spirit, The Assumption of Mary, The Coronation of Mary.",
              "The Luminous Mysteries, also called Mysteries of Light: The Baptism of the Lord, The Wedding at Cana, The Proclamation of the Kingdom, The Transfiguration, The Institution of the Eucharist."
            ]
          }
        ]
      },
      checklistTemplate: {
        title: "Holy Rosary checklist",
        items: [
          { label: "Offer an intention and choose the mysteries", done: false },
          { label: "Sign of the Cross and Apostles Creed", done: false },
          { label: "Our Father on the first large bead", done: false },
          { label: "Three Hail Marys and Glory Be", done: false },
          { label: "Five decades with announced mysteries", done: false },
          { label: "Hail Holy Queen and closing prayer", done: false }
        ]
      },
      tags: ["rosary", "mary", "devotion", "prayer"],
      source: "built-in",
      sourceUrl: null,
      sourceAttribution:
        "Traditional form of the holy Rosary in the Catholic Church",
      updatedAt: now
    },
    {
      slug: "guide-to-adoration",
      title: "Guide to Eucharistic Adoration",
      summary:
        "A calm introduction to spending time with Jesus in the Blessed Sacrament, with simple ways to pray and rest in His presence.",
      guideType: "ADORATION",
      body: {
        intro:
          "Eucharistic Adoration is an encounter with the living Christ, truly present in the Blessed Sacrament. " +
          "This guide offers gentle suggestions for prayer and silence before the Lord.",
        sections: [
          {
            title: "1. Arriving and recollecting",
            paragraphs: [
              "Enter the church with reverence, genuflect before the Blessed Sacrament, and take a moment of silence.",
              "Offer your time to Jesus, asking Him to lead your thoughts, emotions, and desires."
            ]
          },
          {
            title: "2. Listening and responding",
            paragraphs: [
              "You may pray with Scripture, especially the Gospels, slowly reading and listening for a word or phrase that touches your heart.",
              "You can speak to Jesus as to a friend, share your joys and sorrows, and rest in quiet trust before Him."
            ]
          },
          {
            title: "3. Leaving with gratitude",
            paragraphs: [
              "Before you leave, thank the Lord for His presence and any graces received, even if they were hidden.",
              "Ask for the grace to carry His peace, mercy, and love into your daily life."
            ]
          }
        ]
      },
      checklistTemplate: {
        title: "Adoration time checklist",
        items: [
          { label: "Enter reverently and genuflect", done: false },
          { label: "Spend time in silence and listening", done: false },
          { label: "Pray with Scripture or from the heart", done: false },
          { label: "End with a prayer of thanksgiving", done: false }
        ]
      },
      tags: ["adoration", "eucharist", "prayer"],
      source: "built-in",
      sourceUrl: null,
      sourceAttribution:
        "Common pastoral practice for Eucharistic Adoration",
      updatedAt: now
    },
    {
      slug: "discernment-of-vocation",
      title: "Discernment of Vocation",
      summary:
        "A reflective guide for discerning God’s call to marriage, priesthood, consecrated life, or dedicated single life.",
      guideType: "VOCATION",
      body: {
        intro:
          "Every Christian has a vocation, a call to love that gives shape to his or her whole life. " +
          "This guide offers points for prayerful discernment of marriage, priesthood, diaconate, religious life, or other paths of service.",
        sections: [
          {
            title: "1. Listening to the Word of God",
            paragraphs: [
              "Spend regular time with Scripture, especially the Gospels, asking the Lord to reveal His desires for your life.",
              "Notice how your heart responds to passages about marriage, mission, shepherding, or total consecration."
            ]
          },
          {
            title: "2. Daily fidelity and spiritual direction",
            paragraphs: [
              "Grow in daily prayer, frequent confession, and regular reception of the Eucharist.",
              "Seek wise counsel from a priest, spiritual director, or trusted mentor who can help you interpret the movements of your heart."
            ]
          },
          {
            title: "3. Concrete steps",
            paragraphs: [
              "If you feel drawn toward marriage, invest in healthy relationships, virtue, and responsibility.",
              "If you sense a call to priesthood, diaconate, or religious life, reach out to a vocation director or community and begin a respectful conversation.",
              "Remain open, patient, and honest with the Lord, trusting that His timing and His will are good."
            ]
          }
        ]
      },
      checklistTemplate: {
        title: "Vocation discernment checklist",
        items: [
          { label: "Pray daily for light regarding your vocation", done: false },
          { label: "Spend time with Scripture each week", done: false },
          { label: "Receive the sacraments regularly", done: false },
          { label: "Speak with a priest or spiritual director", done: false },
          { label: "Take concrete steps toward possible paths", done: false }
        ]
      },
      tags: ["vocation", "discernment", "marriage", "priesthood", "religious life"],
      source: "built-in",
      sourceUrl: null,
      sourceAttribution:
        "General principles of Catholic vocational discernment",
      updatedAt: now
    }
  ];

  return guides.map((g, idx) => ({
    id: `builtin-guide-${language}-${idx}`,
    language,
    ...g
  }));
}

// Optional external guides JSON
// Configure via GUIDES_EXTERNAL_URL or GUIDES_EXTERNAL_URL_EN etc
async function fetchExternalGuides(language) {
  const cached = externalGuidesCache.get(language);
  if (cached) return cached;

  const upper = language.toUpperCase();
  const specific = process.env[`GUIDES_EXTERNAL_URL_${upper}`];
  const generic = process.env.GUIDES_EXTERNAL_URL;
  const url = specific || generic;

  let external = [];

  if (url && typeof fetch !== "undefined") {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.items)
          ? data.items
          : [];

        external = list
          .map((raw, idx) => {
            if (!raw || typeof raw !== "object") return null;

            const title = String(raw.title || "").trim();
            const summary = String(raw.summary || "").trim();
            if (!title) return null;

            const slugBase =
              raw.slug ||
              title
                .toLowerCase()
                .replace(/[^a-z0-9\s\-]/g, "")
                .replace(/\s+/g, "-");

            return {
              id: String(raw.id || `external-guide-${language}-${idx}`),
              language,
              slug: String(slugBase).slice(0, 140),
              title,
              summary,
              body: raw.body || null,
              guideType: raw.guideType || "GENERAL",
              checklistTemplate: raw.checklistTemplate || null,
              tags: Array.isArray(raw.tags)
                ? raw.tags.map((t) => String(t).toLowerCase())
                : [],
              source: raw.source || "external-json",
              sourceUrl: raw.sourceUrl || null,
              sourceAttribution:
                raw.sourceAttribution || "External guides library",
              updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date()
            };
          })
          .filter(Boolean);
      }
    } catch (err) {
      console.error("[Via Fidei] External guides fetch error", language, err);
    }
  }

  if (external.length === 0) {
    external = builtInGuides(language);
  }

  externalGuidesCache.set(language, external);
  return external;
}

// List guides, optionally filtered by guideType
// GET /api/guides?guideType=OCIA|CONFESSION|ROSARY|ADORATION|CONSECRATION|VOCATION|GENERAL
router.get("/", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);
  const guideType = req.query.guideType || null;

  try {
    const [dbGuides, external] = await Promise.all([
      prisma.guide.findMany({
        where: {
          language,
          isActive: true,
          ...(guideType ? { guideType } : {})
        }
      }),
      fetchExternalGuides(language)
    ]);

    // Merge db and external or built in
    // Prefer database entries when there is a slug or id collision
    const allRaw = [...dbGuides, ...external];

    const seen = new Set();
    const merged = [];

    for (const g of allRaw) {
      if (!g) continue;
      if (guideType && g.guideType !== guideType) continue;

      const key = g.slug || g.id || (g.title || "").toLowerCase();
      if (!key) continue;
      const k = `${language}:${key}`;
      if (seen.has(k)) continue;
      seen.add(k);
      merged.push(g);
    }

    merged.sort((a, b) => {
      const at = (a.guideType || "").toString();
      const bt = (b.guideType || "").toString();
      if (at < bt) return -1;
      if (at > bt) return 1;
      const an = (a.title || "").toString();
      const bn = (b.title || "").toString();
      return an.localeCompare(bn);
    });

    return res.json({
      language,
      items: merged.map(publicGuide)
    });
  } catch (error) {
    console.error("[Via Fidei] Guides list error", error);
    res.status(500).json({ error: "Failed to load guides" });
  }
});

// Load a single guide by id or slug
router.get("/:idOrSlug", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);
  const { idOrSlug } = req.params;

  try {
    let guide = await prisma.guide.findUnique({
      where: { id: idOrSlug }
    });

    if (!guide) {
      guide = await prisma.guide.findUnique({
        where: {
          slug_language: {
            slug: idOrSlug,
            language
          }
        }
      });
    }

    if (guide && guide.isActive) {
      return res.json({ guide: publicGuide(guide) });
    }

    const external = await fetchExternalGuides(language);
    const match =
      external.find((g) => g.id === idOrSlug) ||
      external.find((g) => g.slug === idOrSlug);

    if (!match) {
      return res.status(404).json({ error: "Guide not found" });
    }

    res.json({ guide: publicGuide(match) });
  } catch (error) {
    console.error("[Via Fidei] Guide load error", error);
    res.status(500).json({ error: "Failed to load guide" });
  }
});

// Add as Goal from within a guide
// POST /api/guides/:idOrSlug/add-goal
router.post("/:idOrSlug/add-goal", requireAuth, async (req, res) => {
  const prisma = getPrisma(req);
  const userId = req.user.id;
  const language = resolveLanguage(req);
  const { idOrSlug } = req.params;

  try {
    let guide = await prisma.guide.findUnique({
      where: { id: idOrSlug }
    });

    if (!guide) {
      guide = await prisma.guide.findUnique({
        where: {
          slug_language: {
            slug: idOrSlug,
            language
          }
        }
      });
    }

    // If not in database, try external or built in guides
    if (!guide || !guide.isActive) {
      const external = await fetchExternalGuides(language);
      const match =
        external.find((g) => g.id === idOrSlug) ||
        external.find((g) => g.slug === idOrSlug);

      if (!match) {
        return res.status(404).json({ error: "Guide not found" });
      }
      guide = match;
    }

    let goalType = "CUSTOM";
    switch (guide.guideType) {
      case "OCIA":
        goalType = "TEMPLATE_OCIA";
        break;
      case "CONSECRATION":
        goalType = "TEMPLATE_CONSECRATION";
        break;
      case "VOCATION":
        goalType = "TEMPLATE_VOCATION";
        break;
      case "ROSARY":
      case "CONFESSION":
      case "ADORATION":
      case "GENERAL":
      default:
        goalType = "TEMPLATE_NOVENA";
        break;
    }

    const checklist = guide.checklistTemplate || null;

    const goal = await prisma.goal.create({
      data: {
        userId,
        title: guide.title,
        description: guide.summary || "",
        goalType,
        status: "ACTIVE",
        dueDate: null,
        checklist
      }
    });

    res.status(201).json({ goal });
  } catch (error) {
    console.error("[Via Fidei] Add goal from guide error", error);
    res.status(500).json({ error: "Failed to create goal from guide" });
  }
});

module.exports = router;
