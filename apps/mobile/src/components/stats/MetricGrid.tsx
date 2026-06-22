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
      padding="$4"
      justifyContent="space-between"
    >
      {metrics.map(({ value, label }) => (
        <YStack key={label} alignItems="center" gap="$1">
          <Text color="$ink" fontSize={20} fontWeight="900">{value}</Text>
          <Text color="$muted" fontSize={11}>{label}</Text>
        </YStack>
      ))}
    </XStack>
  )
}
