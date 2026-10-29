import { Navigate, createBrowserRouter } from 'react-router-dom'
import { MarketingPage } from '@/pages/marketing'
import { OperationsPage } from '@/pages/operations'
import { AppLayout } from '../layout/AppLayout'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="/operations" replace /> },
        { path: 'operations', element: <OperationsPage /> },
        { path: 'marketing', element: <MarketingPage /> },
        { path: '*', element: <Navigate to="/operations" replace /> },
      ],
    },
  ],
  // The site may be served from a sub-path (GitHub Pages: /<repo>/); Vite exposes it as BASE_URL.
  { basename: import.meta.env.BASE_URL },
)
