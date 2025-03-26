// eslint.config.mjs
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts'], // Lint all TypeScript files
    ignores: [
      'cdk.out/**', // Ignore the cdk.out directory
      'lib/cdk.out/**',
      'node_modules/**', // Ignore the node_modules directory
      'coverage/**', // Ignore the coverage directory
      '.husky/**', // Ignore the .husky directory
    ],
    languageOptions: {
      parser: tsParser, // Use TypeScript parser
      parserOptions: {
        ecmaVersion: 'latest', // Use the latest ECMAScript version
        sourceType: 'module', // Use ECMAScript modules
      },
      globals: {
        __dirname: 'readonly',
        console: 'readonly',
        process: 'writable',
        fetch: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin, // Add TypeScript plugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // Turn off base rules that are handled by TypeScript
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-undef': 'error',
    },
  },
  {
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in test files
    },
  },
];
