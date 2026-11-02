const demoPassword = 'Demo1234!'

export const demoUsers = {
  rocio: {
    email: 'rocio@duobalance.test',
    name: 'Rocío',
    password: demoPassword,
  },
  pablo: {
    email: 'pablo@duobalance.test',
    name: 'Pablo',
    password: demoPassword,
  },
  ines: {
    email: 'ines@duobalance.test',
    name: 'Inés',
    password: demoPassword,
  },
  mateo: {
    email: 'mateo@duobalance.test',
    name: 'Mateo',
    password: demoPassword,
  },
  nuevo: {
    email: 'nuevo@duobalance.test',
    name: 'Nora',
    password: demoPassword,
  },
  solo: {
    email: 'solo@duobalance.test',
    name: 'Sergio',
    password: demoPassword,
  },
} as const

export type DemoUserKey = keyof typeof demoUsers

export const registrationUser = {
  name: 'Cuenta E2E',
  email: 'registro-e2e@duobalance.test',
  password: 'Pruebas1234!',
} as const
