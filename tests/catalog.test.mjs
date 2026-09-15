import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rename, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { collectSubjects, SUBJECTS } from '../scripts/catalog.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'direito-catalog-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

async function material(root, relativePath, html = '') {
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html, 'utf8');
  return target;
}

test('retorna as cinco disciplinas mesmo quando suas pastas ainda não existem', async (t) => {
  const subjects = await collectSubjects(await fixture(t));
  assert.deepEqual(subjects.map(({ slug, name, materials }) => ({ slug, name, materials })), [
    { slug: 'direito-constitucional', name: 'Direito Constitucional', materials: [] },
    { slug: 'direito-empresarial', name: 'Direito Empresarial', materials: [] },
    { slug: 'direito-civil', name: 'Direito Civil', materials: [] },
    { slug: 'direito-processual-civil', name: 'Direito Processual Civil', materials: [] },
    { slug: 'direito-penal', name: 'Direito Penal', materials: [] },
  ]);
  assert.equal(SUBJECTS.length, 5);
  assert.ok(subjects.every(({ description, shortName }) => description && shortName));
});

test('reflete adição, renomeação e remoção sem manter catálogo em cache', async (t) => {
  const root = await fixture(t);
  const before = await collectSubjects(root);
  assert.equal(before[0].materials.length, 0);
  const original = await material(root, 'direito-constitucional/direitos-fundamentais.html');
  assert.deepEqual((await collectSubjects(root))[0].materials, [{
    path: 'direitos-fundamentais.html', title: 'Direitos fundamentais', description: '', kind: 'Material de estudo',
  }]);
  const renamed = path.join(path.dirname(original), 'controle-de-constitucionalidade.htm');
  await rename(original, renamed);
  assert.equal((await collectSubjects(root))[0].materials[0].path, 'controle-de-constitucionalidade.htm');
  await rm(renamed);
  assert.deepEqual((await collectSubjects(root))[0].materials, []);
});

test('descobre subpastas e mantém espaços, acentos e caracteres reservados no caminho', async (t) => {
  const root = await fixture(t);
  await material(root, 'direito-civil/Revisão 01/Responsabilidade & obrigações.HTML', '<head><title>Responsabilidade civil</title></head>');
  await material(root, 'direito-penal/parte-geral.htm', '<h1>Parte geral</h1>');
  const subjects = await collectSubjects(root);
  assert.equal(subjects[2].materials[0].path, 'Revisão 01/Responsabilidade & obrigações.HTML');
  assert.equal(subjects[4].materials[0].title, 'Parte geral');
  assert.deepEqual(subjects[1].materials, []);
});

test('prefere metadados e decodifica entidades, aspas e atributos fora de ordem', async (t) => {
  const root = await fixture(t);
  await material(root, 'direito-constitucional/arquivo.html', `<!doctype html><html><head>
    <meta content='  Constitui&ccedil;&atilde;o &amp; a&ccedil;&atilde;o &#x2014; &#128218;  ' data-other="yes" NAME='study-title'>
    <meta CONTENT="A &quot;Constituição&quot; &gt; regras&nbsp; e &#39;direitos&#39;." name = 'description'>
    <meta content='  Resumo   orientado  ' name="study-type">
    <title>Título descartado</title>
  </head><body><h1>Outro título</h1></body></html>`);
  assert.deepEqual((await collectSubjects(root))[0].materials[0], {
    path: 'arquivo.html',
    title: 'Constituição & ação — 📚',
    description: 'A "Constituição" > regras e \'direitos\'.',
    kind: 'Resumo orientado',
  });
});

test('usa title do head, h1 e nome legível como alternativas de título', async (t) => {
  const root = await fixture(t);
  await material(root, 'direito-constitucional/a.html', '<head><meta name="study-title" content=" "><title>  Poder\n Judiciário &amp; Justiça </title></head><h1>Ignorar</h1>');
  await material(root, 'direito-constitucional/b.html', '<head></head><body><svg><title>Ícone</title></svg><h1>  Controle <em>difuso</em> </h1></body>');
  await material(root, 'direito-constitucional/organizacao_do-estado.html', '<head></head><body><title>Fora do head</title></body>');
  const titles = Object.fromEntries((await collectSubjects(root))[0].materials.map((item) => [item.path, item.title]));
  assert.deepEqual(titles, {
    'b.html': 'Controle difuso',
    'organizacao_do-estado.html': 'Organizacao do estado',
    'a.html': 'Poder Judiciário & Justiça',
  });
});

