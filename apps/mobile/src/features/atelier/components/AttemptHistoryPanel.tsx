import { Text, XStack, YStack } from 'tamagui'
import { getFrenchTitle } from '../../../game/catalog'
import { useGame } from '../../../state/GameProvider'

const resultLabels: Record<string, string> = {
  new_figure: 'Découverte',
  already_discovered: 'Déjà connue',
  craft: 'Création',
  near_miss: 'Presque',
  ambiguous: 'Ambigu',
  invalid: 'Impossible',
}

export function AttemptHistoryPanel() {
  const { getCard, progress } = useGame()
  const attempts = progress.attemptHistory.slice(0, 5)

  if (attempts.length === 0) return null

  return (
    <YStack borderRadius="$3" borderWidth={1} borderColor="$border" backgroundColor="$surface" padding="$3" gap="$3">
      <XStack alignItems="center" justifyContent="space-between">
        <Text color="$brown" fontSize={10} fontWeight="800" letterSpacing={1}>HISTORIQUE</Text>
        <Text color="$muted" fontSize={9}>{progress.attempts} tentative{progress.attempts > 1 ? 's' : ''}</Text>
      </XStack>
      {attempts.map((attempt) => {
        const inputTitles = attempt.inputCardIds
          .map((cardId) => {
            const card = getCard(cardId)
            return card ? getFrenchTitle(card) : cardId
          })
          .join(' + ')
        const resultCard = attempt.resultCardId ? getCard(attempt.resultCardId) : undefined

        return (
          <YStack key={attempt.id} gap="$1" paddingVertical="$2" borderTopWidth={1} borderColor="$border">
            <XStack justifyContent="space-between" gap="$2">
              <Text color="$ink" fontSize={11} lineHeight={15} fontWeight="800" flex={1} numberOfLines={1}>
                {resultLabels[attempt.resultType] ?? attempt.resultType}
              </Text>
              {typeof attempt.score === 'number' ? (
                <Text color="$goldDark" fontSize={10} fontWeight="800">{Math.round(attempt.score)} pts</Text>
              ) : null}
            </XStack>
            <Text color="$muted" fontSize={9} lineHeight={13} numberOfLines={2}>{inputTitles}</Text>
            {resultCard ? (
              <Text color="$goldDark" fontSize={9} lineHeight={13} numberOfLines={1}>{getFrenchTitle(resultCard)}</Text>
            ) : null}
          </YStack>
        )
      })}
    </YStack>
  )
}
