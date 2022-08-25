import { Edge } from './ontology/Edge';
import { Triple } from './Triple';

export class SparqlQuery {
  queryString: string;
  nodes: Node[];
  edges: Edge[];
}
