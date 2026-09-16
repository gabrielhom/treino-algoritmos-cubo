// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { apply, SOLVED } from '../engine/cube';
import { usePlayer } from './usePlayer';

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean; }
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

type Player = ReturnType<typeof usePlayer>;
function mount() {
  let latest!: Player;
  function Probe() { latest = usePlayer(SOLVED); return null; }
  const host = document.createElement('div');
  const root = createRoot(host);
  act(() => root.render(<Probe />));
  return { get: () => latest, unmount: () => act(() => root.unmount()) };
}
const wait = (ms: number) => act(() => new Promise<void>((r) => setTimeout(r, ms)));

describe('usePlayer', () => {
  it('plays a queue of moves to the end', async () => {
    const p = mount();
    act(() => p.get().play(['R', 'U', "F'"]));
    expect(p.get().playing).toBe(true);
    await wait(1800);
    expect(p.get().playing).toBe(false);
    expect(p.get().anim).toBeNull();
    expect(p.get().state).toEqual(apply(SOLVED, ['R', 'U', "F'"]));
    p.unmount();
  });

  it('can be played again after the queue has emptied', async () => {
    const p = mount();
    act(() => p.get().play(['R']));
    await wait(700);
    expect(p.get().state).toEqual(apply(SOLVED, ['R']));
    act(() => p.get().play(['U']));
    expect(p.get().playing).toBe(true);
    await wait(700);
    expect(p.get().state).toEqual(apply(SOLVED, ['R', 'U']));
    p.unmount();
  });

  it('reset stops the animation and restores a state', async () => {
    const p = mount();
    act(() => p.get().play(['R', 'U', 'F', 'D']));
    await wait(200);
    act(() => p.get().reset(SOLVED));
    expect(p.get().playing).toBe(false);
    await wait(600);
    expect(p.get().state).toEqual(SOLVED);
    p.unmount();
  });
});
