// server/sacraments.routes.js
// Seven sacraments, content, and links to milestones and goals
// Database first, then optional external JSON, then built in canonical content.

const express = require("express");

const router = express.Router();

const SUPPORTED_LANGS = ["en", "es", "pt", "fr", "it", "de", "pl", "ru", "uk"];

// Optional cache for external or built in sacraments
const externalSacramentsCache = new Map();

function getPrisma(req) {
  if (!req.prisma) {
    throw new Error("Prisma client not attached to request");
  }
  return req.prisma;
}

function resolveLanguage(req) {
  const override =
    req.user?.languageOverride ||
    req.query.language ||
    process.env.DEFAULT_LANGUAGE ||
    "en";

  const lower = String(override).toLowerCase();

  if (SUPPORTED_LANGS.includes(lower)) return lower;

  const header = req.headers["accept-language"];
  if (typeof header === "string") {
    const first = header.split(",")[0].trim().toLowerCase();
    if (SUPPORTED_LANGS.includes(first)) return first;
    const base = first.split("-")[0];
    if (SUPPORTED_LANGS.includes(base)) return base;
  }

  return "en";
}

function publicSacrament(s) {
  return {
    id: s.id,
    language: s.language,
    slug: s.slug,
    name: s.name,
    iconKey: s.iconKey || null,
    meaning: s.meaning,
    biblicalFoundation: s.biblicalFoundation,
    preparation: s.preparation,
    whatToExpect: s.whatToExpect,
    commonQuestions: s.commonQuestions || [],
    tags: s.tags || [],
    source: s.source || null,
    sourceUrl: s.sourceUrl || null,
    sourceAttribution: s.sourceAttribution || null,
    updatedAt: s.updatedAt
  };
}

// Canonical sacraments order for fallback content
const CANONICAL_SACRAMENT_ORDER = [
  "baptism",
  "confirmation",
  "eucharist",
  "penance",
  "anointing-of-the-sick",
  "holy-orders",
  "matrimony"
];

function sacramentOrderIndex(slug) {
  const idx = CANONICAL_SACRAMENT_ORDER.indexOf(slug);
  return idx === -1 ? 999 : idx;
}

