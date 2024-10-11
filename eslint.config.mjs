import { includeIgnoreFile } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gitignorePath = path.resolve(__dirname, '.gitignore');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [
  ...compat.extends('eslint:recommended', 'plugin:@typescript-eslint/eslint-recommended', 'plugin:@typescript-eslint/recommended'),
  includeIgnoreFile(gitignorePath),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint
    },

    languageOptions: {
      parser: tsParser
    }
  }
];
