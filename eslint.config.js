import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'playwright-report', 'test-results', 'node_modules']),
  {
    files: ['pocketbase/pb_migrations/*.js'],
    languageOptions: { globals: { migrate: 'readonly', $os: 'readonly', Collection: 'readonly', Record: 'readonly', TextField: 'readonly', DateField: 'readonly', NumberField: 'readonly', JSONField: 'readonly', BoolField: 'readonly', EmailField: 'readonly', SelectField: 'readonly', RelationField: 'readonly' } },
  },
  {
    files: ['pocketbase/pb_hooks/**/*.js'],
    languageOptions: { globals: { FileField: 'readonly', FormData: 'readonly', $filesystem: 'readonly', onRecordValidate: 'readonly', BadRequestError: 'readonly', onRecordCreateRequest: 'readonly', onRecordUpdateRequest: 'readonly', onRecordCreate: 'readonly', onRecordUpdate: 'readonly', onRecordDelete: 'readonly', onRecordDeleteRequest: 'readonly', require: 'readonly', __hooks: 'readonly', Record: 'readonly', ForbiddenError: 'readonly', ApiError: 'readonly', $os: 'readonly', $http: 'readonly', $security: 'readonly', $apis: 'readonly', routerAdd: 'readonly', arrayOf: 'readonly', DynamicModel: 'readonly' } },
  },
  {
    files: ['**/*.{js,ts,tsx}'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['src/**/*.tsx'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
  },
  {
    files: [
      'src/app/**/*.{ts,tsx}',
      'src/shared/**/*.{ts,tsx}',
      'src/modules/**/components/**/*.{ts,tsx}',
      'src/modules/**/pages/**/*.{ts,tsx}',
      'src/modules/**/hooks/**/*.{ts,tsx}',
      'src/modules/**/routes/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ name: 'pocketbase', message: 'Accéder à PocketBase via un service et un repository.' }],
        patterns: [{ group: ['**/repositories/**', '**/core/pocketbase/**'], message: 'La couche UI doit passer par les services métier.' }],
      }],
    },
  },
])
