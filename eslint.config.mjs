import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';

export default [
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: false
                },
                project: './tsconfig.json'
            }
        },
        plugins: {
            '@typescript-eslint': typescriptPlugin
        },
        rules: {
            ...typescriptPlugin.configs.recommended.rules,
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_' }
            ],
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-non-null-assertion': 'warn',
            '@typescript-eslint/no-inferrable-types': 'warn',
            '@typescript-eslint/consistent-type-imports': 'error',
            'prettier/prettier': 'error'
        }
    },
    {
        files: ['**/*.mjs', '**/*.cjs'],
        env: {
            node: true
        },
        rules: {
            'no-console': 'off'
        }
    }
];