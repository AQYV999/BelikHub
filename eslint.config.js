import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['api/**/*.js', 'lib/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_|^response$|^request$' }]
    }
  }
];