// database/seed.js
// Basic seed data for Via Fidei
// Initializes core site content, notices, prayers, saints, apparitions,
// sacraments, history summaries, and guides.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SUPPORTED_LANGS = ["en", "es", "pt", "fr", "it", "de", "pl", "ru", "uk"];

async function seedSiteContent() {
  const language = process.env.DEFAULT_LANGUAGE || "en";

  const missionContent = {
    heading: "Via Fidei",
    subheading: "Walking together in the light of Christ",
    body: [
      "Via Fidei is a quiet place for prayer, learning, and growth.",
      "It is designed for newcomers and lifelong Catholics who desire clarity, beauty, and depth without noise."
    ]
  };

  const aboutContent = {
    paragraphs: [
      "Via Fidei is a multilingual Catholic website and app that offers a curated library of prayers, guides for sacramental life, and tools for personal spiritual growth.",
      "The design focuses on simplicity, symmetry, and reverence so that the content can be read calmly and without distraction.",
      "All interactive features are private and single user focused. There is no social feed, no public profile, and no messaging."
    ],
    quickLinks: [
      { label: "Sacraments", target: "sacraments" },
      { label: "OCIA", target: "guides-ocia" },
      { label: "Rosary", target: "guides-rosary" },
      { label: "Confession", target: "guides-confession" },
      { label: "Guides", target: "guides-root" }
    ]
  };

  const collageContent = {
    layout: "masonry",
    images: []
  };

  await prisma.siteContent.upsert({
    where: { language_key: { language, key: "MISSION" } },
    create: { language, key: "MISSION", content: missionContent },
    update: { content: missionContent }
  });

  await prisma.siteContent.upsert({
    where: { language_key: { language, key: "ABOUT" } },
    create: { language, key: "ABOUT", content: aboutContent },
    update: { content: aboutContent }
  });

  await prisma.siteContent.upsert({
    where: { language_key: { language, key: "PHOTO_COLLAGE" } },
    create: { language, key: "PHOTO_COLLAGE", content: collageContent },
    update: { content: collageContent }
  });

  await prisma.notice.createMany({
    data: [
      {
        language,
        title: "Welcome to Via Fidei",
        body: "This site is in an early preview. Content will grow over time.",
        displayOrder: 1
      },
      {
        language,
        title: "Confession resources",
        body: "You will find examination of conscience and how to go to Confession in the Guides section.",
        displayOrder: 2
      }
    ],
    skipDuplicates: true
  });
}

async function seedPrayers() {
  const language = "en";

  await prisma.prayer.createMany({
    data: [
      {
        language,
        slug: "our-father",
        title: "Our Father",
        content:
          "Our Father, who art in heaven, hallowed be thy name. Thy kingdom come, thy will be done, on earth as it is in heaven. Give us this day our daily bread, and forgive us our trespasses, as we forgive those who trespass against us, and lead us not into temptation, but deliver us from evil. Amen.",
        category: "CHRIST_CENTERED",
        tags: ["lord's prayer", "basic", "daily"],
        source: "Traditional Catholic prayer",
        sourceUrl: null,
        sourceAttribution: null,
        isActive: true
      },
      {
        language,
        slug: "hail-mary",
        title: "Hail Mary",
        content:
          "Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.",
        category: "MARIAN",
        tags: ["rosary", "marian", "daily"],
        source: "Traditional Catholic prayer",
        sourceUrl: null,
        sourceAttribution: null,
        isActive: true
      },
      {
        language,
        slug: "act-of-contrition-simple",
        title: "Act of Contrition",
        content:
          "My God, I am sorry for my sins with all my heart. In choosing to do wrong and failing to do good, I have sinned against you whom I should love above all things. I firmly intend, with your help, to do penance, to sin no more, and to avoid whatever leads me to sin. Our Savior Jesus Christ suffered and died for us. In his name, my God, have mercy. Amen.",
        category: "SACRAMENTAL",
        tags: ["confession", "penance"],
        source: "USCCB sample text",
        sourceUrl: null,
        sourceAttribution: "Text adapted for catechetical use",
        isActive: true
      }
    ],
    skipDuplicates: true
  });
}

