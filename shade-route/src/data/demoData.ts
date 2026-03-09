import type { BuildingFootprint, RouteCandidate, SunProfile, TimeSlot } from '../types'

export const timeSlots: TimeSlot[] = ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

export const sunProfiles: Record<TimeSlot, SunProfile> = {
  '11:00': { azimuthDegrees: 118, altitudeDegrees: 58, heatIndex: 31.5 },
  '12:00': { azimuthDegrees: 146, altitudeDegrees: 68, heatIndex: 33.4 },
  '13:00': { azimuthDegrees: 178, altitudeDegrees: 73, heatIndex: 34.8 },
  '14:00': { azimuthDegrees: 205, altitudeDegrees: 70, heatIndex: 35.1 },
  '15:00': { azimuthDegrees: 228, altitudeDegrees: 61, heatIndex: 34.2 },
  '16:00': { azimuthDegrees: 246, altitudeDegrees: 49, heatIndex: 32.8 },
  '17:00': { azimuthDegrees: 260, altitudeDegrees: 37, heatIndex: 31.1 },
}

export const buildings: BuildingFootprint[] = [
  { id: 'b1', label: '丸の内ビル街 A', x: 90, y: 90, width: 84, height: 56, elevationMeters: 145 },
  { id: 'b2', label: '丸の内仲通りタワー', x: 210, y: 78, width: 72, height: 70, elevationMeters: 172 },
  { id: 'b3', label: '大手町オフィス群', x: 325, y: 96, width: 92, height: 60, elevationMeters: 138 },
  { id: 'b4', label: '皇居側ブロック', x: 148, y: 206, width: 102, height: 64, elevationMeters: 116 },
  { id: 'b5', label: '大手町プレイス', x: 302, y: 220, width: 88, height: 72, elevationMeters: 163 },
]

export const routeCandidates: RouteCandidate[] = [
  {
    id: 'shortest',
    title: '最短ルート',
    subtitle: '東京駅側の一直線ルート',
    color: '#f97316',
    distanceMeters: 820,
    walkMinutes: 11,
    path: [
      [54, 308],
      [132, 280],
      [210, 248],
      [300, 222],
      [410, 194],
    ],
    coordinateSpace: 'grid',
    shadeRatioByTime: {
      '11:00': 0.31,
      '12:00': 0.24,
      '13:00': 0.19,
      '14:00': 0.23,
      '15:00': 0.32,
      '16:00': 0.39,
      '17:00': 0.47,
    },
  },
  {
    id: 'balanced',
    title: 'バランスルート',
    subtitle: '仲通りの影を拾いながら遠回りを抑える',
    color: '#0f766e',
    distanceMeters: 940,
    walkMinutes: 13,
    path: [
      [54, 308],
      [100, 246],
      [176, 196],
      [262, 188],
      [340, 168],
      [410, 194],
    ],
    coordinateSpace: 'grid',
    shadeRatioByTime: {
      '11:00': 0.54,
      '12:00': 0.48,
      '13:00': 0.43,
      '14:00': 0.5,
      '15:00': 0.59,
      '16:00': 0.66,
      '17:00': 0.71,
    },
  },
  {
    id: 'shade',
    title: '日陰優先ルート',
    subtitle: '高層街区の影をつないで歩く',
    color: '#1d4ed8',
    distanceMeters: 1090,
    walkMinutes: 15,
    path: [
      [54, 308],
      [72, 220],
      [108, 146],
      [186, 140],
      [268, 150],
      [350, 152],
      [410, 194],
    ],
    coordinateSpace: 'grid',
    shadeRatioByTime: {
      '11:00': 0.74,
      '12:00': 0.68,
      '13:00': 0.61,
      '14:00': 0.65,
      '15:00': 0.73,
      '16:00': 0.8,
      '17:00': 0.84,
    },
  },
]

export const districtBounds = {
  width: 460,
  height: 360,
}