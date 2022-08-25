import { NodeType } from '../ontology/Node';
import { NodeInstance } from './NodeInstance';
import { QueryGraphResult } from './QueryGraphResult';
import { TripleInstance } from './TripleInstance';

export class MergedNode {
  constructor(node: NodeInstance) {
    this.node = node;
    this.nodeType = this.node.nodeType;
    this.belongsToQueryGraphResults = [];
    this.belongsToTripleInstances = [];
  }
  belongsToTripleInstances: TripleInstance[];
  belongsToQueryGraphResults: QueryGraphResult[];
  node: NodeInstance;
  nodeType: NodeType;

  belongsToNegatedTriple = (): boolean => {
    return this.belongsToTripleInstances.some(
      (triple) => triple.originalTriple.isNegated,
    );
  };
}
