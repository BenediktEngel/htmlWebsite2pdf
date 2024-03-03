module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['airbnb-base', 'airbnb-typescript/base', 'plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['@typescript-eslint', 'prettier', 'import'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json',
    tsconfigRootDir: __dirname / src,
  },
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/indent': 'off',
    'prefer-arrow-callback': 'warn',
    'no-underscore-dangle': 'off',
    'no-console': 'off',
  },
};
