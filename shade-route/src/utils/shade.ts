import type { BuildingFootprint, Point, RouteCandidate, TimeSlot } from '../types'
import { routeCandidates, sunProfiles } from '../data/demoData'

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function getShadowPolygon(building: BuildingFootprint, time: TimeSlot): Point[] {
  const sun = sunProfiles[time]
  const altitudeRadians = (sun.altitudeDegrees * Math.PI) / 180
  const azimuthRadians = ((sun.azimuthDegrees + 180) * Math.PI) / 180
  const length = clamp((building.elevationMeters / Math.tan(altitudeRadians)) * 0.45, 24, 132)
  const dx = Math.cos(azimuthRadians) * length
  const dy = Math.sin(azimuthRadians) * length

  const topLeft = { x: building.x, y: building.y }
  const topRight = { x: building.x + building.width, y: building.y }

  return [topLeft, topRight, { x: topRight.x + dx, y: topRight.y + dy }, { x: topLeft.x + dx, y: topLeft.y + dy }]
}

export function getShadePercent(route: RouteCandidate, time: TimeSlot) {
  return Math.round(route.shadeRatioByTime[time] * 100)
}

export function getHeatAdjustment(time: TimeSlot) {
  return sunProfiles[time].heatIndex >= 35 ? '危険寄り' : sunProfiles[time].heatIndex >= 33 ? 'かなり暑い' : '比較的まし'
}

export function getRecommendedRoutes(time: TimeSlot) {
  const longestDistance = Math.max(...routeCandidates.map((route) => route.distanceMeters))

  return routeCandidates.map((route) => {
    const shadeScore = route.shadeRatioByTime[time]
    const distancePenalty = route.distanceMeters / longestDistance
    const balanceScore = shadeScore * 0.68 + (1 - distancePenalty) * 0.32

    return {
      route,
      shadeScore,
      balanceScore,
    }
  })
}

export function getTopPicks(time: TimeSlot) {
  const scored = getRecommendedRoutes(time)
  const shortest = scored.reduce((best, current) => current.route.distanceMeters < best.route.distanceMeters ? current : best)
  const shadiest = scored.reduce((best, current) => current.shadeScore > best.shadeScore ? current : best)
  const balanced = scored.reduce((best, current) => current.balanceScore > best.balanceScore ? current : best)

  return {
    shortest: shortest.route.id,
    shadiest: shadiest.route.id,
    balanced: balanced.route.id,
  }
}

export function formatMeters(distanceMeters: number) {
  return `${(distanceMeters / 1000).toFixed(2)} km`
}

export function getRouteSummary(route: RouteCandidate, time: TimeSlot) {
  const shadePercent = getShadePercent(route, time)
  const exposurePercent = 100 - shadePercent

  return {
    shadePercent,
    exposurePercent,
    avoidedHeatLoad: Math.round(shadePercent * 0.42),
  }
}