import type { TrainingZoneConfig } from "@/types/rowing-domain";
export function findTrainingZone(configs: TrainingZoneConfig[], heartRatePercent?: number, powerPercent?: number) {
  return configs.find((item) => {
    const hr = heartRatePercent === undefined || ((item.minHeartRatePercent ?? -Infinity) <= heartRatePercent && heartRatePercent <= (item.maxHeartRatePercent ?? Infinity));
    const power = powerPercent === undefined || ((item.minPowerPercent ?? -Infinity) <= powerPercent && powerPercent <= (item.maxPowerPercent ?? Infinity));
    return hr && power;
  })?.zone ?? null;
}

