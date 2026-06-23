import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Card, Constellation, GameCatalog, Pack, Relationship, Source } from "../packages/game-engine/src/index";

type ToolInput = {
  id: string;
  kind: Card["kind"];
  title: string;
  subtitle?: string;
  rarity?: Card["rarity"];
  tags: Record<string, number>;
};

type FigureInput = {
  id: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  rarity: Card["rarity"];
  tags: Record<string, number>;
  evidence: { card?: string; tag?: string; weight: number; reason: string }[];
  synergies?: { id: string; whenAll: string[]; weight: number; reason: string }[];
  contradictions?: { id: string; whenAll: string[]; weight: number; reason: string }[];
  minScore?: number;
  ambiguityMargin?: number;
  unlocksToolCardIds?: string[];
  related?: { target: string; predicate: string; weight?: number }[];
};

// ─────────────────────────────────────────────────────────────
// OUTILS
// ─────────────────────────────────────────────────────────────

const PERIODS: ToolInput[] = [
  { id: "period.antiquity", kind: "period", title: "Antiquité", tags: { "period.antiquity": 100 } },
  { id: "period.middle-ages", kind: "period", title: "Moyen Âge", tags: { "period.middle-ages": 100 } },
  { id: "period.renaissance", kind: "period", title: "Renaissance", tags: { "period.renaissance": 100 } },
  { id: "period.15th-century", kind: "period", title: "XVe siècle", rarity: "uncommon", tags: { "period.15th-century": 100, "period.renaissance": 70 } },
  { id: "period.16th-century", kind: "period", title: "XVIe siècle", rarity: "uncommon", tags: { "period.16th-century": 100, "period.renaissance": 70 } },
  { id: "period.17th-century", kind: "period", title: "XVIIe siècle", rarity: "uncommon", tags: { "period.17th-century": 100 } },
  { id: "period.18th-century", kind: "period", title: "XVIIIe siècle", rarity: "uncommon", tags: { "period.18th-century": 100 } },
  { id: "period.19th-century", kind: "period", title: "XIXe siècle", rarity: "uncommon", tags: { "period.19th-century": 100 } },
  { id: "period.20th-century", kind: "period", title: "XXe siècle", tags: { "period.20th-century": 100 } },
];

const PLACES: ToolInput[] = [
  { id: "place.france", kind: "place", title: "France", tags: { "place.france": 100 } },
  { id: "place.england", kind: "place", title: "Angleterre", tags: { "place.england": 100 } },
  { id: "place.italy", kind: "place", title: "Italie", tags: { "place.italy": 100 } },
  { id: "place.greece", kind: "place", title: "Grèce", tags: { "place.greece": 100 } },
  { id: "place.egypt", kind: "place", title: "Égypte", tags: { "place.egypt": 100 } },
  { id: "place.alexandria", kind: "place", title: "Alexandrie", rarity: "uncommon", tags: { "place.alexandria": 100, "place.egypt": 60 } },
  { id: "place.athens", kind: "place", title: "Athènes", rarity: "uncommon", tags: { "place.athens": 100, "place.greece": 70 } },
  { id: "place.usa", kind: "place", title: "États-Unis", tags: { "place.usa": 100 } },
  { id: "place.south-africa", kind: "place", title: "Afrique du Sud", tags: { "place.south-africa": 100 } },
  { id: "place.india", kind: "place", title: "Inde", tags: { "place.india": 100 } },
  { id: "place.spain", kind: "place", title: "Espagne", tags: { "place.spain": 100 } },
  { id: "place.poland", kind: "place", title: "Pologne", tags: { "place.poland": 100 } },
  { id: "place.venice", kind: "place", title: "Venise", rarity: "uncommon", tags: { "place.venice": 100, "place.italy": 70 } },
  { id: "region.britain", kind: "region", title: "Bretagne", tags: { "region.britain": 100 } },
  { id: "region.south-america", kind: "region", title: "Amérique du Sud", tags: { "region.south-america": 100 } },
];

const CIVILIZATIONS: ToolInput[] = [
  { id: "civilization.ancient-egypt", kind: "civilization", title: "Égypte ancienne", tags: { "civilization.ancient-egypt": 100, "place.egypt": 80 } },
  { id: "civilization.ancient-greece", kind: "civilization", title: "Grèce antique", tags: { "civilization.ancient-greece": 100, "place.greece": 80 } },
  { id: "civilization.ancient-rome", kind: "civilization", title: "Rome antique", tags: { "civilization.ancient-rome": 100, "place.italy": 60 } },
  { id: "civilization.maurya", kind: "civilization", title: "Empire maurya", rarity: "uncommon", tags: { "civilization.maurya": 100, "place.india": 80 } },
];

const DOMAINS: ToolInput[] = [
  { id: "domain.physics", kind: "domain", title: "Physique", tags: { "domain.physics": 100, "domain.science": 70 } },
  { id: "domain.mathematics", kind: "domain", title: "Mathématiques", tags: { "domain.mathematics": 100, "domain.science": 70 } },
  { id: "domain.chemistry", kind: "domain", title: "Chimie", tags: { "domain.chemistry": 100, "domain.science": 70 } },
  { id: "domain.biology", kind: "domain", title: "Biologie", tags: { "domain.biology": 100, "domain.science": 70 } },
  { id: "domain.astronomy", kind: "domain", title: "Astronomie", tags: { "domain.astronomy": 100, "domain.science": 70 } },
  { id: "domain.medicine", kind: "domain", title: "Médecine", tags: { "domain.medicine": 100, "domain.science": 70 } },
  { id: "domain.computing", kind: "domain", title: "Informatique", rarity: "rare", tags: { "domain.computing": 100, "domain.science": 70 } },
  { id: "domain.painting", kind: "domain", title: "Peinture", tags: { "domain.painting": 100, "domain.arts": 70 } },
  { id: "domain.philosophy", kind: "domain", title: "Philosophie", tags: { "domain.philosophy": 100, "domain.thought": 70 } },
  { id: "domain.exploration", kind: "domain", title: "Exploration", tags: { "domain.exploration": 100 } },
  { id: "domain.politics", kind: "domain", title: "Politique", tags: { "domain.politics": 100 } },
  { id: "domain.nursing", kind: "domain", title: "Soins infirmiers", rarity: "uncommon", tags: { "domain.nursing": 100, "domain.medicine": 60 } },
];

