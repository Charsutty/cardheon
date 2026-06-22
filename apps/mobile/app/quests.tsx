import { CardheonHeader, CardheonScreen, CategoryPill, QuestItem } from '@cardheon/ui'
import { XStack, YStack } from 'tamagui'
import { ScreenHeading } from '../src/components/layout/ScreenHeading'
import { useGame } from '../src/state/GameProvider'

export default function QuestsScreen() {
  const { catalog, discoveredCardIds, xp } = useGame()
  const discovered = new Set(discoveredCardIds)
  const quests = catalog.constellations.map((constellation) => ({
    id: constellation.id,
    title: constellation.localization.fr?.title ?? constellation.slug,
    description: constellation.localization.fr?.subtitle
      ?? `Découvrir les cartes de cette constellation`,
    current: constellation.cardIds.filter((cardId) => discovered.has(cardId)).length,
    target: constellation.cardIds.length,
    reward: constellation.reward?.xp ?? 0,
  }))

  return (
    <CardheonScreen>
      <CardheonHeader coins={xp} />
      <ScreenHeading
        eyebrow="Journal de route"
        title="Quêtes"
        description="Suis les fils de l’Histoire et gagne de quoi poursuivre ton exploration."
      />
      <XStack gap="$2">
        <CategoryPill label="Quêtes" active />
        <CategoryPill label="Défis quotidiens" />
      </XStack>
      <YStack gap="$3">
        {quests.map((quest) => <QuestItem key={quest.id} {...quest} />)}
      </YStack>
    </CardheonScreen>
  )
}
