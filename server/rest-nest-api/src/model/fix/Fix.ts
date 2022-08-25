import { Change } from './Change';
import { QueryGraphResult } from './QueryGraphResult';
import { QueryGraphsIntersection } from './QueryGraphsIntersection';

export class Fix {
  constructor(fixName: string, changes: Change[]) {
    this.changes = changes;
    this.forQueries = [];
    this.fixName = fixName;
  }

  fixName: string;
  changes: Change[];
  forQueries: QueryGraphResult[];
  forIntersection: QueryGraphsIntersection;

  toString = (): string => {
    const header =
      '\r\n\nFix for intersection: \r\n' +
      '\t nodes: [' +
      this.forIntersection.nodes.map((node) => node.node.id).join(', ') +
      '] \r\n' +
      '\t edges: [' +
      this.forIntersection.edges.map((edge) => edge.edge.getId()).join(', ') +
      '] \r\n' +
      'Queries intersected: ' +
      this.forQueries.length +
      '\r\n' +
      'Queries ids: ' +
      this.forQueries.map((q) => q.id).join(', ') +
      '\r\n' +
      'FIX NAME: ' +
      this.fixName +
      '\r\n';
    const changesString = Array.from(
      new Set(this.changes.map((ch) => ch.toString())),
    ).sort();
    return header + changesString.join('\r\n');
  };
}
