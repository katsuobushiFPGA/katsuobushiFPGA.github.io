<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import RouteMap from './components/RouteMap.vue'
import { routeCandidates, sunProfiles, timeSlots } from './data/demoData'
import { formatMeters, getHeatAdjustment, getRouteSummary } from './utils/shade'
import { buildRouteCandidates, measureDistanceMeters, snapCoordinateToWalkway } from './utils/routeGraph'
import type {
  PlateauBuildingFeatureCollection,
  PlateauManifest,
  RouteCandidate,
  TimeSlot,
  WalkwayFeatureCollection,
} from './types'

type SelectionTarget = 'start' | 'end'
type BuildingViewMode = '2d' | '3d'

interface LocationOption {
  id: string
  label: string
  coordinate: [number, number]
}

const locationOptions: LocationOption[] = [
  { id: 'tokyo-station', label: '東京駅 丸の内中央口', coordinate: [139.76698, 35.68123] },
  { id: 'marunouchi-naka', label: '丸の内仲通り', coordinate: [139.76384, 35.68166] },
  { id: 'nijubashimae', label: '二重橋前', coordinate: [139.76155, 35.67982] },
  { id: 'otemachi-one', label: 'Otemachi One', coordinate: [139.76186, 35.68406] },
  { id: 'otemachi-park', label: '大手町パークビル', coordinate: [139.76027, 35.68507] },
  { id: 'wadakura', label: '和田倉噴水公園', coordinate: [139.76294, 35.68051] },
]

const fallbackStart = locationOptions[0]!
const fallbackEnd = locationOptions[3]!

const selectedTime = ref<TimeSlot>('14:00')
const selectedRouteId = ref('balanced')
const buildingViewMode = ref<BuildingViewMode>('3d')
const selectedStartPresetId = ref(fallbackStart.id)
const selectedEndPresetId = ref(fallbackEnd.id)
const activeSelectionTarget = ref<SelectionTarget>('start')
const startSelection = ref({
  label: fallbackStart.label,
  coordinate: fallbackStart.coordinate,
  presetId: fallbackStart.id as string | null,
})
const endSelection = ref({
  label: fallbackEnd.label,
  coordinate: fallbackEnd.coordinate,
  presetId: fallbackEnd.id as string | null,
})
const plateauManifest = ref<PlateauManifest | null>(null)
const walkwayData = ref<WalkwayFeatureCollection | null>(null)
const buildingData = ref<PlateauBuildingFeatureCollection | null>(null)

const startLabel = computed(() => startSelection.value.label)
const endLabel = computed(() => endSelection.value.label)
const startPoint = computed(() => startSelection.value.coordinate)
const endPoint = computed(() => endSelection.value.coordinate)

const selectedHeat = computed(() => sunProfiles[selectedTime.value])

function applyPresetSelection(target: SelectionTarget, presetId: string) {
  const preset = locationOptions.find((option) => option.id === presetId)
  if (!preset) {
    return
  }

  if (target === 'start') {
    selectedStartPresetId.value = preset.id
    startSelection.value = {
      label: preset.label,
      coordinate: preset.coordinate,
      presetId: preset.id,
    }
    return
  }

  selectedEndPresetId.value = preset.id
  endSelection.value = {
    label: preset.label,
    coordinate: preset.coordinate,
    presetId: preset.id,
  }
}

function describeCoordinate(target: SelectionTarget, coordinate: [number, number]) {
  const nearestPreset = locationOptions.reduce((best, option) => {
    const distance = measureDistanceMeters(option.coordinate, coordinate)
    if (!best || distance < best.distance) {
      return { option, distance }
    }
    return best
  }, null as { option: LocationOption; distance: number } | null)

  if (nearestPreset && nearestPreset.distance <= 110) {
    return `${nearestPreset.option.label} 付近`
  }

  return target === 'start' ? '地図で指定した始点' : '地図で指定した終点'
}

