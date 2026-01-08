// database/seed.js
// Rich seed data for Via Fidei
// Initializes core site content, notices, prayers, saints, apparitions,
// sacraments, history summaries, and guides.

const { PrismaClient } = require("@prisma/client");

/**
 * @typedef {import('@prisma/client').PrismaClient} PrismaClient
 */

const prisma = new PrismaClient();

/**
 * @type {string[]}
 */
const SUPPORTED_LANGS = ["en", "es", "pt", "fr", "it", "de", "pl", "ru", "uk"];

/**
 * @returns {Promise<void>}
 */
async function seedSiteContent() {
  const language = process.env.DEFAULT_LANGUAGE || "en";

  const missionContent = {
    heading: "Via Fidei",
    subheading: "A calm path for growing in faith",
    body: [
      "Via Fidei exists to be a quiet space where the devout faithful can grow more deeply in their relationship with God.",
      "It is also a place where those who are searching, curious, or distant from the Church can access clear, trustworthy teaching and resources.",
      "In every language we support, the mission of Via Fidei is to offer a tool for spiritual growth, helping both believers and those who are still discerning to encounter Christ and his Church with clarity, beauty, and depth."
    ]
  };

  const aboutContent = {
    paragraphs: [
      "Via Fidei is a multilingual Catholic website and app that gathers approved prayers, guides for sacramental life, and tools for personal spiritual growth into one quiet place.",
      "Its design is intentionally simple, measured, and reverent so that each page can be read slowly, without noise, clutter, or distraction. Typography, spacing, and color are chosen to support prayer rather than compete with it.",
      "The experience is personal and private. There is no public feed, no comments, and no pressure to perform. The focus is a hidden life with God, supported by clear teaching and practical helps."
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
    photos: []
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
        body: "This early preview focuses on prayer, saints, sacraments, and guides. Content will grow carefully over time.",
        displayOrder: 1
      },
      {
        language,
        title: "Confession resources",
        body: "You will find examination of conscience, acts of contrition, and how to go to Confession in the Guides and Prayers sections.",
        displayOrder: 2
      },
      {
        language,
        title: "Rosary and Marian devotion",
        body: "A step by step guide for praying the Rosary and the traditional prayers are available in the Guides and Prayers tabs.",
        displayOrder: 3
      }
    ],
    skipDuplicates: true
  });
}

/**
 * @returns {Promise<void>}
 */
