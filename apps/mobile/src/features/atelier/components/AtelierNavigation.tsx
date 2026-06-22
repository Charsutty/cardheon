import { Link } from 'expo-router'
import { Text, XStack } from 'tamagui'

const links = [
  { href: '/collection' as const, label: 'COLLECTION ›' },
  { href: '/map' as const, label: 'CONSTELLATIONS ›' },
  { href: '/profile' as const, label: 'PROFIL ›' },
]

export function AtelierNavigation() {
  return (
    <XStack gap="$2" flexWrap="wrap">
      {links.map(({ href, label }) => (
        <Link key={href} href={href} asChild>
          <Text color="$goldDark" fontSize={13} fontWeight="800">{label}</Text>
        </Link>
      ))}
    </XStack>
  )
}
