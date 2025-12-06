import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'node_modules', 'prisma/migrations']),
  {
    files: ['**/*.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
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
      // Require explicit return types
      '@typescript-eslint/explicit-function-return-type': ['warn', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],
      // Allow unused vars prefixed with underscore
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    },
  },
]);
