export const authScreens = [
  { path: '/login', title: 'Inicio de sesión' },
  { path: '/register', title: 'Registro' },
  { path: '/forgot-password', title: 'Recuperar contraseña' },
] as const

export const appScreens = [
  { path: '/dashboard', title: 'Dashboard' },
  { path: '/expenses', title: 'Gastos' },
  { path: '/incomes', title: 'Ingresos' },
  { path: '/balance', title: 'Balance' },
  { path: '/space', title: 'Espacio compartido' },
  { path: '/profile', title: 'Mi perfil' },
] as const
