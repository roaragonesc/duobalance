import { createBrowserRouter } from 'react-router'
import AppLayout from '../components/layout/AppLayout'
import AuthLayout from '../components/layout/AuthLayout'
import SimpleLayout from '../components/layout/SimpleLayout'
import NotFoundPage from '../pages/NotFoundPage'
import PlaceholderPage from '../pages/PlaceholderPage'
import { appScreens, authScreens } from './screens'

export const router = createBrowserRouter([
  {
    element: <SimpleLayout />,
    children: [
      { path: '/', element: <PlaceholderPage title="Inicio provisional" /> },
      {
        path: '/onboarding',
        element: <PlaceholderPage title="Crear o unirse a un espacio" />,
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: authScreens.map(({ path, title }) => ({
      path,
      element: <PlaceholderPage title={title} />,
    })),
  },
  {
    element: <AppLayout />,
    children: appScreens.map(({ path, title }) => ({
      path,
      element: <PlaceholderPage title={title} />,
    })),
  },
])
