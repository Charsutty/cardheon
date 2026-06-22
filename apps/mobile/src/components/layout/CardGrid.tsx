import type { ReactNode } from 'react'
import { XStack } from 'tamagui'

type CardGridProps = {
  children: ReactNode
}

export function CardGrid({ children }: CardGridProps) {
  return (
    <XStack flexWrap="wrap" columnGap="$2" rowGap="$3" justifyContent="space-around">
      {children}
    </XStack>
  )
}
