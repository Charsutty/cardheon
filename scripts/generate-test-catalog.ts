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
  { id: "place.germany", kind: "place", title: "Allemagne", tags: { "place.germany": 100 } },
  { id: "place.persia", kind: "place", title: "Perse", rarity: "uncommon", tags: { "place.persia": 100, "place.middle-east": 70 } },
  { id: "place.florence", kind: "place", title: "Florence", rarity: "uncommon", tags: { "place.florence": 100, "place.italy": 70, "period.renaissance": 40 } },
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
  { id: "domain.arts", kind: "domain", title: "Arts", tags: { "domain.arts": 100 } },
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
  { id: "domain.literature", kind: "domain", title: "Littérature", tags: { "domain.literature": 100, "domain.arts": 50 } },
  { id: "domain.statistics", kind: "domain", title: "Statistiques", rarity: "uncommon", tags: { "domain.statistics": 100, "domain.mathematics": 70 } },
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
  { id: "concept.dna", kind: "concept", title: "ADN", rarity: "rare", tags: { "concept.dna": 100, "domain.biology": 80 } },
  { id: "concept.spaceflight", kind: "concept", title: "Vol spatial", rarity: "rare", tags: { "concept.spaceflight": 100, "domain.mathematics": 50, "domain.computing": 50, "period.20th-century": 60 } },
  { id: "concept.feminism", kind: "concept", title: "Féminisme", rarity: "uncommon", tags: { "concept.feminism": 100, "concept.women-history": 80, "concept.civil-rights": 40 } },
  { id: "concept.public-health", kind: "concept", title: "Santé publique", rarity: "uncommon", tags: { "concept.public-health": 100, "domain.medicine": 70 } },
  { id: "concept.typography", kind: "concept", title: "Typographie", rarity: "uncommon", tags: { "concept.typography": 100, "concept.printing": 70 } },
  { id: "concept.faith", kind: "concept", title: "Foi", tags: { "concept.faith": 100, "concept.religion": 70 } },
  { id: "concept.colonialism", kind: "concept", title: "Colonialisme", rarity: "uncommon", tags: { "concept.colonialism": 100, "domain.politics": 70 } },
];

const EVENTS: ToolInput[] = [
  { id: "event.american-civil-rights", kind: "event", title: "Mouvement américain des droits civiques", rarity: "uncommon", tags: { "event.american-civil-rights": 100, "concept.civil-rights": 80, "place.usa": 70 } },
  { id: "event.french-revolution", kind: "event", title: "Révolution française", rarity: "uncommon", tags: { "event.french-revolution": 100, "place.france": 70, "concept.liberty": 60 } },
  { id: "event.independence-south-america", kind: "event", title: "Indépendances sud-américaines", rarity: "uncommon", tags: { "event.independence-south-america": 100, "region.south-america": 80, "concept.liberty": 60 } },
  { id: "event.crusades", kind: "event", title: "Croisades", rarity: "uncommon", tags: { "event.crusades": 100, "period.middle-ages": 80, "concept.faith": 60 } },
  { id: "event.scientific-revolution", kind: "event", title: "Révolution scientifique", rarity: "rare", tags: { "event.scientific-revolution": 100, "period.17th-century": 70, "domain.science": 70 } },
  { id: "event.space-race", kind: "event", title: "Course à l’espace", rarity: "rare", tags: { "event.space-race": 100, "concept.spaceflight": 80, "period.20th-century": 80 } },
];

const WORKS: ToolInput[] = [
  { id: "work.mona-lisa", kind: "work", title: "La Joconde", rarity: "epic", tags: { "work.mona-lisa": 100, "domain.painting": 80, "period.renaissance": 60 } },
  { id: "work.principia", kind: "work", title: "Principes mathématiques", rarity: "epic", tags: { "work.principia": 100, "domain.physics": 80, "domain.mathematics": 70 } },
  { id: "work.origin-of-species", kind: "work", title: "L’Origine des espèces", rarity: "epic", tags: { "work.origin-of-species": 100, "domain.biology": 80, "concept.evolution": 90 } },
  { id: "work.republic", kind: "work", title: "La République", rarity: "epic", tags: { "work.republic": 100, "domain.philosophy": 80, "period.antiquity": 60 } },
  { id: "work.divine-comedy", kind: "work", title: "La Divine Comédie", rarity: "epic", tags: { "work.divine-comedy": 100, "domain.literature": 80, "period.middle-ages": 60, "place.italy": 60 } },
  { id: "work.vindication-rights-woman", kind: "work", title: "Défense des droits de la femme", rarity: "epic", tags: { "work.vindication-rights-woman": 100, "concept.feminism": 90, "domain.literature": 60, "period.18th-century": 50 } },
  { id: "work.canon-medicine", kind: "work", title: "Canon de la médecine", rarity: "epic", tags: { "work.canon-medicine": 100, "domain.medicine": 90, "period.middle-ages": 60, "place.persia": 60 } },
];