async function seedPrayers() {
  const language = "en";

  await prisma.prayer.createMany({
    data: [
      {
        language,
        slug: "our-father",
        title: "Our Father",
        content:
          "Our Father, who art in heaven, hallowed be thy name. Thy kingdom come, thy will be done on earth as it is in heaven. Give us this day our daily bread, and forgive us our trespasses, as we forgive those who trespass against us, and lead us not into temptation, but deliver us from evil. Amen.",
        category: "CHRIST_CENTERED",
        tags: ["lords prayer", "basic", "daily", "rosary"],
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
          "Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners now and at the hour of our death. Amen.",
        category: "MARIAN",
        tags: ["rosary", "marian", "daily"],
        source: "Traditional Catholic prayer",
        sourceUrl: null,
        sourceAttribution: null,
        isActive: true
      },
      {
        language,
        slug: "glory-be",
        title: "Glory Be",
        content:
          "Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.",
        category: "CHRIST_CENTERED",
        tags: ["doxology", "rosary", "daily"],
        source: "Traditional Catholic prayer",
        sourceUrl: null,
        sourceAttribution: null,
        isActive: true
      },
      {
        language,
        slug: "apostles-creed",
        title: "Apostles Creed",
        content:
          "I believe in God, the Father almighty, Creator of heaven and earth, and in Jesus Christ, his only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died, and was buried. He descended into hell. On the third day he rose again from the dead. He ascended into heaven, and is seated at the right hand of God the Father almighty. From there he will come to judge the living and the dead. I believe in the Holy Spirit, the holy catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.",
        category: "CHRIST_CENTERED",
        tags: ["creed", "rosary", "profession of faith"],
        source: "Traditional baptismal creed of the Church",
        sourceUrl: null,
        sourceAttribution: null,
        isActive: true
      },
      {
        language,
        slug: "fatima-prayer",
        title: "Fátima Prayer",
        content:
          "O my Jesus, forgive us our sins, save us from the fires of hell, lead all souls to heaven, especially those who are most in need of thy mercy. Amen.",
        category: "MARIAN",
        tags: ["fatima", "rosary", "mercy"],
        source: "Prayer taught at Fátima",
        sourceUrl: null,
        sourceAttribution: null,
        isActive: true
      },
      {
        language,
        slug: "hail-holy-queen",
        title: "Hail Holy Queen",
        content:
          "Hail, holy Queen, Mother of mercy, our life, our sweetness, and our hope. To thee do we cry, poor banished children of Eve. To thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, thine eyes of mercy toward us, and after this our exile show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary. Pray for us, O holy Mother of God, that we may be made worthy of the promises of Christ. Amen.",
        category: "MARIAN",
        tags: ["rosary", "marian", "salve regina"],
        source: "Traditional Marian antiphon",
        sourceUrl: null,
        sourceAttribution: null,
        isActive: true
      },
      {
        language,
        slug: "st-michael-prayer",
        title: "Prayer to Saint Michael the Archangel",
        content:
          "Saint Michael the Archangel, defend us in battle. Be our protection against the wickedness and snares of the devil. May God rebuke him, we humbly pray, and do thou, O Prince of the heavenly host, by the power of God, cast into hell Satan and all the evil spirits who prowl about the world seeking the ruin of souls. Amen.",
        category: "ANGELIC",
        tags: ["st michael", "protection", "spiritual warfare"],
        source: "Prayer attributed to Pope Leo XIII",
        sourceUrl: null,
        sourceAttribution: null,
        isActive: true
      },
      {
        language,
        slug: "memorare",
        title: "Memorare",
        content:
          "Remember, O most gracious Virgin Mary, that never was it known that anyone who fled to thy protection, implored thy help, or sought thy intercession, was left unaided. Inspired with this confidence, I fly to thee, O Virgin of virgins, my Mother. To thee do I come, before thee I stand, sinful and sorrowful. O Mother of the Word Incarnate, despise not my petitions, but in thy mercy hear and answer me. Amen.",
        category: "MARIAN",
        tags: ["memorare", "trust", "petition"],
        source: "Traditional Marian prayer",
        sourceUrl: null,
        sourceAttribution: null,
        isActive: true
      },
      {
        language,
        slug: "come-holy-spirit",
        title: "Come Holy Spirit",
        content:
          "Come, Holy Spirit, fill the hearts of your faithful and kindle in them the fire of your love. Send forth your Spirit and they shall be created, and you shall renew the face of the earth.",
        category: "CHRIST_CENTERED",
        tags: ["holy spirit", "pentecost", "daily"],
        source: "Traditional invocation of the Holy Spirit",
        sourceUrl: null,
        sourceAttribution: null,
        isActive: true
      },
      {
        language,
        slug: "guardian-angel-prayer",
        title: "Guardian Angel Prayer",
        content:
          "Angel of God, my guardian dear, to whom God's love commits me here, ever this day be at my side, to light and guard, to rule and guide. Amen.",
        category: "ANGELIC",
        tags: ["guardian angel", "children", "daily"],
        source: "Traditional Catholic prayer",
        sourceUrl: null,
        sourceAttribution: null,
        isActive: true
      },
      {
        language,
        slug: "morning-offering",
        title: "Morning Offering",
        content:
          "O Jesus, through the Immaculate Heart of Mary, I offer you my prayers, works, joys, and sufferings of this day for all the intentions of your Sacred Heart, in union with the Holy Sacrifice of the Mass throughout the world.",
        category: "DAILY",
        tags: ["morning", "offering", "sacrifice"],
        source: "Traditional morning offering",
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
        tags: ["confession", "penance", "act of contrition"],
        source: "USCCB sample text",
        sourceUrl: null,
        sourceAttribution: "Text adapted for catechetical use",
        isActive: true
      }
    ],
    skipDuplicates: true
  });
}

