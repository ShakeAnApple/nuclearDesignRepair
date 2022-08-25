import { Edge } from '../model/ontology/Edge';
import { Graph } from '../model/ontology/Graph';
import { Node } from '../model/ontology/Node';

export class GraphHelper {
  public static convertSparqlResultToGraph(queryResult: string) {
    // stub
    return new Graph();
    //   nodes: [
    //     {
    //       id: '1',
    //       title: 'name1',
    //       class: 'class1',
    //     } as Node,
    //     {
    //       id: '2',
    //       title: 'name2',
    //       class: 'class2',
    //     } as Node,
    //   ],
    //   edges: [
    //     {
    //       source: '1',
    //       target: '2',
    //       handleText: "I'm the edge",
    //     } as Edge,
    //   ],
    // } as Graph;
  }
}
