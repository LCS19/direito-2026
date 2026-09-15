import { lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export const SUBJECTS = Object.freeze([
  {
    slug: 'direito-constitucional',
    name: 'Direito Constitucional',
    shortName: 'Constitucional',
    description: 'Constituição, direitos fundamentais e organização do Estado.',
  },
  {
    slug: 'direito-empresarial',
    name: 'Direito Empresarial',
    shortName: 'Empresarial',
    description: 'Empresa, sociedades e relações jurídicas da atividade econômica.',
  },
  {
    slug: 'direito-civil',
    name: 'Direito Civil',
    shortName: 'Civil',
    description: 'Pessoas, obrigações, contratos e relações privadas.',
  },
  {
    slug: 'direito-processual-civil',
    name: 'Direito Processual Civil',
    shortName: 'Processual Civil',
    description: 'Jurisdição, processo e instrumentos de tutela dos direitos.',
  },
  {
    slug: 'direito-penal',
    name: 'Direito Penal',
    shortName: 'Penal',
    description: 'Teoria do crime, responsabilidade penal e aplicação das penas.',
  },
].map(Object.freeze));

const entities = {
  amp: '&', AMP: '&', lt: '<', LT: '<', gt: '>', GT: '>', quot: '"', QUOT: '"', apos: "'",
  nbsp: ' ', ensp: ' ', emsp: ' ', thinsp: ' ', shy: '',
  ndash: '–', mdash: '—', hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  laquo: '«', raquo: '»', bull: '•', middot: '·', copy: '©', reg: '®', trade: '™',
  sect: '§', para: '¶', ordm: 'º', ordf: 'ª', deg: '°', euro: '€', pound: '£',
  aacute: 'á', agrave: 'à', acirc: 'â', atilde: 'ã', auml: 'ä', aring: 'å',
  eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë',
  iacute: 'í', igrave: 'ì', icirc: 'î', iuml: 'ï',
  oacute: 'ó', ograve: 'ò', ocirc: 'ô', otilde: 'õ', ouml: 'ö',
  uacute: 'ú', ugrave: 'ù', ucirc: 'û', uuml: 'ü', ccedil: 'ç', ntilde: 'ñ',
  yacute: 'ý', yuml: 'ÿ', aelig: 'æ', oelig: 'œ', szlig: 'ß',
};
for (const name of Object.keys(entities)) {
  if (/^(?:[aeiouy](?:acute|grave|circ|tilde|uml|ring)|ccedil|ntilde|aelig|oelig)$/.test(name)) {
    entities[name[0].toUpperCase() + name.slice(1)] = entities[name].toUpperCase();
  }
}

function decodeEntities(text) {
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z][a-z\d]+);/gi, (match, entity) => {
    if (entity[0] !== '#') return entities[entity] ?? match;
    const hexadecimal = entity[1].toLowerCase() === 'x';
    const point = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
    return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)
      ? String.fromCodePoint(point)
      : '\uFFFD';
  });
}

function plainText(text, limit) {
  const clean = decodeEntities(text.replace(/<[^>]*>/g, ' ')).replace(/\s+/gu, ' ').trim();
  const characters = Array.from(clean);
  return characters.length <= limit ? clean : `${characters.slice(0, limit - 1).join('').trimEnd()}…`;
}

function attributes(source) {
  const result = Object.create(null);
  const pattern = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const match of source.matchAll(pattern)) {
    const key = match[1].toLowerCase();
    if (!(key in result)) result[key] = match[2] ?? match[3] ?? match[4];
  }
  return result;
}

function readMetadata(html, relativePath) {
  // Parsing text alone keeps arbitrary study documents from executing during the build.
  const source = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  const head = source.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1] ?? '';
  const metadata = Object.create(null);
  for (const match of source.matchAll(/<meta\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi)) {
    const attrs = attributes(match[1]);
    const name = decodeEntities(attrs.name ?? '').trim().toLowerCase();
    if (name && !(name in metadata)) metadata[name] = attrs.content ?? '';
  }
  const filename = path.posix.basename(relativePath).replace(/\.html?$/i, '');
  const readableName = filename.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const fallbackTitle = readableName ? readableName[0].toLocaleUpperCase('pt-BR') + readableName.slice(1) : 'Material de estudo';
  const titleCandidates = [
    metadata['study-title'] ?? '',
    head.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1] ?? '',
    source.match(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/i)?.[1] ?? '',
    fallbackTitle,
  ];
  const normalizedFilename = filename.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const inferredKind = normalizedFilename.includes('simulado') ? 'Simulado'
    : normalizedFilename.includes('questoes') ? 'Questões' : 'Material de estudo';
  return {
    path: relativePath,
    title: titleCandidates.map((candidate) => plainText(candidate, 180)).find(Boolean),
    description: plainText(metadata.description ?? '', 320),
    kind: plainText(metadata['study-type'] ?? '', 60) || inferredKind,
  };
}

function readingError(target, error) {
  return new Error(`Não foi possível ler "${target}": ${error.message}`, { cause: error });
}

async function collectMaterials(directory, relativeDirectory = '') {
  const items = [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    throw readingError(directory, error);
  }
  for (const entry of entries) {
    if (entry.isSymbolicLink() || entry.name.startsWith('.')) continue;
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      items.push(...await collectMaterials(absolutePath, relativePath));
    } else if (entry.isFile() && /\.html?$/i.test(entry.name) && !/^index\.html?$/i.test(entry.name)) {
      let html;
      try {
        html = await readFile(absolutePath, 'utf8');
      } catch (error) {
        throw readingError(absolutePath, error);
      }
      items.push(readMetadata(html, relativePath));
    }
  }
  return items;
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

/** Rebuild the catalog from the five subject directories, without cached file listings. */
export async function collectSubjects(root) {
  const subjects = [];
  for (const subject of SUBJECTS) {
    const directory = path.join(root, subject.slug);
    let info;
    try {
      info = await lstat(directory);
    } catch (error) {
      if (error.code !== 'ENOENT') throw readingError(directory, error);
    }
    const materials = info && !info.isSymbolicLink() ? await collectMaterials(directory) : [];
    materials.sort((a, b) => collator.compare(a.title, b.title)
      || collator.compare(a.path, b.path) || (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
    subjects.push({ ...subject, materials });
  }
  return subjects;
}