function handleMapSelection(coordinate: [number, number]) {
  if (!walkwayData.value) {
    return
  }

  const snapped = snapCoordinateToWalkway(walkwayData.value, coordinate)
  if (!snapped.coordinate) {
    return
  }

  const target = activeSelectionTarget.value
  const nextLabel = describeCoordinate(target, snapped.coordinate)
  if (target === 'start') {
    selectedStartPresetId.value = ''
    startSelection.value = {
      label: nextLabel,
      coordinate: snapped.coordinate,
      presetId: null,
    }
    return
  }

  selectedEndPresetId.value = ''
  endSelection.value = {
    label: nextLabel,
    coordinate: snapped.coordinate,
    presetId: null,
  }
}

const availableRoutes = computed<RouteCandidate[]>(() => {
  if (walkwayData.value && buildingData.value) {
    const realRoutes = buildRouteCandidates(walkwayData.value, buildingData.value, startPoint.value, endPoint.value, selectedTime.value)
    if (realRoutes.length === 3) {
      return realRoutes
    }
  }

  return routeCandidates
})

const picks = computed(() => {
  const routes = availableRoutes.value
  if (routes.length === 0) {
    return {
      shortest: 'shortest' as const,
      shadiest: 'shade' as const,
      balanced: 'balanced' as const,
    }
  }

  const firstRoute = routes[0]!
  const maxDistance = Math.max(...routes.map((route) => route.distanceMeters))
  const shortest = routes.reduce((best, current) => current.distanceMeters < best.distanceMeters ? current : best, firstRoute)
  const shadiest = routes.reduce(
    (best, current) => current.shadeRatioByTime[selectedTime.value] > best.shadeRatioByTime[selectedTime.value] ? current : best,
    firstRoute,
  )
  const balanced = routes.reduce((best, current) => {
    const bestScore = best.shadeRatioByTime[selectedTime.value] * 0.68 + (1 - best.distanceMeters / maxDistance) * 0.32
    const currentScore = current.shadeRatioByTime[selectedTime.value] * 0.68 + (1 - current.distanceMeters / maxDistance) * 0.32
    return currentScore > bestScore ? current : best
  }, firstRoute)

  return {
    shortest: shortest.id,
    shadiest: shadiest.id,
    balanced: balanced.id,
  }
})

const rankedRoutes = computed(() => {
  return availableRoutes.value.map((route) => {
    const summary = getRouteSummary(route, selectedTime.value)
    const badges = [
      route.id === picks.value.shortest ? '最短' : null,
      route.id === picks.value.shadiest ? '最も涼しい' : null,
      route.id === picks.value.balanced ? 'おすすめ' : null,
    ].filter((badge): badge is string => badge !== null)

    return {
      ...route,
      shadePercent: summary.shadePercent,
      exposurePercent: summary.exposurePercent,
      avoidedHeatLoad: summary.avoidedHeatLoad,
      badges,
    }
  })
})

const selectedRoute = computed(() => {
  const route = rankedRoutes.value.find((candidate) => candidate.id === selectedRouteId.value) ?? rankedRoutes.value[0]

  if (!route) {
    throw new Error('Route data is not available')
  }

  return route
})

const timeIndex = computed({
  get: () => timeSlots.indexOf(selectedTime.value),
  set: (value: number | string) => {
    const nextTime = timeSlots[Number(value)]

    if (nextTime) {
      selectedTime.value = nextTime
    }
  },
})

const dataStatus = computed(() => {
  return {
    hasWalkways: walkwayData.value !== null,
    hasPlateauManifest: plateauManifest.value !== null,
    hasBuildings: buildingData.value !== null,
    walkwayCount: walkwayData.value?.metadata.count ?? 0,
    buildingCount: buildingData.value?.metadata.count ?? 0,
    walkwayUpdatedAt: walkwayData.value?.metadata.generatedAt ?? null,
    plateauUpdatedAt: plateauManifest.value?.generatedAt ?? null,
    buildingUpdatedAt: buildingData.value?.metadata.generatedAt ?? null,
  }
})

const officialResources = computed(() => {
  const resources = plateauManifest.value?.resources ?? {}
  return Object.entries(resources)
    .filter((entry): entry is [string, NonNullable<typeof entry[1]>] => entry[1] !== null)
    .slice(0, 3)
})

