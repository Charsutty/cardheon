import { Link, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, XStack, YStack } from 'tamagui'

const destinations = [
  { href: '/' as const, label: 'Atelier', icon: '⚒' },
  { href: '/collection' as const, label: 'Collection', icon: '▥' },
  { href: '/quests' as const, label: 'Quêtes', icon: '✧' },
  { href: '/map' as const, label: 'Carte', icon: '⌖' },
  { href: '/profile' as const, label: 'Profil', icon: '♙' },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const bottomPadding = Math.max(insets.bottom, 8)

  return (
    <XStack
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      width="100%"
      maxWidth={430}
      alignSelf="center"
      height={68 + bottomPadding}
      borderTopWidth={1}
      borderColor="$border"
      backgroundColor="$paper"
      paddingHorizontal="$2"
      paddingTop="$2"
      paddingBottom={bottomPadding}
      justifyContent="space-around"
      zIndex={20}
      shadowColor="$ink"
      shadowOpacity={0.1}
      shadowRadius={14}
    >
      {destinations.map(({ href, label, icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)

        return (
          <Link key={href} href={href} asChild>
            <YStack flex={1} minWidth={52} alignItems="center" gap={2} paddingTop={2}>
              <XStack width={30} height={30} borderRadius={15} backgroundColor={active ? '$goldPale' : 'transparent'} alignItems="center" justifyContent="center">
                <Text color={active ? '$goldDark' : '$muted'} fontSize={16} fontWeight="800">{icon}</Text>
              </XStack>
              <Text color={active ? '$goldDark' : '$muted'} fontSize={8} lineHeight={11} fontWeight="800" textTransform="uppercase">
                {label}
              </Text>
            </YStack>
          </Link>
        )
      })}
    </XStack>
  )
}
