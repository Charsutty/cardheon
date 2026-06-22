import { CardheonScreen, CategoryPill, QuestItem } from '@cardheon/ui'
import { Text, XStack, YStack } from 'tamagui'
import { quests } from '../src/data/mockCards'

export default function QuestsScreen() {
  return (
    <CardheonScreen>
      <YStack gap="$2" alignItems="center">
        <Text color="$ink" fontSize={18} fontWeight="800">QUÊTES</Text>
        <XStack gap="$2">
          <CategoryPill label="Quêtes" active />
          <CategoryPill label="Défis quotidiens" />
        </XStack>
      </YStack>

      <YStack gap="$3">
        {quests.map((quest) => (
          <QuestItem key={quest.id} {...quest} />
        ))}
      </YStack>
    </CardheonScreen>
  )
}
