// ESLint Configuration für Chat Assistant Chrome Extension
export default [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        chrome: 'readonly',
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        navigator: 'readonly',
        NodeFilter: 'readonly',
        performance: 'readonly',
        Date: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        AbortController: 'readonly'
      }
    },

    rules: {
      // Error Prevention
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      'no-undef': 'error',
      'no-redeclare': 'error',

      // Chrome Extension Best Practices
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Code Quality
      'prefer-const': 'warn',
      'no-var': 'warn',
      'eqeqeq': 'warn',
      'curly': 'warn',

      // Security
      'no-script-url': 'error',
      'no-prototype-builtins': 'warn',

      // Extension specific
      'no-console': 'off' // Console ist OK für Extensions
    },

    files: ['*.js', '**/*.js'],
    ignores: ['node_modules/**', 'dist/**', 'build/**']
  }
];