// Built in English sacraments with meaning, history, and what we believe
function builtInSacraments(language) {
  if (language !== "en") return [];

  const now = new Date();

  const sacraments = [
    {
      slug: "baptism",
      name: "Baptism",
      iconKey: "baptism",
      meaning:
        "Baptism is the first sacrament of Christian initiation. Through water and the Holy Spirit a person is freed from original sin, " +
        "reborn as a child of God, and incorporated into the Body of Christ, the Church.",
      biblicalFoundation: [
        {
          reference: "Matthew 28:19 20",
          text:
            "Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit."
        },
        {
          reference: "John 3:5",
          text:
            "Unless one is born of water and the Spirit, he cannot enter the kingdom of God."
        },
        {
          reference: "Acts 2:38",
          text:
            "Repent and be baptized every one of you in the name of Jesus Christ for the forgiveness of your sins."
        }
      ],
      preparation: {
        overview:
          "For infants, parents and godparents prepare through catechesis and a decision to raise the child in the faith. " +
          "For older children and adults, a period of catechesis and conversion precedes the sacrament.",
        steps: [
          "Meet with the parish priest or pastoral staff to request Baptism.",
          "Participate in baptismal preparation sessions.",
          "Choose godparents who are practicing Catholics and can assist in the child’s growth in faith.",
          "Profess the faith and renounce sin at the liturgy or during the rite."
        ]
      },
      whatToExpect: {
        short:
          "During Baptism, the priest or deacon pours water over the person’s head, or immerses them in water, while invoking the Holy Trinity. " +
          "Anointings, a white garment, and a baptismal candle symbolize new life and the light of Christ.",
        notes: [
          "The liturgy often takes place within Mass or in a parish celebration.",
          "The community welcomes the newly baptized and promises support in faith."
        ]
      },
      commonQuestions: [
        {
          question: "Why does the Church baptize infants?",
          answer:
            "Because Baptism is a gift of God’s grace and not earned by any action of ours, the Church lovingly offers it to infants so that they may share in the divine life from the beginning of their Christian journey."
        },
        {
          question: "Can someone be baptized more than once?",
          answer:
            "No. Baptism imprints an indelible spiritual mark. If a person was baptized validly in another Christian community, that Baptism is not repeated."
        }
      ],
      tags: ["initiation", "baptism", "new life"],
      source: "built-in",
      sourceUrl: null,
      sourceAttribution:
        "Catechism of the Catholic Church on the sacrament of Baptism",
      updatedAt: now
    },
    {
      slug: "confirmation",
      name: "Confirmation",
      iconKey: "confirmation",
      meaning:
        "Confirmation is the sacrament that completes baptismal grace. The confirmed are sealed with the gift of the Holy Spirit, " +
        "strengthened to witness to Christ, and sent to participate more fully in the mission of the Church.",
      biblicalFoundation: [
        {
          reference: "Acts 8:14 17",
          text:
            "The apostles laid their hands on the baptized, and they received the Holy Spirit."
        },
        {
          reference: "Acts 2:1 4",
          text:
            "On Pentecost the Holy Spirit came upon the apostles, filling them with power and boldness to proclaim the Gospel."
        }
      ],
      preparation: {
        overview:
          "Candidates ordinarily receive catechesis on the Creed, the sacraments, moral life, and prayer. " +
          "They are invited to a deeper personal relationship with Christ and to active participation in the Church.",
        steps: [
          "Meet with parish staff to enroll in Confirmation preparation.",
          "Attend catechetical sessions and retreats as required.",
          "Choose a Confirmation sponsor who lives the Catholic faith.",
          "Pray regularly and discern how the Holy Spirit is calling you to serve."
        ]
      },
      whatToExpect: {
        short:
          "During the rite of Confirmation the bishop or a delegated priest lays hands on each candidate, prays for the gift of the Holy Spirit, " +
          "and anoints the forehead with sacred chrism while saying, Be sealed with the Gift of the Holy Spirit.",
        notes: [
          "Candidates renew their baptismal promises before being confirmed.",
          "The community prays that the newly confirmed will live as courageous witnesses."
        ]
      },
      commonQuestions: [
        {
          question: "Is Confirmation a kind of graduation from faith formation?",
          answer:
            "No. Confirmation strengthens the baptized to live their faith more deeply. It is a beginning of mature Christian discipleship, not an end."
        },
        {
          question: "Why does the bishop usually confirm?",
          answer:
            "The bishop is the visible sign of communion with the wider Church. His presence expresses that Confirmation unites us more closely with the whole Catholic Church."
        }
      ],
      tags: ["initiation", "confirmation", "holy spirit"],
      source: "built-in",
      sourceUrl: null,
      sourceAttribution:
        "Catechism of the Catholic Church on the sacrament of Confirmation",
      updatedAt: now
    },
    {
      slug: "eucharist",
      name: "The Holy Eucharist",
      iconKey: "eucharist",
      meaning:
        "The Eucharist is the sacrament in which Jesus Christ gives Himself to us as true Body and Blood, Soul and Divinity. " +
        "It makes present the one sacrifice of Christ on the Cross and unites us in communion with Him and with one another.",
      biblicalFoundation: [
        {
          reference: "Luke 22:19 20",
          text:
            "This is my body, which is given for you. Do this in remembrance of me."
        },
        {
          reference: "John 6:51",
          text:
            "I am the living bread that came down from heaven; whoever eats this bread will live forever."
        },
        {
          reference: "1 Corinthians 11:23 26",
          text:
            "For as often as you eat this bread and drink the cup, you proclaim the death of the Lord until he comes."
        }
      ],
      preparation: {
        overview:
          "Catholics prepare to receive Holy Communion by being in a state of grace, living in charity, and observing the Eucharistic fast according to Church law.",
        steps: [
          "Examine your conscience and go to Confession if aware of serious sin.",
          "Fast for at least one hour before receiving Communion, unless excused for health reasons.",
          "Approach the sacrament with reverence and a desire to be united to Christ."
        ]
      },
      whatToExpect: {
        short:
          "In the Mass, bread and wine are consecrated by the priest, becoming the Body and Blood of Christ. The faithful approach the altar to receive Holy Communion, " +
          "either on the tongue or in the hand, according to the norms of the Church.",
        notes: [
          "Christ remains truly present in the Eucharist as long as the appearances of bread and wine remain.",
          "The Eucharist is the source and summit of the Christian life."
        ]
      },
      commonQuestions: [
        {
          question: "Do Catholics believe the Eucharist is only symbolic?",
          answer:
            "No. Catholics believe, in accord with Christ’s own words, that the Eucharist is truly His Body and Blood. The appearances of bread and wine remain, but the substance is changed."
        },
        {
          question: "May anyone receive Communion?",
          answer:
            "Those who are baptized Catholics, properly disposed, and in full communion with the Church may receive. Non Catholics are warmly invited to pray with us but do not ordinarily receive Communion."
        }
      ],
      tags: ["initiation", "eucharist", "mass"],
      source: "built-in",
      sourceUrl: null,
      sourceAttribution:
        "Catechism of the Catholic Church on the sacrament of the Eucharist",
      updatedAt: now
    },
    {
      slug: "penance",
      name: "Penance and Reconciliation",
      iconKey: "penance",
      meaning:
        "Penance, or Reconciliation, is the sacrament in which Christ forgives sins committed after Baptism. " +
        "Through the ministry of the priest, the penitent receives absolution, is reconciled with God and the Church, and receives grace to begin anew.",
      biblicalFoundation: [
        {
          reference: "John 20:21 23",
          text:
            "Whose sins you forgive are forgiven them, and whose sins you retain are retained."
        },
        {
          reference: "James 5:16",
          text:
            "Therefore confess your sins to one another and pray for one another, that you may be healed."
        }
      ],
      preparation: {
        overview:
          "A good confession requires examination of conscience, sorrow for sins, a firm purpose of amendment, and openness to God’s mercy.",
        steps: [
          "Pray for light from the Holy Spirit.",
          "Examine your conscience in the light of the Gospel and the Commandments.",
          "Resolve to avoid sin and the occasions of sin.",
          "Approach the sacrament with humility and trust in God’s mercy."
        ]
      },
      whatToExpect: {
        short:
          "In the confessional the penitent confesses sins to the priest, receives counsel and a penance, and prays an Act of Contrition. " +
          "The priest then extends his hand and pronounces the words of absolution.",
        notes: [
          "Everything confessed is held in absolute sacramental secrecy.",
          "The sacrament can be celebrated face to face or behind a screen."
        ]
      },
      commonQuestions: [
        {
          question: "Why confess to a priest and not directly to God?",
          answer:
            "In the sacrament Christ works through the priest, whom He has entrusted with the ministry of reconciliation. Confession to a priest gives sacramental assurance of forgiveness and unites us visibly with the Church."
        },
        {
          question: "How often should I go to Confession?",
          answer:
            "The Church requires confession of serious sins at least once a year, but frequent confession is encouraged as a path of ongoing conversion and growth in holiness."
        }
      ],
      tags: ["healing", "confession", "reconciliation"],
      source: "built-in",
      sourceUrl: null,
      sourceAttribution:
        "Catechism of the Catholic Church on the sacrament of Penance",
      updatedAt: now
    },
    {
      slug: "anointing-of-the-sick",
      name: "Anointing of the Sick",
      iconKey: "anointing",
      meaning:
        "Anointing of the Sick is the sacrament by which the Church commends those who are seriously ill to the suffering and glorified Lord. " +
        "Through the anointing and the prayer of faith, the sick person receives grace, peace, and sometimes physical healing.",
      biblicalFoundation: [
        {
          reference: "James 5:14 15",
          text:
            "Is anyone among you sick? He should summon the presbyters of the Church, and they should pray over him and anoint him with oil in the name of the Lord."
        }
      ],
      preparation: {
        overview:
          "Those who are seriously ill, preparing for major surgery, or advanced in age may request this sacrament. " +
          "It is not only for those at the point of death, though it may be part of the Church’s care at the end of life.",
        steps: [
          "Contact the parish to request a visit from a priest.",
          "If possible, prepare a quiet space with a crucifix and candle.",
          "Invite family or friends to be present and pray."
        ]
      },
      whatToExpect: {
        short:
          "The priest lays hands on the sick person, prays the prayer of faith, and anoints the forehead and hands with the Oil of the Sick, asking the Lord to raise up and save the person.",
        notes: [
          "The sacrament may be celebrated at home, in a hospital, or in church.",
          "When death is near, the priest may also offer Viaticum, Holy Communion as food for the journey."
        ]
      },
      commonQuestions: [
        {
          question: "Is Anointing of the Sick only for the dying?",
          answer:
            "No. It is for those who are seriously ill or facing major surgery, as well as the elderly whose strength is weakened by age. It may be received more than once when the condition changes."
        },
        {
          question: "Does this sacrament always bring physical healing?",
          answer:
            "Not always. The sacrament always brings spiritual help and peace, and sometimes physical healing, according to God’s will."
        }
      ],
      tags: ["healing", "sick", "anointing"],
      source: "built-in",
      sourceUrl: null,
      sourceAttribution:
        "Catechism of the Catholic Church on the sacrament of the Anointing of the Sick",
      updatedAt: now
    },
    {
      slug: "holy-orders",
      name: "Holy Orders",
      iconKey: "holy-orders",
      meaning:
        "Holy Orders is the sacrament through which the mission entrusted by Christ to His apostles continues in the Church. " +
        "It confers a sacred power for the service of the People of God in the three degrees of bishop, priest, and deacon.",
      biblicalFoundation: [
        {
          reference: "Luke 22:19",
          text:
            "Do this in remembrance of me, spoken by Christ at the Last Supper to the apostles."
        },
        {
          reference: "1 Timothy 4:14",
          text:
            "Do not neglect the gift you have, which was given you by prophetic utterance when the council of elders laid their hands upon you."
        }
      ],
      preparation: {
        overview:
          "Men who sense a call to priesthood or diaconate undertake a period of discernment and formation, usually in cooperation with a vocation director and seminary or formation program.",
        steps: [
          "Pray regularly for clarity and generosity in responding to God’s call.",
          "Seek spiritual direction and speak with a vocation director.",
          "Participate in seminary visits or discernment retreats.",
          "Enter formal formation if the Church confirms the call."
        ]
      },
      whatToExpect: {
        short:
          "During ordination, candidates promise obedience and resolve to live according to the call they receive. The bishop lays hands on them and prays the consecratory prayer, " +
          "after which they are configured to Christ in a new sacramental way.",
        notes: [
          "Ordained ministers serve the Word, the sacraments, and the pastoral care of the faithful.",
          "The sacrament imprints an indelible spiritual character."
        ]
      },
      commonQuestions: [
        {
          question: "Why can only men be ordained to the priesthood in the Catholic Church?",
          answer:
            "The Church understands that she is bound to the example of Christ, who chose men as His apostles. This is received not as a commentary on dignity or holiness, but as a sacramental sign entrusted to the Church."
        },
        {
          question: "Can someone leave the priesthood after ordination?",
          answer:
            "Ordination leaves an indelible mark. For grave reasons a priest may be dispensed from the obligations of the clerical state, but the sacramental character remains."
        }
      ],
      tags: ["holy orders", "priesthood", "diaconate"],
      source: "built-in",
      sourceUrl: null,
      sourceAttribution:
        "Catechism of the Catholic Church on the sacrament of Holy Orders",
      updatedAt: now
    },
    {
      slug: "matrimony",
      name: "Matrimony",
      iconKey: "matrimony",
      meaning:
        "Matrimony is the sacrament by which a baptized man and a baptized woman freely give themselves to one another in a lifelong covenant. " +
        "Their union is ordered to the good of the spouses and the procreation and education of children, and it becomes a sign of Christ’s love for the Church.",
      biblicalFoundation: [
        {
          reference: "Genesis 2:24",
          text:
            "Therefore a man leaves his father and his mother and clings to his wife, and they become one flesh."
        },
        {
          reference: "Ephesians 5:25 32",
          text:
            "Husbands, love your wives, as Christ loved the Church and gave Himself up for her. This is a great mystery, and I mean in reference to Christ and the Church."
        }
      ],
      preparation: {
        overview:
          "Engaged couples prepare for Matrimony through prayer, dialogue, and formal marriage preparation programs. " +
          "They reflect on the promises they will make regarding fidelity, permanence, and openness to life.",
        steps: [
          "Contact the parish well in advance of the desired wedding date.",
          "Meet with a priest or deacon to begin marriage preparation.",
          "Participate in required programs or retreats for engaged couples.",
          "Pray together and discuss the sacramental promises of marriage."
        ]
      },
      whatToExpect: {
        short:
          "In the wedding liturgy the bride and groom exchange consent before a priest or deacon and two witnesses. " +
          "The couple themselves are the ministers of the sacrament; the ordained minister receives their consent in the name of the Church.",
        notes: [
          "The nuptial blessing invokes God’s grace upon the couple and their future family.",
          "The sacrament strengthens spouses to love as Christ loves and to support one another on the path to holiness."
        ]
      },
      commonQuestions: [
        {
          question: "Why does the Church speak of marriage as a covenant and not only as a contract?",
          answer:
            "A covenant is an exchange of persons, rooted in God’s faithful love. In Matrimony, the spouses give themselves to one another before God, forming a bond that reflects Christ’s irrevocable love for the Church."
        },
        {
          question: "Is every Catholic wedding a sacrament?",
          answer:
            "Matrimony is sacramental when both spouses are baptized. When a Catholic marries a non baptized person, the marriage can be valid but is not sacramental."
        }
      ],
      tags: ["marriage", "family", "vocation"],
      source: "built-in",
      sourceUrl: null,
      sourceAttribution:
        "Catechism of the Catholic Church on the sacrament of Matrimony",
      updatedAt: now
    }
  ];

  // Attach language and ids, keep canonical order
  return sacraments.map((s) => ({
    id: `builtin-sacrament-${language}-${s.slug}`,
    language,
    ...s
  }));
}