onMounted(async () => {
  const walkwayUrl = `${import.meta.env.BASE_URL}data/marunouchi-walkways.geojson`
  const plateauUrl = `${import.meta.env.BASE_URL}data/plateau-chiyoda-resources.json`
  const buildingUrl = `${import.meta.env.BASE_URL}data/plateau-marunouchi-buildings.geojson`

  const [walkwayResponse, plateauResponse, buildingResponse] = await Promise.allSettled([
    fetch(walkwayUrl),
    fetch(plateauUrl),
    fetch(buildingUrl),
  ])

  if (walkwayResponse.status === 'fulfilled' && walkwayResponse.value.ok) {
    walkwayData.value = await walkwayResponse.value.json()
  }

  if (plateauResponse.status === 'fulfilled' && plateauResponse.value.ok) {
    plateauManifest.value = await plateauResponse.value.json()
  }

  if (buildingResponse.status === 'fulfilled' && buildingResponse.value.ok) {
    buildingData.value = await buildingResponse.value.json()
  }
})
</script>

<template>
  <main class="min-h-screen bg-[linear-gradient(180deg,#f7f3e8_0%,#efe7d1_28%,#d6e0dd_100%)] text-slate-950">
    <div class="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-5 py-8 lg:px-8 lg:py-10">
      <section class="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,251,235,0.92),rgba(255,255,255,0.72))] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <div class="mb-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
          <span class="rounded-full bg-amber-200 px-3 py-1 text-amber-900">PLATEAU concept MVP</span>
          <span>Marunouchi / Otemachi</span>
        </div>
        <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h1 class="max-w-3xl font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',serif] text-4xl leading-tight text-slate-950 md:text-6xl">
              真夏の丸の内で、
              <span class="text-cyan-800">いちばん影を拾う徒歩ルート</span>
              を探す。
            </h1>
            <p class="mt-5 max-w-2xl text-base leading-8 text-slate-700 md:text-lg">
              PLATEAU 建物形状と OSM 歩行ネットワークから、丸の内・大手町の 3 種類の実ルートを引き分けます。時刻や出発条件を変えると、地図の横で即座に結果を比較できます。
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <article class="rounded-[24px] bg-slate-950 px-5 py-4 text-slate-50 shadow-[0_24px_50px_rgba(15,23,42,0.28)]">
              <p class="text-xs uppercase tracking-[0.2em] text-slate-400">体感指標</p>
              <p class="mt-2 text-3xl font-semibold">{{ selectedHeat.heatIndex.toFixed(1) }}°C</p>
              <p class="mt-2 text-sm text-slate-300">{{ getHeatAdjustment(selectedTime) }}</p>
            </article>
            <article class="rounded-[24px] bg-white px-5 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <p class="text-xs uppercase tracking-[0.2em] text-slate-500">推奨ルート</p>
              <p class="mt-2 text-2xl font-semibold text-slate-900">{{ selectedRoute.title }}</p>
              <p class="mt-2 text-sm text-slate-600">{{ selectedRoute.subtitle }}</p>
            </article>
            <article class="rounded-[24px] bg-cyan-900 px-5 py-4 text-cyan-50 shadow-[0_16px_40px_rgba(8,145,178,0.24)]">
              <p class="text-xs uppercase tracking-[0.2em] text-cyan-100/80">この時間の日陰率</p>
              <p class="mt-2 text-3xl font-semibold">{{ selectedRoute.shadePercent }}%</p>
              <p class="mt-2 text-sm text-cyan-100/80">建物影に入る区間の推定比率</p>
            </article>
          </div>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[0.84fr_1.16fr] xl:items-start">
        <aside class="rounded-[32px] border border-slate-900/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.86))] p-6 text-slate-50 shadow-[0_24px_80px_rgba(15,23,42,0.24)] xl:sticky xl:top-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs uppercase tracking-[0.2em] text-slate-400">出発条件</p>
              <h2 class="mt-2 text-2xl font-semibold">{{ startLabel }} → {{ endLabel }}</h2>
            </div>
            <div class="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
              {{ selectedTime }} 発
            </div>
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <label class="block text-sm text-slate-300">
              <span class="text-xs uppercase tracking-[0.16em] text-slate-500">始点候補</span>
              <select
                class="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-50 outline-none transition focus:border-amber-300"
                :value="selectedStartPresetId"
                @change="applyPresetSelection('start', ($event.target as HTMLSelectElement).value)"
              >
                <option value="" class="text-slate-900">地図で指定した始点を維持</option>
                <option v-for="option in locationOptions" :key="option.id" :value="option.id" class="text-slate-900">
                  {{ option.label }}
                </option>
              </select>
            </label>
            <label class="block text-sm text-slate-300">
              <span class="text-xs uppercase tracking-[0.16em] text-slate-500">終点候補</span>
              <select
                class="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-50 outline-none transition focus:border-amber-300"
                :value="selectedEndPresetId"
                @change="applyPresetSelection('end', ($event.target as HTMLSelectElement).value)"
              >
                <option value="" class="text-slate-900">地図で指定した終点を維持</option>
                <option v-for="option in locationOptions" :key="option.id" :value="option.id" class="text-slate-900">
                  {{ option.label }}
                </option>
              </select>
            </label>
          </div>

          <div class="mt-4 flex flex-wrap gap-3">
            <button
              class="rounded-full border px-4 py-2 text-sm transition"
              :class="activeSelectionTarget === 'start' ? 'border-amber-300 bg-amber-300 text-slate-950' : 'border-white/15 bg-white/5 text-slate-200 hover:border-white/30'"
              type="button"
              @click="activeSelectionTarget = 'start'"
            >
              地図クリックで始点を置く
            </button>
            <button
              class="rounded-full border px-4 py-2 text-sm transition"
              :class="activeSelectionTarget === 'end' ? 'border-amber-300 bg-amber-300 text-slate-950' : 'border-white/15 bg-white/5 text-slate-200 hover:border-white/30'"
              type="button"
              @click="activeSelectionTarget = 'end'"
            >
              地図クリックで終点を置く
            </button>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <span class="text-xs uppercase tracking-[0.16em] text-slate-500">建物表示</span>
            <button
              class="rounded-full border px-4 py-2 text-sm transition"
              :class="buildingViewMode === '2d' ? 'border-cyan-300 bg-cyan-300 text-slate-950' : 'border-white/15 bg-white/5 text-slate-200 hover:border-white/30'"
              type="button"
              @click="buildingViewMode = '2d'"
            >
              2D
            </button>
            <button
              class="rounded-full border px-4 py-2 text-sm transition"
              :class="buildingViewMode === '3d' ? 'border-cyan-300 bg-cyan-300 text-slate-950' : 'border-white/15 bg-white/5 text-slate-200 hover:border-white/30'"
              type="button"
              @click="buildingViewMode = '3d'"
            >
              3D
            </button>
          </div>

          <p class="mt-3 text-sm leading-6 text-slate-400">
            地図をクリックすると、{{ activeSelectionTarget === 'start' ? '始点' : '終点' }}が最寄りの歩道ノードへスナップされます。
          </p>

          <div class="mt-8">
            <div class="flex items-center justify-between text-sm text-slate-300">
              <label for="timeRange">時刻</label>
              <span>{{ selectedTime }}</span>
            </div>
            <input
              id="timeRange"
              class="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-amber-400"
              type="range"
              :value="timeIndex"
              min="0"
              :max="timeSlots.length - 1"
              step="1"
              @input="timeIndex = Number(($event.target as HTMLInputElement).value)"
            />
            <div class="mt-3 flex justify-between text-xs text-slate-500">
              <span v-for="time in timeSlots" :key="time">{{ time }}</span>
            </div>
          </div>

          <div class="mt-8 space-y-3">
            <button
              v-for="route in rankedRoutes"
              :key="route.id"
              class="w-full rounded-[22px] border px-4 py-4 text-left transition duration-200"
              :class="route.id === selectedRouteId
                ? 'border-white/70 bg-white/10 shadow-[0_12px_24px_rgba(148,163,184,0.14)]'
                : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'"
              type="button"
              @click="selectedRouteId = route.id"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="badge in route.badges"
                      :key="badge"
                      class="rounded-full bg-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-200"
                    >
                      {{ badge }}
                    </span>
                  </div>
                  <p class="mt-3 text-lg font-semibold">{{ route.title }}</p>
                  <p class="mt-1 text-sm text-slate-400">{{ route.subtitle }}</p>
                </div>
                <span class="mt-1 h-4 w-4 rounded-full" :style="{ backgroundColor: route.color }" />
              </div>
              <div class="mt-4 grid grid-cols-3 gap-3 text-sm text-slate-300">
                <div>
                  <p class="text-xs uppercase tracking-[0.16em] text-slate-500">距離</p>
                  <p class="mt-1">{{ formatMeters(route.distanceMeters) }}</p>
                </div>
                <div>
                  <p class="text-xs uppercase tracking-[0.16em] text-slate-500">徒歩</p>
                  <p class="mt-1">{{ route.walkMinutes }} 分</p>
                </div>
                <div>
                  <p class="text-xs uppercase tracking-[0.16em] text-slate-500">日陰率</p>
                  <p class="mt-1">{{ route.shadePercent }}%</p>
                </div>
              </div>
            </button>
          </div>
        </aside>

        <div class="grid gap-6">
          <RouteMap
            :selected-time="selectedTime"
            :highlighted-route-id="selectedRouteId"
            :route-candidates="rankedRoutes"
            :start-label="startLabel"
            :end-label="endLabel"
            :start-point="startPoint"
            :end-point="endPoint"
            :active-selection-target="activeSelectionTarget"
            :building-view-mode="buildingViewMode"
            :walkway-data="walkwayData"
            :building-data="buildingData"
            @map-select="handleMapSelection"
          />

          <article class="rounded-[28px] border border-slate-900/10 bg-white/80 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur">
            <p class="text-xs uppercase tracking-[0.22em] text-slate-500">Why this route</p>
            <h2 class="mt-3 text-2xl font-semibold text-slate-950">{{ selectedRoute.title }} の判断</h2>
            <p class="mt-4 text-sm leading-7 text-slate-700">
              {{ selectedTime }} 時点では、{{ selectedRoute.title }} が実道路グラフ上で最も条件に合う経路です。建物影の影響は道路セグメントごとに評価しており、距離と露出区間のトレードオフを比較できます。
            </p>

            <dl class="mt-6 grid gap-4 sm:grid-cols-2">
              <div class="rounded-[20px] bg-slate-100 px-4 py-4">
                <dt class="text-xs uppercase tracking-[0.18em] text-slate-500">推定露出区間</dt>
                <dd class="mt-2 text-2xl font-semibold text-slate-950">{{ selectedRoute.exposurePercent }}%</dd>
              </div>
              <div class="rounded-[20px] bg-slate-100 px-4 py-4">
                <dt class="text-xs uppercase tracking-[0.18em] text-slate-500">想定回避熱負荷</dt>
                <dd class="mt-2 text-2xl font-semibold text-slate-950">{{ selectedRoute.avoidedHeatLoad }} pt</dd>
              </div>
            </dl>
          </article>
        </div>
      </section>

      <section>
        <article class="rounded-[28px] border border-amber-300/40 bg-[linear-gradient(180deg,rgba(255,251,235,0.95),rgba(254,243,199,0.82))] p-6 shadow-[0_18px_48px_rgba(245,158,11,0.12)]">
          <p class="text-xs uppercase tracking-[0.22em] text-amber-700">Implementation status</p>
          <div class="mt-4 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <ul class="space-y-3 text-sm leading-7 text-amber-950">
              <li>
                歩行ネットワーク: {{ dataStatus.hasWalkways ? `実データ読込済み ${dataStatus.walkwayCount} 本` : '未生成' }}
              </li>
              <li>
                PLATEAU リソース: {{ dataStatus.hasPlateauManifest ? '公式 CKAN マニフェスト読込済み' : '未生成' }}
              </li>
              <li>
                建物形状: {{ dataStatus.hasBuildings ? 'PLATEAU CityGML 由来の footprint を表示中' : '未生成' }}
              </li>
              <li>
                建物 footprint: {{ dataStatus.hasBuildings ? `実データ読込済み ${dataStatus.buildingCount} 棟` : '未生成' }}
              </li>
            </ul>

            <div v-if="officialResources.length" class="rounded-[20px] bg-white/55 px-4 py-4">
              <p class="text-xs uppercase tracking-[0.18em] text-amber-800">Official sources</p>
              <ul class="mt-3 space-y-2 text-sm leading-6 text-slate-800">
                <li v-for="[key, resource] in officialResources" :key="key">
                  {{ key }}: {{ resource.name }}
                </li>
              </ul>
            </div>
          </div>
        </article>
      </section>
    </div>
  </main>
</template>