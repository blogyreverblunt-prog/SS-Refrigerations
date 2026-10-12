// @ts-check
/**
 * The architecture is only real if a machine enforces it.
 *
 * HLD-FREE-TIER.md §5.2: "A folder is not a module boundary unless something
 * enforces it. Add this on day one, before there is anything to untangle."
 */
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default tseslint.config(
  { ignores: [".next/**", "node_modules/**", "drizzle/**", "next-env.d.ts"] },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.extends("next/core-web-vitals"),

  /* ---------------------------------------------------------------- global */
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Deliberate: `any` erases the type safety the rest of this design
      // leans on. Use `unknown` and narrow.
      "@typescript-eslint/no-explicit-any": "error",
      eqeqeq: ["error", "smart"],
      "no-console": ["warn", { allow: ["warn", "error", "log"] }],
    },
  },

  /* ------------------------------------------------- type-aware linting --
     Scoped to src/ and given the TS parser explicitly: eslint-config-next
     installs its own parser, and rules that need type information fail
     against it. Config files stay on the untyped pass. */
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
    },
  },

  /* ------------------------------------------------- the module boundary */
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*/*"],
              message:
                "Import from the module root: @/modules/catalog, not @/modules/catalog/repository.",
            },
            {
              group: ["@/app/*"],
              message: "Modules and lib must never import from app/. Dependencies point inward.",
            },
          ],
        },
      ],
    },
  },

  /* A module may reach into its OWN internals — that is what index.ts is for. */
  {
    files: ["src/modules/*/**/*.ts"],
    rules: { "no-restricted-imports": "off" },
  },

  /* ------------------------------------------- one sanctioned env reader */
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/env.ts"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message:
            "Read configuration through `env` from @/lib/env — it is zod-validated and is the only place a missing variable is reported properly.",
        },
      ],
    },
  },

  /* ------------------------------------------- core stays dependency-free */
  {
    files: ["src/core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/*", "@/modules/*", "@/db/*", "drizzle-orm*", "@upstash/*", "resend", "@aws-sdk/*"],
              message:
                "core/ holds pure abstractions. A vendor SDK or a database client here means the dependency arrows have been inverted.",
            },
          ],
        },
      ],
    },
  },

  /* Config files run in Node and legitimately read the raw environment.
     They are also outside the TS program, so type-aware rules misfire.

     `scripts/*.mjs` is the same case: plain Node tooling (browser-check
     drives headless Chrome), outside tsconfig's include, and it reads
     process.env for CHROME_PATH because there is no Next runtime to read
     env through. */
  {
    files: ["*.config.{ts,mjs,js}", "drizzle.config.ts", "scripts/**/*.mjs"],
    rules: {
      "no-restricted-properties": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
