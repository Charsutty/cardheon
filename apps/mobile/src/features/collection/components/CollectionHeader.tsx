import { Text, YStack } from 'tamagui'

type CollectionHeaderProps = {
  discovered: number
  total: number
}

export function CollectionHeader({ discovered, total }: CollectionHeaderProps) {
  return (
    <YStack gap="$1" alignItems="center">
      <Text color="$ink" fontSize={18} fontWeight="800">COLLECTION</Text>
      <Text color="$ink" fontSize={30} fontWeight="900">
        {discovered} / {total}
      </Text>
      <Text color="$muted" fontSize={13}>figures découvertes dans le catalogue de démo</Text>
    </YStack>
  )
}
