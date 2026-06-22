import { Text, YStack } from 'tamagui'

type SectionIntroProps = {
  title: string
  description?: string
  centered?: boolean
}

export function SectionIntro({ title, description, centered = false }: SectionIntroProps) {
  return (
    <YStack gap="$2" alignItems={centered ? 'center' : 'flex-start'}>
      <Text
        color="$brown"
        fontSize={12}
        fontWeight="800"
        letterSpacing={1}
        textAlign={centered ? 'center' : 'left'}
      >
        {title}
      </Text>
      {description ? (
        <Text
          color="$muted"
          fontSize={13}
          lineHeight={19}
          textAlign={centered ? 'center' : 'left'}
        >
          {description}
        </Text>
      ) : null}
    </YStack>
  )
}
