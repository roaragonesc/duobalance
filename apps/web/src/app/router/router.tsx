import { createBrowserRouter, createHashRouter, Navigate } from 'react-router'
import AppLayout from '../../components/layout/AppLayout'
import AuthCallback from '../../pages/AuthCallback'
import AuthLayout from '../../components/layout/AuthLayout'
import AuthLightLayout from '../../components/layout/AuthLightLayout'
import OnboardingLayout, {
  type OnboardingRouteHandle,
} from '../../components/layout/OnboardingLayout'
import SimpleLayout from '../../components/layout/SimpleLayout'
import Balance from '../../pages/Balance'
import Dashboard from '../../pages/Dashboard'
import ExpenseEditor from '../../pages/ExpenseEditor'
import Expenses from '../../pages/Expenses'
import ForgotPassword from '../../pages/ForgotPassword'
import IncomeEditor from '../../pages/IncomeEditor'
import Incomes from '../../pages/Incomes'
import InvitePartner from '../../pages/InvitePartner'
import JoinSpace from '../../pages/JoinSpace'
import Login from '../../pages/Login'
import NotFoundPage from '../../pages/NotFoundPage'
import Onboarding from '../../pages/Onboarding'
import Profile from '../../pages/Profile'
import Register from '../../pages/Register'
import RegisterSettlement from '../../pages/RegisterSettlement'
import ResetPassword from '../../pages/ResetPassword'
import Space from '../../pages/Space'
import ProtectedRoute from './ProtectedRoute'
import PublicOnlyRoute from './PublicOnlyRoute'
import { AUTH_CALLBACK_PATH } from '../../features/auth/navigation'

const createRouter = import.meta.env.MODE === 'pages-demo' ? createHashRouter : createBrowserRouter

export const router = createRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  {
    element: <SimpleLayout />,
    children: [{ path: '*', element: <NotFoundPage /> }],
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <Login /> },
          { path: '/register', element: <Register /> },
        ],
      },
      {
        element: <AuthLightLayout />,
        children: [{ path: '/forgot-password', element: <ForgotPassword /> }],
      },
    ],
  },
  {
    // Reachable with the temporary recovery session from the email link.
    element: <AuthLightLayout />,
    children: [
      { path: '/reset-password', element: <ResetPassword /> },
      // Email confirmation links land here with or without a session.
      { path: AUTH_CALLBACK_PATH, element: <AuthCallback /> },
      // Public so the invitee can sign in or register and come back here.
      { path: '/join', element: <JoinSpace /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <OnboardingLayout />,
        children: [
          { path: '/onboarding', element: <Onboarding /> },
          {
            path: '/onboarding/invite',
            element: <InvitePartner />,
            handle: { backTo: '/onboarding' } satisfies OnboardingRouteHandle,
          },
        ],
      },
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/expenses', element: <Expenses /> },
          { path: '/expenses/new', element: <ExpenseEditor /> },
          { path: '/expenses/:expenseId/edit', element: <ExpenseEditor /> },
          { path: '/incomes', element: <Incomes /> },
          { path: '/incomes/new', element: <IncomeEditor /> },
          { path: '/incomes/:incomeId/edit', element: <IncomeEditor /> },
          { path: '/balance', element: <Balance /> },
          { path: '/balance/settle', element: <RegisterSettlement /> },
          { path: '/space', element: <Space /> },
          { path: '/profile', element: <Profile /> },
        ],
      },
    ],
  },
])