const ROLES: ToolInput[] = [
  { id: "role.queen", kind: "role", title: "Reine", tags: { "role.ruler": 100, "concept.power": 80 } },
  { id: "role.pharaoh", kind: "role", title: "Pharaon", rarity: "uncommon", tags: { "role.ruler": 100, "civilization.ancient-egypt": 70 } },
  { id: "role.emperor", kind: "role", title: "Empereur", rarity: "uncommon", tags: { "role.ruler": 100, "concept.power": 80 } },
  { id: "role.scientist", kind: "role", title: "Scientifique", tags: { "role.scientist": 100, "domain.science": 80 } },
  { id: "role.philosopher", kind: "role", title: "Philosophe", tags: { "role.philosopher": 100, "domain.philosophy": 80 } },
  { id: "role.artist", kind: "role", title: "Artiste", tags: { "role.artist": 100, "domain.arts": 70 } },
  { id: "role.explorer", kind: "role", title: "Explorateur", tags: { "role.explorer": 100, "domain.exploration": 80 } },
  { id: "role.resistance", kind: "role", title: "Résistant", rarity: "uncommon", tags: { "role.resistance": 100, "concept.liberty": 70 } },
  { id: "role.pastor", kind: "role", title: "Pasteur", tags: { "role.pastor": 100, "concept.faith": 80 } },
  { id: "role.inventor", kind: "role", title: "Inventeur", rarity: "uncommon", tags: { "role.inventor": 100, "domain.science": 60 } },
];

const CONCEPTS: ToolInput[] = [
  // Concepts scientifiques
  { id: "concept.radioactivity", kind: "concept", title: "Radioactivité", rarity: "rare", tags: { "concept.radioactivity": 100, "domain.physics": 70, "domain.chemistry": 50 } },
  { id: "concept.evolution", kind: "concept", title: "Évolution", rarity: "rare", tags: { "concept.evolution": 100, "domain.biology": 80 } },
  { id: "concept.gravitation", kind: "concept", title: "Gravitation", rarity: "rare", tags: { "concept.gravitation": 100, "domain.physics": 80 } },
  { id: "concept.heliocentrism", kind: "concept", title: "Héliocentrisme", rarity: "rare", tags: { "concept.heliocentrism": 100, "domain.astronomy": 80 } },
  { id: "concept.algorithm", kind: "concept", title: "Algorithme", rarity: "rare", tags: { "concept.algorithm": 100, "domain.computing": 80, "domain.mathematics": 60 } },
  { id: "concept.calculus", kind: "concept", title: "Calcul infinitésimal", rarity: "rare", tags: { "concept.calculus": 100, "domain.mathematics": 80, "domain.physics": 50 } },
  { id: "concept.nobel-prize", kind: "concept", title: "Prix Nobel", rarity: "rare", tags: { "concept.nobel-prize": 100, "concept.award": 80 } },
  // Concepts philosophiques
  { id: "concept.socratic-method", kind: "concept", title: "Méthode socratique", rarity: "rare", tags: { "concept.socratic-method": 100, "domain.philosophy": 80 } },
  { id: "concept.platonic-ideas", kind: "concept", title: "Idées platoniciennes", rarity: "rare", tags: { "concept.platonic-ideas": 100, "domain.philosophy": 80 } },
  { id: "concept.logic", kind: "concept", title: "Logique", rarity: "rare", tags: { "concept.logic": 100, "domain.philosophy": 80, "domain.mathematics": 60 } },
  // Concepts sociaux et historiques
  { id: "concept.female-figure", kind: "concept", title: "Femme", tags: { "concept.women-history": 100 } },
  { id: "concept.civil-rights", kind: "concept", title: "Droits civiques", rarity: "uncommon", tags: { "concept.civil-rights": 100, "concept.liberty": 80 } },
  { id: "concept.non-violence", kind: "concept", title: "Non-violence", rarity: "uncommon", tags: { "concept.non-violence": 100, "concept.civil-rights": 70 } },
  { id: "concept.apartheid", kind: "concept", title: "Apartheid", rarity: "uncommon", tags: { "concept.apartheid": 100, "concept.civil-rights": 70 } },
  { id: "concept.buddhism", kind: "concept", title: "Bouddhisme", rarity: "uncommon", tags: { "concept.buddhism": 100, "concept.faith": 80 } },
  { id: "concept.printing", kind: "concept", title: "Imprimerie", rarity: "uncommon", tags: { "concept.printing": 100, "domain.invention": 70, "period.renaissance": 40 } },
  { id: "concept.faith", kind: "concept", title: "Foi", tags: { "concept.faith": 100, "concept.religion": 70 } },
  { id: "concept.colonialism", kind: "concept", title: "Colonialisme", rarity: "uncommon", tags: { "concept.colonialism": 100, "domain.politics": 70 } },
];

const EVENTS: ToolInput[] = [
  { id: "event.american-civil-rights", kind: "event", title: "Mouvement américain des droits civiques", rarity: "uncommon", tags: { "event.american-civil-rights": 100, "concept.civil-rights": 80, "place.usa": 70 } },
  { id: "event.french-revolution", kind: "event", title: "Révolution française", rarity: "uncommon", tags: { "event.french-revolution": 100, "place.france": 70, "concept.liberty": 60 } },
  { id: "event.independence-south-america", kind: "event", title: "Indépendances sud-américaines", rarity: "uncommon", tags: { "event.independence-south-america": 100, "region.south-america": 80, "concept.liberty": 60 } },
  { id: "event.crusades", kind: "event", title: "Croisades", rarity: "uncommon", tags: { "event.crusades": 100, "period.middle-ages": 80, "concept.faith": 60 } },
  { id: "event.scientific-revolution", kind: "event", title: "Révolution scientifique", rarity: "rare", tags: { "event.scientific-revolution": 100, "period.17th-century": 70, "domain.science": 70 } },
];

const WORKS: ToolInput[] = [
  { id: "work.mona-lisa", kind: "work", title: "La Joconde", rarity: "epic", tags: { "work.mona-lisa": 100, "domain.painting": 80, "period.renaissance": 60 } },
  { id: "work.principia", kind: "work", title: "Principes mathématiques", rarity: "epic", tags: { "work.principia": 100, "domain.physics": 80, "domain.mathematics": 70 } },
  { id: "work.origin-of-species", kind: "work", title: "L’Origine des espèces", rarity: "epic", tags: { "work.origin-of-species": 100, "domain.biology": 80, "concept.evolution": 90 } },
  { id: "work.republic", kind: "work", title: "La République", rarity: "epic", tags: { "work.republic": 100, "domain.philosophy": 80, "period.antiquity": 60 } },
  { id: "work.divine-comedy", kind: "work", title: "La Divine Comédie", rarity: "epic", tags: { "work.divine-comedy": 100, "domain.literature": 80, "period.middle-ages": 60, "place.italy": 60 } },
];

const MOVEMENTS: ToolInput[] = [
  { id: "movement.humanism", kind: "movement", title: "Humanisme", rarity: "uncommon", tags: { "movement.humanism": 100, "period.renaissance": 70, "domain.philosophy": 60 } },
  { id: "movement.enlightenment", kind: "movement", title: "Lumières", rarity: "uncommon", tags: { "movement.enlightenment": 100, "period.18th-century": 70, "domain.philosophy": 60 } },
  { id: "movement.romanticism", kind: "movement", title: "Romantisme", rarity: "uncommon", tags: { "movement.romanticism": 100, "period.19th-century": 70, "domain.arts": 60 } },
];

