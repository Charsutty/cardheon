import type { ReactNode } from 'react'
import { ScrollView, YStack } from 'tamagui'

export type CardheonScreenProps = {
  children: ReactNode
  scroll?: boolean
}

export function CardheonScreen({ children, scroll = true }: CardheonScreenProps) {
  const content = (
    <YStack
      minHeight="100%"
      width="100%"
      maxWidth={430}
      alignSelf="center"
      backgroundColor="$background"
      paddingHorizontal="$3"
      paddingTop="$3"
      paddingBottom={96}
      gap="$3"
      position="relative"
      overflow="hidden"
    >
      <YStack position="absolute" width={260} height={260} borderRadius={130} borderWidth={1} borderColor="$border" opacity={0.28} right={-150} top={-120} />
      <YStack position="absolute" width={180} height={180} borderRadius={90} borderWidth={1} borderColor="$border" opacity={0.18} left={-120} top={300} />
      {children}
    </YStack>
  )

  if (!scroll) {
    return content
  }

  return (
    <ScrollView backgroundColor="$background" showsVerticalScrollIndicator={false}>
      {content}
    </ScrollView>
  )
}
