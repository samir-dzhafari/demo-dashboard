import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { StoreProvider } from './store'

export const App = () => (
  <StoreProvider>
    <RouterProvider router={router} />
  </StoreProvider>
)
