'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, Polygon, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Lot } from '@/lib/api'

interface Props {
  lots: Lot[]
  height?: string
}

function getCenter(lots: Lot[]): [number, number] {
  const coords = lots
    .filter(l => l.geometry)
    .flatMap(l => l.geometry!.coordinates[0])
  if (coords.length === 0) return [-34.6, -58.4] // Buenos Aires default
  const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length
  const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length
  return [lat, lng]
}

export default function LotMap({ lots, height = '320px' }: Props) {
  const lotsWithGeometry = lots.filter(l => l.geometry)
  const center = getCenter(lots)

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height, width: '100%', borderRadius: '16px' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {lotsWithGeometry.map(lot => {
        // GeoJSON: [lng, lat] → Leaflet: [lat, lng]
        const positions = lot.geometry!.coordinates[0].map(
          ([lng, lat]) => [lat, lng] as [number, number]
        )
        return (
          <Polygon key={lot.id} positions={positions} pathOptions={{ color: '#0e6251', fillColor: '#0e6251', fillOpacity: 0.2 }}>
            <Tooltip sticky>{lot.name}{lot.hectares ? ` — ${lot.hectares} ha` : ''}</Tooltip>
          </Polygon>
        )
      })}
    </MapContainer>
  )
}
