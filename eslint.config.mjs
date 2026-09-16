import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", ".theme-fix-backup/**", "next-env.d.ts", "tests/*.cjs"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
