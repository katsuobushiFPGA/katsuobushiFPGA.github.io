import { sunProfiles } from '../data/demoData'
import type { PlateauBuildingFeatureCollection, RouteCandidate, TimeSlot, WalkwayFeatureCollection } from '../types'

interface GraphNode {
  id: string
  lon: number
  lat: number
  neighbors: GraphEdge[]
}

interface GraphEdge {
  to: string
  distanceMeters: number
  shadeScoreByTime: Record<TimeSlot, number>
}

interface PathResult {
  nodeIds: string[]
  distanceMeters: number
  shadeRatioByTime: Record<TimeSlot, number>
}

const routeMeta = {
  shortest: {
    title: '最短ルート',
    subtitle: '距離優先で最も早く着く',
    color: '#f97316',
  },
  balanced: {
    title: 'バランスルート',
    subtitle: '距離と日陰を両立する',
    color: '#0f766e',
  },
  shade: {
    title: '日陰優先ルート',
    subtitle: '露出区間を抑えて歩く',
    color: '#1d4ed8',
  },
} as const

const walkingSpeedMetersPerMinute = 76

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function haversineMeters(a: [number, number], b: [number, number]) {
  const earthRadius = 6371000
  const dLat = toRadians(b[1] - a[1])
  const dLon = toRadians(b[0] - a[0])
  const lat1 = toRadians(a[1])
  const lat2 = toRadians(b[1])

  const haversine = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * earthRadius * Math.asin(Math.sqrt(haversine))
}

export function measureDistanceMeters(a: [number, number], b: [number, number]) {
  return haversineMeters(a, b)
}

function makeNodeId(lon: number, lat: number) {
  return `${lon.toFixed(7)},${lat.toFixed(7)}`
}

function projectShadowBBox(ring: [number, number][], heightMeters: number, time: TimeSlot) {
  const sun = sunProfiles[time]
  const altitudeRadians = toRadians(sun.altitudeDegrees)
  const azimuthRadians = toRadians(sun.azimuthDegrees + 180)
  const meanLat = ring.reduce((sum, point) => sum + point[1], 0) / Math.max(ring.length, 1)
  const shadowLengthMeters = Math.min(180, Math.max(12, heightMeters / Math.tan(altitudeRadians)))
  const dxMeters = Math.cos(azimuthRadians) * shadowLengthMeters
  const dyMeters = Math.sin(azimuthRadians) * shadowLengthMeters
  const lonFactor = 111320 * Math.cos(toRadians(meanLat))
  const dxLon = dxMeters / Math.max(1, lonFactor)
  const dyLat = dyMeters / 111320
  const shifted = ring.map(([lon, lat]) => [lon + dxLon, lat + dyLat] as [number, number])
  const all = [...ring, ...shifted]
  const lons = all.map((point) => point[0])
  const lats = all.map((point) => point[1])

  return {
    west: Math.min(...lons),
    east: Math.max(...lons),
    south: Math.min(...lats),
    north: Math.max(...lats),
  }
}

function pointInBbox(point: [number, number], bbox: { west: number; east: number; south: number; north: number }) {
  return point[0] >= bbox.west && point[0] <= bbox.east && point[1] >= bbox.south && point[1] <= bbox.north
}

function makeShadowIndex(buildings: PlateauBuildingFeatureCollection) {
  const index = {} as Record<TimeSlot, Array<{ west: number; east: number; south: number; north: number }>>

  for (const time of Object.keys(sunProfiles) as TimeSlot[]) {
    index[time] = buildings.features.map((feature) => {
      const ring = feature.geometry.coordinates[0] ?? []
      return projectShadowBBox(ring, feature.properties.measuredHeight, time)
    })
  }

  return index
}