/**
 * @returns {Promise<void>}
 */
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
          "Saint Francis of Assisi embraced radical poverty and joyful trust in God. He renewed the Church through a life of simplicity, fraternity, preaching, and love for all creation.",
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
          "Saint Thérèse of the Child Jesus lived a hidden life in a Carmelite monastery and taught the Little Way of spiritual childhood, trust, and love in small things. Her confidence in the mercy of God and her desire to be love at the heart of the Church have inspired countless souls.",
        canonizationStatus: "Doctor of the Church",
        officialPrayer:
          "O Lord, who said that unless we become like little children we shall not enter the kingdom of heaven, grant us to follow Saint Thérèse in humble trust and generous love.",
        imageUrl: "/images/saints/st-therese-of-lisieux.jpg",
        tags: ["little way", "trust", "carmelite"],
        source: "General hagiographical summary",
        sourceUrl: null,
        sourceAttribution: "Adapted from Story of a Soul",
        isActive: true
      },
      {
        language,
        slug: "st-john-paul-ii",
        name: "Saint John Paul II",
        feastDay: new Date("2025-10-22T00:00:00.000Z"),
        patronages: ["youth", "families"],
        biography:
          "Saint John Paul II served as pope from 1978 to 2005. He proclaimed the Gospel with courage across the world, defended the dignity of every human person, accompanied young people, and called the Church to a new evangelization rooted in mercy and truth.",
        canonizationStatus: "Canonized",
        officialPrayer:
          "Saint John Paul II, strengthened by the Eucharist and devoted to Mary, pray for us that we may open wide the doors to Christ.",
        imageUrl: "/images/saints/st-john-paul-ii.jpg",
        tags: ["pope", "mercy", "youth"],
        source: "General hagiographical summary",
        sourceUrl: null,
        sourceAttribution: null,
        isActive: true
      },
      {
        language,
        slug: "st-joseph-spouse-of-mary",
        name: "Saint Joseph, Spouse of the Blessed Virgin Mary",
        feastDay: new Date("2025-03-19T00:00:00.000Z"),
        patronages: ["universal church", "families", "workers"],
        biography:
          "Saint Joseph, the just man chosen to be the spouse of Mary and guardian of the Redeemer, lived a hidden life of work, faithfulness, and protection. He is a model of silent strength, obedience, and fatherly love.",
        canonizationStatus: "Patron of the Universal Church",
        officialPrayer:
          "Hail, Guardian of the Redeemer, spouse of the Blessed Virgin Mary. To you God entrusted his only Son. In you Mary placed her trust. With you Christ became man.",
        imageUrl: "/images/saints/st-joseph.jpg",
        tags: ["joseph", "family", "work"],
        source: "General hagiographical summary",
        sourceUrl: null,
        sourceAttribution: null,
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
          "In 1917, the Blessed Virgin Mary appeared to three shepherd children in Fátima. She called for prayer, penance, the daily Rosary, and devotion to her Immaculate Heart, and entrusted messages for the Church and the world.",
        officialPrayer:
          "O my Jesus, forgive us our sins, save us from the fires of hell, lead all souls to heaven, especially those who are most in need of thy mercy.",
        imageUrl: "/images/apparitions/our-lady-of-fatima.jpg",
        tags: ["rosary", "penance", "immaculate heart"],
        source: "General summary of the Fátima apparitions",
        sourceUrl: null,
        sourceAttribution: "Adapted from public domain sources",
        isActive: true
      },
      {
        language,
        slug: "our-lady-of-lourdes",
        title: "Our Lady of Lourdes",
        location: "Lourdes, France",
        firstYear: 1858,
        feastDay: new Date("2025-02-11T00:00:00.000Z"),
        approvalNote:
          "The apparitions at Lourdes were approved by the Bishop of Tarbes in 1862.",
        story:
          "In 1858, the Blessed Virgin Mary appeared to Saint Bernadette Soubirous at the grotto of Massabielle. She invited the world to prayer, penance, and trust in the mercy of God, and a spring of water became a place of healing for many.",
        officialPrayer:
          "O ever Immaculate Virgin, Mother of mercy, health of the sick, refuge of sinners, comfort of the afflicted, you know my wants, my troubles, my sufferings. Look upon me with mercy.",
        imageUrl: "/images/apparitions/our-lady-of-lourdes.jpg",
        tags: ["healing", "penance", "immaculate conception"],
        source: "General summary of the Lourdes apparitions",
        sourceUrl: null,
        sourceAttribution: "Adapted from public domain sources",
        isActive: true
      },
      {
        language,
        slug: "our-lady-of-guadalupe",
        title: "Our Lady of Guadalupe",
        location: "Tepeyac, Mexico",
        firstYear: 1531,
        feastDay: new Date("2025-12-12T00:00:00.000Z"),
        approvalNote:
          "The apparitions of Our Lady of Guadalupe received early episcopal support and have long been venerated in the Church.",
        story:
          "In 1531, the Blessed Virgin Mary appeared to Saint Juan Diego on the hill of Tepeyac. She presented herself as the Mother of God and of all peoples and left the miraculous image on his tilma as a sign of her presence and care.",
        officialPrayer:
          "Our Lady of Guadalupe, Mother of the true God and Mother of the living, intercede for your children, that we may follow your Son with faith and love.",
        imageUrl: "/images/apparitions/our-lady-of-guadalupe.jpg",
        tags: ["evangelization", "americas", "life"],
        source: "General summary of the Guadalupe apparitions",
        sourceUrl: null,
        sourceAttribution: "Adapted from public domain sources",
        isActive: true
      }
    ],
    skipDuplicates: true
  });
}

