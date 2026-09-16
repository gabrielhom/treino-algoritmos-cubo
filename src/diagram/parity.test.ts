// Parity check against the prototype: evaluates the prototype's own JS (extracted
// from treino-f2l.html) and compares its SVG output, rect by rect, with ours.
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FrontView, TopView } from './Diagram';
import { f2l } from '../sets/f2l';
import { apply, invert, mirror, parse, SOLVED } from '../engine/cube';

const html = readFileSync(new URL('../../treino-f2l.html', import.meta.url), 'utf8');
const js = html.slice(html.indexOf('<script>') + 8, html.indexOf('// ---------- storage'));
type Proto = {
  IDS: number[];
  parse(a: string): string[]; invert(m: string[]): string[]; mirror(m: string[]): string[];
  apply(s: number[], m: string[]): number[]; pairSetFor(slot: string): Set<string>;
  renderTop(s: number[], p: Set<string>): string; renderFront(s: number[], p: Set<string>, slot: string): string;
};
const proto = new Function(`${js}; return {IDS,parse,invert,mirror,apply,pairSetFor,renderTop,renderFront};`)() as Proto;

interface Rect { x: string; y: string; w: string; h: string; fill: string; sw: string }
function rects(svg: string): Rect[] {
  const out: Rect[] = [];
  for (const m of svg.matchAll(/<rect ([^>]*?)\/?>/g)) {
    const attr = (n: string) => new RegExp(`${n}="([^"]*)"`).exec(m[1])?.[1] ?? '';
    out.push({ x: attr('x'), y: attr('y'), w: attr('width'), h: attr('height'), fill: attr('fill'), sw: attr('stroke-width') });
  }
  return out.sort((a, b) => `${a.x},${a.y}`.localeCompare(`${b.x},${b.y}`));
}

describe('diagram parity with the prototype', () => {
  for (const slot of ['R', 'L'] as const) {
    it(`matches every F2L case on slot ${slot}`, () => {
      for (const c of f2l.cases) {
        // The prototype only ever mirrors main algs (no M/x), so both mirror tables agree here.
        const protoSol = slot === 'L' ? proto.mirror(proto.parse(c.alg)) : proto.parse(c.alg);
        const protoState = proto.apply(proto.IDS, proto.invert(protoSol));
        const pairSet = proto.pairSetFor(slot);
        const mirrored = slot === 'L';
        const sol = mirrored ? mirror(parse(c.alg)) : parse(c.alg);
        const state = apply(SOLVED, invert(sol));
        expect(state).toEqual(protoState);
        const relevant = f2l.relevantStickers(state, { mirrored });
        const top = renderToStaticMarkup(createElement(TopView, { state, relevant }));
        const front = renderToStaticMarkup(createElement(FrontView, { state, relevant, mirrored }));
        expect(rects(top), `top ${c.id}`).toEqual(rects(proto.renderTop(protoState, pairSet)));
        expect(rects(front), `front ${c.id}`).toEqual(rects(proto.renderFront(protoState, pairSet, slot)));
      }
    });
  }
});
