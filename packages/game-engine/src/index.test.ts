import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'
import { attemptCraft, attemptDiscovery, type Card, type GameCatalog } from './index'

const catalog = JSON.parse(
  readFileSync(resolve(process.cwd(), 'content/catalog.dev.json'), 'utf8'),
) as GameCatalog

const allToolCardIds = catalog.cards
  .filter((card) => card.kind !== 'figure')
  .map((card) => card.id)

function userState(discovered: string[] = []): { discoveredCardIds: string[]; unlockedCardIds: string[] } {
  return {
    discoveredCardIds: discovered,
    unlockedCardIds: [...allToolCardIds, ...discovered],
  }
}

test('discovers Marie Curie with physics, France, twentieth century and woman', () => {
  const result = attemptDiscovery(catalog, userState(), [
    'domain.physics',
    'place.france',
    'period.20th-century',
    'concept.female-figure',
  ])
  assert.equal(result.type, 'new_figure')
  if (result.type === 'new_figure') assert.equal(result.cardId, 'figure.marie-curie')
})

test('discovers Cleopatra with ancient Egypt and queen', () => {
  const result = attemptDiscovery(catalog, userState(), [
    'civilization.ancient-egypt',
    'role.queen',
  ])
  assert.equal(result.type, 'new_figure')
  if (result.type === 'new_figure') assert.equal(result.cardId, 'figure.cleopatra')
})

test('reports an already discovered figure', () => {
  const result = attemptDiscovery(
    catalog,
    userState(['figure.hypatia']),
    ['place.alexandria', 'domain.mathematics', 'period.antiquity'],
  )
  assert.equal(result.type, 'already_discovered')
  if (result.type === 'already_discovered') assert.equal(result.cardId, 'figure.hypatia')
})

test('rejects attempts with fewer than two clues', () => {
  const result = attemptDiscovery(catalog, userState(), ['place.france'])
  assert.equal(result.type, 'invalid')
})

test('a discovered figure becomes playable as an input card', () => {
  const result = attemptDiscovery(
    catalog,
    userState(['figure.hypatia']),
    ['figure.hypatia', 'place.alexandria'],
  )
  assert.equal(result.type, 'already_discovered')
  if (result.type === 'already_discovered') assert.equal(result.cardId, 'figure.hypatia')
})

test('crafts ancient Egypt from Egypt and antiquity', () => {
  const result = attemptCraft(catalog, ['place.egypt', 'period.antiquity'])
  assert.ok(result)
  assert.equal(result?.type, 'craft')
  if (result?.type === 'craft') assert.equal(result.outputCardId, 'civilization.ancient-egypt')
})

test('reports ambiguity when multiple undiscovered figures score inside the ambiguity margin', () => {
  const testCatalog = createTestCatalog({
    cards: [
      tool('period.shared', ['period.shared']),
      tool('domain.shared', ['domain.shared']),
      figure('figure.alpha', [
        { tag: 'period.shared', weight: 50 },
        { tag: 'domain.shared', weight: 50 },
      ]),
      figure('figure.beta', [
        { tag: 'period.shared', weight: 50 },
        { tag: 'domain.shared', weight: 50 },
      ]),
    ],
  })

  const result = attemptDiscovery(
    testCatalog,
    { discoveredCardIds: [], unlockedCardIds: ['period.shared', 'domain.shared'] },
    ['period.shared', 'domain.shared'],
  )

  assert.equal(result.type, 'ambiguous')
  if (result.type === 'ambiguous') {
    assert.equal(result.candidateCount, 2)
    assert.deepEqual(result.candidates.map((candidate) => candidate.cardId), ['figure.alpha', 'figure.beta'])
  }
})

test('keeps a contradictory high-score attempt as a near miss with a contradiction hint', () => {
  const testCatalog = createTestCatalog({
    cards: [
      tool('period.correct', ['period.correct']),
      tool('domain.correct', ['domain.correct']),
      tool('place.wrong', ['place.wrong']),
      figure(
        'figure.contradicted',
        [
          { tag: 'period.correct', weight: 60 },
          { tag: 'domain.correct', weight: 40 },
        ],
        {
          minScore: 90,
          contradictions: [
            {
              id: 'wrong-place',
              whenAll: ['tag:place.wrong'],
              weight: -60,
              reason: 'Wrong place',
            },
          ],
        },
      ),
    ],
  })

  const result = attemptDiscovery(
    testCatalog,
    { discoveredCardIds: [], unlockedCardIds: ['period.correct', 'domain.correct', 'place.wrong'] },
    ['period.correct', 'domain.correct', 'place.wrong'],
    { maxInputs: 5 },
  )

  assert.equal(result.type, 'near_miss')
  if (result.type === 'near_miss') {
    assert.equal(result.hints[0]?.type, 'contradictory')
    assert.equal(result.candidates[0]?.score, 40)
  }
})