/**
 * @returns {Promise<void>}
 */
async function seedSacraments() {
  const language = "en";

  /**
   * @param {string} slug
   * @param {number} orderIndex
   * @returns {{language: string, slug: string, orderIndex: number, tags: string[], source: string, sourceUrl: null, sourceAttribution: string, isActive: boolean}}
   */
  const base = (slug, orderIndex) => ({
    language,
    slug,
    orderIndex,
    tags: [slug, "sacrament"],
    source: "Catechetical summary",
    sourceUrl: null,
    sourceAttribution: "Paraphrase of Catechism of the Catholic Church",
    isActive: true
  });

  await prisma.sacrament.createMany({
    data: [
      {
        ...base("baptism", 1),
        name: "Baptism",
        iconKey: "baptism-water",
        meaning:
          "Baptism is the sacrament of rebirth in water and the Holy Spirit. It forgives sins and makes us children of God and members of the Church.",
        biblicalFoundation:
          "See Matthew 28, John 3, and Acts 2 where Christ commands baptism and the apostles baptize in his name.",
        preparation:
          "Learn the basics of the faith, speak with your parish priest or OCIA leader, and for infants choose sponsors who live the Catholic faith.",
        whatToExpect:
          "There is a liturgy of the word, renunciation of sin, profession of faith, blessing of water, the baptism itself, anointing, clothing with a white garment, and the lighted candle.",
        commonQuestions:
          "Who can be baptized, what is required for valid baptism, how godparents are chosen, and how to have a baptism recorded."
      },
      {
        ...base("confirmation", 2),
        name: "Confirmation",
        iconKey: "confirmation-chrism",
        meaning:
          "Confirmation is the sacrament that strengthens baptismal grace through the gift of the Holy Spirit, sealing the Christian with an indelible spiritual mark.",
        biblicalFoundation:
          "See Acts 2, Acts 8, and Acts 19, where the apostles lay hands on believers and they receive the Holy Spirit.",
        preparation:
          "Participate in parish formation, deepen your life of prayer and service, and choose a sponsor who can accompany you in the faith.",
        whatToExpect:
          "During the Mass, the bishop extends hands in prayer, anoints the forehead with sacred chrism, and says, Receive the Gift of the Holy Spirit.",
        commonQuestions:
          "Why be confirmed, what age is appropriate, how to choose a confirmation name, and what it means to be a witness to Christ."
      },
      {
        ...base("eucharist", 3),
        name: "Holy Eucharist",
        iconKey: "eucharist-chalice-host",
        meaning:
          "The Eucharist is the sacrament of the Body and Blood of Christ. It makes present the sacrifice of the Cross and unites us in communion with Christ and his Church.",
        biblicalFoundation:
          "See John 6 and the Last Supper accounts in the Gospels, where Christ gives his Body and Blood and commands us to do this in memory of him.",
        preparation:
          "Be in a state of grace, observe the Eucharistic fast where required, and prepare your heart through prayer, Scripture, and silence.",
        whatToExpect:
          "Participation in Holy Mass, the Liturgy of the Word and the Liturgy of the Eucharist, and approaching the altar with reverence to receive Holy Communion.",
        commonQuestions:
          "Who may receive, how often one may receive, what to do if unable to receive sacramentally, and how to show proper reverence."
      },
      {
        ...base("penance-reconciliation", 4),
        name: "Penance and Reconciliation",
        iconKey: "confession-keys",
        meaning:
          "The Sacrament of Penance, also called Reconciliation or Confession, is the sacrament through which sins committed after baptism are forgiven.",
        biblicalFoundation:
          "See John 20 where the risen Christ breathes on the apostles and gives them authority to forgive sins, and James 5 which speaks of confessing sins.",
        preparation:
          "Make a sincere examination of conscience, ask the Holy Spirit for light, and stir up true sorrow and a firm purpose of amendment.",
        whatToExpect:
          "You greet the priest, confess your sins honestly, receive a penance, pray an act of contrition, receive absolution, and then complete your penance.",
        commonQuestions:
          "How often to go, how to confess after many years, how to handle forgotten sins, and what to do if you feel nervous or ashamed."
      },
      {
        ...base("anointing-of-the-sick", 5),
        name: "Anointing of the Sick",
        iconKey: "anointing-oil",
        meaning:
          "Anointing of the Sick gives strength, peace, and courage to those who are seriously ill or in danger due to old age, uniting them to the suffering of Christ.",
        biblicalFoundation:
          "See James 5 where the elders of the Church pray over the sick and anoint them with oil in the name of the Lord.",
        preparation:
          "If possible, speak with a priest or arrange through the parish when facing serious illness, surgery, or advanced age.",
        whatToExpect:
          "The priest prays over the sick person, lays hands on them, and anoints them with the oil of the sick on the forehead and hands, asking the Lord for healing and strength.",
        commonQuestions:
          "Who may receive, how often, whether it is only for the dying, and how it relates to Confession and Viaticum."
      },
      {
        ...base("matrimony", 6),
        name: "Matrimony",
        iconKey: "marriage-rings",
        meaning:
          "Matrimony is the sacrament by which a baptized man and woman are joined in a lifelong covenant of faithful love and are given grace to live as a sign of Christ and the Church.",
        biblicalFoundation:
          "See Genesis 2, Matthew 19, and Ephesians 5 where marriage is revealed as a covenant and a sign of Christ's love for the Church.",
        preparation:
          "Meet with your parish priest, participate in marriage preparation, pray together, and reflect seriously on the promises you will make.",
        whatToExpect:
          "The couple exchanges consent in the presence of the Church, receives the nuptial blessing, and begins a vocation of mutual self gift and openness to life.",
        commonQuestions:
          "What is required for a valid marriage, how to prepare well, what the Church teaches about openness to life, and how to seek help when difficulties arise."
      },
      {
        ...base("holy-orders", 7),
        name: "Holy Orders",
        iconKey: "holy-orders-mitre",
        meaning:
          "Holy Orders is the sacrament through which the mission entrusted by Christ to his apostles continues in the Church as bishops, priests, and deacons.",
        biblicalFoundation:
          "See the calling of the apostles in the Gospels and the laying on of hands in Acts and the Pastoral Letters.",
        preparation:
          "Discernment involves prayer, spiritual direction, involvement in parish life, and appropriate formation in a seminary or house of formation.",
        whatToExpect:
          "In the ordination liturgy the candidate is called, examined, promises are made, the litany of the saints is sung, hands are laid on, and the prayer of ordination is offered.",
        commonQuestions:
          "Who can be ordained, what are the differences among bishop, priest, and deacon, how long formation takes, and how to begin discerning."
      }
    ],
    skipDuplicates: true
  });
}

