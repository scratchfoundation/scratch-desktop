import {eslintConfigScratch} from 'eslint-config-scratch';
import {globalIgnores} from 'eslint/config';
import globals from 'globals';

const {defineConfig, legacy} = eslintConfigScratch;

export default defineConfig(
    {
        files: ['**/*.{js,jsx,cjs,mjs}'],
        extends: [legacy.base, legacy.es6, legacy.node],
        languageOptions: {
            globals: globals.node
        }
    },
    {
        files: ['src/**/*.{js,jsx}'],
        extends: [legacy.base, legacy.es6],
        languageOptions: {
            globals: {
                ...globals.node,
                __static: 'readonly'
            }
        }
    },
    {
        files: ['src/main/**/*.{js,jsx}'],
        extends: [legacy.base, legacy.es6, legacy.node]
    },
    {
        files: ['src/renderer/**/*.{js,jsx}'],
        extends: [legacy.base, legacy.es6, legacy.react],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            }
        },
        settings: {
            react: {
                version: '16.2'
            }
        },
        rules: {
            // This project uses @babel/preset-react with the classic JSX runtime,
            // so React must be imported in every JSX file and the linter must
            // recognize JSX as a "use" of the React identifier.
            'react/jsx-uses-react': 'error',
            'react/react-in-jsx-scope': 'error'
        }
    },
    {
        files: ['scripts/**/*.{js,jsx,cjs,mjs}', 'webpack.*.js'],
        rules: {
            'no-console': 'off'
        }
    },
    globalIgnores(['dist/**', 'static/fetched/**', 'node_modules/**'])
);
