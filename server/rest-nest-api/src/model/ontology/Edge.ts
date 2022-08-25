import { EdgeInstance } from '../fix/EdgeInstance';
import { Node } from './Node';
import { Ontology } from './Ontology';

// if it's const and no prefix, then it's an operator
export class Edge {
  constructor(
    title: string,
    edgeType: EdgeType,
    specialSymbol: string,
    prefix: string,
  ) {
    this.edgeType = edgeType;
    this.specialSymbol = specialSymbol;
    this.title = title;
    this.prefix = prefix;
  }

  prefix: string;
  edgeType: EdgeType;
  specialSymbol: string;
  source: Node;
  target: Node;
  title: string;

  generateEdgeInstance(
    propertyName: string,
    isNegated: boolean,
    ontology: Ontology,
  ): EdgeInstance {
    return new EdgeInstance(
      ontology.findPropertyByName(propertyName),
      isNegated,
    );
  }
}

export enum EdgeType {
  Variable,
  Constant,
}
