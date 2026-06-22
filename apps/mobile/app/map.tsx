import { CardheonButton, CardheonScreen } from '@cardheon/ui'
import { Text, XStack, YStack } from 'tamagui'

const nodes = [
  { id: 'cleopatra', label: 'CLÉOPÂTRE', x: 116, y: 24 },
  { id: 'ramses', label: 'RAMSÈS II', x: 16, y: 138 },
  { id: 'alexandria', label: 'ALEXANDRIE', x: 214, y: 138 },
  { id: 'hieroglyphs', label: 'HIÉROGLYPHES', x: 12, y: 334 },
  { id: 'pyramids', label: 'PYRAMIDES', x: 220, y: 334 },
  { id: 'tutankhamun', label: 'TOUTÂNKHAMON', x: 116, y: 468 },
]

export default function KnowledgeMapScreen() {
  return (
    <CardheonScreen>
      <YStack gap="$1" alignItems="center">
        <Text color="$ink" fontSize={16} fontWeight="800">ARBRE DE CONNAISSANCES</Text>
        <Text color="$muted" fontSize={11}>Explore les connexions historiques</Text>
      </YStack>

      <YStack height={610} position="relative" borderRadius="$4" borderWidth={1} borderColor="$border" backgroundColor="$surface" overflow="hidden">
        <YStack position="absolute" left={118} top={226} width={112} height={112} borderRadius={56} borderWidth={2} borderColor="$gold" backgroundColor="$surfaceMuted" alignItems="center" justifyContent="center">
          <Text color="$goldDark" fontSize={38} fontWeight="900">△</Text>
          <Text color="$ink" fontSize={12} fontWeight="800">ÉGYPTE</Text>
        </YStack>

        {nodes.map((node) => (
          <YStack key={node.id} position="absolute" left={node.x} top={node.y} alignItems="center" gap="$2">
            <XStack width={68} height={68} borderRadius={34} borderWidth={1} borderColor="$gold" backgroundColor="$surface" alignItems="center" justifyContent="center">
              <Text color="$goldDark" fontSize={20} fontWeight="900">✦</Text>
            </XStack>
            <Text color="$ink" fontSize={9} fontWeight="800" textAlign="center" width={100}>{node.label}</Text>
          </YStack>
        ))}
      </YStack>

      <CardheonButton>EXPLORER CETTE BRANCHE</CardheonButton>
    </CardheonScreen>
  )
}
