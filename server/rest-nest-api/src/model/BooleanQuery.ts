import { QueryGraphResult } from './fix/QueryGraphResult';
import { TripleInstance } from './fix/TripleInstance';
import { Formula } from './Formula';
import { Ontology } from './ontology/Ontology';
import { SingleResult } from './SingleResult';
import { Triple } from './Triple';

export class BooleanQuery {
  constructor(id: string) {
    this.id = id;
    this.and = [];
    this.constraints = [];
  }
  id: string;

  and: (Triple | Formula)[];

  // TODO: later
  constraints: Triple[];

  generateQueryGraphResult = (
    singleResult: SingleResult,
    ontology: Ontology,
    id?: number,
  ): QueryGraphResult => {
    const queryGraphResult = new QueryGraphResult(this, id);
    const tripleInstances: TripleInstance[] = [];
    this.and.forEach((element) => {
      if (element instanceof Triple) {
        tripleInstances.push(
          element.generateTripleInstance(singleResult, ontology),
        );
      } else {
        tripleInstances.push(
          ...element.generateTripleInsances(singleResult, ontology),
        );
      }
    });
    queryGraphResult.triplesInstances = tripleInstances;
    return queryGraphResult;
  };
}
