import type { ReactNode } from 'react'
import { ScrollView, YStack } from 'tamagui'

export type CardheonScreenProps = {
  children: ReactNode
  scroll?: boolean
}

export function CardheonScreen({ children, scroll = true }: CardheonScreenProps) {
  const content = (
    <YStack minHeight="100%" backgroundColor="$background" padding="$5" paddingBottom={96} gap="$5">
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
