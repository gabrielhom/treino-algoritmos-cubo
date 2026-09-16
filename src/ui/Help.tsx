import type { AlgSet } from '../sets/types';
import { Moves } from './Moves';

export function Help({ set }: { set: AlgSet }) {
  return (
    <section>
      <Moves />
      <div className="card help">
        <h2>O ciclo</h2>
        <ol>
          {set.help.steps.map((s, i) => <li key={i} dangerouslySetInnerHTML={{ __html: s }} />)}
        </ol>
        <p className="note">{set.help.note}</p>
      </div>
      <div className="card help">
        <h2>Lendo o desenho</h2>
        {set.help.reading.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      <div className="card help">
        <h2>Notação</h2>
        <p><b>R</b> direita, <b>L</b> esquerda, <b>U</b> cima, <b>D</b> baixo, <b>F</b> frente, <b>B</b> trás. Sem sinal: 90° horário olhando a face. <b>'</b>: anti-horário. <b>2</b>: 180°.</p>
        <p><b>M</b>, <b>E</b>, <b>S</b>: camadas do meio (seguem L, D e F). Letra minúscula (<b>r</b>, <b>l</b>, <b>f</b>...): duas camadas juntas. <b>x</b>, <b>y</b>, <b>z</b>: gira o cubo inteiro como R, U e F.</p>
      </div>
    </section>
  );
}
