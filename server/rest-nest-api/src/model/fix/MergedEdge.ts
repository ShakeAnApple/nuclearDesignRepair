import { EdgeInstance } from './EdgeInstance';
import { QueryGraphResult } from './QueryGraphResult';
import { TripleInstance } from './TripleInstance';

export class MergedEdge {
  constructor(edge: EdgeInstance) {
    this.edge = edge;
    this.belongsToQueryGraphResults = [];
    this.belongsToTripleInstances = [];
  }
  belongsToTripleInstances: TripleInstance[];
  belongsToQueryGraphResults: QueryGraphResult[];
  edge: EdgeInstance;
}