const SYMBOLS: ToolInput[] = [
  { id: "symbol.owl", kind: "symbol", title: "Chouette", rarity: "uncommon", tags: { "symbol.wisdom": 100, "domain.philosophy": 60 } },
  { id: "symbol.compass", kind: "symbol", title: "Boussole", rarity: "uncommon", tags: { "symbol.navigation": 100, "domain.exploration": 60 } },
  { id: "symbol.atom", kind: "symbol", title: "Atome", rarity: "rare", tags: { "symbol.science": 100, "domain.physics": 60 } },
];

const tools: ToolInput[] = [
  ...PERIODS,
  ...PLACES,
  ...CIVILIZATIONS,
  ...DOMAINS,
  ...ROLES,
  ...CONCEPTS,
  ...EVENTS,
  ...WORKS,
  ...MOVEMENTS,
  ...SYMBOLS,
];

// ─────────────────────────────────────────────────────────────
// FIGURES
// ─────────────────────────────────────────────────────────────

const figures: FigureInput[] = [
  // Niveau 1 — découvrables avec le pack de départ
  {
    id: "figure.marie-curie",
    title: "Marie Curie",
    subtitle: "Physicienne et chimiste",
    shortDescription: "Pionnière de la radioactivité, première femme prix Nobel et seule lauréate de deux prix Nobel en sciences distincts.",
    rarity: "legendary",
    tags: { "domain.physics": 40, "domain.chemistry": 35, "concept.radioactivity": 55, "place.france": 25, "place.poland": 20, "period.20th-century": 30, "concept.women-history": 30, "concept.nobel-prize": 40 },
    evidence: [
      { tag: "domain.physics", weight: 25, reason: "Physique" },
      { tag: "place.france", weight: 22, reason: "France" },
      { tag: "period.20th-century", weight: 18, reason: "XXe siècle" },
      { tag: "concept.women-history", weight: 22, reason: "Femme scientifique" },
    ],
    synergies: [
      { id: "radioactivity-france", whenAll: ["card:concept.radioactivity", "card:place.france"], weight: 15, reason: "Radioactivité + France" },
      { id: "scientist-france-20th", whenAll: ["tag:role.scientist", "card:place.france", "tag:period.20th-century"], weight: 12, reason: "Scientifique + France + XXe" },
    ],
    contradictions: [
      { id: "ancient-egypt-radioactivity", whenAll: ["card:period.antiquity", "card:concept.radioactivity"], weight: -30, reason: "La radioactivité moderne contredit l’Antiquité." },
    ],
    unlocksToolCardIds: ["place.poland"],
    related: [
      { target: "figure.pierre-curie", predicate: "collaborated_with", weight: 35 },
      { target: "figure.irene-joliot-curie", predicate: "parent_of", weight: 30 },
    ],
  },
  {
    id: "figure.cleopatra",
    title: "Cléopâtre VII",
    subtitle: "Reine d’Égypte",
    shortDescription: "Dernière souveraine active du royaume ptolémaïque d’Égypte.",
    rarity: "legendary",
    tags: { "period.antiquity": 45, "civilization.ancient-egypt": 50, "role.ruler": 40, "concept.women-history": 25, "place.egypt": 35 },
    evidence: [
      { card: "civilization.ancient-egypt", weight: 35, reason: "Égypte ancienne" },
      { tag: "role.ruler", weight: 25, reason: "Pouvoir royal" },
      { tag: "period.antiquity", weight: 20, reason: "Antiquité" },
      { tag: "concept.women-history", weight: 18, reason: "Femme historique" },
    ],
    synergies: [
      { id: "egypt-queen", whenAll: ["card:civilization.ancient-egypt", "card:role.queen"], weight: 24, reason: "Égypte ancienne + reine" },
      { id: "egypt-queen-woman", whenAll: ["card:civilization.ancient-egypt", "card:role.queen", "card:concept.female-figure"], weight: 18, reason: "Égypte ancienne + reine + femme" },
    ],
    contradictions: [
      { id: "modern-science", whenAll: ["card:period.20th-century", "card:domain.physics"], weight: -25, reason: "La science moderne éloigne de Cléopâtre." },
    ],
    unlocksToolCardIds: ["role.pharaoh"],
  },
  {
    id: "figure.socrate",
    title: "Socrate",
    subtitle: "Philosophe",
    shortDescription: "Philosophe athénien, maître de la méthode dialectique.",
    rarity: "epic",
    tags: { "domain.philosophy": 50, "place.athens": 40, "period.antiquity": 45, "civilization.ancient-greece": 40, "concept.socratic-method": 45 },
    evidence: [
      { tag: "domain.philosophy", weight: 30, reason: "Philosophie" },
      { card: "place.athens", weight: 30, reason: "Athènes" },
      { tag: "period.antiquity", weight: 22, reason: "Antiquité" },
      { tag: "concept.socratic-method", weight: 20, reason: "Méthode socratique" },
    ],
    synergies: [
      { id: "athens-philosophy-antiquity", whenAll: ["card:place.athens", "tag:domain.philosophy", "tag:period.antiquity"], weight: 15, reason: "Athènes antique + philosophie" },
    ],
    unlocksToolCardIds: ["concept.socratic-method"],
    related: [{ target: "figure.plato", predicate: "teacher_of", weight: 30 }],
  },
  {
    id: "figure.joan-of-arc",
    title: "Jeanne d’Arc",
    subtitle: "Héroïne française",
    shortDescription: "Chef de guerre et sainte, figure de la résistance française pendant la guerre de Cent Ans.",
    rarity: "epic",
    tags: { "place.france": 40, "period.middle-ages": 45, "role.resistance": 35, "concept.faith": 30, "concept.women-history": 25 },
    evidence: [
      { tag: "place.france", weight: 30, reason: "France" },
      { tag: "period.middle-ages", weight: 28, reason: "Moyen Âge" },
      { tag: "role.resistance", weight: 20, reason: "Résistance" },
      { tag: "concept.faith", weight: 15, reason: "Foi" },
    ],
    synergies: [
      { id: "france-middle-ages-faith", whenAll: ["card:place.france", "tag:period.middle-ages", "tag:concept.faith"], weight: 12, reason: "France médiévale + foi" },
    ],
    contradictions: [
      { id: "modern-france", whenAll: ["card:period.20th-century", "card:concept.radioactivity"], weight: -25, reason: "Jeanne d’Arc est médiévale." },
    ],
    unlocksToolCardIds: ["event.crusades"],
  },
  {
    id: "figure.leonardo-da-vinci",
    title: "Léonard de Vinci",
    subtitle: "Peintre, inventeur et savant",
    shortDescription: "Génie de la Renaissance, auteur de la Joconde et de nombreux projets techniques.",
    rarity: "legendary",
    tags: { "domain.painting": 45, "role.artist": 40, "period.renaissance": 45, "place.italy": 35, "role.inventor": 30 },
    evidence: [
      { tag: "domain.painting", weight: 30, reason: "Peinture" },
      { tag: "period.renaissance", weight: 25, reason: "Renaissance" },
      { tag: "place.italy", weight: 20, reason: "Italie" },
      { tag: "role.artist", weight: 18, reason: "Artiste" },
    ],
    synergies: [
      { id: "renaissance-artist-italy", whenAll: ["tag:period.renaissance", "tag:role.artist", "card:place.italy"], weight: 18, reason: "Renaissance italienne + artiste" },
    ],
    unlocksToolCardIds: ["work.mona-lisa"],
  },
  {
    id: "figure.martin-luther-king",
    title: "Martin Luther King Jr.",
    subtitle: "Pasteur et militant",
    shortDescription: "Leader du mouvement américain des droits civiques, célèbre pour son discours « I Have a Dream ».",
    rarity: "legendary",
    tags: { "concept.civil-rights": 50, "concept.non-violence": 45, "place.usa": 40, "period.20th-century": 35, "role.pastor": 30 },
    evidence: [
      { tag: "concept.civil-rights", weight: 30, reason: "Droits civiques" },
      { tag: "place.usa", weight: 22, reason: "États-Unis" },
      { tag: "role.pastor", weight: 18, reason: "Pasteur" },
      { tag: "period.20th-century", weight: 15, reason: "XXe siècle" },
    ],
    synergies: [
      { id: "civil-rights-usa", whenAll: ["card:concept.civil-rights", "card:place.usa"], weight: 15, reason: "Droits civiques + USA" },
      { id: "non-violence-pastor", whenAll: ["card:concept.non-violence", "tag:role.pastor"], weight: 12, reason: "Non-violence + pasteur" },
    ],
    unlocksToolCardIds: ["event.american-civil-rights"],
  },
  {
    id: "figure.rosa-parks",
    title: "Rosa Parks",
    subtitle: "Activiste des droits civiques",
    shortDescription: "Figure emblématique du mouvement américain des droits civiques.",
    rarity: "epic",
    tags: { "concept.civil-rights": 50, "place.usa": 40, "period.20th-century": 35, "concept.women-history": 30, "role.resistance": 35 },
    evidence: [
      { tag: "concept.civil-rights", weight: 30, reason: "Droits civiques" },
      { tag: "place.usa", weight: 22, reason: "États-Unis" },
      { tag: "concept.women-history", weight: 18, reason: "Femme engagée" },
      { tag: "role.resistance", weight: 15, reason: "Résistance" },
    ],
    synergies: [
      { id: "civil-rights-woman-usa", whenAll: ["card:concept.civil-rights", "card:concept.female-figure", "card:place.usa"], weight: 15, reason: "Droits civiques + femme + USA" },
    ],
    contradictions: [
      { id: "ancient-civil-rights", whenAll: ["card:period.antiquity"], weight: -25, reason: "Les droits civiques américains sont modernes." },
    ],
    related: [{ target: "figure.martin-luther-king", predicate: "inspired", weight: 25 }],
  },
  {
    id: "figure.christopher-columbus",
    title: "Christophe Colomb",
    subtitle: "Navigateur",
    shortDescription: "Explorateur dont les voyages ont ouvert la voie à la colonisation européenne des Amériques.",
    rarity: "epic",
    tags: { "role.explorer": 45, "place.spain": 35, "period.15th-century": 40, "domain.exploration": 40 },
    evidence: [
      { tag: "role.explorer", weight: 30, reason: "Explorateur" },
      { tag: "period.renaissance", weight: 22, reason: "Renaissance" },
      { tag: "domain.exploration", weight: 18, reason: "Exploration" },
      { tag: "place.spain", weight: 15, reason: "Espagne" },
    ],
    synergies: [
      { id: "explorer-renaissance-spain", whenAll: ["tag:role.explorer", "card:place.spain", "tag:period.renaissance"], weight: 15, reason: "Explorateur + Espagne + Renaissance" },
    ],
    unlocksToolCardIds: ["symbol.compass"],
  },
  {
    id: "figure.galileo-galilei",
    title: "Galilée",
    subtitle: "Astronome et physicien",
    shortDescription: "Père de l’astronomie moderne, défenseur de l’héliocentrisme.",
    rarity: "legendary",
    tags: { "domain.astronomy": 50, "domain.physics": 35, "concept.heliocentrism": 50, "place.italy": 30, "period.renaissance": 35 },
    evidence: [
      { tag: "domain.astronomy", weight: 30, reason: "Astronomie" },
      { tag: "place.italy", weight: 20, reason: "Italie" },
      { tag: "period.renaissance", weight: 18, reason: "Renaissance" },
      { tag: "concept.heliocentrism", weight: 15, reason: "Héliocentrisme" },
    ],
    synergies: [
      { id: "italy-astronomy-renaissance", whenAll: ["card:place.italy", "tag:domain.astronomy", "tag:period.renaissance"], weight: 15, reason: "Italie + astronomie + Renaissance" },
    ],
    contradictions: [
      { id: "ancient-astronomy", whenAll: ["card:period.antiquity", "card:concept.heliocentrism"], weight: -20, reason: "L’héliocentrisme moderne dépasse l’astronomie antique." },
    ],
    unlocksToolCardIds: ["concept.heliocentrism", "period.17th-century"],
  },
  {
    id: "figure.boudica",
    title: "Boudica",
    subtitle: "Reine celte",
    shortDescription: "Reine des Icènes qui a mené une révolte contre l’Empire romain en Bretagne.",
    rarity: "epic",
    tags: { "role.ruler": 35, "region.britain": 40, "period.antiquity": 40, "concept.women-history": 25, "role.resistance": 35 },
    evidence: [
      { tag: "role.ruler", weight: 25, reason: "Reine" },
      { tag: "region.britain", weight: 25, reason: "Bretagne" },
      { tag: "period.antiquity", weight: 22, reason: "Antiquité" },
      { tag: "role.resistance", weight: 18, reason: "Résistance" },
    ],
    synergies: [
      { id: "britain-queen-antiquity", whenAll: ["card:region.britain", "tag:role.ruler", "tag:period.antiquity"], weight: 15, reason: "Bretagne + reine + Antiquité" },
    ],
    unlocksToolCardIds: ["civilization.ancient-rome"],
  },

  // Niveau 2 — nécessitent des cartes débloquées ou des combinaisons plus fines
  {
    id: "figure.pierre-curie",
    title: "Pierre Curie",
    subtitle: "Physicien",
    shortDescription: "Physicien français, pionnier de l’étude de la radioactivité aux côtés de Marie Curie.",
    rarity: "epic",
    tags: { "domain.physics": 45, "concept.radioactivity": 50, "place.france": 30, "period.19th-century": 20, "period.20th-century": 20, "concept.nobel-prize": 30 },
    evidence: [
      { card: "concept.radioactivity", weight: 40, reason: "Radioactivité" },
      { tag: "domain.physics", weight: 25, reason: "Physique" },
      { tag: "place.france", weight: 18, reason: "France" },
    ],
    synergies: [
      { id: "radioactivity-france", whenAll: ["card:concept.radioactivity", "card:place.france"], weight: 12, reason: "Radioactivité + France" },
    ],
    unlocksToolCardIds: ["concept.nobel-prize"],
    related: [{ target: "figure.marie-curie", predicate: "collaborated_with", weight: 35 }],
  },
  {
    id: "figure.irene-joliot-curie",
    title: "Irène Joliot-Curie",
    subtitle: "Chimiste",
    shortDescription: "Chimiste française, prix Nobel de chimie pour ses travaux sur la radioactivité artificielle.",
    rarity: "epic",
    tags: { "domain.chemistry": 45, "concept.radioactivity": 50, "place.france": 30, "period.20th-century": 30, "concept.women-history": 25, "concept.nobel-prize": 30 },
    evidence: [
      { card: "concept.radioactivity", weight: 35, reason: "Radioactivité" },
      { tag: "domain.chemistry", weight: 25, reason: "Chimie" },
      { tag: "place.france", weight: 18, reason: "France" },
      { tag: "concept.women-history", weight: 15, reason: "Femme scientifique" },
      { card: "concept.nobel-prize", weight: 15, reason: "Prix Nobel" },
    ],
    synergies: [
      { id: "curie-family", whenAll: ["card:figure.marie-curie", "card:concept.radioactivity"], weight: 18, reason: "Suite de la famille Curie" },
      { id: "radioactivity-chemistry-france", whenAll: ["card:concept.radioactivity", "tag:domain.chemistry", "card:place.france"], weight: 12, reason: "Radioactivité + chimie + France" },
    ],
    related: [{ target: "figure.marie-curie", predicate: "child_of", weight: 30 }],
  },
  {
    id: "figure.hypatia",
    title: "Hypatie",
    subtitle: "Philosophe et mathématicienne",
    shortDescription: "Figure savante de l’Alexandrie antique, connue pour son enseignement néoplatonicien.",
    rarity: "epic",
    tags: { "domain.mathematics": 40, "domain.philosophy": 35, "place.alexandria": 50, "period.antiquity": 45, "concept.women-history": 25, "civilization.ancient-greece": 30 },
    evidence: [
      { card: "place.alexandria", weight: 35, reason: "Alexandrie" },
      { tag: "domain.mathematics", weight: 25, reason: "Mathématiques" },
      { tag: "period.antiquity", weight: 22, reason: "Antiquité" },
      { tag: "concept.women-history", weight: 15, reason: "Femme de savoir" },
    ],
    synergies: [
      { id: "alexandria-math-antiquity", whenAll: ["card:place.alexandria", "tag:domain.mathematics", "tag:period.antiquity"], weight: 15, reason: "Alexandrie antique + mathématiques" },
    ],
    unlocksToolCardIds: ["symbol.owl"],
  },
  {
    id: "figure.hatshepsout",
    title: "Hatshepsout",
    subtitle: "Pharaon d’Égypte",
    shortDescription: "Reine-pharaon de la XVIIIe dynastie, l’une des grandes souveraines de l’Égypte ancienne.",
    rarity: "epic",
    tags: { "period.antiquity": 45, "civilization.ancient-egypt": 50, "role.ruler": 40, "concept.women-history": 25, "place.egypt": 35 },
    evidence: [
      { card: "civilization.ancient-egypt", weight: 30, reason: "Égypte ancienne" },
      { card: "role.pharaoh", weight: 30, reason: "Pharaon" },
      { tag: "concept.women-history", weight: 18, reason: "Femme souveraine" },
      { tag: "period.antiquity", weight: 12, reason: "Antiquité" },
    ],
    synergies: [
      { id: "ancient-egypt-queen", whenAll: ["card:civilization.ancient-egypt", "tag:role.ruler", "card:concept.female-figure"], weight: 15, reason: "Égypte ancienne + souveraine + femme" },
    ],
    contradictions: [
      { id: "modern-egypt", whenAll: ["card:period.20th-century"], weight: -30, reason: "Hatshepsout appartient à l’Antiquité." },
    ],
    unlocksToolCardIds: ["symbol.owl"],
  },
  {
    id: "figure.isaac-newton",
    title: "Isaac Newton",
    subtitle: "Physicien et mathématicien",
    shortDescription: "Auteur des lois du mouvement et de la gravitation universelle.",
    rarity: "legendary",
    tags: { "domain.physics": 50, "domain.mathematics": 40, "concept.gravitation": 50, "place.england": 30, "period.17th-century": 35 },
    evidence: [
      { tag: "domain.physics", weight: 28, reason: "Physique" },
      { tag: "domain.mathematics", weight: 22, reason: "Mathématiques" },
      { tag: "place.england", weight: 18, reason: "Angleterre" },
      { tag: "period.17th-century", weight: 18, reason: "XVIIe siècle" },
    ],
    synergies: [
      { id: "physics-math-england", whenAll: ["tag:domain.physics", "tag:domain.mathematics", "card:place.england"], weight: 18, reason: "Physique + mathématiques + Angleterre" },
    ],
    unlocksToolCardIds: ["concept.gravitation", "work.principia"],
  },
  {
    id: "figure.charles-darwin",
    title: "Charles Darwin",
    subtitle: "Naturaliste",
    shortDescription: "Auteur de la théorie de l’évolution par sélection naturelle.",
    rarity: "legendary",
    tags: { "domain.biology": 50, "concept.evolution": 55, "place.england": 30, "period.19th-century": 35 },
    evidence: [
      { tag: "domain.biology", weight: 30, reason: "Biologie" },
      { tag: "place.england", weight: 20, reason: "Angleterre" },
      { tag: "period.19th-century", weight: 20, reason: "XIXe siècle" },
    ],
    synergies: [
      { id: "biology-england-19th", whenAll: ["tag:domain.biology", "card:place.england", "tag:period.19th-century"], weight: 18, reason: "Biologie + Angleterre + XIXe" },
    ],
    unlocksToolCardIds: ["concept.evolution", "work.origin-of-species"],
  },
  {
    id: "figure.ada-lovelace",
    title: "Ada Lovelace",
    subtitle: "Mathématicienne",
    shortDescription: "Pionnière de l’informatique, auteure du premier algorithme destiné à une machine.",
    rarity: "epic",
    tags: { "domain.mathematics": 40, "domain.computing": 45, "concept.algorithm": 45, "place.england": 30, "period.19th-century": 35, "concept.women-history": 30 },
    evidence: [
      { tag: "domain.computing", weight: 28, reason: "Informatique" },
      { tag: "domain.mathematics", weight: 20, reason: "Mathématiques" },
      { tag: "place.england", weight: 18, reason: "Angleterre" },
      { tag: "period.19th-century", weight: 15, reason: "XIXe siècle" },
      { tag: "concept.women-history", weight: 15, reason: "Femme scientifique" },
    ],
    synergies: [
      { id: "computing-mathematics-england", whenAll: ["tag:domain.computing", "tag:domain.mathematics", "card:place.england"], weight: 15, reason: "Informatique + mathématiques + Angleterre" },
    ],
    contradictions: [
      { id: "no-computing-ancient", whenAll: ["card:period.antiquity", "card:domain.computing"], weight: -30, reason: "L’informatique n’existait pas dans l’Antiquité." },
    ],
    unlocksToolCardIds: ["concept.algorithm"],
  },
  {
    id: "figure.florence-nightingale",
    title: "Florence Nightingale",
    subtitle: "Infirmière et statisticienne",
    shortDescription: "Pionnière des soins infirmiers modernes et de l’utilisation des statistiques en santé.",
    rarity: "epic",
    tags: { "domain.nursing": 50, "domain.medicine": 35, "place.england": 30, "period.19th-century": 35, "concept.women-history": 30 },
    evidence: [
      { tag: "domain.nursing", weight: 35, reason: "Soins infirmiers" },
      { tag: "place.england", weight: 22, reason: "Angleterre" },
      { tag: "period.19th-century", weight: 18, reason: "XIXe siècle" },
      { tag: "concept.women-history", weight: 15, reason: "Femme pionnière" },
    ],
    synergies: [
      { id: "nursing-england-19th", whenAll: ["tag:domain.nursing", "card:place.england", "tag:period.19th-century"], weight: 12, reason: "Soins infirmiers + Angleterre + XIXe" },
    ],
    unlocksToolCardIds: ["domain.medicine"],
  },
  {
    id: "figure.nelson-mandela",
    title: "Nelson Mandela",
    subtitle: "Président et militant",
    shortDescription: "Leader anti-apartheid et premier président noir d’Afrique du Sud.",
    rarity: "legendary",
    tags: { "role.resistance": 40, "place.south-africa": 45, "period.20th-century": 40, "concept.civil-rights": 40, "concept.apartheid": 45 },
    evidence: [
      { tag: "concept.apartheid", weight: 35, reason: "Apartheid" },
      { tag: "place.south-africa", weight: 25, reason: "Afrique du Sud" },
      { tag: "role.resistance", weight: 18, reason: "Résistant" },
      { tag: "period.20th-century", weight: 15, reason: "XXe siècle" },
    ],
    synergies: [
      { id: "south-africa-resistance-20th", whenAll: ["card:place.south-africa", "tag:role.resistance", "tag:period.20th-century"], weight: 15, reason: "Afrique du Sud + résistance + XXe" },
    ],
    unlocksToolCardIds: ["concept.apartheid"],
  },
  {
    id: "figure.marco-polo",
    title: "Marco Polo",
    subtitle: "Voyageur vénitien",
    shortDescription: "Marchand et explorateur dont le livre a fait connaître l’Asie à l’Europe médiévale.",
    rarity: "epic",
    tags: { "role.explorer": 45, "place.venice": 40, "period.middle-ages": 40, "domain.exploration": 40 },
    evidence: [
      { tag: "role.explorer", weight: 30, reason: "Explorateur" },
      { tag: "period.middle-ages", weight: 22, reason: "Moyen Âge" },
      { tag: "domain.exploration", weight: 18, reason: "Exploration" },
      { card: "place.venice", weight: 15, reason: "Venise" },
    ],
    synergies: [
      { id: "explorer-middle-ages-venice", whenAll: ["tag:role.explorer", "tag:period.middle-ages", "card:place.venice"], weight: 15, reason: "Explorateur + Moyen Âge + Venise" },
    ],
    unlocksToolCardIds: ["concept.colonialism"],
  },
  {
    id: "figure.ashoka",
    title: "Ashoka",
    subtitle: "Empereur maurya",
    shortDescription: "Empereur qui a fait diffuser le bouddhisme dans l’Asie ancienne.",
    rarity: "epic",
    tags: { "role.ruler": 40, "place.india": 40, "period.antiquity": 40, "concept.buddhism": 45, "civilization.maurya": 40 },
    evidence: [
      { tag: "concept.buddhism", weight: 30, reason: "Bouddhisme" },
      { tag: "role.ruler", weight: 25, reason: "Empereur" },
      { tag: "place.india", weight: 20, reason: "Inde" },
      { tag: "period.antiquity", weight: 15, reason: "Antiquité" },
    ],
    synergies: [
      { id: "india-buddhism-ruler", whenAll: ["card:place.india", "tag:concept.buddhism", "tag:role.ruler"], weight: 15, reason: "Inde + bouddhisme + souverain" },
    ],
    unlocksToolCardIds: ["concept.buddhism"],
  },
  {
    id: "figure.catherine-de-medici",
    title: "Catherine de Médicis",
    subtitle: "Reine de France",
    shortDescription: "Figure politique de la Renaissance française, originaire de Florence.",
    rarity: "epic",
    tags: { "role.ruler": 40, "place.france": 30, "place.italy": 25, "period.renaissance": 40, "concept.women-history": 20 },
    evidence: [
      { tag: "role.ruler", weight: 25, reason: "Pouvoir royal" },
      { tag: "period.renaissance", weight: 22, reason: "Renaissance" },
      { card: "place.france", weight: 18, reason: "France" },
      { card: "place.italy", weight: 15, reason: "Italie" },
    ],
    synergies: [
      { id: "renaissance-france-italy", whenAll: ["tag:period.renaissance", "card:place.france", "card:place.italy"], weight: 15, reason: "Renaissance + France + Italie" },
    ],
    unlocksToolCardIds: ["period.renaissance"],
  },
  {
    id: "figure.simon-bolivar",
    title: "Simón Bolívar",
    subtitle: "Libérateur sud-américain",
    shortDescription: "Chef militaire et politique à l’origine de l’indépendance de plusieurs pays d’Amérique du Sud.",
    rarity: "epic",
    tags: { "role.resistance": 40, "region.south-america": 45, "period.19th-century": 40, "domain.politics": 30, "concept.colonialism": 30 },
    evidence: [
      { tag: "region.south-america", weight: 30, reason: "Amérique du Sud" },
      { tag: "role.resistance", weight: 25, reason: "Libérateur" },
      { tag: "period.19th-century", weight: 20, reason: "XIXe siècle" },
      { tag: "domain.politics", weight: 15, reason: "Politique" },
    ],
    synergies: [
      { id: "south-america-resistance-19th", whenAll: ["card:region.south-america", "tag:role.resistance", "tag:period.19th-century"], weight: 15, reason: "Amérique du Sud + libérateur + XIXe" },
    ],
    unlocksToolCardIds: ["event.independence-south-america"],
  },

  // Niveau 3 — nécessitent des figures de niveau 2 comme indices
  {
    id: "figure.plato",
    title: "Platon",
    subtitle: "Philosophe",
    shortDescription: "Philosophe grec, disciple de Socrate et maître d’Aristote.",
    rarity: "epic",
    tags: { "domain.philosophy": 50, "place.athens": 40, "period.antiquity": 45, "civilization.ancient-greece": 40, "concept.platonic-ideas": 45 },
    evidence: [
      { tag: "domain.philosophy", weight: 25, reason: "Philosophie" },
      { card: "place.athens", weight: 20, reason: "Athènes" },
      { card: "figure.socrate", weight: 22, reason: "Disciple de Socrate" },
      { tag: "period.antiquity", weight: 18, reason: "Antiquité" },
    ],
    synergies: [
      { id: "socrate-plato", whenAll: ["card:figure.socrate", "tag:domain.philosophy"], weight: 18, reason: "Socrate + philosophie" },
      { id: "athens-philosophy-antiquity", whenAll: ["card:place.athens", "tag:domain.philosophy", "tag:period.antiquity"], weight: 12, reason: "Athènes antique + philosophie" },
    ],
    unlocksToolCardIds: ["concept.platonic-ideas"],
    related: [
      { target: "figure.socrate", predicate: "student_of", weight: 30 },
      { target: "figure.aristote", predicate: "teacher_of", weight: 30 },
    ],
  },
  {
    id: "figure.aristote",
    title: "Aristote",
    subtitle: "Philosophe et scientifique",
    shortDescription: "Penseur grec aux vastes domaines : philosophie, biologie, physique, politique.",
    rarity: "legendary",
    tags: { "domain.philosophy": 45, "domain.biology": 30, "domain.physics": 25, "place.athens": 35, "period.antiquity": 45, "concept.logic": 45 },
    evidence: [
      { tag: "domain.philosophy", weight: 22, reason: "Philosophie" },
      { card: "figure.plato", weight: 22, reason: "Élève de Platon" },
      { tag: "period.antiquity", weight: 18, reason: "Antiquité" },
      { card: "place.athens", weight: 15, reason: "Athènes" },
    ],
    synergies: [
      { id: "plato-aristote", whenAll: ["card:figure.plato", "tag:domain.philosophy"], weight: 18, reason: "Platon + philosophie" },
      { id: "athens-philosophy-antiquity", whenAll: ["card:place.athens", "tag:domain.philosophy", "tag:period.antiquity"], weight: 12, reason: "Athènes antique + philosophie" },
    ],
    unlocksToolCardIds: ["concept.logic"],
  },
];

