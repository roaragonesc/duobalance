import type { ComponentType, SVGProps } from 'react'
import {
  BarsIcon,
  CardIcon,
  HomeIcon,
  RefreshIcon,
  UserIcon,
  UsersIcon,
} from '../../components/ui/icons'

type AppScreen = {
  path: string
  title: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

export const appScreens: readonly AppScreen[] = [
  { path: '/dashboard', title: 'Inicio', icon: HomeIcon },
  { path: '/expenses', title: 'Gastos', icon: CardIcon },
  { path: '/incomes', title: 'Ingresos', icon: BarsIcon },
  { path: '/balance', title: 'Balance', icon: RefreshIcon },
  { path: '/space', title: 'Espacio', icon: UsersIcon },
  { path: '/profile', title: 'Mi perfil', icon: UserIcon },
]