/**
 * @returns {Promise<void>}
 */
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
          "The Apostolic Age is the foundation of the Church. The apostles bear witness to the Resurrection, celebrate the Eucharist, and form communities that receive the word, prayer, and the breaking of bread. The New Testament is written in this period as the Spirit guides the Church into all truth.",
        timeline: {
          entries: [
            { year: 30, title: "Pentecost", note: "Descent of the Holy Spirit" },
            { year: 49, title: "Council of Jerusalem", note: "Gentile inclusion" }
          ]
        },
        eraOrder: 1,
        tags: ["apostolic", "foundations"],
        source: "General church history summary",
        sourceUrl: null,
        sourceAttribution: "Adapted from standard church history outlines",
        isActive: true
      },
      {
        language,
        slug: "early-church",
        title: "Early Church and Fathers",
        summary:
          "Persecution, growth, and the first great teachers of the Church as the faith spreads through the Roman world.",
        body:
          "After the apostolic era, the Church grows amid persecution, clarifies her faith in Christ, and is nourished by the Fathers who preach, write, and defend the Gospel. The canon of Scripture is received and local liturgical traditions develop.",
        timeline: {
          entries: [
            {
              year: 313,
              title: "Edict of Milan",
              note: "Religious tolerance for Christians"
            },
            {
              year: 325,
              title: "Council of Nicaea",
              note: "Affirms Christ's true divinity"
            }
          ]
        },
        eraOrder: 2,
        tags: ["fathers", "persecution"],
        source: "General church history summary",
        sourceUrl: null,
        sourceAttribution: "Adapted from standard church history outlines",
        isActive: true
      },
      {
        language,
        slug: "ecumenical-councils",
        title: "Ecumenical Councils and Doctrine",
        summary:
          "The Church gathers in councils to profess the faith in Christ, the Trinity, and the sacraments with clarity.",
        body:
          "Across the first millennium and beyond, the Church meets in ecumenical councils to respond to doctrinal crises and to profess the faith with precision. Nicaea, Constantinople, Ephesus, Chalcedon, and later councils deepen the Church understanding of the Trinity and the mystery of Christ.",
        timeline: {
          entries: [
            {
              year: 381,
              title: "Council of Constantinople",
              note: "Completes Nicene Creed"
            },
            {
              year: 451,
              title: "Council of Chalcedon",
              note: "Defines Christ's two natures"
            }
          ]
        },
        eraOrder: 3,
        tags: ["councils", "doctrine"],
        source: "General church history summary",
        sourceUrl: null,
        sourceAttribution: "Adapted from standard church history outlines",
        isActive: true
      },
      {
        language,
        slug: "middle-ages",
        title: "Middle Ages and Christendom",
        summary:
          "Monastic renewal, universities, and the shaping of Christian culture in Europe.",
        body:
          "The medieval period sees the rise of monastic orders, the birth of universities, and the building of great cathedrals. Thinkers such as Saint Thomas Aquinas integrate faith and reason while popular devotion deepens through the liturgy, the Rosary, and local pilgrimages.",
        timeline: {
          entries: [
            {
              year: 1095,
              title: "First Crusade preached",
              note: "Pilgrimage and conflict"
            },
            {
              year: 1215,
              title: "Fourth Lateran Council",
              note: "Clarifies Eucharistic doctrine"
            }
          ]
        },
        eraOrder: 4,
        tags: ["monastic", "scholasticism"],
        source: "General church history summary",
        sourceUrl: null,
        sourceAttribution: "Adapted from standard church history outlines",
        isActive: true
      },
      {
        language,
        slug: "reformation-and-response",
        title: "Reformation and Catholic Renewal",
        summary:
          "A time of division and reform that leads to deep spiritual and pastoral renewal in the Church.",
        body:
          "In the sixteenth century, serious abuses and doctrinal disputes contribute to the Protestant Reformation. The Council of Trent responds with clear teaching on Scripture, tradition, the sacraments, and justification, and inspires a strong renewal of priestly formation, religious life, and catechesis.",
        timeline: {
          entries: [
            {
              year: 1517,
              title: "Reformation begins",
              note: "Debates on doctrine and practice"
            },
            {
              year: 1545,
              title: "Council of Trent opens",
              note: "Catholic reform and clarity"
            }
          ]
        },
        eraOrder: 5,
        tags: ["reformation", "tridentine"],
        source: "General church history summary",
        sourceUrl: null,
        sourceAttribution: "Adapted from standard church history outlines",
        isActive: true
      },
      {
        language,
        slug: "modern-era",
        title: "Modern Era and Mission",
        summary:
          "The Church engages new cultures, scientific advances, and social questions across the globe.",
        body:
          "The modern period brings revolutions, new philosophies, and global mission. Catholic social teaching emerges, new religious congregations serve the poor, and the Church proclaims the dignity of every human person in the face of war and totalitarian ideologies.",
        timeline: {
          entries: [
            {
              year: 1891,
              title: "Rerum Novarum",
              note: "Foundational social encyclical"
            },
            {
              year: 1917,
              title: "Fátima apparitions",
              note: "Call to conversion and prayer"
            }
          ]
        },
        eraOrder: 6,
        tags: ["mission", "social teaching"],
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
          "The First and Second Vatican Councils address faith and reason, papal primacy, the Church, and her mission in the modern world.",
        body:
          "Vatican I defined papal primacy and infallibility in a context of modern challenges to faith. Vatican II renewed the Church with a focus on the People of God, the liturgy, Scripture, religious freedom, and dialogue with the world, calling all the faithful to holiness and mission.",
        timeline: {
          entries: [
            {
              year: 1869,
              title: "First Vatican Council opens",
              note: "Papal primacy and faith"
            },
            {
              year: 1962,
              title: "Second Vatican Council opens",
              note: "Pastoral renewal and mission"
            }
          ]
        },
        eraOrder: 7,
        tags: ["councils", "modern era"],
        source: "General church history summary",
        sourceUrl: null,
        sourceAttribution: "Adapted from standard church history outlines",
        isActive: true
      },
      {
        language,
        slug: "contemporary-church",
        title: "Contemporary Church",
        summary:
          "The Church lives the Gospel in a rapidly changing world, with new opportunities and new challenges.",
        body:
          "In the contemporary period the Church continues to form missionary disciples, defend human dignity from conception to natural death, accompany families and the poor, and proclaim the mercy of God. New ecclesial movements, lay initiatives, and digital evangelization all serve the same ancient mission.",
        timeline: {
          entries: [
            {
              year: 1978,
              title: "Election of John Paul II",
              note: "Be not afraid"
            },
            {
              year: 2013,
              title: "Election of Francis",
              note: "A Church that goes forth"
            }
          ]
        },
        eraOrder: 8,
        tags: ["contemporary", "evangelization"],
        source: "General church history summary",
        sourceUrl: null,
        sourceAttribution: "Adapted from standard church history outlines",
        isActive: true
      }
    ],
    skipDuplicates: true
  });
}