// ─────────────────────────────────────────────────────────────
// CONSTELLATIONS
// ─────────────────────────────────────────────────────────────

const constellations: Constellation[] = [
  {
    id: "constellation.women-in-science",
    slug: "femmes-de-science",
    localization: { fr: { title: "Femmes de science" } },
    cardIds: ["figure.marie-curie", "figure.hypatia", "figure.ada-lovelace", "figure.irene-joliot-curie", "figure.florence-nightingale"],
    reward: { xp: 250, unlockCardIds: ["concept.nobel-prize"] },
  },
  {
    id: "constellation.curie-family",
    slug: "famille-curie",
    localization: { fr: { title: "Famille Curie" } },
    cardIds: ["figure.marie-curie", "figure.pierre-curie", "figure.irene-joliot-curie"],
    reward: { xp: 180, unlockCardIds: ["symbol.atom"] },
  },
  {
    id: "constellation.greek-thinkers",
    slug: "penseurs-grecs",
    localization: { fr: { title: "Penseurs grecs" } },
    cardIds: ["figure.socrate", "figure.plato", "figure.aristote"],
    reward: { xp: 200, unlockCardIds: ["symbol.owl", "work.republic"] },
  },
  {
    id: "constellation.civil-rights",
    slug: "droits-civiques",
    localization: { fr: { title: "Droits civiques et résistances" } },
    cardIds: ["figure.rosa-parks", "figure.martin-luther-king", "figure.nelson-mandela", "figure.boudica"],
    reward: { xp: 220, unlockCardIds: ["event.french-revolution"] },
  },
  {
    id: "constellation.explorers",
    slug: "explorateurs",
    localization: { fr: { title: "Explorateurs et routes" } },
    cardIds: ["figure.christopher-columbus", "figure.marco-polo"],
    reward: { xp: 120, unlockCardIds: ["concept.colonialism"] },
  },
  {
    id: "constellation.modern-sciences",
    slug: "sciences-modernes",
    localization: { fr: { title: "Sciences modernes" } },
    cardIds: ["figure.isaac-newton", "figure.charles-darwin", "figure.galileo-galilei"],
    reward: { xp: 200, unlockCardIds: ["concept.calculus", "event.scientific-revolution"] },
  },
  {
    id: "constellation.sovereigns",
    slug: "souveraines",
    localization: { fr: { title: "Souveraines de l’Histoire" } },
    cardIds: ["figure.cleopatra", "figure.hatshepsout", "figure.catherine-de-medici", "figure.boudica", "figure.joan-of-arc"],
    reward: { xp: 250, unlockCardIds: ["role.emperor"] },
  },
  {
    id: "constellation.italian-renaissance",
    slug: "renaissance-italienne",
    localization: { fr: { title: "Renaissance italienne" } },
    cardIds: ["figure.leonardo-da-vinci", "figure.galileo-galilei", "figure.catherine-de-medici"],
    reward: { xp: 150, unlockCardIds: ["movement.humanism"] },
  },
];

