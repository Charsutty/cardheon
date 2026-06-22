import { Text, XStack, YStack } from 'tamagui'

type ScreenHeadingProps = {
  title: string
  eyebrow?: string
  description?: string
  action?: string
}

export function ScreenHeading({ title, eyebrow, description, action }: ScreenHeadingProps) {
  return (
    <YStack gap="$2" alignItems="center">
      {eyebrow ? (
        <Text color="$goldDark" fontSize={9} fontWeight="800" letterSpacing={1.4}>
          {eyebrow.toUpperCase()}
        </Text>
      ) : null}
      <XStack alignItems="center" justifyContent="center" gap="$3" width="100%">
        <YStack height={1} width={36} backgroundColor="$border" />
        <Text color="$ink" fontFamily="$heading" fontSize={22} fontWeight="700" letterSpacing={0.8} textAlign="center">
          {title.toUpperCase()}
        </Text>
        <YStack height={1} width={36} backgroundColor="$border" />
      </XStack>
      {description ? <Text color="$muted" fontSize={12} lineHeight={18} textAlign="center">{description}</Text> : null}
      {action ? <Text color="$goldDark" fontSize={10} fontWeight="800">{action}</Text> : null}
    </YStack>
  )
}