const MOVEMENTS: ToolInput[] = [
  { id: "movement.humanism", kind: "movement", title: "Humanisme", rarity: "uncommon", tags: { "movement.humanism": 100, "period.renaissance": 70, "domain.philosophy": 60 } },
  { id: "movement.enlightenment", kind: "movement", title: "Lumières", rarity: "uncommon", tags: { "movement.enlightenment": 100, "period.18th-century": 70, "domain.philosophy": 60 } },
  { id: "movement.romanticism", kind: "movement", title: "Romantisme", rarity: "uncommon", tags: { "movement.romanticism": 100, "period.19th-century": 70, "domain.arts": 60 } },
  { id: "movement.early-modern-medicine", kind: "movement", title: "Médecine savante médiévale", rarity: "uncommon", tags: { "movement.early-modern-medicine": 100, "domain.medicine": 70, "period.middle-ages": 60 } },
];

const SYMBOLS: ToolInput[] = [
  { id: "symbol.owl", kind: "symbol", title: "Chouette", rarity: "uncommon", tags: { "symbol.wisdom": 100, "domain.philosophy": 60 } },
  { id: "symbol.compass", kind: "symbol", title: "Boussole", rarity: "uncommon", tags: { "symbol.navigation": 100, "domain.exploration": 60 } },
  { id: "symbol.atom", kind: "symbol", title: "Atome", rarity: "rare", tags: { "symbol.science": 100, "domain.physics": 60 } },
  { id: "symbol.rocket", kind: "symbol", title: "Fusée", rarity: "rare", tags: { "symbol.rocket": 100, "concept.spaceflight": 80 } },
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
    unlocksToolCardIds: [],
  },
  {
    id: "figure.leonardo-da-vinci",
    title: "Léonard de Vinci",
    subtitle: "Peintre, inventeur et savant",
    shortDescription: "Génie de la Renaissance, auteur de la Joconde et de nombreux projets techniques.",
    rarity: "legendary",
    tags: { "domain.arts": 45, "role.artist": 40, "period.renaissance": 45, "place.italy": 35, "role.inventor": 30 },
    evidence: [
      { tag: "domain.arts", weight: 30, reason: "Arts" },
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
    unlocksToolCardIds: ["work.principia"],
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
    unlocksToolCardIds: ["work.origin-of-species"],
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
    unlocksToolCardIds: [],
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
  {
    id: "figure.rosalind-franklin",
    title: "Rosalind Franklin",
    subtitle: "Chimiste et cristallographe",
    shortDescription: "Scientifique britannique dont les images de diffraction des rayons X ont été décisives pour comprendre la structure de l’ADN.",
    rarity: "epic",
    tags: { "domain.chemistry": 40, "domain.biology": 35, "concept.dna": 55, "place.england": 30, "period.20th-century": 35, "concept.women-history": 30 },
    evidence: [
      { tag: "domain.biology", weight: 28, reason: "Biologie moléculaire" },
      { tag: "domain.chemistry", weight: 24, reason: "Cristallographie chimique" },
      { tag: "period.20th-century", weight: 18, reason: "XXe siècle" },
      { tag: "concept.women-history", weight: 18, reason: "Femme de science" },
      { card: "concept.dna", weight: 25, reason: "ADN" },
    ],
    synergies: [
      { id: "biology-chemistry-20th", whenAll: ["tag:domain.biology", "tag:domain.chemistry", "tag:period.20th-century"], weight: 18, reason: "Biologie + chimie + XXe siècle" },
    ],
    unlocksToolCardIds: ["concept.public-health"],
  },
  {
    id: "figure.katherine-johnson",
    title: "Katherine Johnson",
    subtitle: "Mathématicienne de la NASA",
    shortDescription: "Mathématicienne américaine dont les calculs de trajectoire ont contribué aux premiers vols spatiaux habités.",
    rarity: "epic",
    tags: { "domain.mathematics": 50, "domain.statistics": 30, "domain.computing": 35, "concept.spaceflight": 45, "place.usa": 35, "period.20th-century": 35, "concept.women-history": 30 },
    evidence: [
      { tag: "domain.mathematics", weight: 30, reason: "Mathématiques" },
      { tag: "period.20th-century", weight: 20, reason: "XXe siècle" },
      { tag: "concept.women-history", weight: 18, reason: "Femme de science" },
      { card: "place.usa", weight: 18, reason: "États-Unis" },
      { card: "concept.spaceflight", weight: 25, reason: "Vol spatial" },
    ],
    synergies: [
      { id: "math-usa-space", whenAll: ["tag:domain.mathematics", "card:place.usa", "tag:period.20th-century"], weight: 18, reason: "Mathématiques + USA + XXe siècle" },
    ],
    unlocksToolCardIds: ["event.space-race", "symbol.rocket"],
  },
  {
    id: "figure.ibn-sina",
    title: "Ibn Sina",
    subtitle: "Médecin et philosophe",
    shortDescription: "Savant persan médiéval, connu en Europe sous le nom d’Avicenne, auteur du Canon de la médecine.",
    rarity: "legendary",
    tags: { "domain.medicine": 50, "domain.philosophy": 35, "period.middle-ages": 40, "place.persia": 40, "domain.science": 30 },
    evidence: [
      { tag: "domain.medicine", weight: 32, reason: "Médecine" },
      { tag: "domain.philosophy", weight: 22, reason: "Philosophie" },
      { tag: "period.middle-ages", weight: 22, reason: "Moyen Âge" },
      { card: "place.persia", weight: 18, reason: "Perse" },
    ],
    synergies: [
      { id: "medicine-philosophy-middle-ages", whenAll: ["tag:domain.medicine", "tag:domain.philosophy", "tag:period.middle-ages"], weight: 18, reason: "Médecine + philosophie médiévale" },
    ],
    unlocksToolCardIds: [],
  },
  {
    id: "figure.mary-wollstonecraft",
    title: "Mary Wollstonecraft",
    subtitle: "Écrivaine et philosophe",
    shortDescription: "Autrice anglaise, pionnière de la pensée féministe moderne et de l’éducation des femmes.",
    rarity: "epic",
    tags: { "domain.philosophy": 35, "domain.literature": 40, "concept.feminism": 55, "place.england": 30, "period.18th-century": 35, "concept.women-history": 35 },
    evidence: [
      { tag: "domain.philosophy", weight: 24, reason: "Philosophie politique" },
      { card: "place.england", weight: 18, reason: "Angleterre" },
      { tag: "concept.women-history", weight: 20, reason: "Droits des femmes" },
      { card: "concept.feminism", weight: 32, reason: "Féminisme" },
      { tag: "period.18th-century", weight: 16, reason: "XVIIIe siècle" },
    ],
    synergies: [
      { id: "women-philosophy-england", whenAll: ["tag:domain.philosophy", "card:concept.female-figure", "card:place.england"], weight: 16, reason: "Philosophie + droits des femmes + Angleterre" },
    ],
    unlocksToolCardIds: ["work.vindication-rights-woman"],
  },
  {
    id: "figure.johannes-gutenberg",
    title: "Johannes Gutenberg",
    subtitle: "Inventeur et imprimeur",
    shortDescription: "Inventeur européen associé à l’imprimerie à caractères mobiles, qui transforma la diffusion des textes.",
    rarity: "legendary",
    tags: { "concept.printing": 55, "concept.typography": 40, "place.germany": 40, "period.renaissance": 35, "role.inventor": 35 },
    evidence: [
      { card: "concept.printing", weight: 34, reason: "Imprimerie" },
      { tag: "period.renaissance", weight: 22, reason: "Renaissance" },
      { card: "place.germany", weight: 20, reason: "Allemagne" },
      { tag: "role.inventor", weight: 18, reason: "Inventeur" },
    ],
    synergies: [
      { id: "printing-germany-renaissance", whenAll: ["card:concept.printing", "card:place.germany", "tag:period.renaissance"], weight: 18, reason: "Imprimerie + Allemagne + Renaissance" },
    ],
    unlocksToolCardIds: ["concept.typography"],
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
  {
    id: "constellation.code-and-space",
    slug: "calcul-code-espace",
    localization: { fr: { title: "Calcul, code et espace" } },
    cardIds: ["figure.ada-lovelace", "figure.katherine-johnson", "figure.isaac-newton"],
    reward: { xp: 220, unlockCardIds: ["concept.spaceflight", "domain.statistics"] },
  },
  {
    id: "constellation.texts-and-transmission",
    slug: "textes-et-transmission",
    localization: { fr: { title: "Textes et transmission" } },
    cardIds: ["figure.johannes-gutenberg", "figure.mary-wollstonecraft", "figure.plato", "figure.ibn-sina"],
    reward: { xp: 240, unlockCardIds: ["domain.literature", "concept.typography"] },
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
    { source: "concept.dna", predicate: "branch_of", target: "domain.biology", weight: 45, sourceIds: ["source.cardheon.test"] },
    { source: "concept.spaceflight", predicate: "uses", target: "domain.mathematics", weight: 40, sourceIds: ["source.cardheon.test"] },
    { source: "concept.feminism", predicate: "related_to", target: "concept.female-figure", weight: 40, sourceIds: ["source.cardheon.test"] },
    { source: "concept.typography", predicate: "branch_of", target: "concept.printing", weight: 35, sourceIds: ["source.cardheon.test"] },
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
    { source: "place.florence", predicate: "located_in", target: "place.italy", weight: 60, sourceIds: ["source.cardheon.test"] },
    { source: "place.persia", predicate: "related_to", target: "place.india", weight: 25, sourceIds: ["source.cardheon.test"] },
    { source: "period.renaissance", predicate: "follows", target: "period.middle-ages", weight: 40, sourceIds: ["source.cardheon.test"] },
    { source: "period.15th-century", predicate: "part_of", target: "period.renaissance", weight: 40, sourceIds: ["source.cardheon.test"] },
    { source: "period.16th-century", predicate: "part_of", target: "period.renaissance", weight: 40, sourceIds: ["source.cardheon.test"] },
    { source: "work.mona-lisa", predicate: "created_by", target: "figure.leonardo-da-vinci", weight: 60, sourceIds: ["source.cardheon.test"] },
    { source: "work.principia", predicate: "written_by", target: "figure.isaac-newton", weight: 60, sourceIds: ["source.cardheon.test"] },
    { source: "work.origin-of-species", predicate: "written_by", target: "figure.charles-darwin", weight: 60, sourceIds: ["source.cardheon.test"] },
    { source: "work.republic", predicate: "written_by", target: "figure.plato", weight: 60, sourceIds: ["source.cardheon.test"] },
    { source: "work.vindication-rights-woman", predicate: "written_by", target: "figure.mary-wollstonecraft", weight: 60, sourceIds: ["source.cardheon.test"] },
    { source: "work.canon-medicine", predicate: "written_by", target: "figure.ibn-sina", weight: 60, sourceIds: ["source.cardheon.test"] },
  );

  return relationships;
}

function main(): void {
  const cards: Card[] = [...tools.map(toCard), ...figures.map(toCard)];
  const relationships = buildRelationships();

  // Starter pack: a very small set of atomic concepts, places, periods and roles.
  // Most specific tools are crafted from these basics or unlocked by figures.
  const starterCardIds = [
    // Fundamental knowledge domains
    "domain.mathematics",
    "domain.physics",
    "domain.biology",
    "domain.philosophy",
    "domain.arts",
    // Broad timeline periods
    "period.antiquity",
    "period.middle-ages",
    "period.renaissance",
    "period.20th-century",
    // Broad geography
    "place.france",
    "place.england",
    "place.italy",
    "place.greece",
    "place.egypt",
    // Archetypal roles and social concepts
    "role.ruler",
    "concept.female-figure",
    "concept.faith",
    "role.resistance",
  ];

  // Crafting recipes: combine two basic tool cards to obtain a more specific tool.
  // Recipes are checked before discovery: when the selected cards exactly match a
  // recipe, the player creates the output card instead of attempting a discovery.
  const craftingRecipes: CraftingRecipe[] = [
    // Geography + period -> civilization
    { id: "recipe.ancient-egypt", inputs: ["place.egypt", "period.antiquity"], outputCardId: "civilization.ancient-egypt", localization: { fr: { reason: "L’Égypte antique émerge de l’Égypte et de l’Antiquité." } } },
    { id: "recipe.ancient-greece", inputs: ["place.greece", "period.antiquity"], outputCardId: "civilization.ancient-greece", localization: { fr: { reason: "La Grèce antique émerge de la Grèce et de l’Antiquité." } } },
    { id: "recipe.ancient-rome", inputs: ["place.italy", "period.antiquity"], outputCardId: "civilization.ancient-rome", localization: { fr: { reason: "La Rome antique émerge de l’Italie et de l’Antiquité." } } },

    // Domain + period -> concept / movement
    { id: "recipe.radioactivity", inputs: ["domain.physics", "domain.mathematics"], outputCardId: "concept.radioactivity", localization: { fr: { reason: "La radioactivité est une découverte de la physique mathématique." } } },
    { id: "recipe.astronomy", inputs: ["domain.physics", "period.renaissance"], outputCardId: "domain.astronomy", localization: { fr: { reason: "L’astronomie moderne naît de la physique et de la Renaissance." } } },
    { id: "recipe.evolution", inputs: ["domain.biology", "domain.mathematics"], outputCardId: "concept.evolution", localization: { fr: { reason: "La théorie de l’évolution s’appuie sur la biologie et les statistiques." } } },
    { id: "recipe.socratic-method", inputs: ["domain.philosophy", "period.antiquity"], outputCardId: "concept.socratic-method", localization: { fr: { reason: "La méthode socratique naît de la philosophie antique." } } },
    { id: "recipe.humanism", inputs: ["domain.arts", "period.renaissance"], outputCardId: "movement.humanism", localization: { fr: { reason: "L’humanisme renaît de l’art et de la Renaissance." } } },

    // Geography + domain -> specific place
    { id: "recipe.athens", inputs: ["place.greece", "domain.philosophy"], outputCardId: "place.athens", localization: { fr: { reason: "Athènes devient le foyer de la philosophie grecque." } } },
    { id: "recipe.alexandria", inputs: ["place.egypt", "domain.mathematics"], outputCardId: "place.alexandria", localization: { fr: { reason: "Alexandrie devient le centre des savoirs mathématiques." } } },

    // Role + concept -> specific role
    { id: "recipe.queen", inputs: ["role.ruler", "concept.female-figure"], outputCardId: "role.queen", localization: { fr: { reason: "Une femme souveraine devient reine." } } },
    { id: "recipe.artist", inputs: ["domain.arts", "period.renaissance"], outputCardId: "role.artist", localization: { fr: { reason: "L’artiste se distingue dans la Renaissance." } } },
    { id: "recipe.explorer", inputs: ["role.resistance", "period.renaissance"], outputCardId: "role.explorer", localization: { fr: { reason: "L’esprit d’aventure renaît de la Renaissance." } } },

    // Society recipes
    { id: "recipe.civil-rights", inputs: ["concept.female-figure", "role.resistance"], outputCardId: "concept.civil-rights", localization: { fr: { reason: "La résistance des femmes préfigure les droits civiques." } } },
    { id: "recipe.pastor", inputs: ["concept.faith", "role.ruler"], outputCardId: "role.pastor", localization: { fr: { reason: "Un dirigeant de foi devient pasteur." } } },
    { id: "recipe.apartheid", inputs: ["concept.civil-rights", "place.south-africa"], outputCardId: "concept.apartheid", localization: { fr: { reason: "L’apartheid naît des droits civiques en Afrique du Sud." } } },
    { id: "recipe.buddhism", inputs: ["period.antiquity", "place.india"], outputCardId: "concept.buddhism", localization: { fr: { reason: "Le bouddhisme naît dans l’Inde antique." } } },

    // Geography recipes
    { id: "recipe.usa", inputs: ["place.england", "period.20th-century"], outputCardId: "place.usa", localization: { fr: { reason: "Les États-Unis émergent comme puissance du XXe siècle." } } },
    { id: "recipe.spain", inputs: ["place.italy", "period.renaissance"], outputCardId: "place.spain", localization: { fr: { reason: "L’Espagne renaît comme puissance de la Renaissance." } } },
    { id: "recipe.britain", inputs: ["place.england", "period.middle-ages"], outputCardId: "region.britain", localization: { fr: { reason: "La Bretagne se forme dans l’Angleterre médiévale." } } },
    { id: "recipe.south-africa", inputs: ["place.egypt", "period.20th-century"], outputCardId: "place.south-africa", localization: { fr: { reason: "L’Afrique du Sud entre dans l’histoire du XXe siècle." } } },
    { id: "recipe.india", inputs: ["place.egypt", "period.middle-ages"], outputCardId: "place.india", localization: { fr: { reason: "L’Inde médiévale s’illumine comme l’Égypte." } } },
    { id: "recipe.south-america", inputs: ["place.england", "period.renaissance"], outputCardId: "region.south-america", localization: { fr: { reason: "L’Amérique du Sud se dessine à la Renaissance." } } },
    { id: "recipe.venice", inputs: ["place.italy", "period.middle-ages"], outputCardId: "place.venice", localization: { fr: { reason: "Venise fleurit au Moyen Âge italien." } } },

    // Late domain recipes
    { id: "recipe.nursing", inputs: ["domain.biology", "concept.faith"], outputCardId: "domain.nursing", localization: { fr: { reason: "Les soins infirmiers naissent de la biologie et du dévouement." } } },
    { id: "recipe.computing", inputs: ["domain.mathematics", "period.19th-century"], outputCardId: "domain.computing", localization: { fr: { reason: "L’informatique théorique émerge des mathématiques du XIXe siècle." } } },
    { id: "recipe.19th-century", inputs: ["period.renaissance", "concept.evolution"], outputCardId: "period.19th-century", localization: { fr: { reason: "La théorie de l’évolution marque le XIXe siècle." } } },
    { id: "recipe.18th-century", inputs: ["domain.philosophy", "movement.enlightenment"], outputCardId: "period.18th-century", localization: { fr: { reason: "Les Lumières structurent le XVIIIe siècle." } } },
    { id: "recipe.enlightenment", inputs: ["domain.philosophy", "period.renaissance"], outputCardId: "movement.enlightenment", localization: { fr: { reason: "Les Lumières prolongent l’humanisme philosophique." } } },
    { id: "recipe.literature", inputs: ["domain.arts", "domain.philosophy"], outputCardId: "domain.literature", localization: { fr: { reason: "La littérature naît entre art et pensée." } } },
    { id: "recipe.feminism", inputs: ["concept.female-figure", "domain.philosophy"], outputCardId: "concept.feminism", localization: { fr: { reason: "La réflexion sur les droits des femmes fait émerger le féminisme." } } },
    { id: "recipe.statistics", inputs: ["domain.mathematics", "period.20th-century"], outputCardId: "domain.statistics", localization: { fr: { reason: "Les statistiques modernes organisent les calculs du XXe siècle." } } },
    { id: "recipe.dna", inputs: ["domain.biology", "period.20th-century"], outputCardId: "concept.dna", localization: { fr: { reason: "La biologie du XXe siècle révèle l’ADN." } } },
    { id: "recipe.spaceflight", inputs: ["domain.mathematics", "period.20th-century"], outputCardId: "concept.spaceflight", localization: { fr: { reason: "Le vol spatial dépend de calculs modernes." } } },
    { id: "recipe.germany", inputs: ["place.england", "domain.arts"], outputCardId: "place.germany", localization: { fr: { reason: "Les arts d’Europe du Nord ouvrent vers l’Allemagne." } } },
    { id: "recipe.persia", inputs: ["place.india", "period.middle-ages"], outputCardId: "place.persia", localization: { fr: { reason: "Les routes savantes médiévales relient l’Inde et la Perse." } } },
    { id: "recipe.florence", inputs: ["place.italy", "domain.arts"], outputCardId: "place.florence", localization: { fr: { reason: "Florence devient un foyer artistique italien." } } },
    { id: "recipe.printing", inputs: ["domain.literature", "period.renaissance"], outputCardId: "concept.printing", localization: { fr: { reason: "La diffusion des textes fait émerger l’imprimerie." } } },
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
    version: "0.2.2-test",
    gameplay: {
      discovery: { minInputs: 2, maxInputs: 5 },
      crafting: craftingRecipes,
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
