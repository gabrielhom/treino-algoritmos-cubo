// "Movimentos": every notation letter, animated on a cube you can keep turning.
import { useState } from 'react';
import { SOLVED } from '../engine/cube';
import { Cube3D } from '../diagram/Cube3D';
import { usePlayer } from '../diagram/usePlayer';

const NONE = new Set<number>();
const ALL = new Set([...Array(54).keys()]);

interface MoveInfo { m: string; name: string; how: string }
const FAMILIES: { title: string; note: string; moves: MoveInfo[] }[] = [
  {
    title: 'Faces',
    note: 'Sem sinal: 90° no sentido horário olhando para aquela face. Com \' (linha): anti-horário. Com 2: meia volta.',
    moves: [
      { m: 'R', name: 'direita', how: 'a face da direita sobe por trás e desce pela frente' },
      { m: 'L', name: 'esquerda', how: 'a face da esquerda desce por trás e sobe pela frente' },
      { m: 'U', name: 'cima', how: 'a camada de cima gira como um relógio visto de cima' },
      { m: 'D', name: 'baixo', how: 'a camada de baixo gira como um relógio visto de baixo' },
      { m: 'F', name: 'frente', how: 'a face da frente gira como um relógio visto de frente' },
      { m: 'B', name: 'trás', how: 'a face de trás gira como um relógio visto de trás' },
    ],
  },
  {
    title: 'Camadas do meio',
    note: 'Seguem a direção da face vizinha indicada: M como L, E como D, S como F.',
    moves: [
      { m: 'M', name: 'meio vertical', how: 'a fatia entre L e R, girando como L' },
      { m: 'E', name: 'equador', how: 'a fatia entre U e D, girando como D' },
      { m: 'S', name: 'meio frontal', how: 'a fatia entre F e B, girando como F' },
    ],
  },
  {
    title: 'Duas camadas (letra minúscula)',
    note: 'A face mais a camada do meio ao lado dela, juntas, no mesmo sentido da face.',
    moves: [
      { m: 'r', name: 'direita dupla', how: 'R mais a fatia do meio' },
      { m: 'l', name: 'esquerda dupla', how: 'L mais a fatia do meio' },
      { m: 'u', name: 'cima dupla', how: 'U mais o equador' },
      { m: 'd', name: 'baixo dupla', how: 'D mais o equador' },
      { m: 'f', name: 'frente dupla', how: 'F mais a fatia do meio' },
      { m: 'b', name: 'trás dupla', how: 'B mais a fatia do meio' },
    ],
  },
  {
    title: 'Rotações do cubo inteiro',
    note: 'Nada é resolvido: você só muda a pegada. x gira como R, y como U, z como F.',
    moves: [
      { m: 'x', name: 'como R', how: 'o cubo inteiro rola para trás' },
      { m: 'y', name: 'como U', how: 'o cubo inteiro gira para a esquerda' },
      { m: 'z', name: 'como F', how: 'o cubo inteiro tomba para a direita' },
    ],
  },
];

export function Moves() {
  const player = usePlayer(SOLVED);
  const [last, setLast] = useState<string | null>(null);
  const [mirrored, setMirrored] = useState(false);
  const play = (m: string) => { setLast(m); player.play([m]); };

  return (
    <div className="card">
      <h2>Movimentos</h2>
      <p className="mini">Toque em uma letra para ver o giro. Os movimentos se acumulam; use "montar" para voltar ao cubo resolvido.</p>
      <div className="moves-stage">
        <Cube3D state={player.state} relevant={ALL} mirrored={mirrored} anim={player.anim} size={200} label="Cubo para demonstrar movimentos" />
        <div className="moves-side">
          <div className="moves-last">{last ?? '–'}</div>
          <div className="mini">{last ? describe(last) : 'nenhum movimento ainda'}</div>
          <div className="chips" style={{ marginTop: 10 }}>
            <button className="chip" onClick={() => player.reset(SOLVED)}>montar</button>
            <button className="chip" onClick={() => setMirrored((v) => !v)}>{mirrored ? 'ver lado direito' : 'ver lado esquerdo'}</button>
          </div>
        </div>
      </div>
      {FAMILIES.map((f) => (
        <div key={f.title} className="moves-family">
          <div className="t">{f.title}</div>
          <div className="d">{f.note}</div>
          {f.moves.map((mv) => (
            <div key={mv.m} className="row">
              <div><div className="t"><b className="mono">{mv.m}</b> {mv.name}</div><div className="d">{mv.how}</div></div>
              <div className="seg">
                {['', "'", '2'].map((s) => (
                  <button key={s} className={`mono${last === mv.m + s ? ' on' : ''}`} onClick={() => play(mv.m + s)}>{mv.m + s}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function describe(move: string): string {
  const info = FAMILIES.flatMap((f) => f.moves).find((m) => m.m === move[0]);
  const s = move.slice(1);
  const dir = s === "'" ? 'anti-horário (o caminho contrário)' : s === '2' ? 'meia volta (180°)' : 'horário, 90°';
  return info ? `${info.name}: ${info.how}. ${dir}.` : dir;
}

export { NONE };
