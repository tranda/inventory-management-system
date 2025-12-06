import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Constitution Art. 1: No any type
      '@typescript-eslint/no-explicit-any': 'error',
      // Constitution Art. 2.4: No skipped tests
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.property.name=/^(skip|only)$/]',
          message: 'it.skip() and it.only() are not allowed in committed code (Constitution Art. 2.4)',
        },
      ],
      // Constitution Art. 7.3: No empty catch blocks
      'no-empty': ['error', { allowEmptyCatch: false }],
      // Require explicit return types for functions
      '@typescript-eslint/explicit-function-return-type': ['warn', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],
    },
  },
])