test('ignora markup em comentários e scripts sem executar HTML', async (t) => {
  const root = await fixture(t);
  await material(root, 'direito-constitucional/seguro.html', `<head>
    <!-- <meta name="study-title" content="Comentário"> -->
    <script>throw new Error('HTML não deve ser executado'); const fake = '<title>Script</title>';</script>
    <title>Título real</title>
  </head><body><!-- <h1>Oculto</h1> --><h1>Corpo</h1></body>`);
  assert.equal((await collectSubjects(root))[0].materials[0].title, 'Título real');
});

test('infere simulados e questões pelo nome e limita metadados excessivamente longos', async (t) => {
  const root = await fixture(t);
  await material(root, 'direito-constitucional/simulado-01.html');
  await material(root, 'direito-constitucional/questoes.htm');
  await material(root, 'direito-constitucional/questões-02.html');
  await material(root, 'direito-constitucional/longo.html', `<head><title>${'A'.repeat(1000)}</title><meta name="description" content="${'B'.repeat(1000)}"></head>`);
  const items = Object.fromEntries((await collectSubjects(root))[0].materials.map((item) => [item.path, item]));
  assert.equal(items['simulado-01.html'].kind, 'Simulado');
  assert.equal(items['questoes.htm'].kind, 'Questões');
  assert.equal(items['questões-02.html'].kind, 'Questões');
  assert.ok(items['longo.html'].title.length <= 180);
  assert.ok(items['longo.html'].description.length <= 320);
  assert.ok(items['longo.html'].title.startsWith('AAA'));
});

test('exclui índices em qualquer caixa, pastas ocultas e arquivos de outros formatos', async (t) => {
  const root = await fixture(t);
  for (const file of ['index.html', 'INDEX.HTM', 'sub/Index.Html', '.privado/a.html', 'sub/.cache/b.html', 'anotacoes.txt']) {
    await material(root, `direito-constitucional/${file}`, '<h1>Não listar</h1>');
  }
  await material(root, 'direito-constitucional/resumo.html', '<h1>Resumo público</h1>');
  assert.deepEqual((await collectSubjects(root))[0].materials.map(({ path: itemPath }) => itemPath), ['resumo.html']);
});

test('exclui diretórios simbólicos internos e pastas de disciplina simbólicas', async (t) => {
  const root = await fixture(t);
  const outside = path.join(root, 'originais');
  await material(outside, 'externo.html', '<h1>Não listar</h1>');
  await mkdir(path.join(root, 'direito-constitucional'));
  await symlink(outside, path.join(root, 'direito-constitucional', 'atalho'), process.platform === 'win32' ? 'junction' : 'dir');
  await symlink(outside, path.join(root, 'direito-penal'), process.platform === 'win32' ? 'junction' : 'dir');
  const subjects = await collectSubjects(root);
  assert.deepEqual(subjects[0].materials, []);
  assert.deepEqual(subjects[4].materials, []);
});

test('exclui arquivos simbólicos quando disponíveis no sistema', async (t) => {
  const root = await fixture(t);
  const original = await material(root, 'original.html', '<h1>Não listar</h1>');
  await mkdir(path.join(root, 'direito-constitucional'));
  try {
    await symlink(original, path.join(root, 'direito-constitucional', 'atalho.html'), 'file');
  } catch (error) {
    if (process.platform === 'win32' && error.code === 'EPERM') {
      t.skip('Windows exige privilégio de symlink para arquivos; diretórios são cobertos por junction.');
      return;
    }
    throw error;
  }
  assert.deepEqual((await collectSubjects(root))[0].materials, []);
});

test('ordena por título em português e desempata de forma estável pelo caminho', async (t) => {
  const root = await fixture(t);
  await material(root, 'direito-constitucional/z.html', '<head><title>Árvore</title></head>');
  await material(root, 'direito-constitucional/a.html', '<head><title>Árvore</title></head>');
  await material(root, 'direito-constitucional/meio.html', '<head><title>Constituição</title></head>');
  await material(root, 'direito-constitucional/fim.html', '<head><title>Zelo</title></head>');
  assert.deepEqual((await collectSubjects(root))[0].materials.map(({ path: itemPath }) => itemPath), ['a.html', 'z.html', 'meio.html', 'fim.html']);
});

test('falha com contexto quando um caminho de disciplina existe mas não pode ser lido como pasta', async (t) => {
  const root = await fixture(t);
  await writeFile(path.join(root, 'direito-constitucional'), 'sou um arquivo');
  await assert.rejects(collectSubjects(root), (error) => {
    assert.match(error.message, /direito-constitucional/);
    assert.match(error.message, /ler|pasta|diretório/i);
    return true;
  });
});
