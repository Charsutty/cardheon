import { CardheonHeader, CardheonScreen, CategoryPill } from '@cardheon/ui'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Input, Text, XStack, YStack } from 'tamagui'
import { ScreenHeading } from '../../components/layout/ScreenHeading'
import { getCompletion, getCompletionPercentage } from '../../game/progress'
import { useGame } from '../../state/GameProvider'
import { FigureCollectionGrid } from './components/FigureCollectionGrid'

export function CollectionScreen() {
  const router = useRouter()
  const { catalog, progress, figureCards } = useGame()
  const [filter, setFilter] = useState<'all' | 'discovered' | 'locked'>('all')
  const [rarity, setRarity] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all')
  const [constellationId, setConstellationId] = useState<string | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const completion = getCompletion(progress, figureCards.length)
  const percentage = getCompletionPercentage(progress, figureCards.length)
  const categoryCount = new Set(catalog.cards.map((card) => card.kind)).size

  return (
    <CardheonScreen>
      <CardheonHeader coins={progress.xp} />
      <ScreenHeading title="Collection" eyebrow="Cabinet d’histoire" />

      <XStack borderRadius="$3" borderWidth={1} borderColor="$border" backgroundColor="$surface" paddingVertical="$3" paddingHorizontal="$2" justifyContent="space-around">
        <Stat value={String(completion.discovered)} label="Découvertes" />
        <Divider />
        <Stat value={`${percentage}%`} label="Complétion" />
        <Divider />
        <Stat value={String(categoryCount)} label="Catégories" />
      </XStack>

      <XStack gap="$2" flexWrap="wrap">
        <CategoryPill label="Toutes" active={filter === 'all'} onPress={() => setFilter('all')} />
        <CategoryPill label="Découvertes" active={filter === 'discovered'} onPress={() => setFilter('discovered')} />
        <CategoryPill label="À découvrir" active={filter === 'locked'} onPress={() => setFilter('locked')} />
      </XStack>

      <YStack gap="$2">
        <Text color="$brown" fontSize={10} fontWeight="800" letterSpacing={1}>RARETÉ</Text>
        <XStack gap="$2" flexWrap="wrap">
          <CategoryPill label="Toutes" active={rarity === 'all'} onPress={() => setRarity('all')} />
          <CategoryPill label="Communes" active={rarity === 'common'} onPress={() => setRarity('common')} />
          <CategoryPill label="Rares" active={rarity === 'rare'} onPress={() => setRarity('rare')} />
          <CategoryPill label="Épiques" active={rarity === 'epic'} onPress={() => setRarity('epic')} />
          <CategoryPill label="Légendaires" active={rarity === 'legendary'} onPress={() => setRarity('legendary')} />
        </XStack>
      </YStack>

      <YStack gap="$2">
        <Text color="$brown" fontSize={10} fontWeight="800" letterSpacing={1}>CONSTELLATION</Text>
        <XStack gap="$2" flexWrap="wrap">
          <CategoryPill label="Toutes" active={!constellationId} onPress={() => setConstellationId(undefined)} />
          {catalog.constellations.slice(0, 6).map((constellation) => (
            <CategoryPill
              key={constellation.id}
              label={constellation.localization.fr?.title ?? constellation.slug}
              active={constellationId === constellation.id}
              onPress={() => setConstellationId(constellation.id)}
            />
          ))}
        </XStack>
      </YStack>

      <XStack alignItems="center" gap="$2" borderRadius="$2" borderWidth={1} borderColor="$border" backgroundColor="$surface" paddingHorizontal="$3" minHeight={42}>
        <Text color="$goldDark" fontSize={12}>⌕</Text>
        <Input
          flex={1}
          unstyled
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher dans la collection..."
          placeholderTextColor="$muted"
          color="$ink"
          fontSize={12}
          returnKeyType="search"
        />
      </XStack>

      <FigureCollectionGrid
        filter={filter}
        searchQuery={searchQuery}
        rarity={rarity}
        constellationId={constellationId}
        onOpenCard={(cardId) => router.push(`/card/${cardId}` as never)}
      />
    </CardheonScreen>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <YStack alignItems="center" gap={2}>
      <Text color="$ink" fontFamily="$heading" fontSize={20} lineHeight={24} fontWeight="700">{value}</Text>
      <Text color="$muted" fontSize={9} lineHeight={12}>{label}</Text>
    </YStack>
  )
}

function Divider() {
  return <YStack width={1} height={38} backgroundColor="$border" />
}
