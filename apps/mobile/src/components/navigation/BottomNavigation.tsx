import { Link, usePathname } from 'expo-router'
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

  return (
    <XStack
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      width="100%"
      maxWidth={460}
      alignSelf="center"
      height={76}
      borderTopWidth={1}
      borderColor="$border"
      backgroundColor="$paper"
      paddingHorizontal="$2"
      paddingTop="$2"
      paddingBottom="$2"
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
            <YStack minWidth={56} alignItems="center" gap={3} paddingTop={2}>
              <XStack width={active ? 28 : 24} height={active ? 28 : 24} borderRadius={999} backgroundColor={active ? '$goldPale' : 'transparent'} alignItems="center" justifyContent="center">
                <Text color={active ? '$goldDark' : '$muted'} fontSize={17} fontWeight="800">{icon}</Text>
              </XStack>
              <Text color={active ? '$goldDark' : '$muted'} fontSize={8} fontWeight="800" textTransform="uppercase">
                {label}
              </Text>
            </YStack>
          </Link>
        )
      })}
    </XStack>
  )
}