// ─────────────────────────────────────────────────────────────
// GÉNÉRATION
// ─────────────────────────────────────────────────────────────

function toCard(input: ToolInput | FigureInput): Card {
  const tags = Object.entries(input.tags).map(([tag, weight]) => ({ tag, weight }));

  if ("evidence" in input) {
    return {
      id: input.id,
      slug: input.id.replace(/\./g, "-"),
      kind: "figure",
      status: "reviewed",
      rarity: input.rarity,
      localization: {
        fr: {
          title: input.title,
          subtitle: input.subtitle,
          shortDescription: input.shortDescription,
        },
      },
      tags,
      sourceIds: ["source.cardheon.test"],
      constellationIds: constellations
        .filter((constellation) => constellation.cardIds.includes(input.id))
        .map((constellation) => constellation.id),
      discovery: {
        figureId: input.id,
        minScore: input.minScore ?? 82,
        ambiguityMargin: input.ambiguityMargin ?? 12,
        minEvidenceCount: 2,
        evidence: input.evidence,
        synergies: input.synergies ?? [],
        contradictions: input.contradictions ?? [],
      },
      unlocksToolCardIds: input.unlocksToolCardIds,
    };
  }

  return {
    id: input.id,
    slug: input.id.replace(/\./g, "-"),
    kind: input.kind,
    status: "published",
    rarity: input.rarity ?? "common",
    localization: {
      fr: {
        title: input.title,
        subtitle: input.subtitle ?? "",
      },
    },
    tags,
  };
}

