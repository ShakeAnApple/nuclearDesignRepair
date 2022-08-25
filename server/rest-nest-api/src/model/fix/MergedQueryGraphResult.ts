import { NodeType } from '../ontology/Node';
import { EdgeInstance } from './EdgeInstance';
import { MergedEdge } from './MergedEdge';
import { MergedNode } from './MergedNode';
import { NodeInstance } from './NodeInstance';
import { QueryGraphResult } from './QueryGraphResult';
import { QueryGraphsIntersection } from './QueryGraphsIntersection';
import { TripleInstance } from './TripleInstance';

export class MergedQueryGraphResult {
  constructor(queryGraphResults: QueryGraphResult[]) {
    this.constructMerge(queryGraphResults);
  }
  mergedNodes: MergedNode[];
  mergedEdges: MergedEdge[];

  getGraphsIntersections = (): QueryGraphsIntersection[] => {
    let intersections: QueryGraphsIntersection[] = [];
    this.mergedNodes.forEach((node) => {
      const intersection = new QueryGraphsIntersection(
        [node],
        [],
        node.belongsToQueryGraphResults,
      );

      let localQueriesFullIntersectionsFound = false;
      intersections.forEach((existingIntersection) => {
        if (
          !existingIntersection.nodes.some((n) => n.node.id === node.node.id)
        ) {
          const localQueriesIntersected: QueryGraphResult[] =
            existingIntersection.intersectWithQueries(
              intersection.queriesIntersected,
            );
          if (
            localQueriesIntersected.length > 0 &&
            localQueriesIntersected.length ==
              intersection.queriesIntersected.length
          ) {
            localQueriesFullIntersectionsFound = true;
          }
          // NOTE: order of if-s is important!
          if (localQueriesIntersected.length > 0) {
            if (
              localQueriesIntersected.length ==
                intersection.queriesIntersected.length &&
              localQueriesIntersected.length ==
                existingIntersection.queriesIntersected.length
            ) {
              existingIntersection.nodes.push(node);
            } else if (localQueriesIntersected.length > 0) {
              const newIntersection = new QueryGraphsIntersection(
                intersection.nodes.concat(existingIntersection.nodes).slice(),
                existingIntersection.edges.slice(),
                localQueriesIntersected.slice(),
              );
              intersections.push(newIntersection);
            }
          }
        }
      });
      if (!localQueriesFullIntersectionsFound) {
        intersections.push(intersection);
      }
    });

    intersections = this.mergeSameQueriesIntersections(intersections);

    this.mergedEdges.forEach((edge) => {
      const intersection = new QueryGraphsIntersection(
        [],
        [edge],
        edge.belongsToQueryGraphResults,
      );

      let localQueriesFullIntersectionsFound = false;
      intersections.forEach((existingIntersection) => {
        if (
          !existingIntersection.edges.some(
            (e) => e.edge.getId() === edge.edge.getId(),
          )
        ) {
          const localQueriesIntersected: QueryGraphResult[] =
            existingIntersection.intersectWithQueries(
              intersection.queriesIntersected,
            );
          if (
            localQueriesIntersected.length > 0 &&
            localQueriesIntersected.length ==
              intersection.queriesIntersected.length &&
            localQueriesIntersected.length ==
              existingIntersection.queriesIntersected.length
          ) {
            localQueriesFullIntersectionsFound = true;
          }
          // NOTE: order of if-s is important!
          if (localQueriesIntersected.length > 0) {
            if (
              localQueriesIntersected.length ==
                intersection.queriesIntersected.length &&
              localQueriesIntersected.length ==
                existingIntersection.queriesIntersected.length
            ) {
              existingIntersection.edges.push(edge);
            } else {
              const newIntersection = new QueryGraphsIntersection(
                existingIntersection.nodes.slice(),
                intersection.edges.concat(existingIntersection.edges).slice(),
                localQueriesIntersected.slice(),
              );
              intersections.push(newIntersection);
            }
          }
        }
      });

      if (!localQueriesFullIntersectionsFound) {
        intersections.push(intersection);
      }
    });

    intersections = this.mergeSameQueriesIntersections(intersections);

    return intersections;
  };

  private mergeSameQueriesIntersections = (
    intersections: QueryGraphsIntersection[],
  ): QueryGraphsIntersection[] => {
    const newIntersections: QueryGraphsIntersection[] = [];
    intersections.forEach((intersection) => {
      let hasBeenAdded = false;
      newIntersections.forEach((newIntersection) => {
        const queriesIntersected = intersection.intersectWithQueries(
          newIntersection.queriesIntersected,
        );
        if (
          queriesIntersected.length ===
            intersection.queriesIntersected.length &&
          queriesIntersected.length ===
            newIntersection.queriesIntersected.length
        ) {
          newIntersection.edges.push(
            ...intersection.edges
              .slice()
              .filter(
                (edge) =>
                  !newIntersection.edges.some(
                    (newEdge) => edge.edge.getId() === newEdge.edge.getId(),
                  ),
              ),
          );
          newIntersection.nodes.push(
            ...intersection.nodes
              .slice()
              .filter(
                (node) =>
                  !newIntersection.nodes.some(
                    (newNode) => node.node.id === newNode.node.id,
                  ),
              ),
          );
          hasBeenAdded = true;
        }
      });
      if (!hasBeenAdded) {
        newIntersections.push(intersection);
      }
    });
    return newIntersections;
  };

