import { Text, XStack, YStack } from 'tamagui'

type ScreenHeadingProps = {
  title: string
  eyebrow?: string
  description?: string
  action?: string
}

export function ScreenHeading({ title, eyebrow, description, action }: ScreenHeadingProps) {
  return (
    <YStack gap="$2">
      <XStack alignItems="flex-end" justifyContent="space-between" gap="$3">
        <YStack gap={3} flex={1}>
          {eyebrow ? (
            <Text color="$goldDark" fontSize={9} fontWeight="800" letterSpacing={1.2}>
              {eyebrow.toUpperCase()}
            </Text>
          ) : null}
          <Text color="$ink" fontFamily="$heading" fontSize={25} fontWeight="700" letterSpacing={-0.3}>
            {title}
          </Text>
        </YStack>
        {action ? <Text color="$goldDark" fontSize={10} fontWeight="800">{action}</Text> : null}
      </XStack>
      {description ? <Text color="$muted" fontSize={12} lineHeight={18}>{description}</Text> : null}
    </YStack>
  )
}
