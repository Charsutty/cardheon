import { Text, XStack } from 'tamagui'

export type CategoryPillProps = {
  label: string
  active?: boolean
  onPress?: () => void
}

export function CategoryPill({ label, active, onPress }: CategoryPillProps) {
  return (
    <XStack
      onPress={onPress}
      pressStyle={{ scale: 0.97 }}
      borderRadius="$1"
      borderWidth={1}
      borderColor={active ? '$borderStrong' : '$border'}
      backgroundColor={active ? '$surface' : '$paper'}
      paddingHorizontal="$3"
      minHeight={34}
      alignItems="center"
      justifyContent="center"
    >
      <Text color={active ? '$goldDark' : '$muted'} fontSize={9} lineHeight={12} fontWeight="800" letterSpacing={0.35} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
    </XStack>
  )
}
