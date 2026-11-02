import type { ReactNode } from 'react'
import { BarsIcon, ScaleIcon } from '../../components/ui/icons'
import type { SplitMethod } from './types/space'

// The two split methods of the MVP.
export const splitMethods = [
  {
    value: 'equal',
    title: '50/50',
    description: 'Ambos aportáis la misma cantidad',
    icon: <ScaleIcon className="size-[32px]" />,
  },
  {
    value: 'proportional',
    title: 'Proporcional',
    description: 'Según los ingresos de cada uno',
    icon: <BarsIcon className="size-[32px]" />,
  },
] as const satisfies ReadonlyArray<{
  value: SplitMethod
  title: string
  description: string
  icon: ReactNode
}>

export function getSplitMethodLabel(method: SplitMethod): string {
  return method === 'equal' ? '50 % / 50 %' : 'Proporcional a ingresos'
}