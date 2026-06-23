import { Link, usePathname } from 'expo-router'
import { Pressable, useWindowDimensions } from 'react-native'
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
  const { width } = useWindowDimensions()
  const bottomPadding = Math.max(insets.bottom, 10)
  const isWide = width >= 640

  return (
    <XStack
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      width="100%"
      alignItems="center"
      justifyContent="center"
      pointerEvents="box-none"
    >
      <XStack
        width="100%"
        maxWidth={isWide ? 480 : undefined}
        height={72 + bottomPadding}
        borderTopWidth={1}
        borderColor="$border"
        backgroundColor="$paper"
        paddingHorizontal={isWide ? '$4' : '$2'}
        paddingTop="$2"
        paddingBottom={bottomPadding}
        justifyContent="space-around"
        alignItems="flex-start"
        zIndex={20}
        shadowColor="$ink"
        shadowOpacity={0.1}
        shadowRadius={14}
      >
        {destinations.map(({ href, label, icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)

          return (
            <Link key={href} href={href} asChild>
              <Pressable style={{ flex: 1 }}>
                {({ pressed }) => (
                  <YStack
                    flex={1}
                    minWidth={52}
                    alignItems="center"
                    gap={4}
                    paddingTop={4}
                    opacity={pressed ? 0.7 : 1}
                  >
                    <XStack
                      width={34}
                      height={34}
                      borderRadius={17}
                      backgroundColor={active ? '$goldPale' : 'transparent'}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color={active ? '$goldDark' : '$muted'} fontSize={17} fontWeight="800">{icon}</Text>
                    </XStack>
                    <Text
                      color={active ? '$goldDark' : '$muted'}
                      fontSize={9}
                      lineHeight={12}
                      fontWeight="800"
                      textTransform="uppercase"
                    >
                      {label}
                    </Text>
                  </YStack>
                )}
              </Pressable>
            </Link>
          )
        })}
      </XStack>
    </XStack>
  )
}
