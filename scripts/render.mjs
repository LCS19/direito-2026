export const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const urlPath = value => value.split('/').map(encodeURIComponent).join('/');
const countLabel = n => `${n} ${n === 1 ? 'material' : 'materiais'}`;
const arrow = '<span class="arrow" aria-hidden="true">↗</span>';

function shell({ subjects, active, title, description, body }) {
  const prefix = active ? '../' : './';
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHTML(description)}">
  <meta name="theme-color" content="#172c46">
  <title>${escapeHTML(title)} · Direito 2026</title>
  <link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="${prefix}assets/estilos.css">
</head>
<body>
  <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
  <aside class="sidebar">
    <a class="brand" href="${prefix}index.html" aria-label="Direito 2026 — início"><span class="brand-mark" aria-hidden="true">§</span><span>Direito <strong>2026</strong></span></a>
    <nav aria-label="Navegação principal">
      <a class="nav-home ${!active ? 'is-current' : ''}" href="${prefix}index.html" ${!active ? 'aria-current="page"' : ''}><span aria-hidden="true">⌂</span> Visão geral</a>
      <p class="nav-label">Disciplinas</p>
      <ul class="nav-subjects">${subjects.map(s => `
        <li><a class="nav-link ${s.slug === active ? 'is-current' : ''}" href="${prefix}${s.slug}/index.html" ${s.slug === active ? 'aria-current="page"' : ''}><span class="subject-dot ${s.slug}" aria-hidden="true"></span><span>${escapeHTML(s.shortName || s.name.replace('Direito ', ''))}</span><span class="nav-count" aria-label="${countLabel(s.materials.length)}">${s.materials.length}</span></a></li>`).join('')}
      </ul>
    </nav>
    <div class="sidebar-foot"><span class="small-caps">Acervo pessoal</span><p>Um lugar para seus<br>materiais de estudo.</p></div>
  </aside>
  <div class="workspace">
    <header class="topbar"><span>Biblioteca de estudos</span><span class="year-label">ANO LETIVO <strong>2026</strong></span></header>
    <main id="conteudo" tabindex="-1">${body}</main>
    <footer class="footer"><span>Direito 2026</span><span>Seu acervo, por disciplina.</span></footer>
  </div>
</body>
</html>
`;
}

export function renderHome(subjects) {
  const total = subjects.reduce((sum, s) => sum + s.materials.length, 0);
  return shell({ subjects, title: 'Biblioteca de estudos', description: 'Materiais de estudo em Direito, organizados por disciplina.', body: `
      <section class="page-intro">
        <p class="eyebrow">Seu acervo</p>
        <h1>Vamos estudar?</h1>
        <p class="intro-copy">Escolha uma disciplina e encontre seus materiais.</p>
        <p class="collection-count">${subjects.length} disciplinas <span aria-hidden="true">/</span> ${countLabel(total)} no acervo</p>
      </section>
      <section aria-labelledby="disciplinas-title">
        <div class="section-heading"><h2 id="disciplinas-title">Disciplinas</h2><span>Explore o acervo</span></div>
        <div class="subject-grid">${subjects.map(s => `
          <a class="subject-card ${s.slug}" href="${s.slug}/index.html">
            <div class="folder-tab" aria-hidden="true"></div>
            <div class="card-top"><span class="card-kicker">Direito</span>${arrow}</div>
            <h3>${escapeHTML(s.shortName || s.name.replace('Direito ', ''))}</h3>
            <p>${escapeHTML(s.description)}</p>
            <div class="card-bottom"><span class="count-badge ${s.materials.length ? 'has-materials' : ''}">${countLabel(s.materials.length)}</span><span>${s.materials.length ? 'Acessar disciplina' : 'Ver disciplina'}</span></div>
          </a>`).join('')}
        </div>
      </section>
      <section class="acervo-note"><span class="note-symbol" aria-hidden="true">§</span><div><h2>O estudo continua por aqui.</h2><p>Resumos, questões e simulados reunidos nas suas disciplinas.</p></div></section>` });
}

export function renderSubject(subjects, subject) {
  return shell({ subjects, active: subject.slug, title: subject.name, description: subject.description, body: `
      <nav class="breadcrumbs" aria-label="Localização"><a href="../index.html">Início</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHTML(subject.name)}</span></nav>
      <section class="page-intro subject-intro ${subject.slug}">
        <p class="eyebrow">Disciplina</p><h1>${escapeHTML(subject.name)}</h1>
        <p class="intro-copy">${escapeHTML(subject.description)}</p>
        <p class="collection-count">${countLabel(subject.materials.length)} no acervo</p>
      </section>
      <section aria-labelledby="materiais-title"><div class="section-heading"><h2 id="materiais-title">Materiais de estudo</h2><span>${subject.materials.length ? 'Organizados por título' : 'Acervo em construção'}</span></div>
      ${subject.materials.length ? `<div class="material-list">${subject.materials.map(m => `
        <a class="material-card ${subject.slug}" href="${urlPath(m.path)}">
          <span class="document-icon" aria-hidden="true"><span></span><span></span><span></span></span>
          <div class="material-copy"><span class="material-type">${escapeHTML(m.kind)}</span><h3>${escapeHTML(m.title)}</h3>${m.description ? `<p>${escapeHTML(m.description)}</p>` : ''}</div>
          <span class="material-open">Abrir material ${arrow}</span>
        </a>`).join('')}</div>` : `<div class="empty-state"><span class="empty-symbol" aria-hidden="true">§</span><h3>Nenhum material disponível ainda</h3><p>Os próximos materiais desta disciplina aparecerão aqui.</p><a class="back-button" href="../index.html">Explorar outras disciplinas <span aria-hidden="true">→</span></a></div>`}
      </section>` });
}
