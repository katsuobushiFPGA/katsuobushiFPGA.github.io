<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { sunProfiles } from '../data/demoData'
import { clamp } from '../utils/shade'
import type { PlateauBuildingFeatureCollection, RouteCandidate, TimeSlot, WalkwayFeatureCollection } from '../types'

const props = defineProps<{
  selectedTime: TimeSlot
  highlightedRouteId: string
  routeCandidates: RouteCandidate[]
  startLabel: string
  endLabel: string
  startPoint: [number, number] | null
  endPoint: [number, number] | null
  activeSelectionTarget: 'start' | 'end'
  buildingViewMode: '2d' | '3d'
  walkwayData: WalkwayFeatureCollection | null
  buildingData: PlateauBuildingFeatureCollection | null
}>()

const emit = defineEmits<{
  'map-select': [coordinate: [number, number]]
}>()

const mapElement = ref<HTMLDivElement | null>(null)
const map = ref<L.Map | null>(null)
const hasFittedBounds = ref(false)

let walkwayLayer: L.LayerGroup | null = null
let shadowLayer: L.LayerGroup | null = null
let buildingLayer: L.LayerGroup | null = null
let routeLayer: L.LayerGroup | null = null
let markerLayer: L.LayerGroup | null = null

type GeoPoint = [number, number]

const activeSun = computed(() => sunProfiles[props.selectedTime])
const mapBBox = computed(() => props.walkwayData?.metadata.bbox ?? props.buildingData?.metadata.bbox ?? null)
const statusText = computed(() => {
  return props.activeSelectionTarget === 'start' ? '地図クリックで始点を更新' : '地図クリックで終点を更新'
})

function toLatLng([lon, lat]: GeoPoint): L.LatLngExpression {
  return [lat, lon]
}

function toLatLngs(points: GeoPoint[]) {
  return points.map(toLatLng)
}

function shiftCoordinate([lon, lat]: GeoPoint, eastMeters: number, northMeters: number): GeoPoint {
  const dLat = northMeters / 111320
  const dLon = eastMeters / (111320 * Math.cos((lat * Math.PI) / 180))
  return [lon + dLon, lat + dLat]
}

function normalizeRing(ring: GeoPoint[]) {
  if (ring.length > 1) {
    const first = ring[0]
    const last = ring[ring.length - 1]
    if (first && last && first[0] === last[0] && first[1] === last[1]) {
      return ring.slice(0, -1)
    }
  }

  return ring
}

function getExtrusionOffsetMeters(heightMeters: number) {
  const extrusion = clamp(heightMeters * 0.2, 10, 34)
  return {
    east: extrusion * -0.72,
    north: extrusion * 0.5,
  }
}

function buildExtrudedGeometry(ring: GeoPoint[], centroid: GeoPoint, heightMeters: number) {
  const normalizedRing = normalizeRing(ring)
  const offset = getExtrusionOffsetMeters(heightMeters)
  const roof = normalizedRing.map((point) => shiftCoordinate(point, offset.east, offset.north))
  const sides: GeoPoint[][] = []

  for (let index = 0; index < normalizedRing.length; index += 1) {
    const current = normalizedRing[index]
    const next = normalizedRing[(index + 1) % normalizedRing.length]
    const roofCurrent = roof[index]
    const roofNext = roof[(index + 1) % roof.length]

    if (!current || !next || !roofCurrent || !roofNext) {
      continue
    }

    const midLon = (current[0] + next[0]) / 2
    const midLat = (current[1] + next[1]) / 2
    const isVisibleFace = midLat <= centroid[1] || midLon >= centroid[0]

    if (isVisibleFace) {
      sides.push([current, next, roofNext, roofCurrent])
    }
  }

  return {
    roof,
    sides,
  }
}

function buildShadowPolygon(ring: GeoPoint[], heightMeters: number, time: TimeSlot) {
  const sun = sunProfiles[time]
  const altitudeRadians = (sun.altitudeDegrees * Math.PI) / 180
  const azimuthRadians = ((sun.azimuthDegrees + 180) * Math.PI) / 180
  const shadowLengthMeters = clamp(heightMeters / Math.tan(altitudeRadians), 12, 170)
  const east = Math.cos(azimuthRadians) * shadowLengthMeters
  const north = Math.sin(azimuthRadians) * shadowLengthMeters
  return normalizeRing(ring).map((point) => shiftCoordinate(point, east, north))
}

function createCircleMarker(point: GeoPoint, color: string, radius: number) {
  return L.circleMarker(toLatLng(point), {
    radius,
    color,
    weight: 2,
    fillColor: '#f8fafc',
    fillOpacity: 1,
  })
}

