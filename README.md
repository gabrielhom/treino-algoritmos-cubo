# Treino de algoritmos de cubo mágico

Treino de reconhecimento de casos de F2L (41), OLL (57) e PLL (21): o app mostra um caso em 3D, você monta no cubo, resolve, confere a solução (com animação, se quiser) e avalia. A aba "Como usar" tem cada movimento da notação animado. Casos difíceis voltam mais vezes. Funciona sem login, neste navegador; com login por e-mail, o progresso sincroniza entre celular e PC. É um PWA: dá para instalar na tela inicial do celular e usar offline.

## Rodar local

```bash
npm install
npm run dev      # http://localhost:5173
npm run test     # motor de cubo, validação dos conjuntos, progresso, sync, interface
npm run build    # tsc + vite build em dist/
```

Sem variáveis de ambiente o app roda em modo offline: tudo fica em IndexedDB no navegador.

## Estrutura

| Pasta | O que tem |
|---|---|
| `src/engine/` | motor de cubo por facelets (54 adesivos, tabelas de permutação, inversão, espelho) |
| `src/sets/` | conjuntos de algoritmos: `f2l/`, `oll/`, `pll/`. Cada um exporta um `AlgSet`; `validate.ts` é a validação comum, `ll.ts` tem helpers de última camada |
| `src/trainer/` | sorteio ponderado, construção do caso, hook do treino |
| `src/diagram/` | cubo 3D em SVG (`cube3d.ts`: 26 cubies, câmera ortográfica, animação de giro de camada) e vista de cima com tiras |
| `src/progress/` | modelo de tentativas, IndexedDB, estatísticas |
| `src/sync/` | cliente Supabase, sincronização, auth |
| `src/ui/` | telas |

Nada específico de F2L fica fora de `src/sets/f2l/`. Para adicionar um conjunto, crie a pasta, exporte um `AlgSet`, registre em `src/sets/index.ts` e escreva um teste que chame `validateSet`. Algoritmo que não passa não entra.

## Supabase (sync entre aparelhos)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, rode o conteúdo de [`supabase.sql`](./supabase.sql). Ele cria a tabela `attempts` com RLS: cada usuário só lê e insere as próprias linhas. Não há update nem delete: tentativas são append-only e o estado por caso (`case_state`) é recalculado no cliente a partir delas.
3. Em **Authentication → Providers**, deixe **Email** ligado. O app usa magic link (sem senha).
4. Em **Authentication → URL Configuration**, coloque a URL do deploy em *Site URL* e adicione `http://localhost:5173` e a URL da Vercel em *Redirect URLs*.
5. Em **Project Settings → API**, copie *Project URL* e *anon public key*.

Variáveis de ambiente (veja `.env.example`):

| Nome | Valor |
|---|---|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon public key |

Local: crie um `.env.local` com as duas. Na Vercel: **Settings → Environment Variables**.

### Como a sincronização funciona

- Toda tentativa é gravada primeiro em IndexedDB, com `synced: false`.
- Ao logar, ao voltar a ficar online e depois de cada tentativa, o app envia as pendentes em lote (upsert por `id`, duplicata ignorada) e baixa o que o servidor recebeu depois do último cursor.
- O cursor é `synced_at`, carimbado pelo servidor, e não `created_at`: um aparelho que ficou offline e enviou depois não fica invisível para o outro.
- Não existe conflito: tentativas nunca mudam. Pesos e médias são derivados delas.

## Deploy na Vercel

1. Suba o repositório no GitHub.
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório. A Vercel detecta Vite: build `npm run build`, saída `dist`.
3. Adicione as duas variáveis de ambiente acima (se quiser sync).
4. Deploy. Cada `git push` na branch principal gera um novo deploy.

O `vercel.json` redireciona rotas para `index.html` (SPA), impede cache do `sw.js` e marca os assets com hash como imutáveis.

### PWA

`public/manifest.webmanifest` e `public/sw.js` são servidos como estão. O service worker guarda a casca do app e os assets com hash; navegações tentam a rede primeiro e caem no cache offline. Chamadas ao Supabase nunca são cacheadas. Ao publicar uma versão nova, o `sw.js` é buscado sem cache e troca o cache antigo na ativação.

Ícones em `public/` foram gerados por script (quadrado 3×3 nas cores do cubo); troque à vontade.

## Convenções

- Código e nomes de arquivo em inglês; textos da interface em português do Brasil.
- Algoritmos vêm de fontes comuns da comunidade (J Perm, SpeedCubeDB). Todo caso passa por `validateSet` em teste: o scramble não pode resolver o caso nem mexer fora do escopo, o algoritmo e cada alternativa têm que resolver, e não pode haver dois casos iguais a menos de AUF.
- `validate_algs.py` é o simulador original em Python que gerou as tabelas de permutação; serve de referência cruzada.
