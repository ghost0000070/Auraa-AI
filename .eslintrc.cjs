module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  plugins: [
    'react',
    '@typescript-eslint'
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/no-unescaped-entities': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/prop-types': 'off',
    'react/no-unknown-property': ['error', { ignore: ['cmdk-input-wrapper'] }]
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  overrides: [
    {
      files: ['public/sw.js'],
      env: {
        browser: true,
        serviceworker: true
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'script'
      }
    }
  ]
};
