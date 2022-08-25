import { TripleInstance } from './fix/TripleInstance';
import { Ontology } from './ontology/Ontology';
import { SingleResult } from './SingleResult';
import { Triple } from './Triple';

export class Formula {
  left: Triple | Formula;
  right: Triple | Formula;
  op: Operation;

  generateTripleInsances = (
    singleResult: SingleResult,
    ontology: Ontology,
  ): TripleInstance[] => {
    const tripleInstances: TripleInstance[] = [];
    this.traverseFormula(this, singleResult, ontology, tripleInstances);
    return tripleInstances;
  };

  private traverseFormula = (
    currentFormula: Formula,
    singleResult: SingleResult,
    ontology: Ontology,
    tripleInstances: TripleInstance[],
  ) => {
    if (currentFormula.left instanceof Triple) {
      tripleInstances.push(
        currentFormula.left.generateTripleInstance(singleResult, ontology),
      );
    } else {
      this.traverseFormula(
        currentFormula.left,
        singleResult,
        ontology,
        tripleInstances,
      );
    }
    if (currentFormula.right instanceof Triple) {
      tripleInstances.push(
        currentFormula.right.generateTripleInstance(singleResult, ontology),
      );
    } else {
      this.traverseFormula(
        currentFormula.right,
        singleResult,
        ontology,
        tripleInstances,
      );
    }
  };
}

export enum Operation {
  And,
  Or,
}
