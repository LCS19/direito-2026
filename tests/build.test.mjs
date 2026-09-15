import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, access, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

test('publica índices sob uma subpasta e mantém material e assets intactos', async () => {
  const { build } = await import('../scripts/build.mjs');
  const root = await mkdtemp(path.join(tmpdir(), 'direito-build-'));
  try {
    await mkdir(path.join(root, 'assets'));
    await writeFile(path.join(root, 'assets', 'estilos.css'), 'body{}');
    const folder = path.join(root, 'direito-constitucional');
    await mkdir(folder);
    const original = '<!doctype html><html><head><title>A &amp; B</title></head><body>Estudo<img src="mapa.svg"></body></html>';
    await writeFile(path.join(folder, 'revisão #1.html'), original);
    await writeFile(path.join(folder, 'mapa.svg'), '<svg></svg>');
    await writeFile(path.join(root, 'segredo.txt'), 'não publicar');
    await build(root);
    const output = path.join(root, '_site');
    const home = await readFile(path.join(output, 'index.html'), 'utf8');
    assert.match(home, /direito-penal\/index\.html/);
    const subject = await readFile(path.join(output, 'direito-constitucional', 'index.html'), 'utf8');
    assert.match(subject, /revis%C3%A3o%20%231\.html/);
    assert.match(subject, /A &amp; B/);
    assert.match(subject, /href="\.\.\/index\.html"/);
    assert.match(subject, /href="\.\.\/assets\/estilos\.css"/);
    assert.doesNotMatch(home + subject, /(?:href|src)="\//);
    assert.equal(await readFile(path.join(output, 'direito-constitucional', 'revisão #1.html'), 'utf8'), original);
    assert.equal(await readFile(path.join(folder, 'revisão #1.html'), 'utf8'), original);
    assert.equal(await readFile(path.join(output, 'direito-constitucional', 'mapa.svg'), 'utf8'), '<svg></svg>');
    await assert.rejects(access(path.join(output, 'segredo.txt')));
    const empty = await readFile(path.join(output, 'direito-penal', 'index.html'), 'utf8');
    assert.match(empty, /Nenhum material disponível ainda/);
    await rm(path.join(folder, 'revisão #1.html'));
    await build(root);
    await assert.rejects(access(path.join(output, 'direito-constitucional', 'revisão #1.html')));
    assert.doesNotMatch(await readFile(path.join(output, 'direito-constitucional', 'index.html'), 'utf8'), /A &amp; B/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

for (const indexPath of ['index.html', 'direito-constitucional/index.html']) {
  test(`recusa índice simbólico ${indexPath} antes de limpar a saída`, async (t) => {
    const { build } = await import('../scripts/build.mjs');
    const root = await mkdtemp(path.join(tmpdir(), 'direito-build-link-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    await mkdir(path.join(root, 'assets'));
    await mkdir(path.join(root, 'direito-constitucional'));
    await mkdir(path.join(root, '_site'));
    await writeFile(path.join(root, '_site', 'preservado.txt'), 'saída anterior');
    const target = path.join(root, 'alvo');
    await mkdir(target);
    await writeFile(path.join(target, 'preservado.txt'), 'conteúdo original');
    await symlink(target, path.join(root, indexPath), process.platform === 'win32' ? 'junction' : 'dir');

    await assert.rejects(build(root), /index\.html.*link simbólico/i);
    assert.equal(await readFile(path.join(root, '_site', 'preservado.txt'), 'utf8'), 'saída anterior');
    assert.equal(await readFile(path.join(target, 'preservado.txt'), 'utf8'), 'conteúdo original');
    if (indexPath !== 'index.html') {
      await assert.rejects(access(path.join(root, 'index.html')));
    }
  });
}

test('recusa índice que aponta para um material sem sobrescrever seu conteúdo', async (t) => {
  const { build } = await import('../scripts/build.mjs');
  const root = await mkdtemp(path.join(tmpdir(), 'direito-build-file-link-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'assets'));
  const target = path.join(root, 'material.html');
  await writeFile(target, '<h1>Material original</h1>');
  try {
    await symlink(target, path.join(root, 'index.html'), 'file');
  } catch (error) {
    if (process.platform === 'win32' && error.code === 'EPERM') {
      t.skip('Windows exige privilégio de symlink para arquivos; índices simbólicos são cobertos por junction.');
      return;
    }
    throw error;
  }
  await assert.rejects(build(root), /index\.html.*link simbólico/i);
  assert.equal(await readFile(target, 'utf8'), '<h1>Material original</h1>');
});