test('allows one figure to be discovered through multiple coherent paths', () => {
  const testCatalog = createTestCatalog({
    cards: [
      tool('place.path-a', ['place.path-a']),
      tool('domain.path-a', ['domain.path-a']),
      tool('event.path-b', ['event.path-b']),
      tool('role.path-b', ['role.path-b']),
      figure('figure.multiple-paths', [
        { tag: 'place.path-a', weight: 45 },
        { tag: 'domain.path-a', weight: 45 },
        { tag: 'event.path-b', weight: 45 },
        { tag: 'role.path-b', weight: 45 },
      ], { minScore: 90 }),
    ],
  })
  const state = {
    discoveredCardIds: [],
    unlockedCardIds: ['place.path-a', 'domain.path-a', 'event.path-b', 'role.path-b'],
  }

  const firstPath = attemptDiscovery(testCatalog, state, ['place.path-a', 'domain.path-a'])
  const secondPath = attemptDiscovery(testCatalog, state, ['event.path-b', 'role.path-b'])

  assert.equal(firstPath.type, 'new_figure')
  assert.equal(secondPath.type, 'new_figure')
  if (firstPath.type === 'new_figure') assert.equal(firstPath.cardId, 'figure.multiple-paths')
  if (secondPath.type === 'new_figure') assert.equal(secondPath.cardId, 'figure.multiple-paths')
})

test('rejects known cards that are not currently playable', () => {
  const testCatalog = createTestCatalog({
    cards: [
      tool('period.playable', ['period.playable']),
      tool('domain.locked', ['domain.locked']),
      figure('figure.locked-input', [
        { tag: 'period.playable', weight: 50 },
        { tag: 'domain.locked', weight: 50 },
      ]),
    ],
  })

  const result = attemptDiscovery(
    testCatalog,
    { discoveredCardIds: [], unlockedCardIds: ['period.playable'] },
    ['period.playable', 'domain.locked'],
  )

  assert.equal(result.type, 'invalid')
  if (result.type === 'invalid') {
    assert.match(result.reason, /non-playable/)
  }
})

test('returns constellation completion rewards when a figure completes a constellation', () => {
  const testCatalog = createTestCatalog({
    cards: [
      tool('period.shared', ['period.shared']),
      tool('domain.shared', ['domain.shared']),
      tool('reward.tool', ['reward.tool']),
      {
        ...figure('figure.first', [
          { tag: 'period.shared', weight: 50 },
          { tag: 'domain.shared', weight: 50 },
        ]),
        constellationIds: ['constellation.test'],
      },
      {
        ...figure('figure.second', [
          { tag: 'period.shared', weight: 50 },
          { tag: 'domain.shared', weight: 50 },
        ]),
        constellationIds: ['constellation.test'],
      },
    ],
    constellations: [
      {
        id: 'constellation.test',
        slug: 'test',
        localization: { fr: { title: 'Test' } },
        cardIds: ['figure.first', 'figure.second'],
        reward: { xp: 40, unlockCardIds: ['reward.tool'] },
      },
    ],
  })

  const result = attemptDiscovery(
    testCatalog,
    { discoveredCardIds: ['figure.first'], unlockedCardIds: ['period.shared', 'domain.shared', 'figure.first'] },
    ['period.shared', 'domain.shared'],
  )

  assert.equal(result.type, 'new_figure')
  if (result.type === 'new_figure') {
    assert.equal(result.cardId, 'figure.second')
    assert.ok(result.rewards.some((reward) => reward.type === 'constellation_unlock'))
    assert.ok(result.rewards.some((reward) => reward.type === 'new_tool_card' && reward.value === 'reward.tool'))
    assert.ok(result.rewards.some((reward) => reward.type === 'xp' && reward.value === 40))
  }
})

function createTestCatalog(overrides: Partial<GameCatalog> & { cards: Card[] }): GameCatalog {
  return {
    version: 'test',
    cards: overrides.cards,
    relationships: overrides.relationships ?? [],
    constellations: overrides.constellations ?? [],
    packs: overrides.packs ?? [],
    sources: overrides.sources ?? [],
    gameplay: overrides.gameplay ?? {
      discovery: {
        minInputs: 2,
        maxInputs: 5,
      },
      progression: {
        xpPerLevel: 100,
        initialLevel: 1,
      },
    },
  }
}

function tool(id: string, tags: string[]): Card {
  return {
    id,
    slug: id.replace('.', '-'),
    kind: id.split('.')[0] as Card['kind'],
    status: 'reviewed',
    localization: { fr: { title: id } },
    tags: tags.map((tag) => ({ tag })),
  }
}

function figure(
  id: string,
  evidence: NonNullable<Card['discovery']>['evidence'],
  options: Partial<NonNullable<Card['discovery']>> = {},
): Card {
  return {
    id,
    slug: id.replace('.', '-'),
    kind: 'figure',
    status: 'reviewed',
    rarity: 'common',
    localization: { fr: { title: id } },
    discovery: {
      figureId: id,
      minScore: options.minScore,
      ambiguityMargin: options.ambiguityMargin,
      evidence,
      synergies: options.synergies,
      contradictions: options.contradictions,
      minEvidenceCount: options.minEvidenceCount,
    },
  }
}