function sampleShadeScore(a: [number, number], b: [number, number], shadowBoxes: Array<{ west: number; east: number; south: number; north: number }>) {
  const samples: [number, number][] = [
    a,
    [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
    b,
  ]
  let covered = 0

  for (const sample of samples) {
    if (shadowBoxes.some((bbox) => pointInBbox(sample, bbox))) {
      covered += 1
    }
  }

  return covered / samples.length
}

function addEdge(nodes: Map<string, GraphNode>, from: [number, number], to: [number, number], shadowIndex: ReturnType<typeof makeShadowIndex>) {
  const fromId = makeNodeId(from[0], from[1])
  const toId = makeNodeId(to[0], to[1])
  const distanceMeters = haversineMeters(from, to)

  if (distanceMeters < 3) {
    return
  }

  if (!nodes.has(fromId)) {
    nodes.set(fromId, { id: fromId, lon: from[0], lat: from[1], neighbors: [] })
  }

  if (!nodes.has(toId)) {
    nodes.set(toId, { id: toId, lon: to[0], lat: to[1], neighbors: [] })
  }

  const shadeScoreByTime = {} as Record<TimeSlot, number>
  for (const time of Object.keys(sunProfiles) as TimeSlot[]) {
    shadeScoreByTime[time] = sampleShadeScore(from, to, shadowIndex[time])
  }

  nodes.get(fromId)?.neighbors.push({ to: toId, distanceMeters, shadeScoreByTime })
  nodes.get(toId)?.neighbors.push({ to: fromId, distanceMeters, shadeScoreByTime })
}

function buildGraph(walkways: WalkwayFeatureCollection, buildings: PlateauBuildingFeatureCollection) {
  const nodes = new Map<string, GraphNode>()
  const shadowIndex = makeShadowIndex(buildings)

  for (const feature of walkways.features) {
    const coordinates = feature.geometry.coordinates
    for (let index = 0; index < coordinates.length - 1; index += 1) {
      const from = coordinates[index]
      const to = coordinates[index + 1]
      if (from && to) {
        addEdge(nodes, from, to, shadowIndex)
      }
    }
  }

  return nodes
}

function findNearestNode(nodes: Map<string, GraphNode>, target: [number, number]) {
  let bestNode: GraphNode | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  for (const node of nodes.values()) {
    const distance = haversineMeters([node.lon, node.lat], target)
    if (distance < bestDistance) {
      bestDistance = distance
      bestNode = node
    }
  }

  return bestNode
}

export function snapCoordinateToWalkway(walkways: WalkwayFeatureCollection, target: [number, number]) {
  let bestCoordinate: [number, number] | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  for (const feature of walkways.features) {
    for (const coordinate of feature.geometry.coordinates) {
      const distance = haversineMeters(coordinate, target)
      if (distance < bestDistance) {
        bestDistance = distance
        bestCoordinate = coordinate
      }
    }
  }

  return {
    coordinate: bestCoordinate,
    distanceMeters: bestDistance,
  }
}

function edgeWeight(edge: GraphEdge, time: TimeSlot, mode: RouteCandidate['id']) {
  const shade = edge.shadeScoreByTime[time]

  if (mode === 'shortest') {
    return edge.distanceMeters
  }

  if (mode === 'shade') {
    return edge.distanceMeters * (1.9 - shade * 1.1)
  }

  return edge.distanceMeters * (1.45 - shade * 0.6)
}

function findRoute(nodes: Map<string, GraphNode>, startId: string, endId: string, time: TimeSlot, mode: RouteCandidate['id']): PathResult | null {
  const queue = new Set<string>([startId])
  const distance = new Map<string, number>([[startId, 0]])
  const previous = new Map<string, string>()

  while (queue.size) {
    let currentId: string | null = null
    let currentWeight = Number.POSITIVE_INFINITY

    for (const nodeId of queue) {
      const candidateWeight = distance.get(nodeId) ?? Number.POSITIVE_INFINITY
      if (candidateWeight < currentWeight) {
        currentId = nodeId
        currentWeight = candidateWeight
      }
    }

    if (!currentId) {
      break
    }

    queue.delete(currentId)

    if (currentId === endId) {
      break
    }

    const node = nodes.get(currentId)
    if (!node) {
      continue
    }

    for (const edge of node.neighbors) {
      const nextWeight = currentWeight + edgeWeight(edge, time, mode)
      if (nextWeight < (distance.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        distance.set(edge.to, nextWeight)
        previous.set(edge.to, currentId)
        queue.add(edge.to)
      }
    }
  }

  if (!previous.has(endId) && startId !== endId) {
    return null
  }

  const path = [endId]
  let cursor = endId
  while (cursor !== startId) {
    const parent = previous.get(cursor)
    if (!parent) {
      break
    }
    path.unshift(parent)
    cursor = parent
  }

  let totalDistance = 0
  const weightedShade = {} as Record<TimeSlot, number>
  for (const timeKey of Object.keys(sunProfiles) as TimeSlot[]) {
    weightedShade[timeKey] = 0
  }

  for (let index = 0; index < path.length - 1; index += 1) {
    const currentId = path[index]
    const nextId = path[index + 1]
    if (!currentId || !nextId) {
      continue
    }

    const node = nodes.get(currentId)
    const edge = node?.neighbors.find((candidate) => candidate.to === nextId)
    if (!edge) {
      continue
    }

    totalDistance += edge.distanceMeters
    for (const timeKey of Object.keys(sunProfiles) as TimeSlot[]) {
      weightedShade[timeKey] += edge.shadeScoreByTime[timeKey] * edge.distanceMeters
    }
  }

  const shadeRatioByTime = {} as Record<TimeSlot, number>
  for (const timeKey of Object.keys(sunProfiles) as TimeSlot[]) {
    shadeRatioByTime[timeKey] = totalDistance > 0 ? weightedShade[timeKey] / totalDistance : 0
  }

  return {
    nodeIds: path,
    distanceMeters: totalDistance,
    shadeRatioByTime,
  }
}

export function buildRouteCandidates(
  walkways: WalkwayFeatureCollection,
  buildings: PlateauBuildingFeatureCollection,
  start: [number, number],
  end: [number, number],
  time: TimeSlot,
): RouteCandidate[] {
  const nodes = buildGraph(walkways, buildings)
  const startNode = findNearestNode(nodes, start)
  const endNode = findNearestNode(nodes, end)

  if (!startNode || !endNode) {
    return []
  }

  return (Object.keys(routeMeta) as RouteCandidate['id'][]).flatMap((mode) => {
    const result = findRoute(nodes, startNode.id, endNode.id, time, mode)
    if (!result) {
      return []
    }

    return [{
      id: mode,
      title: routeMeta[mode].title,
      subtitle: routeMeta[mode].subtitle,
      color: routeMeta[mode].color,
      distanceMeters: Math.round(result.distanceMeters),
      walkMinutes: Math.max(1, Math.round(result.distanceMeters / walkingSpeedMetersPerMinute)),
      path: result.nodeIds.map((nodeId) => {
        const node = nodes.get(nodeId)
        return [node?.lon ?? 0, node?.lat ?? 0] as [number, number]
      }),
      coordinateSpace: 'geo' as const,
      shadeRatioByTime: result.shadeRatioByTime,
    }]
  })
}