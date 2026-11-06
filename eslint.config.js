import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['src/sim/**/*.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'sim/ must use the seeded RNG from core/rng.',
        },
        { object: 'performance', property: 'now', message: 'sim/ uses fixed time steps.' },
        ...['sin', 'cos', 'tan', 'atan2', 'exp', 'log', 'pow'].map((property) => ({
          object: 'Math',
          property,
          message: 'Not bit-identical across engines; breaks determinism.',
        })),
      ],
      'no-restricted-globals': ['error', 'window', 'document', 'Date', 'performance'],
      'no-restricted-imports': [
        'error',
        { patterns: ['**/render/**', '**/ui/**', '**/audio/**', '**/game/**'] },
      ],
    },
  },
  {
    files: ['src/content/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: 'FunctionDeclaration', message: 'content/ holds data only.' },
        { selector: 'ArrowFunctionExpression', message: 'content/ holds data only.' },
        { selector: 'FunctionExpression', message: 'content/ holds data only.' },
        { selector: 'ClassDeclaration', message: 'content/ holds data only.' },
      ],
    },
  },
  {
    files: ['src/render/**/*.ts', 'src/audio/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['**/ui/**', '**/game/**'] }],
    },
  },
  prettier,
);
