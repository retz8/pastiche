import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist-plugin');

function log(msg: string) {
  console.log(`[build] ${msg}`);
}

function clean() {
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true });
  }
  log('cleaned dist-plugin/');
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function renderAgents() {
  const agentsDir = path.join(ROOT, 'agents');
  const templatePath = path.join(ROOT, 'adapters', 'claude-code', 'agents.template');
  const templateRaw = fs.readFileSync(templatePath, 'utf8');

  // Extract template body: everything after the closing --> comment line
  const closingIdx = templateRaw.indexOf('-->');
  if (closingIdx === -1) {
    throw new Error('agents.template: could not find closing --> of metadata comment');
  }
  const afterComment = templateRaw.slice(closingIdx + 3);
  // Skip the newline right after -->
  const tmpl = afterComment.startsWith('\n') ? afterComment.slice(1) : afterComment;

  const outDir = path.join(DIST, 'agents');
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

    const rendered = tmpl
      .replace('{{sidecar}}', sidecar)
      .replace('{{body}}', body);

    fs.writeFileSync(path.join(outDir, `${name}.md`), rendered);
    log(`  agent: ${name}.md`);
  }
}

function copySkills() {
  const skillsDir = path.join(ROOT, 'skills');
  const files = fs.readdirSync(skillsDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const name = file.replace('.md', '');
    const outDir = path.join(DIST, 'skills', name);
    ensureDir(outDir);
    fs.copyFileSync(
      path.join(skillsDir, file),
      path.join(outDir, 'SKILL.md'),
    );
    log(`  skill: ${name}/SKILL.md`);
  }
}

function copyTemplates() {
  const templatesDir = path.join(ROOT, 'templates');
  const outDir = path.join(DIST, 'templates');
  ensureDir(outDir);

  const files = fs.readdirSync(templatesDir);
  for (const file of files) {
    fs.copyFileSync(
      path.join(templatesDir, file),
      path.join(outDir, file),
    );
    log(`  template: ${file}`);
  }
}

function generatePluginJson() {
  const outDir = path.join(DIST, '.claude-plugin');
  ensureDir(outDir);

  const manifest = {
    name: 'pastiche',
    description: 'Faithful design-system execution for LLM coding agents',
    version: '0.0.0-dev',
  };

  fs.writeFileSync(
    path.join(outDir, 'plugin.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  );
  log('  plugin.json generated');
}

function bundleJs() {
  log('bundling JS (tsup)...');
  execSync('npx tsup --config tsup.config.ts', {
    cwd: ROOT,
    stdio: 'inherit',
  });
  log('  JS bundled → dist-plugin/dist/extract-fact.js');
}

function buildRustBinary() {
  const manifestPath = path.join(ROOT, 'rust', 'pastiche-lint', 'Cargo.toml');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('rust/pastiche-lint/Cargo.toml not found — cannot build pastiche-lint binary');
  }

  log('compiling Rust binary (cargo build --release)...');
  execSync(`cargo build --release --manifest-path ${manifestPath}`, {
    cwd: ROOT,
    stdio: 'inherit',
  });

  const binaryName = process.platform === 'win32' ? 'pastiche-lint.exe' : 'pastiche-lint';
  const src = path.join(ROOT, 'rust', 'pastiche-lint', 'target', 'release', binaryName);
  if (!fs.existsSync(src)) {
    throw new Error(`compiled binary not found at ${src}`);
  }

  const binDir = path.join(DIST, 'bin');
  ensureDir(binDir);
  fs.copyFileSync(src, path.join(binDir, binaryName));
  fs.chmodSync(path.join(binDir, binaryName), 0o755);
  log(`  binary: bin/${binaryName}`);
}

function main() {
  log('=== pastiche plugin build ===');

  clean();

  log('rendering agents...');
  renderAgents();

  log('copying skills...');
  copySkills();

  log('copying templates...');
  copyTemplates();

  log('generating plugin.json...');
  generatePluginJson();

  bundleJs();

  buildRustBinary();

  log('=== build complete ===');
  log(`output: ${DIST}`);
}

main();
