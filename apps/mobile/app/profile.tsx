import { CardheonButton, CardheonScreen } from '@cardheon/ui'
import { Text, XStack, YStack } from 'tamagui'

const menuItems = ['Paramètres', 'Statistiques', 'Sauvegarder', 'À propos']

export default function ProfileScreen() {
  return (
    <CardheonScreen>
      <YStack alignItems="center" gap="$3">
        <XStack width={116} height={116} borderRadius={58} borderWidth={2} borderColor="$gold" backgroundColor="$surfaceMuted" alignItems="center" justifyContent="center">
          <Text color="$ink" fontSize={48} fontWeight="900">◖</Text>
        </XStack>
        <YStack alignItems="center" gap="$1">
          <Text color="$ink" fontSize={22} fontWeight="800">Explorateur</Text>
          <Text color="$muted" fontSize={12}>Niveau 12</Text>
        </YStack>
        <YStack width={220} height={8} borderRadius={999} backgroundColor="$surfaceMuted" overflow="hidden">
          <YStack width="66%" height="100%" backgroundColor="$gold" />
        </YStack>
        <Text color="$muted" fontSize={10}>1250 / 2000 XP</Text>
      </YStack>

      <XStack borderRadius="$3" borderWidth={1} borderColor="$border" backgroundColor="$surface" padding="$4" justifyContent="space-between">
        {[
          ['142', 'Découvertes'],
          ['24%', 'Collection'],
          ['18', 'Quêtes'],
        ].map(([value, label]) => (
          <YStack key={label} alignItems="center" gap="$1">
            <Text color="$ink" fontSize={20} fontWeight="900">{value}</Text>
            <Text color="$muted" fontSize={11}>{label}</Text>
          </YStack>
        ))}
      </XStack>

      <YStack gap="$3">
        {menuItems.map((item) => (
          <XStack key={item} minHeight={50} borderRadius="$2" borderWidth={1} borderColor="$border" backgroundColor="$surface" alignItems="center" justifyContent="space-between" paddingHorizontal="$4">
            <XStack gap="$3" alignItems="center">
              <Text color="$goldDark" fontSize={15} fontWeight="900">✦</Text>
              <Text color="$ink" fontSize={12} fontWeight="700">{item.toUpperCase()}</Text>
            </XStack>
            <Text color="$goldDark" fontSize={16}>›</Text>
          </XStack>
        ))}
      </YStack>

      <CardheonButton variant="secondary">SE DÉCONNECTER</CardheonButton>
    </CardheonScreen>
  )
}
