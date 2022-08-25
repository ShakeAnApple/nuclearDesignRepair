import { Fix } from './Fix';
import { MergedEdge } from './MergedEdge';
import { MergedNode } from './MergedNode';
import { QueryGraphResult } from './QueryGraphResult';

export class QueryGraphsIntersection {
  constructor(
    nodes: MergedNode[],
    edges: MergedEdge[],
    queriesIntersected: QueryGraphResult[],
  ) {
    this.nodes = nodes;
    this.edges = edges;
    this.queriesIntersected = queriesIntersected;
  }
  nodes: MergedNode[];
  edges: MergedEdge[];
  queriesIntersected: QueryGraphResult[];

  intersectWithQueries = (queries: QueryGraphResult[]): QueryGraphResult[] => {
    const queriesIds = queries.map((q) => q.id);
    return this.queriesIntersected.filter((query) =>
      queriesIds.includes(query.id),
    );
  };

  tryApplyFix = (fix: Fix): QueryGraphResult[] => {
    const queriesFixed: QueryGraphResult[] = [];
    this.queriesIntersected.forEach((query) => {
      if (query.isFixApplicable(fix)) {
        queriesFixed.push(query);
      }
    });
    return queriesFixed;
  };
}
