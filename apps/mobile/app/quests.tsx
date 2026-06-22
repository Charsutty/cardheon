import { CardheonHeader, CardheonScreen, CategoryPill, QuestItem } from '@cardheon/ui'
import { XStack, YStack } from 'tamagui'
import { ScreenHeading } from '../src/components/layout/ScreenHeading'
import { quests } from '../src/data/mockCards'
import { useGame } from '../src/state/GameProvider'

export default function QuestsScreen() {
  const { xp } = useGame()

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
