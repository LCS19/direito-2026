# Direito 2026 — projeto aprovado

Biblioteca pública de estudos em HTML, hospedada no GitHub Pages, com atualização automática. O nome do repositório será `direito-2026` e o título do site será **Direito 2026**.

## Estrutura e navegação

- Página inicial com links para Direito Constitucional, Empresarial, Civil, Processual Civil e Penal.
- Uma pasta e um `index.html` por disciplina. Disciplinas vazias continuam acessíveis.
- Os três materiais existentes ficam em Direito Constitucional, sem alteração do conteúdo.
- Interface responsiva com navegação por teclado e links relativos, compatível com a subpasta do GitHub Pages.
- Tipografia de títulos em Palatino/Georgia, texto em Segoe UI/Arial; fundo azul acinzentado, superfícies brancas, tinta azul escura e cores distintas nas abas das disciplinas.

## Atualização

Um gerador Node.js sem dependências encontra HTML e HTM nas pastas, lê títulos e descrições e gera os seis índices. Um workflow do GitHub Actions executa os testes e o gerador a cada envio à branch principal e publica somente `_site/`. Não consulta a API do GitHub no navegador.

Os índices na árvore de arquivos são cópias geradas para abrir localmente. O workflow regenera os índices publicados sem criar commits automáticos. Assets associados aos materiais acompanham suas pastas.

## Validação e entrega

Testes de descoberta, inclusão/remoção de material, preservação dos arquivos e links relativos; inspeção visual em computador e celular. README com publicação, uso e manutenção. A criação remota depende de uma sessão autenticada no GitHub.