async function seedSaintsAndApparitions() {
  const language = "en";

  await prisma.saint.createMany({
    data: [
      {
        language,
        slug: "st-francis-of-assisi",
        name: "Saint Francis of Assisi",
        feastDay: new Date("2025-10-04T00:00:00.000Z"),
        patronages: ["animals", "peace", "creation"],
        biography:
          "Saint Francis of Assisi embraced radical poverty and joyful trust in God. He renewed the Church through a life of simplicity, fraternity, and love for all creation.",
        canonizationStatus: "Canonized",
        officialPrayer:
          "Most High and glorious God, enlighten the darkness of my heart. Give me right faith, sure hope, and perfect charity, sense and knowledge, Lord, that I may carry out your holy and true command. Amen.",
        imageUrl: "/images/saints/st-francis-of-assisi.jpg",
        tags: ["poverty", "creation", "franciscan"],
        source: "General hagiographical summary",
        sourceUrl: null,
        sourceAttribution: "Adapted from traditional biographies",
        isActive: true
      },
      {
        language,
        slug: "st-therese-of-lisieux",
        name: "Saint Thérèse of Lisieux",
        feastDay: new Date("2025-10-01T00:00:00.000Z"),
        patronages: ["missions", "priests", "trust"],
        biography:
          "Saint Thérèse of the Child Jesus lived a hidden life in a Carmelite monastery and taught the Little Way of spiritual childhood, trust, and love in small things.",
        canonizationStatus: "Doctor of the Church",
        officialPrayer:
          "O Lord, who said, unless you become like little children, you shall not enter the kingdom of heaven, grant us to follow Saint Thérèse in humble trust and generous love.",
        imageUrl: "/images/saints/st-therese-of-lisieux.jpg",
        tags: ["little way", "trust", "carmelite"],
        source: "General hagiographical summary",
        sourceUrl: null,
        sourceAttribution: "Adapted from Story of a Soul",
        isActive: true
      }
    ],
    skipDuplicates: true
  });

  await prisma.apparition.createMany({
    data: [
      {
        language,
        slug: "our-lady-of-fatima",
        title: "Our Lady of Fátima",
        location: "Fátima, Portugal",
        firstYear: 1917,
        feastDay: new Date("2025-05-13T00:00:00.000Z"),
        approvalNote:
          "The apparitions of Our Lady at Fátima were approved by the Bishop of Leiria in 1930.",
        story:
          "In 1917, the Blessed Virgin Mary appeared to three shepherd children in Fátima. She called for prayer, penance, and devotion to her Immaculate Heart, and entrusted messages for the Church and the world.",
        officialPrayer:
          "O my Jesus, forgive us our sins, save us from the fires of hell, lead all souls to heaven, especially those who are most in need of your mercy.",
        imageUrl: "/images/apparitions/our-lady-of-fatima.jpg",
        tags: ["rosary", "penance", "immaculate heart"],
        source: "General summary of the Fátima apparitions",
        sourceUrl: null,
        sourceAttribution: "Adapted from public domain sources",
        isActive: true
      }
    ],
    skipDuplicates: true
  });
}

async function seedSacraments() {
  const language = "en";

  const commonTags = (slug) => [slug, "sacrament"];

  await prisma.sacrament.createMany({
    data: [
      {
        language,
        slug: "baptism",
        name: "Baptism",
        iconKey: "baptism-water",
        meaning:
          "Baptism is the sacrament of rebirth in water and the Holy Spirit. It forgives sins and makes us children of God and members of the Church.",
        biblicalFoundation:
          "See Matthew 28, John 3, and Acts 2 where Christ commands baptism and the apostles baptize in his name.",
        preparation:
          "Learn the basics of the faith, choose sponsors, and speak with a parish priest or OCIA leader.",
        whatToExpect:
          "There is a liturgy of the word, renunciation of sin, profession of faith, the blessing of water, the baptism with water, and explanatory rites.",
        commonQuestions:
          "Who can be baptized, how old should a child be, what about godparents, and what is needed for valid baptism.",
        tags: commonTags("baptism"),
        source: "Catechetical summary",
        sourceUrl: null,
        sourceAttribution: "Paraphrase of Catechism of the Catholic Church",
        isActive: true
      },
      {
        language,
        slug: "eucharist",
        name: "Holy Eucharist",
        iconKey: "eucharist-chalice-host",
        meaning:
          "The Eucharist is the sacrament of the Body and Blood of Christ. It makes present the sacrifice of the Cross and unites us in communion with Christ and his Church.",
        biblicalFoundation:
          "See John 6 and the Last Supper accounts in the Gospels, where Christ gives his Body and Blood and commands us to do this in memory of him.",
        preparation:
          "Be in a state of grace, observe the Eucharistic fast where required, and prepare your heart by prayer.",
        whatToExpect:
          "Participation in Holy Mass, the Liturgy of the Word and the Liturgy of the Eucharist, and approaching the altar with reverence.",
        commonQuestions:
          "Who may receive, how often, what to do if unable to receive, and how to show proper reverence.",
        tags: commonTags("eucharist"),
        source: "Catechetical summary",
        sourceUrl: null,
        sourceAttribution: "Paraphrase of Catechism of the Catholic Church",
        isActive: true
      }
    ],
    skipDuplicates: true
  });
}

