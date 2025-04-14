// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: {
        project: 'tsconfig.json',
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      semi: 'off',
      '@typescript-eslint/semi': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      // Note: you must disable the base rule as it can report incorrect errors
      'space-before-function-paren': 'off',
      '@typescript-eslint/space-before-function-paren': 'off',
      '@typescript-eslint/member-delimiter-style': 'off',
      'comma-dangle': 'off',
      '@typescript-eslint/comma-dangle': 'off',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'no-use-before-define': ['error', { variables: true }],
      // '@typescript-eslint/no-extraneous-class': 'warn',
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'class',
          format: ['PascalCase'],
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: ['enum', 'enumMember'],
          format: ['PascalCase'],
        },
        {
          selector: ['memberLike', 'variableLike'],
          modifiers: ['const', 'exported', 'readonly'],
          format: ['PascalCase'],
        },
        {
          selector: ['parameter', 'method', 'function'],
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: true,
          },
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
          custom: {
            regex: '^T[A-Z]',
            match: true,
          },
        },
        {
          selector: ['variable', 'classProperty'],
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: [
            'can',
            'did',
            'has',
            'is',
            'must',
            'needs',
            'should',
            'will',
          ],
        },
        {
          selector: ['variable', 'classProperty'],
          modifiers: ['public'],
          format: ['camelCase'],
          leadingUnderscore: 'forbid',
        },
        {
          selector: 'memberLike',
          modifiers: ['private'],
          format: ['camelCase'],
          leadingUnderscore: 'require',
        },
      ],
      'max-depth': ['warn', 1],
      complexity: ['warn', { max: 5 }],
      'max-lines': ['warn', 200],
      'no-else-return': 'warn',
      'no-console': 'off',
      'no-magic-numbers': [
        'warn',
        {
          detectObjects: false,
          enforceConst: true,
          ignore: [-1, 0, 1],
          ignoreArrayIndexes: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
          caughtErrorsIgnorePattern: '^_',
          vars: 'all',
          varsIgnorePattern: '^[_A-Z]',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: false,
        },
      ],
      'no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-member-accessibility': 'error',
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  }
);
