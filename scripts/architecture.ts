import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { builtinModules, createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { BindingName, Node, SourceFile } from 'typescript/unstable/ast'

const requireWeb = createRequire(new URL('../apps/web/package.json', import.meta.url))
const { API }: typeof import('typescript/unstable/sync') =
  await import(pathToFileURL(requireWeb.resolve('typescript/unstable/sync')).href)
const ast: typeof import('typescript/unstable/ast') =
  await import(pathToFileURL(requireWeb.resolve('typescript/unstable/ast')).href)

export interface Violation {
  file: string
  rule: string
  message: string
  suggestion: string
}

export interface Entry {
  file: string
  owner: string
  responsibility: string
  exports: string[]
  dependencies: string[]
  consumers: string[]
}

const codeExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts'])
const inventoryExtensions = new Set([...codeExtensions, '.css', '.json'])
const excludedDirectories = new Set(['node_modules', 'dist', 'dist-demo', 'coverage', '.git', '.tmp'])
const startMarker = '<!-- inventory:generated:start -->'
const endMarker = '<!-- inventory:generated:end -->'
const portable = (file: string) => file.split(path.sep).join('/')

function walk(root: string, directory: string): string[] {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name)
    if (entry.isSymbolicLink()) return []
    if (entry.isDirectory()) {
      return excludedDirectories.has(entry.name) ? [] : walk(root, file)
    }
    const relative = portable(path.relative(root, file))
    return inventoryExtensions.has(path.extname(file)) ? [relative] : []
  })
}

export function collectFiles(root: string): string[] {
  const nested = ['apps/web/src', 'apps/web/demo', 'apps/api/src', 'packages', 'scripts', 'shared']
    .flatMap((directory) => walk(root, path.join(root, directory)))
  const configs = ['', 'apps/web', 'apps/api'].flatMap((directory) => {
    const absolute = path.join(root, directory)
    if (!existsSync(absolute)) return []
    return readdirSync(absolute, { withFileTypes: true })
      .filter((entry) => entry.isFile() && inventoryExtensions.has(path.extname(entry.name)))
      .map((entry) => portable(path.join(directory, entry.name)))
  })
  return [...new Set([...nested, ...configs])].sort()
}

function ownership(file: string): Pick<Entry, 'owner' | 'responsibility'> {
  if (file.startsWith('apps/api/src/')) {
    const layer = file.split('/')[3]
    const responsibilities: Record<string, string> = {
      controllers: 'Traducción HTTP de operaciones',
      routes: 'Registro de rutas HTTP',
      services: 'Reglas y operaciones de aplicación',
      repositories: 'Acceso a persistencia',
      models: 'Modelos de persistencia MongoDB',
      validators: 'Validación runtime de entradas',
      middlewares: 'Middleware HTTP transversal',
      config: 'Configuración y contratos HTTP documentados',
      seeds: 'Preparación de datos ficticios',
      utils: 'Utilidad interna de API',
    }
    return { owner: `API / ${layer}`, responsibility: responsibilities[layer] ?? 'Composición y arranque de API' }
  }
  if (file.startsWith('apps/web/src/features/')) {
    const feature = file.split('/')[4]
    return { owner: `Web / ${feature}`, responsibility: `Pieza local de ${feature}` }
  }
  if (file.startsWith('apps/web/src/')) {
    const layer = file.split('/')[3]
    const responsibilities: Record<string, string> = {
      app: 'Composición, providers y navegación',
      components: 'UI o layout compartido',
      pages: 'Composición de pantalla/ruta',
      hooks: 'Lógica React reutilizable',
      lib: 'Utilidad o integración transversal',
      services: 'Adaptador de transporte API',
      styles: 'Estilos globales',
    }
    return { owner: `Web / ${layer}`, responsibility: responsibilities[layer] ?? 'Entrada o recurso web' }
  }
  if (file.startsWith('apps/web/demo/')) return { owner: 'Web / demo', responsibility: 'Adaptador o infraestructura mock/demo' }
  if (file.startsWith('packages/')) return { owner: `Contrato / ${file.split('/')[1]}`, responsibility: 'Contrato público o esquema seguro compartido' }
  if (file.startsWith('scripts/')) return { owner: 'Tooling', responsibility: file.includes('.test.') ? 'Pruebas unitarias del validador' : 'Gobierno y verificación arquitectónica' }
  if (file.startsWith('shared/')) return { owner: 'Datos ficticios', responsibility: 'Fixture común a demo y seed' }
  return { owner: 'Configuración', responsibility: 'Configuración del workspace o herramienta' }
}