function buildRelationships(): Relationship[] {
  const relationships: Relationship[] = [];
  const seen = new Set<string>();

  for (const figure of figures) {
    // Explicit figure-figure relationships.
    for (const related of figure.related ?? []) {
      const key = `${figure.id}-${related.predicate}-${related.target}`;
      if (seen.has(key)) continue;
      seen.add(key);
      relationships.push({
        source: figure.id,
        predicate: related.predicate,
        target: related.target,
        weight: related.weight,
        sourceIds: ["source.cardheon.test"],
      });
    }

    // Figure → unlocked tool cards.
    for (const toolCardId of figure.unlocksToolCardIds ?? []) {
      const key = `${figure.id}-unlocks-${toolCardId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      relationships.push({
        source: figure.id,
        predicate: "unlocks",
        target: toolCardId,
        weight: 30,
        sourceIds: ["source.cardheon.test"],
      });
    }

    // Auto-generate figure-tool relationships from evidence cards/tags.
    for (const evidence of figure.evidence) {
      if (evidence.card) {
        const key = `${figure.id}-associated_with-${evidence.card}`;
        if (seen.has(key)) continue;
        seen.add(key);
        relationships.push({
          source: figure.id,
          predicate: "associated_with",
          target: evidence.card,
          weight: evidence.weight,
          sourceIds: ["source.cardheon.test"],
        });
      } else if (evidence.tag) {
        const matchingTool = tools.find((tool) => tool.tags[evidence.tag!] !== undefined);
        if (matchingTool) {
          const key = `${figure.id}-related_to-${matchingTool.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          relationships.push({
            source: figure.id,
            predicate: "related_to",
            target: matchingTool.id,
            weight: evidence.weight,
            sourceIds: ["source.cardheon.test"],
          });
        }
      }
    }
  }

  // Cross-tool relationships for richer graph feel.
  relationships.push(
    { source: "concept.radioactivity", predicate: "branch_of", target: "domain.physics", weight: 40, sourceIds: ["source.cardheon.test"] },
    { source: "concept.evolution", predicate: "branch_of", target: "domain.biology", weight: 45, sourceIds: ["source.cardheon.test"] },
    { source: "concept.gravitation", predicate: "branch_of", target: "domain.physics", weight: 45, sourceIds: ["source.cardheon.test"] },
    { source: "concept.heliocentrism", predicate: "branch_of", target: "domain.astronomy", weight: 45, sourceIds: ["source.cardheon.test"] },
    { source: "concept.algorithm", predicate: "branch_of", target: "domain.computing", weight: 45, sourceIds: ["source.cardheon.test"] },
    { source: "concept.calculus", predicate: "branch_of", target: "domain.mathematics", weight: 45, sourceIds: ["source.cardheon.test"] },
    { source: "concept.socratic-method", predicate: "branch_of", target: "domain.philosophy", weight: 40, sourceIds: ["source.cardheon.test"] },
    { source: "concept.logic", predicate: "branch_of", target: "domain.philosophy", weight: 40, sourceIds: ["source.cardheon.test"] },
    { source: "concept.non-violence", predicate: "branch_of", target: "concept.civil-rights", weight: 40, sourceIds: ["source.cardheon.test"] },
    { source: "concept.apartheid", predicate: "opposes", target: "concept.civil-rights", weight: 40, sourceIds: ["source.cardheon.test"] },
    { source: "domain.computing", predicate: "evolved_from", target: "domain.mathematics", weight: 35, sourceIds: ["source.cardheon.test"] },
    { source: "domain.astronomy", predicate: "evolved_from", target: "domain.physics", weight: 35, sourceIds: ["source.cardheon.test"] },
    { source: "domain.nursing", predicate: "branch_of", target: "domain.medicine", weight: 35, sourceIds: ["source.cardheon.test"] },
    { source: "place.alexandria", predicate: "located_in", target: "place.egypt", weight: 60, sourceIds: ["source.cardheon.test"] },
    { source: "place.athens", predicate: "located_in", target: "place.greece", weight: 60, sourceIds: ["source.cardheon.test"] },
    { source: "place.venice", predicate: "located_in", target: "place.italy", weight: 60, sourceIds: ["source.cardheon.test"] },
    { source: "period.renaissance", predicate: "follows", target: "period.middle-ages", weight: 40, sourceIds: ["source.cardheon.test"] },
    { source: "period.15th-century", predicate: "part_of", target: "period.renaissance", weight: 40, sourceIds: ["source.cardheon.test"] },
    { source: "period.16th-century", predicate: "part_of", target: "period.renaissance", weight: 40, sourceIds: ["source.cardheon.test"] },
    { source: "work.mona-lisa", predicate: "created_by", target: "figure.leonardo-da-vinci", weight: 60, sourceIds: ["source.cardheon.test"] },
    { source: "work.principia", predicate: "written_by", target: "figure.isaac-newton", weight: 60, sourceIds: ["source.cardheon.test"] },
    { source: "work.origin-of-species", predicate: "written_by", target: "figure.charles-darwin", weight: 60, sourceIds: ["source.cardheon.test"] },
    { source: "work.republic", predicate: "written_by", target: "figure.plato", weight: 60, sourceIds: ["source.cardheon.test"] },
  );

  return relationships;
}