function ensureMap() {
  if (map.value || !mapElement.value) {
    return
  }

  const instance = L.map(mapElement.value, {
    zoomControl: true,
    attributionControl: true,
    preferCanvas: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(instance)

  walkwayLayer = L.layerGroup().addTo(instance)
  shadowLayer = L.layerGroup().addTo(instance)
  buildingLayer = L.layerGroup().addTo(instance)
  routeLayer = L.layerGroup().addTo(instance)
  markerLayer = L.layerGroup().addTo(instance)

  instance.on('click', (event: L.LeafletMouseEvent) => {
    emit('map-select', [event.latlng.lng, event.latlng.lat])
  })

  map.value = instance
}

function fitMapToData() {
  if (!map.value || !mapBBox.value || hasFittedBounds.value) {
    return
  }

  const { south, west, north, east } = mapBBox.value
  map.value.fitBounds(
    [
      [south, west],
      [north, east],
    ],
    { padding: [24, 24] },
  )
  hasFittedBounds.value = true
}

function renderWalkways() {
  walkwayLayer?.clearLayers()

  if (!props.walkwayData || !walkwayLayer) {
    return
  }

  for (const feature of props.walkwayData.features) {
    L.polyline(toLatLngs(feature.geometry.coordinates), {
      color: 'rgba(15,23,42,0.24)',
      weight: 4,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(walkwayLayer)
  }
}

function renderBuildings() {
  shadowLayer?.clearLayers()
  buildingLayer?.clearLayers()

  if (!props.buildingData || !shadowLayer || !buildingLayer) {
    return
  }

  for (const feature of props.buildingData.features) {
    const ring = normalizeRing(feature.geometry.coordinates[0] ?? [])
    if (!ring.length) {
      continue
    }

    L.polygon(toLatLngs(buildShadowPolygon(ring, feature.properties.measuredHeight, props.selectedTime)), {
      stroke: false,
      fillColor: '#0891b2',
      fillOpacity: 0.14,
    }).addTo(shadowLayer)

    if (props.buildingViewMode === '3d') {
      const extruded = buildExtrudedGeometry(ring, feature.properties.centroid, feature.properties.measuredHeight)

      for (const side of extruded.sides) {
        L.polygon(toLatLngs(side), {
          color: '#64748b',
          weight: 1,
          fillColor: '#94a3b8',
          fillOpacity: 0.5,
        }).addTo(buildingLayer)
      }

      L.polygon(toLatLngs(ring), {
        color: '#475569',
        weight: 1,
        fillColor: '#cbd5e1',
        fillOpacity: 0.88,
      }).addTo(buildingLayer)

      L.polygon(toLatLngs(extruded.roof), {
        color: '#94a3b8',
        weight: 1,
        fillColor: '#f1f5f9',
        fillOpacity: 0.96,
      }).addTo(buildingLayer)

      continue
    }

    L.polygon(toLatLngs(ring), {
      color: '#94a3b8',
      weight: 1,
      fillColor: '#e2e8f0',
      fillOpacity: 0.84,
    }).addTo(buildingLayer)
  }
}

function renderRoutes() {
  routeLayer?.clearLayers()

  if (!routeLayer) {
    return
  }

  for (const route of props.routeCandidates) {
    if (route.coordinateSpace !== 'geo' || route.path.length < 2) {
      continue
    }

    L.polyline(toLatLngs(route.path), {
      color: route.color,
      weight: route.id === props.highlightedRouteId ? 7 : 5,
      opacity: route.id === props.highlightedRouteId ? 0.96 : 0.42,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(routeLayer)
  }
}

function renderMarkers() {
  markerLayer?.clearLayers()

  if (!markerLayer || !props.startPoint || !props.endPoint) {
    return
  }

  const startAccent = props.activeSelectionTarget === 'start' ? '#f59e0b' : '#ffffff'
  const endAccent = props.activeSelectionTarget === 'end' ? '#f59e0b' : '#ffffff'

  createCircleMarker(props.startPoint, startAccent, 10)
    .bindTooltip(props.startLabel, { permanent: true, direction: 'bottom', offset: [0, 14], className: 'route-map-tooltip' })
    .addTo(markerLayer)
  createCircleMarker(props.startPoint, startAccent, 16).setStyle({ fillOpacity: 0, weight: 2 }).addTo(markerLayer)

  createCircleMarker(props.endPoint, endAccent, 10)
    .bindTooltip(props.endLabel, { permanent: true, direction: 'bottom', offset: [0, 14], className: 'route-map-tooltip' })
    .addTo(markerLayer)
  createCircleMarker(props.endPoint, endAccent, 16).setStyle({ fillOpacity: 0, weight: 2 }).addTo(markerLayer)
}

function renderAllLayers() {
  renderWalkways()
  renderBuildings()
  renderRoutes()
  renderMarkers()
  fitMapToData()
}

onMounted(async () => {
  await nextTick()
  ensureMap()
  renderAllLayers()
})

watch(
  () => [
    props.walkwayData,
    props.buildingData,
    props.selectedTime,
    props.highlightedRouteId,
    props.routeCandidates,
    props.startPoint,
    props.endPoint,
    props.startLabel,
    props.endLabel,
    props.activeSelectionTarget,
    props.buildingViewMode,
  ],
  () => {
    ensureMap()
    renderAllLayers()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  map.value?.remove()
  map.value = null
})
</script>

<template>
  <div class="rounded-[28px] border border-slate-800/15 bg-white/80 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.22em] text-slate-500">
      <span>OpenStreetMap + PLATEAU overlay</span>
      <span>{{ statusText }} / az {{ activeSun.azimuthDegrees }}° / alt {{ activeSun.altitudeDegrees }}°</span>
    </div>
    <div ref="mapElement" class="route-map h-[560px] w-full overflow-hidden rounded-[22px] border border-slate-900/10" />
  </div>
</template>
