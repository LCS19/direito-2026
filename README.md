# Direito 2026

Biblioteca pessoal de estudos com uma página inicial, cinco disciplinas e listas de materiais atualizadas automaticamente.

**[Acessar o site](https://lcs19.github.io/direito-2026/)** · **[Acompanhar publicações](https://github.com/LCS19/direito-2026/actions)**

## Adicionar um material pelo GitHub

1. Abra a pasta da disciplina no repositório.
2. Clique em **Add file → Upload files**.
3. Envie o arquivo `.html` ou `.htm`. Se o material depende de imagens, CSS ou JavaScript locais, envie também esses arquivos, mantendo seus caminhos relativos.
4. Clique em **Commit changes** para salvar na branch principal (`main`).
5. Aguarde a execução **Publicar Direito 2026** terminar na aba **Actions**. O material aparecerá na disciplina e a contagem da página inicial será atualizada.

Não é preciso editar listas, instalar programas nem cadastrar cada material manualmente. Renomear e remover HTML também atualiza o catálogo na próxima publicação. Subpastas são aceitas.

| Disciplina | Pasta |
| --- | --- |
| Direito Constitucional | `direito-constitucional/` |
| Direito Empresarial | `direito-empresarial/` |
| Direito Civil | `direito-civil/` |
| Direito Processual Civil | `direito-processual-civil/` |
| Direito Penal | `direito-penal/` |

Use nomes como `controle-de-constitucionalidade.html`. Acentos e espaços são aceitos, mas nomes curtos com hífens facilitam compartilhar endereços. Não use `index.html` ou `index.htm` para um material: esses nomes são reservados e ignorados no catálogo. O `index.html` da raiz e de cada disciplina é recriado pelo gerador.

## Como aparecem o título e a descrição

O título vem do `<title>` no `<head>` do material. Na ausência dele, o gerador usa o primeiro `<h1>` ou o nome do arquivo. Você pode definir informações específicas para o catálogo no `<head>`:

```html
<title>Controle de constitucionalidade</title>
<meta name="description" content="Revisão de controle difuso e concentrado, com questões comentadas.">
<meta name="study-type" content="Resumo">
<meta name="study-title" content="Controle de constitucionalidade — revisão">
```

Todos os metadados são opcionais. `study-title` tem prioridade sobre `<title>`. Os materiais são ordenados por título. O conteúdo dos arquivos de estudo é copiado sem alteração.

## Publicação inicial e configuração

O repositório deve ser público para uso com GitHub Free. Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**. O workflow em `.github/workflows/pages.yml` testa e gera o acervo, depois publica `_site/` usando as ações oficiais do Pages.

O workflow roda em envios a `main` ou `master`, publica apenas a branch padrão e também permite execução manual: **Actions → Publicar Direito 2026 → Run workflow**. Pull requests executam os testes e a geração, sem publicação.

Os índices visíveis nos arquivos do repositório são cópias geradas. A cada publicação, os índices do **site** são recriados com os materiais atuais; o workflow não faz commits para atualizar as cópias do repositório. Para regenerá-las localmente, execute `npm run build`.

Referência: [publicação automática com GitHub Pages](https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically).

## Usar no computador

Os índices já fornecidos podem ser abertos diretamente pelo `index.html` principal. Após adicionar arquivos localmente, é necessário gerar os índices novamente. Instale Node.js 22 ou mais recente e execute na pasta do projeto:

```sh
npm test
npm run build
npm run preview
```

Abra **http://127.0.0.1:4173/direito-2026/**. A prévia usa a mesma subpasta do site publicado. Encerre o servidor com `Ctrl+C`. Não há dependências a instalar com `npm install`.

## Estrutura

```text
index.html                  Página inicial gerada
direito-*/                  Materiais e índice gerado da disciplina
assets/                     Estilos e ícone da biblioteca
scripts/catalog.mjs         Descoberta e metadados dos materiais
scripts/render.mjs          Estrutura visual das páginas
scripts/build.mjs           Geração dos índices e cópia dos materiais
scripts/preview.mjs         Servidor de prévia local
tests/                      Testes da descoberta e da publicação
.github/workflows/pages.yml Publicação automática
_site/                      Saída gerada, ignorada pelo Git
```

Para alterar o visual, edite `assets/estilos.css`. Para alterar a estrutura das páginas, edite `scripts/render.mjs`. As disciplinas são definidas em `scripts/catalog.mjs`.

## Progresso dos simulados

As respostas e anotações dos materiais que usam armazenamento local ficam no navegador e não são sincronizadas entre dispositivos. No simulado que oferece **Exportar progresso** e **Importar progresso**, use essas opções para transferir seus dados do arquivo local para o site ou entre navegadores.

O site é público. As pastas das disciplinas e `assets/` são copiadas para a publicação, exceto arquivos ocultos e links simbólicos. Guarde nessas pastas apenas materiais e recursos destinados ao site. Os estudos mantêm suas dependências originais: fontes e links externos podem precisar de internet.
