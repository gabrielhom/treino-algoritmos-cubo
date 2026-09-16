// @vitest-environment jsdom
// Smoke test of the training loop without a browser: mount, reveal, rate, tabs.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean; }
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
const $ = (sel: string) => document.querySelector(sel) as HTMLElement;
const $$ = (sel: string) => [...document.querySelectorAll(sel)] as HTMLElement[];
const byText = (text: string) => $$('button').find((b) => b.textContent === text)!;
const click = async (el: HTMLElement) => act(async () => { el.click(); });
const flush = () => act(async () => { await Promise.resolve(); });

beforeEach(async () => {
  localStorage.clear();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => { root.render(<App />); });
  await flush();
  expect($('.tab.on').textContent).toBe('Casos'); // the app opens on the case browser
  await click(byText('Treinar'));
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('App', () => {
  it('shows a case from group 0 with scramble and diagrams', () => {
    expect($('header h1').textContent).toBe('Treino');
    expect($('header .seg .on').textContent).toBe('F2L');
    expect($('header .sub').textContent).toBe('4 de 41 casos no sorteio');
    expect(Number($('.caselabel b').textContent)).toBeGreaterThanOrEqual(1);
    expect(Number($('.caselabel b').textContent)).toBeLessThanOrEqual(4);
    expect($$('.mv').length).toBeGreaterThan(0);
    expect($$('svg').length).toBe(2); // 3D + top view
    expect($$('svg rect').length).toBe(21);
    expect($$('svg polygon').length).toBeGreaterThan(27);
    expect($$('.dgl')[0].textContent).toBe('cima · frente · direita');
    expect($('.solution')).toBeNull();
  });

  it('reveals, rates and records an attempt', async () => {
    const before = $('.caselabel b').textContent;
    await click(byText('Mostrar solução'));
    expect($('.solution .alg').textContent!.length).toBeGreaterThan(0);
    expect($('.solution .meta').textContent).toMatch(/Reconhecimento: \d+\.\d s/);
    expect((byText('Mostrar solução') as HTMLButtonElement).disabled).toBe(true);
    await click(byText('Difícil'));
    await flush();
    expect($('.solution')).toBeNull();
    const stored = JSON.parse(localStorage.getItem('cube-trainer:attempts')!);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ set_id: 'f2l', case_id: before, rating: 'hard', mirrored: false });
    await click(byText('Progresso'));
    expect($('.card .row b').textContent).toBe('1 de 41');
    const row = $$('tbody tr').find((r) => r.querySelector('b')!.textContent === before)!;
    expect(row.querySelector('.sc')!.textContent).toBe('3'); // 1 + 2 after one "hard"
    expect(row.querySelectorAll('td')[2].textContent).toBe('1');
    expect(row.querySelectorAll('td')[5].textContent).toBe('Difícil');
    // heaviest list + focus mode
    expect($$('.chips .chip.on').map((c) => c.firstChild!.textContent!.trim())).toEqual([before]);
    await click(byText('treinar só esses 1'));
    expect($('header .sub').textContent).toBe('só 1 casos');
    expect($('.caselabel b').textContent).toBe(before);
    await click(byText('voltar ao sorteio normal'));
    expect($('header .sub').textContent).toBe('4 de 41 casos no sorteio');
  });

  it('progress table sorts by weight and by attempts', async () => {
    await click(byText('Progresso'));
    const ths = () => $$('th.sortable');
    await click(ths().find((t) => t.textContent!.startsWith('Peso'))!);
    expect(ths().find((t) => t.textContent!.startsWith('Peso'))!.textContent).toContain('▾');
    expect($$('tbody tr .sc').map((s) => s.textContent)).toEqual(Array(41).fill('3'));
    await click(ths().find((t) => t.textContent!.startsWith('#'))!);
    expect($$('tbody tr b').slice(0, 3).map((b) => b.textContent)).toEqual(['1', '2', '3']);
  });

  it('keyboard: space reveals then advances, 1/2/3 rate', async () => {
    const key = (k: string) => act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); });
    await key(' ');
    expect($('.solution')).not.toBeNull();
    await key('1');
    await flush();
    expect(JSON.parse(localStorage.getItem('cube-trainer:attempts')!)[0].rating).toBe('easy');
    expect($('.solution')).toBeNull();
  });

  it('settings: groups, slot and number toggle persist and affect the trainer', async () => {
    await click(byText('Ajustes'));
    await click(byText('nenhum'));
    expect($('header .sub').textContent).toBe('0 de 41 casos no sorteio');
    await click(byText('Treinar'));
    expect($('.scramble').textContent).toContain('Nenhum grupo selecionado');
    await click(byText('Ajustes'));
    await click(byText('todos'));
    await click(byText('esquerda'));
    await click($('[aria-label="Mostrar número"]'));
    await click(byText('Treinar'));
    await click(byText('Próximo'));
    expect($('.caselabel b').textContent).toBe('?');
    expect($$('.dgl')[0].textContent).toBe('cima · frente · esquerda');
    const saved = JSON.parse(localStorage.getItem('cube-trainer:settings')!);
    expect(saved.sets.f2l).toMatchObject({ slot: 'L', showNumber: false });
    expect(saved.sets.f2l.groups).toHaveLength(9);
  });

  it('switches sets from the header and keeps per-set settings', async () => {
    await click(byText('OLL'));
    expect($('header .sub').textContent).toBe('2 de 57 casos no sorteio');
    expect($$('.dgl').map((d) => d.textContent)).toEqual(['cima · frente · direita', 'visto de cima']);
    expect($$('.mv.auf').length).toBe(0);
    await click(byText('Ajustes'));
    expect(byText('esquerda')).toBeUndefined(); // no slot control for OLL
    await click($('[aria-label="Giro aleatório"]'));
    await click(byText('Treinar'));
    await click(byText('Próximo'));
    expect($$('.mv.auf').length).toBe(2); // pre and post AUF
    await click(byText('PLL'));
    expect($('header .sub').textContent).toBe('3 de 21 casos no sorteio');
    expect(['Aa', 'Ab', 'E']).toContain($('.caselabel b').textContent);
    await click(byText('F2L'));
    expect($('header .sub').textContent).toBe('4 de 41 casos no sorteio');
    expect(JSON.parse(localStorage.getItem('cube-trainer:settings')!).setId).toBe('f2l');
  });

  it('cases tab: filters, marks and focus', async () => {
    await click(byText('Casos'));
    expect($$('.casecard').length).toBe(41);
    await click(byText('no slot')); // corner in slot
    const inSlot = $$('.casecard').length;
    expect(inSlot).toBeGreaterThan(0);
    expect(inSlot).toBeLessThan(41);
    await click(byText('qualquer'));
    expect($$('.casecard').length).toBe(41);
    // mark case 1 as "aprendendo", persisted and reflected in the header
    const card1 = $$('.casecard').find((c) => c.querySelector('b')!.textContent === '1')!;
    await click([...card1.querySelectorAll('.seg button')].find((b) => b.textContent === 'aprendendo') as HTMLElement);
    expect($('.card .t').textContent).toContain('1 aprendendo');
    expect(JSON.parse(localStorage.getItem('cube-trainer:marks')!)[0]).toMatchObject({ set_id: 'f2l', case_id: '1', status: 'learning' });
    await click(byText('treinar os que estou aprendendo'));
    expect($('.caselabel b').textContent).toBe('1');
    expect($('header .sub').textContent).toBe('só 1 casos');
  });

  it('realistic scramble is longer than the plain inverse and can be turned off', async () => {
    const long = $$('.mv').length;
    await click(byText('Ajustes'));
    await click($('[aria-label="Embaralhar o resto"]'));
    await click(byText('Treinar'));
    await click(byText('Próximo'));
    expect($$('.mv').length).toBeLessThan(long);
  });

  it('"treinar" on the progress tab forces that case', async () => {
    await click(byText('Progresso'));
    const row = $$('tbody tr').find((r) => r.querySelector('b')!.textContent === '41')!;
    await click(row.querySelector('button')!);
    expect($('.caselabel b').textContent).toBe('41');
    expect($('.caselabel span:last-child').textContent).toBe('Canto e aresta no slot');
  });
});
