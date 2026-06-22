import { CardheonButton, CardheonHeader, CardheonScreen, CategoryPill } from '@cardheon/ui'
import { Text, XStack, YStack } from 'tamagui'
import { ScreenHeading } from '../src/components/layout/ScreenHeading'
import { useGame } from '../src/state/GameProvider'

const nodes = [
  { id: 'cleopatra', label: 'CLÉOPÂTRE', kind: 'Personnage', x: 116, y: 16, glyph: 'C' },
  { id: 'ramses', label: 'RAMSÈS II', kind: 'Personnage', x: 10, y: 118, glyph: 'R' },
  { id: 'alexandria', label: 'ALEXANDRIE', kind: 'Lieu', x: 220, y: 118, glyph: '⌂' },
  { id: 'hieroglyphs', label: 'HIÉROGLYPHES', kind: 'Concept', x: 8, y: 330, glyph: '✣' },
  { id: 'pyramids', label: 'PYRAMIDES', kind: 'Concept', x: 222, y: 330, glyph: '△' },
  { id: 'tutankhamun', label: 'TOUTÂNKHAMON', kind: 'Personnage', x: 116, y: 445, glyph: 'T' },
]

export default function KnowledgeMapScreen() {
  const { xp } = useGame()

  return (
    <CardheonScreen>
      <CardheonHeader coins={xp} />
      <ScreenHeading eyebrow="Graphe historique" title="Arbre de connaissances" />
      <XStack gap="$2">
        <CategoryPill label="Carte" active />
        <CategoryPill label="Liste" />
      </XStack>

      <YStack height={565} position="relative" borderRadius="$4" borderWidth={1} borderColor="$border" backgroundColor="$paper" overflow="hidden">
        <YStack position="absolute" left={138} top={92} width={1} height={365} backgroundColor="$borderStrong" opacity={0.75} />
        <YStack position="absolute" left={62} top={252} width={220} height={1} backgroundColor="$borderStrong" opacity={0.75} />

        <YStack position="absolute" left={101} top={205} width={112} height={112} borderRadius={56} borderWidth={2} borderColor="$gold" backgroundColor="$goldPale" alignItems="center" justifyContent="center" zIndex={2}>
          <Text color="$goldDark" fontSize={35} fontWeight="900">△</Text>
          <Text color="$ink" fontFamily="$heading" fontSize={12} fontWeight="700">ÉGYPTE</Text>
          <Text color="$muted" fontSize={8}>CIVILISATION</Text>
        </YStack>

        {nodes.map((node) => (
          <YStack key={node.id} position="absolute" left={node.x} top={node.y} alignItems="center" gap={3} zIndex={3}>
            <XStack width={64} height={64} borderRadius={32} borderWidth={2} borderColor="$borderStrong" backgroundColor="$surface" alignItems="center" justifyContent="center">
              <XStack width={52} height={52} borderRadius={26} backgroundColor="$surfaceMuted" alignItems="center" justifyContent="center">
                <Text color="$goldDark" fontFamily="$heading" fontSize={19} fontWeight="700">{node.glyph}</Text>
              </XStack>
            </XStack>
            <YStack backgroundColor="$surface" borderRadius="$1" paddingHorizontal="$2" paddingVertical={3} alignItems="center">
              <Text color="$ink" fontFamily="$heading" fontSize={8} fontWeight="700">{node.label}</Text>
              <Text color="$muted" fontSize={7}>{node.kind}</Text>
            </YStack>
          </YStack>
        ))}
      </YStack>

      <CardheonButton variant="secondary">EXPLORER CETTE BRANCHE</CardheonButton>
    </CardheonScreen>
  )
}
