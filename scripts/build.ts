import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

function log(msg: string) {
  console.log(`[build] ${msg}`);
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

// --- shared build steps (each takes the platform's output dir) ---

function clean(dist: string) {
  if (fs.existsSync(dist)) {
    fs.rmSync(dist, { recursive: true });
  }
  log(`cleaned ${path.relative(ROOT, dist)}/`);
}

function renderAgents(dist: string) {
  const agentsDir = path.join(ROOT, 'core', 'agents');
  const templatePath = path.join(ROOT, 'adapters', 'claude-code', 'agents.template');
  const templateRaw = fs.readFileSync(templatePath, 'utf8');

  const closingIdx = templateRaw.indexOf('-->');
  if (closingIdx === -1) {
    throw new Error('agents.template: could not find closing --> of metadata comment');
  }
  const afterComment = templateRaw.slice(closingIdx + 3);
  const tmpl = afterComment.startsWith('\n') ? afterComment.slice(1) : afterComment;

  const outDir = path.join(dist, 'agents');
  ensureDir(outDir);

  const canonicalFiles = fs.readdirSync(agentsDir)
    .filter(f => f.endsWith('.md') && !f.includes('.meta.'));

  for (const file of canonicalFiles) {
    const name = file.replace('.md', '');
    const sidecarPath = path.join(agentsDir, `${name}.claude-code.meta.yaml`);
    if (!fs.existsSync(sidecarPath)) {
      log(`  skip ${name} (no .claude-code.meta.yaml sidecar)`);
      continue;
    }
    const body = fs.readFileSync(path.join(agentsDir, file), 'utf8');
    const sidecar = fs.readFileSync(sidecarPath, 'utf8').trimEnd();
    const rendered = tmpl.replace('{{sidecar}}', sidecar).replace('{{body}}', body);
    fs.writeFileSync(path.join(outDir, `${name}.md`), rendered);
    log(`  agent: ${name}.md`);
  }
}

function copySkills(dist: string) {
  const skillsDir = path.join(ROOT, 'core', 'skills');
  const files = fs.readdirSync(skillsDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const name = file.replace('.md', '');
    const outDir = path.join(dist, 'skills', name);
    ensureDir(outDir);
    fs.copyFileSync(path.join(skillsDir, file), path.join(outDir, 'SKILL.md'));
    log(`  skill: ${name}/SKILL.md`);
  }
}

function copyTemplates(dist: string) {
  const templatesDir = path.join(ROOT, 'core', 'templates');
  const outDir = path.join(dist, 'templates');
  ensureDir(outDir);
  for (const file of fs.readdirSync(templatesDir)) {
    fs.copyFileSync(path.join(templatesDir, file), path.join(outDir, file));
    log(`  template: ${file}`);
  }
}

function generatePluginJson(dist: string) {
  const outDir = path.join(dist, '.claude-plugin');
  ensureDir(outDir);
  const manifest = {
    name: PKG.name,
    description: PKG.description,
    version: PKG.version,
    author: PKG.author,
    homepage: PKG.homepage,
    repository: PKG.repository,
    license: PKG.license,
    keywords: PKG.keywords,
  };
  fs.writeFileSync(
    path.join(outDir, 'plugin.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  );
  log(`  plugin.json generated (v${PKG.version})`);
}

function bundleJs(dist: string) {
  log('bundling JS (tsup)...');
  const outDir = path.join(dist, 'dist');
  execSync(`npx tsup --config tsup.config.ts --out-dir "${outDir}"`, {
    cwd: ROOT,
    stdio: 'inherit',
  });
  log(`  JS bundled → ${path.relative(ROOT, outDir)}/extract-fact.js`);
}

function writeExtractFactWrapper(dist: string) {
  const binDir = path.join(dist, 'bin');
  ensureDir(binDir);
  const wrapper = path.join(binDir, 'extract-fact');
  fs.writeFileSync(wrapper, `#!/usr/bin/env bash\nexec node "$(dirname "$0")/../dist/extract-fact.js" "$@"\n`);
  fs.chmodSync(wrapper, 0o755);
  log('  wrapper: bin/extract-fact');
}

function buildRustBinary(dist: string) {
  const manifestPath = path.join(ROOT, 'core', 'tools', 'pastiche-lint', 'Cargo.toml');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('core/tools/pastiche-lint/Cargo.toml not found — cannot build pastiche-lint binary');
  }
  log('compiling Rust binary (cargo build --release)...');
  execSync(`cargo build --release --manifest-path ${manifestPath}`, { cwd: ROOT, stdio: 'inherit' });

  const binaryName = process.platform === 'win32' ? 'pastiche-lint.exe' : 'pastiche-lint';
  const src = path.join(ROOT, 'core', 'tools', 'pastiche-lint', 'target', 'release', binaryName);
  if (!fs.existsSync(src)) {
    throw new Error(`compiled binary not found at ${src}`);
  }
  const binDir = path.join(dist, 'bin');
  ensureDir(binDir);
  fs.copyFileSync(src, path.join(binDir, binaryName));
  fs.chmodSync(path.join(binDir, binaryName), 0o755);
  log(`  binary: bin/${binaryName}`);
}

// --- platform adapters ---

interface PlatformAdapter {
  name: string;
  build(): void;
}

const claudeCode: PlatformAdapter = {
  name: 'claude-code',
  build() {
    const dist = path.join(ROOT, 'dist', 'claude-code');
    clean(dist);
    log('rendering agents...');
    renderAgents(dist);
    log('copying skills...');
    copySkills(dist);
    log('copying templates...');
    copyTemplates(dist);
    log('generating plugin.json...');
    generatePluginJson(dist);
    bundleJs(dist);
    writeExtractFactWrapper(dist);
    buildRustBinary(dist);
    log(`output: ${path.relative(ROOT, dist)}`);
  },
};

const ADAPTERS: Record<string, PlatformAdapter> = {
  'claude-code': claudeCode,
};

// --- entrypoint ---

function parsePlatform(): string {
  // Two invocation forms must both work and both validate:
  //   npm run build -- --platform=x   → reaches process.argv
  //   npm run build --platform=x      → npm swallows it into npm_config_platform
  const arg = process.argv.find(a => a.startsWith('--platform='));
  if (arg) return arg.split('=')[1];
  if (process.env.npm_config_platform) return process.env.npm_config_platform;
  return 'all';
}

function main() {
  log('=== pastiche plugin build ===');
  const platform = parsePlatform();

  let selected: PlatformAdapter[];
  if (platform === 'all') {
    selected = Object.values(ADAPTERS);
  } else {
    const adapter = ADAPTERS[platform];
    if (!adapter) {
      const known = [...Object.keys(ADAPTERS), 'all'].join(', ');
      console.error(`[build] unknown platform: "${platform}". known: ${known}`);
      process.exit(1);
    }
    selected = [adapter];
  }

  for (const adapter of selected) {
    log(`=== building platform: ${adapter.name} ===`);
    adapter.build();
  }

  log('=== build complete ===');
}

main();
