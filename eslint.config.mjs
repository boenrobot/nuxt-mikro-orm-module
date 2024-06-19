import { createConfigForNuxt } from '@nuxt/eslint-config/flat';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

// Run `npx @eslint/config-inspector` to inspect the resolved config interactively
const config = await createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: true,
    typescript: true,
    standalone: true,
  },
  dirs: {
    src: ['./playground', './test/fixtures/*'],
  },
})
  // Enable extra goodies normally disabled
  .overrideRules(
    {
      'unicorn/number-literal-case': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { disallowTypeAnnotations: true, prefer: 'type-imports', fixStyle: 'inline-type-imports' }]
    }
  )
  // Resolves conflicts
  .overrideRules(
    {
      'import/order': 'off',
      '@stylistic/indent-binary-ops': ['off'],
      '@stylistic/member-delimiter-style': [
        'error',
        {
          multiline: {
            delimiter: 'semi',
            requireLast: true,
          },
          singleline: {
            delimiter: 'semi',
            requireLast: false,
          },
          multilineDetection: 'brackets',
        },
      ],
    }
  )
  .insertAfter('nuxt/import/rules', {
    name: 'simple-import-sort',
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  })
  // .overrideRules(eslintPluginPrettierRecommended.rules ?? {})//Throws error. Workaround below.
  .overrideRules(Object.fromEntries(
    Object.entries(eslintPluginPrettierRecommended.rules ?? {})
      .map(([rule, settings]) => {
        return [`@stylistic/${rule}`, settings];
      }),
  ))
  .prepend({ ignores: ['docs/**'] });

// Workaround for prettier overrides
const prettierRules = Object.keys(eslintPluginPrettierRecommended.rules);
for (const { rules } of Object.values(config)) {
  if (typeof rules !== 'object') {
    continue;
  }
  for (const rule of Object.keys(rules)) {
    if (prettierRules.includes(rule)) {
      rules[rule] = eslintPluginPrettierRecommended.rules[rule];
    }
  }
}

// console.log(config.map(({name, rules}) => ({name, rules})));
export default config;
