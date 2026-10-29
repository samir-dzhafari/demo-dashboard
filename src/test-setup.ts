import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Component tests opt into jsdom with `// @vitest-environment jsdom`; plain metric tests stay in node.
if (typeof window !== 'undefined') {
  afterEach(cleanup)
  // Recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
