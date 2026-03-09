export type TimeSlot = '11:00' | '12:00' | '13:00' | '14:00' | '15:00' | '16:00' | '17:00'

export interface Point {
  x: number
  y: number
}

export interface BuildingFootprint {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  elevationMeters: number
}

export interface RouteCandidate {
  id: 'shortest' | 'balanced' | 'shade'
  title: string
  subtitle: string
  color: string
  distanceMeters: number
  walkMinutes: number
  path: [number, number][]
  coordinateSpace: 'grid' | 'geo'
  shadeRatioByTime: Record<TimeSlot, number>
}

export interface SunProfile {
  azimuthDegrees: number
  altitudeDegrees: number
  heatIndex: number
}

export interface WalkwayFeature {
  type: 'Feature'
  properties: {
    id: number
    highway: string | null
    name: string | null
    access: string | null
    surface: string | null
  }
  geometry: {
    type: 'LineString'
    coordinates: [number, number][]
  }
}

export interface WalkwayFeatureCollection {
  type: 'FeatureCollection'
  metadata: {
    source: string
    endpoint: string | null
    generatedAt: string
    bbox: {
      south: number
      west: number
      north: number
      east: number
    }
    count: number
    osmBaseTimestamp: string | null
  }
  features: WalkwayFeature[]
}

export interface PlateauResource {
  id: string
  name: string
  url: string
  format?: string
  description?: string
}

export interface PlateauManifest {
  dataset: {
    id: string
    title: string
    city: string
    licenseTitle: string
    licenseUrl: string
    datasetUrl: string
    metadataModified: string
  }
  resources: Record<string, PlateauResource | null>
  generatedAt: string
}

export interface PlateauBuildingFeature {
  type: 'Feature'
  properties: {
    id: string
    measuredHeight: number
    storeysAboveGround: number
    meshCode: string
    centroid: [number, number]
  }
  geometry: {
    type: 'Polygon'
    coordinates: [number, number][][]
  }
}

export interface PlateauBuildingFeatureCollection {
  type: 'FeatureCollection'
  metadata: {
    source: string
    generatedAt: string
    bbox: {
      south: number
      west: number
      north: number
      east: number
    }
    count: number
    meshFiles: string[]
    archivePath: string
  }
  features: PlateauBuildingFeature[]
}