// Optional external sacraments JSON
// Configure via SACRAMENTS_EXTERNAL_URL or SACRAMENTS_EXTERNAL_URL_EN etc
async function fetchExternalSacraments(language) {
  const cached = externalSacramentsCache.get(language);
  if (cached) return cached;

  const upper = language.toUpperCase();
  const specific = process.env[`SACRAMENTS_EXTERNAL_URL_${upper}`];
  const generic = process.env.SACRAMENTS_EXTERNAL_URL;
  const url = specific || generic;

  let external = [];

  if (url && typeof fetch !== "undefined") {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [];

        external = list
          .map((raw, idx) => {
            if (!raw || typeof raw !== "object") return null;

            const name = String(raw.name || "").trim();
            if (!name) return null;

            const slugBase =
              raw.slug ||
              name
                .toLowerCase()
                .replace(/[^a-z0-9\s\-]/g, "")
                .replace(/\s+/g, "-");

            return {
              id: String(raw.id || `external-sacrament-${language}-${idx}`),
              language,
              slug: String(slugBase).slice(0, 140),
              name,
              iconKey: raw.iconKey || null,
              meaning: raw.meaning || "",
              biblicalFoundation: raw.biblicalFoundation || [],
              preparation: raw.preparation || null,
              whatToExpect: raw.whatToExpect || null,
              commonQuestions: Array.isArray(raw.commonQuestions)
                ? raw.commonQuestions
                : [],
              tags: Array.isArray(raw.tags)
                ? raw.tags.map((t) => String(t).toLowerCase())
                : [],
              source: raw.source || "external-json",
              sourceUrl: raw.sourceUrl || null,
              sourceAttribution:
                raw.sourceAttribution || "External sacraments library",
              updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date()
            };
          })
          .filter(Boolean);
      }
    } catch (err) {
      console.error("[Via Fidei] External sacraments fetch error", language, err);
    }
  }

  if (external.length === 0) {
    external = builtInSacraments(language);
  }

  // Enforce canonical order where possible
  external.sort((a, b) => {
    const ai = sacramentOrderIndex(a.slug);
    const bi = sacramentOrderIndex(b.slug);
    if (ai === bi) return a.name.localeCompare(b.name);
    return ai - bi;
  });

  externalSacramentsCache.set(language, external);
  return external;
}

