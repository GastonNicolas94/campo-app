import dynamic from 'next/dynamic'
import type { Lot } from '@/lib/api'

const LotMap = dynamic(() => import('./LotMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-card border border-rim rounded-2xl flex items-center justify-center" style={{ height: '320px' }}>
      <p className="text-subtle text-sm">Cargando mapa...</p>
    </div>
  ),
})

interface Props {
  lots: Lot[]
  height?: string
}

export default function LotMapWrapper({ lots, height }: Props) {
  return <LotMap lots={lots} height={height} />
}