function main(): void {
  const cards: Card[] = [...tools.map(toCard), ...figures.map(toCard)];
  const relationships = buildRelationships();

  // Starter pack: foundational tool cards that combine into clear level-1 figures.
  const starterCardIds = [
    // Periods (timeline vocabulary)
    "period.antiquity",
    "period.middle-ages",
    "period.renaissance",
    "period.15th-century",
    "period.16th-century",
    "period.17th-century",
    "period.18th-century",
    "period.19th-century",
    "period.20th-century",
    // Places (geography vocabulary)
    "place.france",
    "place.england",
    "place.italy",
    "place.greece",
    "place.egypt",
    "place.usa",
    "place.athens",
    "place.alexandria",
    "place.spain",
    "place.venice",
    "region.britain",
    "place.south-africa",
    "place.india",
    "region.south-america",
    // Civilizations
    "civilization.ancient-egypt",
    "civilization.ancient-greece",
    "civilization.ancient-rome",
    "civilization.maurya",
    // Domains (disciplinary vocabulary)
    "domain.physics",
    "domain.biology",
    "domain.mathematics",
    "domain.chemistry",
    "domain.philosophy",
    "domain.astronomy",
    "domain.painting",
    "domain.exploration",
    "domain.politics",
    "domain.nursing",
    "domain.computing",
    // Roles & social concepts
    "role.queen",
    "role.scientist",
    "role.artist",
    "role.explorer",
    "role.philosopher",
    "role.resistance",
    "role.pastor",
    "role.emperor",
    "concept.female-figure",
    "concept.civil-rights",
    "concept.faith",
    "concept.buddhism",
    "concept.apartheid",
    "concept.radioactivity",
  ];

  const packs: Pack[] = [
    {
      id: "pack.starter",
      slug: "depart",
      localization: { fr: { title: "Pack de départ" } },
      starterCardIds,
      cardPoolIds: figures.map((figure) => figure.id),
    },
  ];

  const sources: Source[] = [
    { id: "source.cardheon.test", title: "Cardhéon test corpus", type: "institution" },
  ];

  const catalog: GameCatalog = {
    version: "0.2.1-test",
    gameplay: {
      discovery: { minInputs: 2, maxInputs: 5 },
      progression: { xpPerLevel: 2000, initialLevel: 1 },
    },
    cards,
    relationships,
    constellations,
    packs,
    sources,
  };

  const outputPath = resolve(process.cwd(), "content/catalog.dev.json");
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

  console.info(`✅ Generated catalog.dev.json: ${outputPath}`);
  console.info(`   ${cards.length} cards (${figures.length} figures, ${tools.length} tools)`);
  console.info(`   ${relationships.length} relationships`);
  console.info(`   ${constellations.length} constellations`);
}

main();
