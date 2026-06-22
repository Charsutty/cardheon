import { Text, XStack, YStack } from 'tamagui'

export type Metric = {
  label: string
  value: string
}

type MetricGridProps = {
  metrics: Metric[]
}

export function MetricGrid({ metrics }: MetricGridProps) {
  return (
    <XStack
      borderRadius="$3"
      borderWidth={1}
      borderColor="$border"
      backgroundColor="$surface"
      paddingVertical="$4"
      paddingHorizontal="$2"
      justifyContent="space-around"
    >
      {metrics.map(({ value, label }, index) => (
        <XStack key={label} alignItems="center" flex={1}>
          {index > 0 ? <YStack width={1} height={34} backgroundColor="$border" /> : null}
          <YStack alignItems="center" gap="$1" flex={1}>
            <Text color="$ink" fontFamily="$heading" fontSize={20} lineHeight={24} fontWeight="700">{value}</Text>
            <Text color="$muted" fontSize={10} lineHeight={13}>{label}</Text>
          </YStack>
        </XStack>
      ))}
    </XStack>
  )
}