async function seedHistory() {
  const language = "en";

  await prisma.historySection.createMany({
    data: [
      {
        language,
        slug: "apostolic-age",
        title: "Apostolic Age",
        summary:
          "From the Resurrection of Christ to the death of the last apostle, the Gospel is preached and local churches are founded.",
        body:
          "The Apostolic Age is the foundation of the Church. The apostles bear witness to the Resurrection, celebrate the Eucharist, and form communities that receive the word, prayer, and the breaking of bread.",
        timeline: {
          entries: [
            { year: 30, title: "Pentecost", note: "Descent of the Holy Spirit" },
            { year: 49, title: "Council of Jerusalem", note: "Gentile inclusion" }
          ]
        },
        tags: ["apostolic", "foundations"],
        source: "General church history summary",
        sourceUrl: null,
        sourceAttribution: "Adapted from standard church history outlines",
        isActive: true
      },
      {
        language,
        slug: "vatican-councils",
        title: "Vatican Councils",
        summary:
          "The First and Second Vatican Councils addressed faith and reason, papal primacy, the Church, and her mission in the modern world.",
        body:
          "Vatican I defined papal primacy and infallibility in a context of modern challenges to faith. Vatican II renewed the Church with a focus on the People of God, the liturgy, Scripture, and dialogue with the world.",
        timeline: {
          entries: [
            { year: 1869, title: "First Vatican Council opens", note: "Papal primacy" },
            { year: 1962, title: "Second Vatican Council opens", note: "Pastoral renewal" }
          ]
        },
        tags: ["councils", "modern era"],
        source: "General church history summary",
        sourceUrl: null,
        sourceAttribution: "Adapted from standard church history outlines",
        isActive: true
      }
    ],
    skipDuplicates: true
  });
}

async function seedGuides() {
  const language = "en";

  await prisma.guide.createMany({
    data: [
      {
        language,
        slug: "ocia-entering-the-church",
        title: "Entering the Church (OCIA)",
        summary:
          "A step by step path for adults who desire to enter the Catholic Church through the Order of Christian Initiation of Adults.",
        body:
          "This guide explains how to begin, how to speak with your parish, what to expect in OCIA meetings, and how the sacraments of initiation are celebrated at the Easter Vigil.",
        guideType: "OCIA",
        checklistTemplate: {
          items: [
            { label: "Contact parish office", required: true },
            { label: "Meet with priest or OCIA director", required: true },
            { label: "Begin regular OCIA sessions", required: true },
            { label: "Attend Sunday Mass weekly", required: true }
          ]
        },
        tags: ["ocia", "initiation"],
        source: "Parish level OCIA outlines",
        sourceUrl: null,
        sourceAttribution: "General catechetical practice",
        isActive: true
      },
      {
        language,
        slug: "how-to-go-to-confession",
        title: "How to Go to Confession",
        summary:
          "A gentle step by step guide to preparing for and celebrating the Sacrament of Reconciliation.",
        body:
          "This guide walks through examination of conscience, contrition, how to confess, the act of contrition, and penance. It is written for those returning after a long time and those who go regularly.",
        guideType: "CONFESSION",
        checklistTemplate: {
          items: [
            { label: "Pray before the tabernacle or at home", required: false },
            { label: "Examine your conscience carefully", required: true },
            { label: "Recall how long it has been since your last confession", required: true },
            { label: "Learn or review an act of contrition", required: true }
          ]
        },
        tags: ["confession", "reconciliation"],
        source: "Catechetical aids for confession",
        sourceUrl: null,
        sourceAttribution: "Adapted from parish guides",
        isActive: true
      },
      {
        language,
        slug: "how-to-pray-the-rosary",
        title: "How to Pray the Rosary",
        summary:
          "A clear outline of the prayers, mysteries, and structure of the Holy Rosary.",
        body:
          "This guide explains how to begin the Rosary, which prayers to use on each bead, how to meditate on the mysteries of the life of Christ with Mary, and how to integrate the Rosary into daily life.",
        guideType: "ROSARY",
        checklistTemplate: {
          items: [
            { label: "Make the Sign of the Cross", required: true },
            { label: "Pray the Apostles Creed", required: true },
            { label: "Announce each mystery with a short pause for meditation", required: true }
          ]
        },
        tags: ["rosary", "marian devotion"],
        source: "Traditional explanations of the Rosary",
        sourceUrl: null,
        sourceAttribution: "Adapted from standard rosary guides",
        isActive: true
      }
    ],
    skipDuplicates: true
  });
}

async function main() {
  console.log("Seeding Via Fidei database");

  await seedSiteContent();
  await seedPrayers();
  await seedSaintsAndApparitions();
  await seedSacraments();
  await seedHistory();
  await seedGuides();

  console.log("Seed complete");
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error("Seed error", err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = {
  main
};
