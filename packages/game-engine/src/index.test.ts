import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'
import { attemptDiscovery, type GameCatalog } from './index'

const catalog = JSON.parse(
  readFileSync(resolve(process.cwd(), 'content/catalog.dev.json'), 'utf8'),
) as GameCatalog

test('discovers Marie Curie with radioactivity and France', () => {
  const result = attemptDiscovery(catalog, { discoveredCardIds: [] }, [
    'concept.radioactivity',
    'place.france',
  ])
  assert.equal(result.type, 'new_figure')
  if (result.type === 'new_figure') assert.equal(result.cardId, 'figure.marie-curie')
})

test('discovers Cleopatra with ancient Egypt and queen', () => {
  const result = attemptDiscovery(catalog, { discoveredCardIds: [] }, [
    'period.ancient-egypt',
    'role.queen',
  ])
  assert.equal(result.type, 'new_figure')
  if (result.type === 'new_figure') assert.equal(result.cardId, 'figure.cleopatra')
})

test('reports an already discovered figure', () => {
  const result = attemptDiscovery(
    catalog,
    { discoveredCardIds: ['figure.hypatia'] },
    ['place.alexandria', 'domain.mathematics', 'period.ancient-egypt'],
  )
  assert.equal(result.type, 'already_discovered')
  if (result.type === 'already_discovered') assert.equal(result.cardId, 'figure.hypatia')
})

test('rejects attempts with fewer than two clues', () => {
  const result = attemptDiscovery(catalog, { discoveredCardIds: [] }, ['place.france'])
  assert.equal(result.type, 'invalid')
})