interface PackageInfo {
  name: string
  directory: string
  exports: Record<string, unknown>
}

function readPackages(root: string): PackageInfo[] {
  const directory = path.join(root, 'packages')
  if (!existsSync(directory)) return []
  return readdirSync(directory).flatMap((name) => {
    const manifest = path.join(directory, name, 'package.json')
    if (!existsSync(manifest)) return []
    const data: unknown = JSON.parse(readFileSync(manifest, 'utf8'))
    if (!data || typeof data !== 'object' || !('name' in data) || typeof data.name !== 'string' ||
        !('exports' in data) || !data.exports || typeof data.exports !== 'object') {
      throw new Error(`${manifest}: el paquete compartido debe declarar name y exports públicos`)
    }
    return [{ name: data.name, directory: `packages/${name}`, exports: Object.fromEntries(Object.entries(data.exports)) }]
  })
}

function publicTargets(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(publicTargets)
  if (value && typeof value === 'object') return Object.values(value).flatMap(publicTargets)
  return []
}

function resolveFile(root: string, candidate: string): string | undefined {
  const extension = path.extname(candidate)
  const stem = candidate.slice(0, -extension.length || undefined)
  const candidates = extension === '.js' || extension === '.mjs' || extension === '.cjs'
    ? [candidate, `${stem}.ts`, `${stem}.tsx`, `${stem}.mts`, `${stem}.cts`, `${stem}.d.ts`]
    : [candidate, ...['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.d.ts', '.json', '.css'].map((ext) => candidate + ext),
      ...['index.ts', 'index.tsx', 'index.js', 'index.d.ts'].map((name) => path.join(candidate, name))]
  return candidates.find((file) => existsSync(path.resolve(root, file)) && statSync(path.resolve(root, file)).isFile())
}

function readImports(source: SourceFile): string[] {
  const imports = new Set<string>()
  function visit(node: Node): void {
    if ((ast.isImportDeclaration(node) || ast.isExportDeclaration(node)) &&
        node.moduleSpecifier && ast.isStringLiteral(node.moduleSpecifier)) {
      imports.add(node.moduleSpecifier.text)
    } else if (ast.isImportEqualsDeclaration(node) && ast.isExternalModuleReference(node.moduleReference) &&
        node.moduleReference.expression && ast.isStringLiteral(node.moduleReference.expression)) {
      imports.add(node.moduleReference.expression.text)
    } else if (ast.isImportTypeNode(node) && ast.isLiteralTypeNode(node.argument) &&
        ast.isStringLiteral(node.argument.literal)) {
      imports.add(node.argument.literal.text)
    } else if (ast.isCallExpression(node) && node.arguments.length > 0 &&
        (node.expression.kind === ast.SyntaxKind.ImportKeyword ||
        (ast.isIdentifier(node.expression) && node.expression.text === 'require'))) {
      const argument = node.arguments[0]
      if (ast.isStringLiteral(argument) || ast.isNoSubstitutionTemplateLiteral(argument)) imports.add(argument.text)
    }
    node.forEachChild(visit)
  }
  visit(source)
  return [...imports].sort()
}

function readExports(source: SourceFile): string[] {
  const names = new Set<string>()
  function binding(node: BindingName): void {
    if (ast.isIdentifier(node)) names.add(node.text)
    else for (const element of node.elements) {
      if (ast.isBindingElement(element) && element.name) binding(element.name)
    }
  }
  for (const statement of source.statements) {
    if (ast.isExportAssignment(statement)) names.add('default')
    if (ast.isExportDeclaration(statement)) {
      if (statement.exportClause && ast.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) names.add(element.name.text)
      } else if (statement.exportClause && ast.isNamespaceExport(statement.exportClause)) {
        names.add(statement.exportClause.name.text)
      } else names.add('*')
    }
    if ('modifierFlags' in statement && typeof statement.modifierFlags === 'number') {
      if (statement.modifierFlags & ast.ModifierFlags.Default) names.add('default')
      if (statement.modifierFlags & ast.ModifierFlags.Export) {
        if (ast.isVariableStatement(statement)) {
          for (const declaration of statement.declarationList.declarations) binding(declaration.name)
        } else if ((ast.isFunctionDeclaration(statement) || ast.isClassDeclaration(statement) ||
            ast.isInterfaceDeclaration(statement) || ast.isTypeAliasDeclaration(statement) ||
            ast.isEnumDeclaration(statement) || ast.isModuleDeclaration(statement)) && statement.name &&
            ast.isIdentifier(statement.name)) {
          names.add(statement.name.text)
        }
      }
    }
  }
  return [...names].sort()
}

