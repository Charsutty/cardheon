import { Text, XStack, YStack } from 'tamagui'

type ExplorerIdentityProps = {
  xp: number
  xpPerLevel: number
  initialLevel: number
}

export function ExplorerIdentity({ xp, xpPerLevel, initialLevel }: ExplorerIdentityProps) {
  const safeXpPerLevel = Math.max(1, xpPerLevel)
  const completedLevels = Math.floor(xp / safeXpPerLevel)
  const level = initialLevel + completedLevels
  const levelXp = xp % safeXpPerLevel
  const progress = levelXp / safeXpPerLevel

  return (
    <YStack alignItems="center" gap="$2" paddingVertical="$2">
      <XStack width={90} height={90} borderRadius={45} borderWidth={2} borderColor="$gold" backgroundColor="$surfaceMuted" alignItems="center" justifyContent="center">
        <XStack width={74} height={74} borderRadius={37} borderWidth={1} borderColor="$borderStrong" backgroundColor="$goldPale" alignItems="center" justifyContent="center">
          <Text color="$ink" fontFamily="$heading" fontSize={34} lineHeight={40} fontWeight="700">E</Text>
        </XStack>
      </XStack>
      <Text color="$ink" fontFamily="$heading" fontSize={22} lineHeight={27} fontWeight="700">Explorateur</Text>
      <Text color="$goldDark" fontSize={9} lineHeight={12} fontWeight="800" letterSpacing={0.8}>NIVEAU {level}</Text>
      <YStack width={184} height={5} borderRadius={999} backgroundColor="$surfaceMuted" overflow="hidden">
        <YStack width={`${progress * 100}%`} height="100%" backgroundColor="$gold" />
      </YStack>
      <Text color="$muted" fontSize={9} lineHeight={12}>{levelXp} / {safeXpPerLevel} XP</Text>
    </YStack>
  )
}
