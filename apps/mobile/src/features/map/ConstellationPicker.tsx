import type { Constellation, GameCatalog } from '@cardheon/game-engine'
import { CategoryPill } from '@cardheon/ui'
import { useMemo, useState } from 'react'
import { Input, ScrollView, Text, XStack, YStack } from 'tamagui'

type ConstellationPickerProps = {
  catalog: GameCatalog
  discoveredCardIds: string[]
  selectedId?: string
  onSelect: (constellationId: string) => void
}

export function ConstellationPicker({
  catalog,
  discoveredCardIds,
  selectedId,
  onSelect,
}: ConstellationPickerProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'complete'>('all')
  const discovered = useMemo(() => new Set(discoveredCardIds), [discoveredCardIds])
  const normalizedQuery = query.trim().toLowerCase()

  const constellations = useMemo(() => {
    return catalog.constellations
      .map((constellation) => {
        const current = constellation.cardIds.filter((cardId) => discovered.has(cardId)).length
        const total = constellation.cardIds.length
        return {
          constellation,
          current,
          total,
          progress: total === 0 ? 0 : current / total,
        }
      })
      .filter((item) => {
        if (status === 'active' && (item.current === 0 || item.current === item.total)) return false
        if (status === 'complete' && item.current !== item.total) return false
        if (!normalizedQuery) return true
        const title = item.constellation.localization.fr?.title ?? item.constellation.slug
        return title.toLowerCase().includes(normalizedQuery)
      })
      .sort((left, right) => right.progress - left.progress || left.constellation.slug.localeCompare(right.constellation.slug))
  }, [catalog.constellations, discovered, normalizedQuery, status])

  return (
    <YStack borderRadius="$3" borderWidth={1} borderColor="$border" backgroundColor="$surface" padding="$3" gap="$3">
      <XStack alignItems="center" justifyContent="space-between">
        <Text color="$brown" fontSize={10} fontWeight="800" letterSpacing={1}>CONSTELLATIONS</Text>
        <Text color="$muted" fontSize={9}>{constellations.length} résultat{constellations.length > 1 ? 's' : ''}</Text>
      </XStack>

      <XStack alignItems="center" gap="$2" borderRadius="$2" borderWidth={1} borderColor="$border" backgroundColor="$paper" paddingHorizontal="$3" minHeight={38}>
        <Text color="$goldDark" fontSize={12}>⌕</Text>
        <Input
          flex={1}
          unstyled
          value={query}
          onChangeText={setQuery}
          placeholder="Chercher une constellation..."
          placeholderTextColor="$muted"
          color="$ink"
          fontSize={12}
          returnKeyType="search"
        />
      </XStack>

      <XStack gap="$2" flexWrap="wrap">
        <CategoryPill label="Toutes" active={status === 'all'} onPress={() => setStatus('all')} />
        <CategoryPill label="En cours" active={status === 'active'} onPress={() => setStatus('active')} />
        <CategoryPill label="Terminées" active={status === 'complete'} onPress={() => setStatus('complete')} />
      </XStack>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap="$2" paddingRight="$4">
          {constellations.map(({ constellation, current, total }) => (
            <ConstellationOption
              key={constellation.id}
              constellation={constellation}
              current={current}
              total={total}
              selected={selectedId === constellation.id}
              onPress={() => onSelect(constellation.id)}
            />
          ))}
        </XStack>
      </ScrollView>
    </YStack>
  )
}

function ConstellationOption({
  constellation,
  current,
  total,
  selected,
  onPress,
}: {
  constellation: Constellation
  current: number
  total: number
  selected: boolean
  onPress: () => void
}) {
  const title = constellation.localization.fr?.title ?? constellation.slug
  const progress = total === 0 ? 0 : current / total

  return (
    <YStack
      onPress={onPress}
      pressStyle={{ scale: 0.98 }}
      width={156}
      minHeight={92}
      borderRadius="$2"
      borderWidth={1}
      borderColor={selected ? '$gold' : '$border'}
      backgroundColor={selected ? '$goldPale' : '$paper'}
      padding="$3"
      gap="$2"
    >
      <Text color="$ink" fontFamily="$heading" fontSize={11} lineHeight={15} fontWeight="700" numberOfLines={2}>
        {title.toUpperCase()}
      </Text>
      <Text color="$muted" fontSize={9} lineHeight={12}>{current} / {total}</Text>
      <YStack height={5} borderRadius={999} backgroundColor="$surfaceMuted" overflow="hidden">
        <YStack width={`${Math.round(progress * 100)}%`} height="100%" backgroundColor="$gold" />
      </YStack>
    </YStack>
  )
}