export function analyze(root: string): { entries: Entry[]; violations: Violation[] } {
  root = path.resolve(root)
  const files = collectFiles(root)
  const entries = files.map((file): Entry => ({ file, ...ownership(file), exports: [], dependencies: [], consumers: [] }))
  const byFile = new Map(entries.map((entry) => [entry.file, entry]))
  const violations: Violation[] = []
  const report = (file: string, rule: string, message: string, suggestion: string) => {
    violations.push({ file, rule, message, suggestion })
  }
  const packages = readPackages(root)
  const applicationNames = ['apps/web', 'apps/api'].flatMap((directory) => {
    const manifest = path.join(root, directory, 'package.json')
    if (!existsSync(manifest)) return []
    const data: unknown = JSON.parse(readFileSync(manifest, 'utf8'))
    return data && typeof data === 'object' && 'name' in data && typeof data.name === 'string'
      ? [{ directory, name: data.name }] : []
  })
  const config = path.join(root, '.architecture.virtual.json')
  const api = new API({ cwd: root, fs: {
    fileExists: (file) => path.resolve(file) === config ? true : undefined,
    readFile: (file) => path.resolve(file) === config ? JSON.stringify({
      compilerOptions: { noResolve: true, noLib: true, allowJs: true, jsx: 'preserve' },
      files: files.filter((file) => codeExtensions.has(path.extname(file))),
    }) : undefined,
  } })
  try {
    const snapshot = api.updateSnapshot({ openProjects: [config] })
    try {
      const project = snapshot.getProjects().find((item) => path.resolve(item.configFileName) === config)
      if (!project) throw new Error('No se pudo abrir el proyecto virtual de análisis TypeScript')
      const aliases = ['apps/web/tsconfig.app.json', 'apps/web/tsconfig.node.json', 'apps/api/tsconfig.json']
        .filter((file) => existsSync(path.join(root, file)))
        .map((file) => ({ file, config: api.parseConfigFile(path.join(root, file)).options }))

      for (const entry of entries) {
        if (!codeExtensions.has(path.extname(entry.file))) continue
        const source = project.program.getSourceFile(path.join(root, entry.file))
        if (!source) throw new Error(`No se pudo analizar ${entry.file}`)
        for (const diagnostic of project.program.getSyntacticDiagnostics(path.join(root, entry.file))) {
          report(entry.file, 'syntax', diagnostic.text, 'Corregir la sintaxis antes de validar la arquitectura.')
        }
        entry.exports = readExports(source)
        for (const specifier of readImports(source)) {
          const application = applicationNames.find((item) => specifier === item.name || specifier.startsWith(`${item.name}/`))
          if (application && !entry.file.startsWith(`${application.directory}/`)) {
            report(entry.file, 'workspace-boundary', specifier, 'Consumir contratos compartidos, no el paquete de otra aplicación.')
          }
          let target: string | undefined
          const shared = packages.find((item) => specifier === item.name || specifier.startsWith(`${item.name}/`))
          if (shared) {
            const key = specifier === shared.name ? '.' : `.${specifier.slice(shared.name.length)}`
            const exported = shared.exports[key]
            if (exported === undefined) {
              report(entry.file, 'public-import', specifier, 'Usar un export declarado del paquete compartido.')
              continue
            }
            const targets = publicTargets(exported).map((item) => path.join(shared.directory, item))
            for (const item of targets) {
              const resolved = resolveFile(root, item)
              if (!resolved) report(entry.file, 'unresolved-import', item, 'Corregir el destino del export público.')
              else entry.dependencies.push(portable(resolved))
            }
          } else if (specifier.startsWith('.')) {
            target = resolveFile(root, path.join(path.dirname(entry.file), specifier))
            if (!target) report(entry.file, 'unresolved-import', specifier, 'Corregir la ruta relativa o recuperar su fuente.')
          } else {
            const selected = aliases.find((item) => entry.file.startsWith(path.posix.dirname(item.file) + '/'))
            const paths = selected?.config.paths
            if (paths && typeof paths === 'object') {
              for (const [pattern, replacements] of Object.entries(paths)) {
                const [prefix, suffix = ''] = pattern.split('*')
                const matches = pattern.includes('*') ? specifier.startsWith(prefix) && specifier.endsWith(suffix) : specifier === pattern
                if (!matches || !Array.isArray(replacements)) continue
                const capture = pattern.includes('*') ? specifier.slice(prefix.length, suffix ? -suffix.length : undefined) : ''
                const base = typeof selected.config.baseUrl === 'string'
                  ? selected.config.baseUrl : path.dirname(path.join(root, selected.file))
                for (const replacement of replacements) {
                  if (typeof replacement === 'string') target ??= resolveFile(root, path.relative(root, path.resolve(base, replacement.replace('*', capture))))
                }
                if (!target) report(entry.file, 'unresolved-import', specifier, 'Corregir el alias del tsconfig.')
                break
              }
            }
            const builtin = builtinModules.includes(specifier.replace(/^node:/, ''))
            const serverOnly = builtin || ['mongoose', 'express', 'argon2'].some((name) => specifier === name || specifier.startsWith(`${name}/`))
            if (serverOnly && (entry.file.startsWith('packages/') || entry.file.startsWith('apps/web/src/'))) {
              report(entry.file, 'shared-safe', specifier, 'Mantener dependencias de servidor fuera de contratos compartidos y código de navegador.')
            }
          }
          if (target) entry.dependencies.push(portable(target))
        }
        entry.dependencies = [...new Set(entry.dependencies)].sort()
        for (const target of entry.dependencies) {
          const web = entry.file.startsWith('apps/web/')
          const backend = entry.file.startsWith('apps/api/')
          if ((web && target.startsWith('apps/api/')) || (backend && target.startsWith('apps/web/')) ||
              (entry.file.startsWith('packages/') && target.startsWith('apps/'))) {
            report(entry.file, 'workspace-boundary', target, 'Consumir contratos compartidos; no importar la implementación de otra aplicación.')
          }
          const shared = packages.find((item) => target.startsWith(`${item.directory}/`))
          if (shared && !entry.file.startsWith(`${shared.directory}/`)) {
            const exported = Object.values(shared.exports).flatMap(publicTargets).map((item) => portable(path.join(shared.directory, item)))
            if (!exported.includes(target)) report(entry.file, 'public-import', target, 'Usar únicamente puntos de entrada declarados del paquete.')
          }
          if (entry.file.startsWith('packages/') && target.startsWith('scripts/')) {
            report(entry.file, 'shared-safe', target, 'Los contratos no deben depender del tooling del repositorio.')
          }
          if (entry.file.startsWith('apps/api/src/')) {
            const layer = entry.file.split('/')[3]
            const targetLayer = target.startsWith('apps/api/src/') ? target.split('/')[3] : ''
            if (['services', 'repositories', 'models'].includes(layer) && ['routes', 'controllers', 'middlewares'].includes(targetLayer)) {
              report(entry.file, 'api-layer', target, 'Mantener HTTP fuera de servicios y persistencia; extraer contratos neutrales si es necesario.')
            }
          }
          if ((entry.file.startsWith('apps/web/src/features/') || entry.file.startsWith('apps/web/src/components/')) &&
              (target.startsWith('apps/web/src/pages/') ||
              (target.startsWith('apps/web/src/app/') && target !== 'apps/web/src/app/router/screens.ts'))) {
            report(entry.file, 'web-composition', target, 'La composición consume features/UI, no al revés.')
          }
          if (!byFile.has(target) && inventoryExtensions.has(path.extname(target))) {
            report(entry.file, 'source-scope', target, 'Incluir la fuente local en el alcance o documentar una exclusión explícita.')
          }
          byFile.get(target)?.consumers.push(entry.file)
        }
      }
    } finally {
      snapshot.dispose()
    }
  } finally {
    api.close()
  }
  const visited = new Set<string>()
  const active = new Set<string>()
  const stack: string[] = []
  function visit(file: string): void {
    if (active.has(file)) {
      const cycle = [...stack.slice(stack.indexOf(file)), file]
      report(file, 'dependency-cycle', cycle.join(' → '), 'Romper el ciclo moviendo la responsabilidad o contrato a su propietario.')
      return
    }
    if (visited.has(file)) return
    visited.add(file)
    active.add(file)
    stack.push(file)
    for (const target of byFile.get(file)?.dependencies ?? []) if (byFile.has(target)) visit(target)
    stack.pop()
    active.delete(file)
  }
  for (const file of files) visit(file)
  for (const entry of entries) entry.consumers = [...new Set(entry.consumers)].sort()
  return { entries, violations }
}

