import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared']

// Layer N may import only from layers below it. Sideways imports (same layer) are blocked too,
// except through the slice itself, which is what the relative import covers.
const upwardPatterns = (layer) => {
  const forbidden = LAYERS.slice(0, LAYERS.indexOf(layer))
  const sideways = layer === 'app' || layer === 'shared' ? [] : [layer]
  return [...forbidden, ...sideways]
}

const layerRule = (layer, { allowTypeImports = [] } = {}) => ({
  files: [`src/${layer}/**/*.{ts,tsx}`],
  rules: {
    '@typescript-eslint/no-restricted-imports': [
      'error',
      {
        patterns: upwardPatterns(layer).map((name) => ({
          group: [`@/${name}`, `@/${name}/*`],
          message: `FSD: layer "${layer}" must not import from "${name}" (imports go only downwards).`,
          allowTypeImports: allowTypeImports.includes(name),
        })),
      },
    ],
  },
})

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  ...LAYERS.map((layer) => layerRule(layer)),
  // Data-contract exception: the mock backend and the cross-entity metrics only *describe* entity types.
  {
    files: ['src/shared/api/mocks/**/*.ts', 'src/shared/lib/metrics/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            ...['app', 'pages', 'widgets', 'features'].map((name) => ({
              group: [`@/${name}`, `@/${name}/*`],
              message: `FSD: layer "shared" must not import from "${name}".`,
            })),
            {
              group: ['@/entities', '@/entities/*'],
              message: 'Only `import type` from entities is allowed here (data contract).',
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
)
