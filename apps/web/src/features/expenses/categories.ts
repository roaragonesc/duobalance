import type { ComponentType, SVGProps } from 'react'
import {
  CarIcon,
  CartIcon,
  DumbbellIcon,
  HomeIcon,
  TagIcon,
  UtensilsIcon,
  WifiIcon,
} from '../../components/ui/icons'
import type { ExpenseCategoryId } from './types'

type CategoryInfo = {
  id: ExpenseCategoryId
  name: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  badgeClassName: string
}

// Categories from the approved design, plus "Otros" as a fallback.
export const expenseCategories: CategoryInfo[] = [
  { id: 'food', name: 'Alimentación', icon: CartIcon, badgeClassName: 'bg-[#E3F8F1] text-[#00704A]' },
  { id: 'housing', name: 'Vivienda', icon: HomeIcon, badgeClassName: 'bg-[#F3EAFE] text-[#6B35B8]' },
  { id: 'utilities', name: 'Servicios', icon: WifiIcon, badgeClassName: 'bg-[#E6F1FD] text-[#1E5FB3]' },
  { id: 'transport', name: 'Transporte', icon: CarIcon, badgeClassName: 'bg-[#E6F1FD] text-[#1E5FB3]' },
  { id: 'leisure', name: 'Ocio', icon: UtensilsIcon, badgeClassName: 'bg-[#FDE8EF] text-[#B0244F]' },
  { id: 'health', name: 'Salud', icon: DumbbellIcon, badgeClassName: 'bg-[#FFF4DB] text-[#8A5A00]' },
  { id: 'other', name: 'Otros', icon: TagIcon, badgeClassName: 'bg-[#EEF2F6] text-[#3E4C63]' },
]

export function getCategory(id: ExpenseCategoryId): CategoryInfo {
  return (
    expenseCategories.find((category) => category.id === id) ??
    expenseCategories[expenseCategories.length - 1]
  )
}

export function isCategoryId(value: string): value is ExpenseCategoryId {
  return expenseCategories.some((category) => category.id === value)
}