// List all sacraments for the chosen language
router.get("/", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);

  try {
    const sacraments = await prisma.sacrament.findMany({
      where: { language, isActive: true },
      // Keep stable ordering when DB is used, but built in set enforces canonical order
      orderBy: [{ name: "asc" }]
    });

    if (sacraments.length > 0) {
      return res.json({
        language,
        items: sacraments.map(publicSacrament)
      });
    }

    // Fallback to external or built in canonical list
    const external = await fetchExternalSacraments(language);

    return res.json({
      language,
      items: external.map(publicSacrament)
    });
  } catch (error) {
    console.error("[Via Fidei] Sacraments list error", error);
    res.status(500).json({ error: "Failed to load sacraments" });
  }
});

// Load a single sacrament by id or slug
router.get("/:idOrSlug", async (req, res) => {
  const prisma = getPrisma(req);
  const language = resolveLanguage(req);
  const { idOrSlug } = req.params;

  try {
    let sacrament = await prisma.sacrament.findUnique({
      where: { id: idOrSlug }
    });

    if (!sacrament) {
      sacrament = await prisma.sacrament.findUnique({
        where: {
          slug_language: {
            slug: idOrSlug,
            language
          }
        }
      });
    }

    if (sacrament && sacrament.isActive) {
      return res.json({ sacrament: publicSacrament(sacrament) });
    }

    // Fallback to external or built in
    const external = await fetchExternalSacraments(language);
    const match =
      external.find((s) => s.id === idOrSlug) ||
      external.find((s) => s.slug === idOrSlug);

    if (!match) {
      return res.status(404).json({ error: "Sacrament not found" });
    }

    res.json({ sacrament: publicSacrament(match) });
  } catch (error) {
    console.error("[Via Fidei] Sacrament load error", error);
    res.status(500).json({ error: "Failed to load sacrament" });
  }
});

module.exports = router;