/**
 * @returns {Promise<void>}
 */
async function seedGuides() {
  const language = "en";

  const rosaryBody = [
    "The Holy Rosary is a meditative prayer that leads us through the mysteries of the life of Christ in union with Mary.",
    "Begin by making the Sign of the Cross and praying the Apostles Creed on the crucifix. On the first large bead, pray the Our Father. On the next three small beads, pray three Hail Marys for faith, hope, and charity, followed by a Glory Be.",
    "For each decade, announce the mystery, pause for a moment of quiet meditation, then pray one Our Father on the large bead, ten Hail Marys on the small beads, and one Glory Be. Many also add the Fátima Prayer after each decade.",
    "After the five decades, pray the Hail Holy Queen and a concluding prayer, then finish with the Sign of the Cross. You can pray the Joyful, Luminous, Sorrowful, or Glorious Mysteries depending on the day or your devotion."
  ].join("\n\n");

  await prisma.guide.createMany({
    data: [
      {
        language,
        slug: "ocia-entering-the-church",
        title: "Entering the Church (OCIA)",
        summary:
          "A step by step path for adults who desire to enter the Catholic Church through the Order of Christian Initiation of Adults.",
        body:
          "This guide explains how to begin, how to speak with your parish, what to expect in OCIA meetings, and how the sacraments of initiation are celebrated at the Easter Vigil. It emphasizes prayer, patient listening, and freedom from pressure while you discern.",
        guideType: "OCIA",
        guideOrder: 1,
        checklistTemplate: {
          items: [
            { label: "Pray and ask the Holy Spirit for guidance", required: true },
            { label: "Contact your local parish office", required: true },
            { label: "Meet with a priest or OCIA coordinator", required: true },
            { label: "Begin regular OCIA sessions", required: true },
            { label: "Attend Sunday Mass weekly", required: true }
          ]
        },
        tags: ["ocia", "initiation", "entering the church"],
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
          "This guide walks through examination of conscience, contrition, how to confess, the act of contrition, and penance. It is written for those returning after a long time and those who go regularly, emphasizing that Confession is an encounter with the mercy of Christ.",
        guideType: "CONFESSION",
        guideOrder: 2,
        checklistTemplate: {
          items: [
            { label: "Pray for the light of the Holy Spirit", required: true },
            { label: "Make an honest examination of conscience", required: true },
            {
              label: "Recall how long it has been since your last confession",
              required: true
            },
            {
              label: "Write down anything you are afraid of forgetting",
              required: false
            },
            { label: "Learn or review an act of contrition", required: true }
          ]
        },
        tags: ["confession", "reconciliation", "mercy"],
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
          "A clear outline of the prayers, mysteries, and structure of the Holy Rosary with each step and its corresponding prayer.",
        body: rosaryBody,
        guideType: "ROSARY",
        guideOrder: 3,
        checklistTemplate: {
          items: [
            { label: "Make the Sign of the Cross", required: true },
            { label: "Pray the Apostles Creed on the crucifix", required: true },
            { label: "Pray one Our Father on the first large bead", required: true },
            { label: "Pray three Hail Marys on the next three beads", required: true },
            { label: "Pray one Glory Be", required: true },
            {
              label: "Announce the first mystery and pause in silence",
              required: true
            },
            {
              label:
                "For each decade, pray one Our Father, ten Hail Marys, and one Glory Be",
              required: true
            },
            {
              label: "Optionally add the Fátima Prayer after each decade",
              required: false
            },
            {
              label:
                "After five decades, pray the Hail Holy Queen and concluding prayer",
              required: true
            },
            { label: "Finish with the Sign of the Cross", required: true }
          ]
        },
        tags: ["rosary", "marian devotion", "meditation"],
        source: "Traditional explanations of the Rosary",
        sourceUrl: null,
        sourceAttribution: "Adapted from standard rosary guides",
        isActive: true
      },
      {
        language,
        slug: "adoration-before-the-blessed-sacrament",
        title: "Adoration before the Blessed Sacrament",
        summary:
          "A simple guide for spending time in silent prayer before Jesus present in the Eucharist.",
        body:
          "This guide offers a gentle pattern for entering a church or chapel, making a reverent sign of adoration, praying with Scripture, sitting in silence, and leaving with gratitude. It encourages a balance of set prayers and wordless presence before the Lord.",
        guideType: "ADORATION",
        guideOrder: 4,
        checklistTemplate: {
          items: [
            {
              label: "Enter reverently and make a genuflection or deep bow",
              required: true
            },
            {
              label: "Begin with a simple prayer of faith and love",
              required: true
            },
            {
              label: "Read a short passage of Scripture slowly",
              required: false
            },
            {
              label: "Spend time in silence before the Lord",
              required: true
            },
            {
              label: "End with a prayer of thanksgiving and intercession",
              required: true
            }
          ]
        },
        tags: ["adoration", "eucharist", "silence"],
        source: "Parish and retreat house practices",
        sourceUrl: null,
        sourceAttribution: null,
        isActive: true
      },
      {
        language,
        slug: "discernment-and-vocation",
        title: "Listening for God in Your Vocation",
        summary:
          "A guide for men and women who are discerning marriage, priesthood, or consecrated life.",
        body:
          "This guide lays out a pattern of prayer, conversation, and concrete steps for vocational discernment. It emphasizes that every Christian is called to holiness and mission, and that each particular vocation is discovered through patient listening, spiritual direction, and real life experience.",
        guideType: "VOCATION",
        guideOrder: 5,
        checklistTemplate: {
          items: [
            { label: "Commit to daily personal prayer", required: true },
            {
              label: "Seek regular spiritual direction if possible",
              required: true
            },
            {
              label: "Become involved in the life and service of your parish",
              required: true
            },
            {
              label: "Learn about the different vocations in the Church",
              required: true
            },
            {
              label:
                "Pay attention to the desires and gifts God has placed in your heart",
              required: true
            }
          ]
        },
        tags: ["vocation", "discernment", "calling"],
        source: "Vocation ministry resources",
        sourceUrl: null,
        sourceAttribution: null,
        isActive: true
      }
    ],
    skipDuplicates: true
  });
}

/**
 * @returns {Promise<void>}
 */
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
