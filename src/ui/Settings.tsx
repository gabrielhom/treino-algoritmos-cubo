import type { AlgSet } from '../sets/types';
import type { SetSettings, Slot } from '../trainer/trainer';

function groupRange(set: AlgSet, g: number): string {
  const ids = set.cases.filter((c) => c.group === g).map((c) => c.id);
  const nums = ids.map(Number);
  const contiguous = nums.every((n, i) => !Number.isNaN(n) && (i === 0 || n === nums[i - 1] + 1));
  return contiguous && ids.length > 1 ? `${ids[0]}–${ids[ids.length - 1]}` : `${ids.length}`;
}

export function Settings({ set, settings, onChange, onReset }: {
  set: AlgSet;
  settings: SetSettings;
  onChange: (s: SetSettings) => void;
  onReset: () => void;
}) {
  const toggleGroup = (g: number) => {
    const gs = settings.groups;
    onChange({ ...settings, groups: gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g].sort((a, b) => a - b) });
  };
  return (
    <section>
      <div className="card">
        <h2>Grupos no sorteio</h2>
        <div className="chips">
          {set.groups.map((name, i) => (
            <button key={i} className={`chip${settings.groups.includes(i) ? ' on' : ''}`} onClick={() => toggleGroup(i)}>
              {name} <span className="mini">{groupRange(set, i)}</span>
            </button>
          ))}
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <span className="mini">Comece com 1 ou 2 grupos. Adicione quando estiverem automáticos.</span>
          <span>
            <button className="chip" onClick={() => onChange({ ...settings, groups: set.groups.map((_, i) => i) })}>todos</button>{' '}
            <button className="chip" onClick={() => onChange({ ...settings, groups: [] })}>nenhum</button>
          </span>
        </div>
      </div>
      <div className="card">
        <h2>Como o caso aparece</h2>
        {set.mirrorable && (
          <div className="row">
            <div><div className="t">Slot</div><div className="d">Onde o par vai ser inserido</div></div>
            <div className="seg">
              {(['R', 'L', 'X'] as Slot[]).map((v) => (
                <button key={v} className={settings.slot === v ? 'on' : ''} onClick={() => onChange({ ...settings, slot: v })}>
                  {v === 'R' ? 'direita' : v === 'L' ? 'esquerda' : 'ambos'}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="row">
          <div><div className="t">Giro aleatório da camada de cima</div><div className="d">Treina reconhecer o caso de qualquer ângulo</div></div>
          <button className={`switch${settings.auf ? ' on' : ''}`} role="switch" aria-checked={settings.auf} aria-label="Giro aleatório"
            onClick={() => onChange({ ...settings, auf: !settings.auf })} />
        </div>
        <div className="row">
          <div><div className="t">Mostrar número do caso</div><div className="d">Desligue para não reconhecer pelo número</div></div>
          <button className={`switch${settings.showNumber ? ' on' : ''}`} role="switch" aria-checked={settings.showNumber} aria-label="Mostrar número"
            onClick={() => onChange({ ...settings, showNumber: !settings.showNumber })} />
        </div>
      </div>
      <div className="card">
        <h2>Dados</h2>
        <div className="row">
          <div><div className="t">Zerar progresso</div><div className="d">Apaga pesos e tempos deste navegador</div></div>
          <button className="chip" onClick={onReset}>zerar</button>
        </div>
      </div>
    </section>
  );
}
