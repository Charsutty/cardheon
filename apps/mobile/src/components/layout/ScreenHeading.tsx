import { Text, XStack, YStack } from 'tamagui'

type ScreenHeadingProps = {
  title: string
  eyebrow?: string
  description?: string
  action?: string
}

export function ScreenHeading({ title, eyebrow, description, action }: ScreenHeadingProps) {
  return (
    <YStack gap="$2" alignItems="center" paddingVertical="$1">
      {eyebrow ? (
        <Text color="$goldDark" fontSize={9} fontWeight="800" letterSpacing={1.4}>
          {eyebrow.toUpperCase()}
        </Text>
      ) : null}
      <XStack alignItems="center" justifyContent="center" gap="$2" width="100%">
        <YStack height={1} width={28} backgroundColor="$border" />
        <Text color="$ink" fontFamily="$heading" fontSize={21} lineHeight={27} fontWeight="700" letterSpacing={0.5} textAlign="center" maxWidth="76%">
          {title.toUpperCase()}
        </Text>
        <YStack height={1} width={28} backgroundColor="$border" />
      </XStack>
      {description ? <Text color="$muted" fontSize={12} lineHeight={18} textAlign="center">{description}</Text> : null}
      {action ? <Text color="$goldDark" fontSize={10} fontWeight="800">{action}</Text> : null}
    </YStack>
  )
}
