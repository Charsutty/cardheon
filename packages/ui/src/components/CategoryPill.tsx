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
      borderRadius={999}
      borderWidth={1}
      borderColor="$border"
      backgroundColor={active ? '$surfaceMuted' : '$surface'}
      paddingHorizontal="$3"
      height={30}
      alignItems="center"
      justifyContent="center"
    >
      <Text color={active ? '$goldDark' : '$muted'} fontSize={9} fontWeight="800" letterSpacing={0.4}>
        {label.toUpperCase()}
      </Text>
    </XStack>
  )
}
