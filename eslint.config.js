import globals from 'globals';
import tseslint from 'typescript-eslint';


export default [
    {files: ['**/*.{js,mjs,cjs,ts}']},
    {languageOptions: { globals: globals.browser }},
    ...tseslint.configs.recommended,
    {
        rules: {
            indent: ['error', 4],
            quotes: ['error', 'single'],
            semi: ['error', 'always'],
            'no-extra-semi': 'error',
            'semi-spacing': 'error',
            'semi-style': 'error',
            'linebreak-style': ['error', 'unix'],
        }
    }
];