// Maps the "@/..." path alias (tsconfig `paths`) for `node --test`, so tests can
// import application modules without a bundler or an extra dependency.
// Also appends the extension Next.js resolves implicitly but Node does not.
import { pathToFileURL, fileURLToPath } from "node:url"
import { resolve as resolvePath, dirname } from "node:path"
import { existsSync, readFileSync } from "node:fs"
import ts from "typescript"

const SRC = resolvePath(dirname(fileURLToPath(import.meta.url)), "..", "src")

function withExtension(path) {
  if (existsSync(path)) return path
  for (const candidate of [`${path}.ts`, `${path}.tsx`, `${path}/index.ts`, `${path}/index.tsx`]) {
    if (existsSync(candidate)) return candidate
  }
  return path
}

export function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const target = withExtension(resolvePath(SRC, specifier.slice(2)))
    return next(pathToFileURL(target).href, context)
  }
  return next(specifier, context)
}

// Node strips TypeScript but not JSX. Compile TSX only for component render tests.
export function load(url, context, next) {
  if (url.startsWith("file:") && url.endsWith(".tsx")) {
    const { outputText } = ts.transpileModule(readFileSync(new URL(url), "utf8"), {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      fileName: fileURLToPath(url),
    })
    return { format: "module", source: outputText, shortCircuit: true }
  }
  return next(url, context)
}