export function inventoryRows(document: string): string[] {
  const start = document.indexOf(startMarker)
  const end = document.indexOf(endMarker)
  if (start < 0 || end < start || document.indexOf(startMarker, start + startMarker.length) >= 0 ||
      document.indexOf(endMarker, end + endMarker.length) >= 0) {
    throw new Error('El inventario debe contener un único bloque inventory:generated:start/end')
  }
  return document.slice(start + startMarker.length, end).split('\n')
    .filter((line) => line.startsWith('| `'))
    .map((line) => line.split('`')[1])
}

export function checkInventory(entries: Entry[], document: string): Violation[] {
  const rows = inventoryRows(document)
  const expected = new Set(entries.map((entry) => entry.file))
  const actual = new Set(rows)
  const violations: Violation[] = []
  const report = (file: string, rule: string, message: string) => violations.push({
    file, rule, message, suggestion: 'Actualizar el bloque con npm run inventory:update y revisar la documentación manual.',
  })
  for (const file of expected) if (!actual.has(file)) report(file, 'inventory-missing', 'Fuente ausente del inventario.')
  for (const file of actual) if (!expected.has(file)) report(file, 'inventory-orphan', 'Entrada inexistente o fuera del alcance documentado.')
  for (const file of actual) if (rows.filter((row) => row === file).length > 1) report(file, 'inventory-duplicate', 'Entrada duplicada.')
  if (!violations.length &&
      updateInventory(entries, document).replaceAll('\r\n', '\n') !== document.replaceAll('\r\n', '\n')) {
    report('docs/COMPONENT_INVENTORY.md', 'inventory-drift', 'Exports, dependencias, consumidores o clasificación desactualizados.')
  }
  return violations
}