  private constructMerge = (queryGraphResults: QueryGraphResult[]): void => {
    this.mergedNodes = [];
    this.mergedEdges = [];
    // nodes
    const nodeInstancesByIndividualTitles: { [key: string]: NodeInstance } = {}; // these are nodeInstance ids
    const belongsToQueryGraphResultsByNodeInstanceId: {
      [key: string]: QueryGraphResult[];
    } = {};
    const belongsToTripleInstancesByNodeInstanceId: {
      [key: string]: TripleInstance[];
    } = {};

    // edges
    const edgeInstancesByIds: { [key: string]: EdgeInstance } = {};
    const belongsToQueryGraphResultsByEdgeInstanceId: {
      [key: string]: QueryGraphResult[];
    } = {};
    const belongsToTripleInstancesByEdgeInstanceId: {
      [key: string]: TripleInstance[];
    } = {};
    queryGraphResults.forEach((queryGraphResult) => {
      queryGraphResult.triplesInstances.forEach((tripleInstance) => {
        this.addNode(
          tripleInstance.subject,
          nodeInstancesByIndividualTitles,
          belongsToQueryGraphResultsByNodeInstanceId,
          belongsToTripleInstancesByNodeInstanceId,
          tripleInstance,
          queryGraphResult,
        );
        this.addNode(
          tripleInstance.object,
          nodeInstancesByIndividualTitles,
          belongsToQueryGraphResultsByNodeInstanceId,
          belongsToTripleInstancesByNodeInstanceId,
          tripleInstance,
          queryGraphResult,
        );
        this.addEdge(
          tripleInstance.predicate,
          edgeInstancesByIds,
          belongsToQueryGraphResultsByEdgeInstanceId,
          belongsToTripleInstancesByEdgeInstanceId,
          tripleInstance,
          queryGraphResult,
        );
      });
    });
    for (const [individualTitle, node] of Object.entries(
      nodeInstancesByIndividualTitles,
    )) {
      const mergedNode = new MergedNode(node);
      mergedNode.belongsToQueryGraphResults.push(
        ...belongsToQueryGraphResultsByNodeInstanceId[individualTitle],
      );
      mergedNode.belongsToTripleInstances.push(
        ...belongsToTripleInstancesByNodeInstanceId[individualTitle],
      );
      this.mergedNodes.push(mergedNode);
    }

    for (const [edgeId, edge] of Object.entries(edgeInstancesByIds)) {
      const mergedEdge = new MergedEdge(edge);
      mergedEdge.belongsToQueryGraphResults.push(
        ...belongsToQueryGraphResultsByEdgeInstanceId[edgeId],
      );
      mergedEdge.belongsToTripleInstances.push(
        ...belongsToTripleInstancesByEdgeInstanceId[edgeId],
      );
      this.mergedEdges.push(mergedEdge);
    }
  };

  addEdge = (
    edge: EdgeInstance,
    edgeInstancesByIds: { [key: string]: EdgeInstance },
    belongsToQueryGraphResultsByEdgeInstanceId: {
      [key: string]: QueryGraphResult[];
    },
    belongsToTripleInstancesByEdgeInstanceId: {
      [key: string]: TripleInstance[];
    },
    tripleInstance: TripleInstance,
    queryGraphResult: QueryGraphResult,
  ) => {
    if (!edgeInstancesByIds[edge.getId()]) {
      edgeInstancesByIds[edge.getId()] = edge;
    }
    if (!belongsToQueryGraphResultsByEdgeInstanceId[edge.getId()]) {
      belongsToQueryGraphResultsByEdgeInstanceId[edge.getId()] = [];
    }
    if (!belongsToTripleInstancesByEdgeInstanceId[edge.getId()]) {
      belongsToTripleInstancesByEdgeInstanceId[edge.getId()] = [];
    }

    if (
      !belongsToQueryGraphResultsByEdgeInstanceId[edge.getId()].includes(
        queryGraphResult,
      )
    ) {
      belongsToQueryGraphResultsByEdgeInstanceId[edge.getId()].push(
        queryGraphResult,
      );
    }

    if (
      !belongsToTripleInstancesByEdgeInstanceId[edge.getId()].includes(
        tripleInstance,
      )
    ) {
      belongsToTripleInstancesByEdgeInstanceId[edge.getId()].push(
        tripleInstance,
      );
    }
  };

  private addNode = (
    node: NodeInstance,
    nodeInstancesByIds: { [key: string]: NodeInstance },
    belongsToQueryGraphResultsByNodeInstanceId: {
      [key: string]: QueryGraphResult[];
    },
    belongsToTripleInstancesByNodeInstanceId: {
      [key: string]: TripleInstance[];
    },
    tripleInstance: TripleInstance,
    queryGraphResult: QueryGraphResult,
  ): void => {
    if (!nodeInstancesByIds[node.id]) {
      nodeInstancesByIds[node.id] = node;
    }
    if (!belongsToQueryGraphResultsByNodeInstanceId[node.id]) {
      belongsToQueryGraphResultsByNodeInstanceId[node.id] = [];
    }
    if (!belongsToTripleInstancesByNodeInstanceId[node.id]) {
      belongsToTripleInstancesByNodeInstanceId[node.id] = [];
    }

    // NOTE: important when fixing (if it's a var for some query, change fix won't make sense)
    if (
      nodeInstancesByIds[node.id].nodeType === NodeType.Constant &&
      node.nodeType === NodeType.Variable
    ) {
      nodeInstancesByIds[node.id].nodeType = NodeType.Variable;
    }

    if (
      !belongsToQueryGraphResultsByNodeInstanceId[node.id].includes(
        queryGraphResult,
      )
    ) {
      belongsToQueryGraphResultsByNodeInstanceId[node.id].push(
        queryGraphResult,
      );
    }

    if (
      !belongsToTripleInstancesByNodeInstanceId[node.id].includes(
        tripleInstance,
      )
    ) {
      belongsToTripleInstancesByNodeInstanceId[node.id].push(tripleInstance);
    }
  };
}
