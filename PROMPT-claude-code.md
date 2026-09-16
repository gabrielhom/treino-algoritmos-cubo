# Treino de algoritmos de cubo mágico — porte para projeto Vercel

Você está transformando um protótipo em um app de produção. O protótipo é `treino-f2l.html`, um arquivo único (HTML + CSS + JS inline) que já funciona. Leia ele por inteiro antes de escrever qualquer código: ele é a fonte da verdade para o motor de cubo, os dados dos 41 casos de F2L, o comportamento do treino e o visual. Não reescreva o que já funciona; extraia, organize e estenda.

Também existe `validate_algs.py`, um simulador de facelets em Python que gera as tabelas de permutação embutidas no HTML e valida se um algoritmo é um algoritmo de F2L válido (só mexe no par e na camada de cima). Use ele como referência para gerar e validar novos conjuntos de algoritmos.

## O que já existe no protótipo (preservar)

- Motor de cubo por facelets: 54 adesivos, tabelas de permutação para R L U D F B M E S x y z r l u d f b, aplicação de sequências, inversão, espelhamento (slot direito → esquerdo), identificação de peça por posição.
- 41 casos de F2L com algoritmo principal (sem rotações) e alternativas validadas, agrupados em 9 grupos.
- Scramble = inverso do algoritmo, com AUF (U/U2/U') aleatório opcional no fim.
- Diagrama SVG: vista de cima com tiras laterais + painel frente/direita (ou esquerda/frente). Peças da camada de cima que não fazem parte do caso ficam cinza.
- Treino: sortear caso, cronometrar reconhecimento até "Mostrar solução", avaliar Fácil/Ok/Difícil, peso por caso (repetição espaçada simples).
- Ajustes: grupos ativos, slot (direita/esquerda/ambos), AUF aleatório, ocultar número do caso.
- Tema claro/escuro por tokens CSS, layout mobile-first, atalhos de teclado (espaço, 1, 2, 3).
- Textos em português do Brasil, tom direto, sem jargão desnecessário.

## Objetivo

1. Projeto deployável na Vercel com um `git push`.
2. Acompanhamento de progresso de verdade, com histórico e sincronização entre celular e PC.
3. Arquitetura pronta para outros conjuntos de algoritmos (OLL, PLL, e futuros), sem duplicar o motor nem o treino.

## Stack

- Vite + TypeScript + React (componentes pequenos, sem UI kit). Se preferir manter vanilla, justifique; React só pelo estado do dashboard.
- Sem framework de CSS: portar os tokens e classes do protótipo para CSS modules ou um único arquivo global. Manter o visual atual.
- Supabase para auth (magic link por e-mail) e banco (Postgres). Modo offline-first: tudo funciona sem login usando IndexedDB (ou localStorage como fallback); ao logar, sincroniza.
- Vercel: `vercel.json` mínimo, variáveis de ambiente para Supabase, `README.md` com passo a passo de deploy.
- Testes: Vitest para o motor de cubo e para cada conjunto de algoritmos (ver "Validação").

## Arquitetura de conjuntos de algoritmos

Cada conjunto é um módulo em `src/sets/<nome>/` que exporta um objeto tipado:

```ts
interface AlgSet {
  id: string;                 // 'f2l', 'oll', 'pll'
  name: string;
  groups: string[];
  cases: Array<{ id: string | number; group: number; alg: string; alts: string[]; }>;
  view: 'f2l' | 'll';         // qual diagrama usar
  mirrorable: boolean;        // F2L sim (slot esquerdo); OLL/PLL não
  aufBefore: boolean;         // OLL/PLL: AUF antes também (o caso aparece girado)
  relevantStickers(state, opts): Set<number>; // quais adesivos colorir; o resto da camada de cima fica cinza
  isSolved(state): boolean;   // critério de "resolvido" para validação do conjunto
}
```

- `f2l`: portar do protótipo tal qual.
- `oll`: 57 casos. Diagrama = vista de cima com tiras. Colorir só os adesivos amarelos (orientação); o resto cinza. `isSolved` = todos os adesivos de U amarelos.
- `pll`: 21 casos. Diagrama = vista de cima com tiras, cores reais das tiras. Mostrar setas é opcional; se fizer, faça bem ou não faça. `isSolved` = camada de cima resolvida a menos de AUF.
- Fontes de algoritmos: usar os padrões mais comuns da comunidade (J Perm / speedcubedb). Nunca inventar algoritmo. Todo algoritmo passa pela validação abaixo antes de entrar no conjunto.

O treino, o sorteio, o peso, o cronômetro e o diagrama são genéricos e recebem um `AlgSet`. Nada específico de F2L pode ficar fora de `src/sets/f2l/`.

## Validação (obrigatória, em teste automatizado)

Para cada caso de cada conjunto:
- aplicar o inverso do algoritmo ao cubo montado gera um estado onde `isSolved` é falso e tudo fora do escopo do conjunto está intacto (F2L: cruz e outros 3 slots; OLL/PLL: as duas primeiras camadas inteiras);
- aplicar o algoritmo em seguida devolve um estado onde `isSolved` é verdadeiro;
- cada alternativa também resolve o mesmo caso;
- não existem dois casos com o mesmo estado a menos de AUF (e de espelho, quando `mirrorable`).

Se um algoritmo falhar, o teste quebra e o caso não entra. Sem exceções.

## Progresso

Modelo de dados (local e no Supabase, mesmo formato):

- `attempts`: id, user_id (nulo offline), set_id, case_id, mirrored, auf, recognition_ms, rating ('easy' | 'ok' | 'hard'), created_at.
- `case_state`: set_id, case_id, weight, seen_count, last_seen_at (derivável de attempts; manter como cache).
- `sessions`: agrupamento de attempts por janela de tempo (gap maior que 10 min fecha a sessão). Pode ser derivado, não precisa persistir.

Tela "Progresso":
- por conjunto: casos vistos / total, tempo médio de reconhecimento, tendência dos últimos 7 e 30 dias;
- por caso: tabela ordenável (peso, tempo médio, tentativas, último rating) com botão "treinar";
- gráfico simples de tempo médio por sessão (SVG próprio ou lib leve; sem Chart.js pesado se der para evitar);
- lista dos 5 casos que mais estão pesando agora, com atalho para treinar só eles.

Sincronização: fila local de attempts não enviados; ao logar ou reconectar, envia em lote e baixa o que falta. Conflito não existe (attempts são append-only); `case_state` é recalculado a partir de attempts.

## Ordem de trabalho

Trabalhe em fases e faça commit no fim de cada uma. Não avance para a próxima sem a anterior rodando.

1. Scaffold Vite + TS + React, CSS portado, motor de cubo em `src/engine/` com testes. Rodar `npm run dev` e ver a página vazia com tema.
2. Conjunto `f2l` portado + treino genérico funcionando exatamente como o protótipo (paridade de funcionalidade). Testes de validação passando.
3. Progresso local (IndexedDB) + tela Progresso.
4. Supabase: auth, tabelas, RLS por usuário, sync. README com o SQL das tabelas e as env vars.
5. Conjuntos `oll` e `pll` com validação. Seletor de conjunto na interface.
6. PWA (manifest + service worker simples) e deploy na Vercel.

## Regras

- Não quebre a paridade com o protótipo na fase 2. Compare lado a lado.
- Não adicione dependências sem justificar em uma linha no commit.
- Nomes de arquivos e código em inglês; textos da interface em português do Brasil.
- Cada fase termina com `npm run test` e `npm run build` passando.
- Se algo no protótipo parecer errado, pergunte antes de "corrigir". Especialmente algoritmos e permutações: eles foram validados por simulação.
