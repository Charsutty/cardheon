import type { ReactNode } from 'react'
import { Text, XStack } from 'tamagui'

export type CardheonButtonVariant = 'primary' | 'secondary' | 'ghost'

export type CardheonButtonProps = {
  children: ReactNode
  variant?: CardheonButtonVariant
  disabled?: boolean
  onPress?: () => void
}

export function CardheonButton({ children, variant = 'primary', disabled, onPress }: CardheonButtonProps) {
  const isPrimary = variant === 'primary'
  const isGhost = variant === 'ghost'

  return (
    <XStack
      opacity={disabled ? 0.55 : 1}
      pressStyle={{ scale: 0.98, backgroundColor: isPrimary ? '$goldDark' : '$surfaceMuted' }}
      onPress={disabled ? undefined : onPress}
      alignItems="center"
      justifyContent="center"
      minHeight={48}
      paddingHorizontal="$5"
      borderRadius="$2"
      borderWidth={isGhost ? 0 : 1}
      borderColor={isPrimary ? '$goldDark' : '$border'}
      backgroundColor={isPrimary ? '$gold' : isGhost ? 'transparent' : '$surface'}
      shadowColor="$goldDark"
      shadowOpacity={isPrimary ? 0.18 : 0.04}
      shadowRadius={isPrimary ? 8 : 3}
      shadowOffset={{ width: 0, height: 3 }}
    >
      <Text color={isPrimary ? '$white' : '$brown'} fontSize={12} fontWeight="800" letterSpacing={0.7}>
        {children}
      </Text>
    </XStack>
  )
}
