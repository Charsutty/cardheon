import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'
import { attemptDiscovery, type GameCatalog } from './index'

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
