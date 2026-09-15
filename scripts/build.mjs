import { cp, mkdir, readdir, rm, writeFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { collectSubjects } from './catalog.mjs';
import { renderHome, renderSubject } from './render.mjs';

// Publish only public assets and discipline folders. Skip hidden files and links.
async function copyPublic(source, destination) {
  const info = await lstat(source);
  if (info.isSymbolicLink()) return;
  if (info.isDirectory()) {
    await mkdir(destination, { recursive: true });
    for (const entry of await readdir(source)) {
      if (!entry.startsWith('.') && !['node_modules', 'Thumbs.db'].includes(entry)) {
        await copyPublic(path.join(source, entry), path.join(destination, entry));
      }
    }
  } else if (info.isFile()) {
    await cp(source, destination);
  }
}

export async function build(root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))) {
  root = path.resolve(root);
  const subjects = await collectSubjects(root);
  for (const subject of subjects) {
    const info = await lstat(path.join(root, subject.slug)).catch(e => { if (e.code !== 'ENOENT') throw e; });
    if (info?.isSymbolicLink()) throw new Error(`A pasta ${subject.slug} não pode ser um link simbólico.`);
  }
  // Check every generated source file before clearing output or writing any index.
  const indexPaths = ['index.html', ...subjects.map(subject => path.join(subject.slug, 'index.html'))];
  for (const indexPath of indexPaths) {
    const info = await lstat(path.join(root, indexPath)).catch(e => { if (e.code !== 'ENOENT') throw e; });
    if (info?.isSymbolicLink()) throw new Error(`${indexPath} não pode ser um link simbólico.`);
  }
  const output = path.join(root, '_site');
  // Only this fixed generated directory is cleared; never follow a symlink.
  const info = await lstat(output).catch(e => { if (e.code !== 'ENOENT') throw e; });
  if (info?.isSymbolicLink()) throw new Error('_site não pode ser um link simbólico.');
  if (path.dirname(output) !== root) throw new Error('Diretório de saída inválido.');
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  const home = renderHome(subjects);
  await writeFile(path.join(root, 'index.html'), home, 'utf8');
  await writeFile(path.join(output, 'index.html'), home, 'utf8');
  await copyPublic(path.join(root, 'assets'), path.join(output, 'assets'));
  for (const subject of subjects) {
    const source = path.join(root, subject.slug);
    await mkdir(source, { recursive: true });
    const index = renderSubject(subjects, subject);
    await writeFile(path.join(source, 'index.html'), index, 'utf8');
    await copyPublic(source, path.join(output, subject.slug));
  }
  await writeFile(path.join(output, '.nojekyll'), '');
  return { output, subjects };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { subjects } = await build();
  console.log(`Site gerado: ${subjects.length} disciplinas, ${subjects.reduce((n, s) => n + s.materials.length, 0)} materiais. Saída: _site/`);
}
