import type { ReactNode } from 'react'
import { XStack } from 'tamagui'

type CardGridProps = {
  children: ReactNode
}

export function CardGrid({ children }: CardGridProps) {
  return (
    <XStack flexWrap="wrap" gap="$3" justifyContent="space-between">
      {children}
    </XStack>
  )
}
