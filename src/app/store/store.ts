import { configureStore } from '@reduxjs/toolkit'
import { filtersReducer } from '@/features/filters'

/** Redux DevTools are enabled by `configureStore` in development automatically. */
export const store = configureStore({
  reducer: {
    filters: filtersReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
