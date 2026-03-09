export const TARGET_BBOX = {
  south: 35.676,
  west: 139.757,
  north: 35.6838,
  east: 139.7678,
}

export function intersectsBBox(a, b) {
  return !(a.east < b.west || a.west > b.east || a.north < b.south || a.south > b.north)
}

export function ringToBBox(ring) {
  const longitudes = ring.map((point) => point[0])
  const latitudes = ring.map((point) => point[1])

  return {
    west: Math.min(...longitudes),
    east: Math.max(...longitudes),
    south: Math.min(...latitudes),
    north: Math.max(...latitudes),
  }
}