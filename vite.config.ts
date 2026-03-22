import { defineConfig } from 'vite-plus';

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  pack: {
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['esm', 'cjs'],
    target: 'es2022',
    treeshake: true,
    sourcemap: true,
    dts: {
      tsgo: true,
    },
    exports: true,
  },
  fmt: {
    endOfLine: 'lf',
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'es5',
    printWidth: 80,
    experimentalSortPackageJson: {
      sortScripts: true,
    },
    sortImports: {},
    experimentalTailwindcss: {
      attributes: ['class', 'className'],
      functions: ['cn', 'clsx', 'cva'],
    },
    ignorePatterns: ['src/routeTree.gen.ts'],
  },

  lint: {
    plugins: ['typescript', 'import'],
    rules: {
      'typescript/consistent-type-imports': 'error',
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      curly: ['error', 'all'],
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