export function updateInventory(entries: Entry[], document: string): string {
  inventoryRows(document)
  const cell = (values: string[]) => values.length ? values.map((value) => `\`${value.replaceAll('|', '\\|')}\``).join(', ') : '—'
  const table = [
    '| Ruta real | Propietario / responsabilidad por ubicación | Exports declarados | Dependencias locales | Consumidores locales |',
    '| --- | --- | --- | --- | --- |',
    ...entries.map((entry) => `| \`${entry.file}\` | ${entry.owner}: ${entry.responsibility} | ${cell(entry.exports)} | ${cell(entry.dependencies)} | ${cell(entry.consumers)} |`),
  ].join('\n')
  return document.slice(0, document.indexOf(startMarker) + startMarker.length) +
    `\n\n${table}\n\n` + document.slice(document.indexOf(endMarker))
}

export function run(root: string, write = false): number {
  const { entries, violations } = analyze(root)
  const inventory = path.join(root, 'docs', 'COMPONENT_INVENTORY.md')
  const document = readFileSync(inventory, 'utf8')
  if (write) writeFileSync(inventory, updateInventory(entries, document))
  else violations.push(...checkInventory(entries, document))
  for (const violation of violations) {
    console.error(`${violation.file} [${violation.rule}] ${violation.message}\n  Corrección: ${violation.suggestion}`)
  }
  if (violations.length) return 1
  console.info(`${write ? 'Inventario actualizado' : 'Arquitectura verificada'}: ${entries.length} archivos inventariables.`)
  return 0
}
