import { Text, XStack, YStack } from 'tamagui'

type ExplorerIdentityProps = {
  xp: number
}

export function ExplorerIdentity({ xp }: ExplorerIdentityProps) {
  const progress = Math.min(1, xp / 2000)

  return (
    <YStack alignItems="center" gap="$2" paddingTop="$2">
      <XStack width={94} height={94} borderRadius={47} borderWidth={2} borderColor="$gold" backgroundColor="$surfaceMuted" alignItems="center" justifyContent="center">
        <XStack width={78} height={78} borderRadius={39} borderWidth={1} borderColor="$borderStrong" backgroundColor="$goldPale" alignItems="center" justifyContent="center">
          <Text color="$ink" fontFamily="$heading" fontSize={36} fontWeight="700">E</Text>
        </XStack>
      </XStack>
      <Text color="$ink" fontFamily="$heading" fontSize={23} fontWeight="700">Explorateur</Text>
      <Text color="$muted" fontSize={10}>NIVEAU 12</Text>
      <YStack width={160} height={5} borderRadius={999} backgroundColor="$surfaceMuted" overflow="hidden">
        <YStack width={`${progress * 100}%`} height="100%" backgroundColor="$gold" />
      </YStack>
      <Text color="$muted" fontSize={9}>{xp} / 2000 XP</Text>
    </YStack>
  )
}
