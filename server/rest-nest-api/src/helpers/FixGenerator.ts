import { Change, ChangeType } from '../model/fix/Change';
import { EdgeInstance } from '../model/fix/EdgeInstance';
import { Fix } from '../model/fix/Fix';
import { MergedEdge } from '../model/fix/MergedEdge';
import { MergedNode } from '../model/fix/MergedNode';
import { NodeInstance } from '../model/fix/NodeInstance';
import { QueryGraphResult } from '../model/fix/QueryGraphResult';
import { QueryGraphsIntersection } from '../model/fix/QueryGraphsIntersection';
import { Individual } from '../model/ontology/Individual';
import { NodeType } from '../model/ontology/Node';
import { Ontology } from '../model/ontology/Ontology';
import { Property } from '../model/ontology/Property';
import { DataType } from '../model/ontology/PropertyValue';

//NOTE: if a node belongs to a negated triple, it doesn't make sense to change it!
export class FixGenerator {
  generateFixForGraphIntersections = (
    queryGraphsIntersections: QueryGraphsIntersection[],
    ontology: Ontology,
  ): Fix[] => {
    const queryGraphsFixed: QueryGraphResult[] = [];
    const allFixes: Fix[] = [];
    queryGraphsIntersections.forEach((graphsIntersection) => {
      const possibleFixes: Fix[] = [];
      graphsIntersection.nodes.forEach((node) => {
        if (
          !node.belongsToNegatedTriple() &&
          node.nodeType == NodeType.Constant
        ) {
          const changes: Change[] = this.replaceConstantNode(node, ontology);
          this.applyFix(
            'Replace constant node ' + node.node.id,
            changes,
            possibleFixes,
            queryGraphsFixed,
            graphsIntersection,
          );
        }
        const changes: Change[] = this.deleteNode(node);
        this.applyFix(
          'Delete node ' + node.node.id,
          changes,
          possibleFixes,
          queryGraphsFixed,
          graphsIntersection,
        );
      });
      graphsIntersection.edges.forEach((edge) => {
        if (edge.edge.isNegated) {
          const changes = this.unNegateEdge(edge);
          this.applyFix(
            'Unnegate edge ' + edge.edge.getId(),
            changes,
            possibleFixes,
            queryGraphsFixed,
            graphsIntersection,
          );
        } else {
          const changesReplace = this.replaceEdge(edge, ontology);
          this.applyFix(
            'Replace edge ' + edge.edge.getId(),
            changesReplace,
            possibleFixes,
            queryGraphsFixed,
            graphsIntersection,
          );
          const changesRemove = this.removeEdge(edge);
          this.applyFix(
            'Remove edge ' + edge.edge.getId(),
            changesRemove,
            possibleFixes,
            queryGraphsFixed,
            graphsIntersection,
          );
        }
      });
      if (graphsIntersection.nodes.length > 2) {
        this.rebuildGraph(
          graphsIntersection,
          ontology,
          possibleFixes,
          queryGraphsFixed,
        );
      }
      allFixes.push(...possibleFixes);
    });
    return allFixes;
  };

  private applyFix = (
    fixName: string,
    changes: Change[],
    possibleFixes: Fix[],
    queryGraphsFixed: QueryGraphResult[],
    graphsIntersection: QueryGraphsIntersection,
  ): void => {
    if (changes.length == 0) {
      return;
    }
    const fix = new Fix(fixName, changes);
    const forQueries = graphsIntersection.tryApplyFix(fix);
    fix.forQueries = forQueries;
    fix.forIntersection = graphsIntersection;
    possibleFixes.push(fix);
    queryGraphsFixed.push(...forQueries);
  };

  private rebuildGraph = (
    graphsIntersection: QueryGraphsIntersection,
    ontology: Ontology,
    possibleFixes: Fix[],
    queryGraphsFixed: QueryGraphResult[],
  ) => {
    const nodesEdgesWithinIntersetion: {
      [key: string]: MergedEdge[];
    } = {};
    graphsIntersection.nodes.forEach((node) => {
      const nodeTitle = node.node.id;
      nodesEdgesWithinIntersetion[nodeTitle] = [];
      graphsIntersection.edges.forEach((edge) => {
        if (
          edge.edge.source.id === nodeTitle ||
          edge.edge.target.id === nodeTitle
        ) {
          nodesEdgesWithinIntersetion[nodeTitle].push(edge);
        }
      });
    });
    const nodesWithSeveralEdgesIds: string[] = [];

    // if there's a negated node, then, there're only few scenarios when it's useful, won't tackle them for now
    for (const [key, value] of Object.entries(nodesEdgesWithinIntersetion)) {
      if (value.length > 1 && !value.some((edge) => edge.edge.isNegated)) {
        nodesWithSeveralEdgesIds.push(key);
      }
    }

    // finish if there're no nodes with several edges pointing at/from them
    if (nodesWithSeveralEdgesIds.length == 0) {
      return;
    }

    // NOTE: ideally should be for all combinations of edges but we'll suggest only for the first one and the user gets the idea
    nodesWithSeveralEdgesIds.forEach((nodeId) => {
      const node = graphsIntersection.nodes.find(
        (node) => node.node.id === nodeId,
      );
      const changes: Change[] = [];
      const newIndividual: Individual = ontology.findSimilarIndividual(
        node.node.individual,
      );
      const newNodeInstance = new NodeInstance(
        newIndividual,
        node.nodeType,
        DataType.Individual,
      );
      changes.push(new Change(newNodeInstance, ChangeType.Add));

      const edgeToRetarget = nodesEdgesWithinIntersetion[nodeId][0];
      edgeToRetarget.belongsToTripleInstances.forEach((tripleInstance) => {
        const newEdge: EdgeInstance = new EdgeInstance(
          tripleInstance.predicate.property,
          tripleInstance.predicate.isNegated,
        );
        if (tripleInstance.predicate.source.individual.title === nodeId) {
          newEdge.source = newNodeInstance;
          newEdge.target = tripleInstance.object;
        } else {
          newEdge.source = tripleInstance.subject;
          newEdge.target = newNodeInstance;
        }
        changes.push(new Change(tripleInstance.predicate, ChangeType.Delete));
        changes.push(new Change(newEdge, ChangeType.Add));
      });
      this.applyFix(
        'Rebuild graph: replace ' + nodeId + ' with ' + newIndividual.title,
        changes,
        possibleFixes,
        queryGraphsFixed,
        graphsIntersection,
      );
    });
  };

  private removeEdge = (edge: MergedEdge): Change[] => {
    const changes: Change[] = [];
    edge.belongsToTripleInstances.forEach((tripleInstance) => {
      changes.push(new Change(tripleInstance.predicate, ChangeType.Delete));
    });
    return changes;
  };

  // TODO: should be multiple properties found (the most similar for now)
  // TODO: will have problems if value of the property is not an individual (maybe not?)
  private replaceEdge = (edge: MergedEdge, ontology: Ontology): Change[] => {
    const changes: Change[] = [];
    const newProperty: Property = ontology.findSimilarProperties(
      edge.edge.property,
    );
    if (!newProperty) {
      return [];
    }
    edge.belongsToTripleInstances.forEach((tripleInstance) => {
      changes.push(new Change(tripleInstance.predicate, ChangeType.Delete));
      const newEdgeInstance = new EdgeInstance(
        newProperty,
        edge.edge.isNegated,
      );

      newEdgeInstance.source = tripleInstance.subject;
      newEdgeInstance.target = tripleInstance.object;
      changes.push(new Change(newEdgeInstance, ChangeType.Add));
    });
    return changes;
  };

  private unNegateEdge = (edge: MergedEdge): Change[] => {
    const changes: Change[] = [];
    edge.belongsToTripleInstances.forEach((tripleInstance) => {
      changes.push(new Change(tripleInstance.predicate, ChangeType.Delete));
      const newEdge: EdgeInstance = new EdgeInstance(
        tripleInstance.predicate.property,
        false,
      );
      newEdge.source = tripleInstance.subject;
      newEdge.target = tripleInstance.object;
      changes.push(new Change(newEdge, ChangeType.Add));
    });
    return changes;
  };

  // TODO: should be multiple new individuals found (one the most suitable for now)
  private replaceConstantNode = (
    node: MergedNode,
    ontology: Ontology,
  ): Change[] => {
    const changes: Change[] = [];
    const newIndividual: Individual = ontology.findSimilarIndividual(
      node.node.individual,
    );
    if (!newIndividual) {
      return [];
    }
    const newNodeInstance = new NodeInstance(
      newIndividual,
      node.nodeType,
      DataType.Individual,
    );
    changes.push(new Change(node.node, ChangeType.Delete));
    changes.push(new Change(newNodeInstance, ChangeType.Add));
    node.belongsToTripleInstances.forEach((tripleIstance) => {
      if (tripleIstance.subject.individual.title === node.node.id) {
        const newEdge: EdgeInstance = new EdgeInstance(
          tripleIstance.predicate.property,
          tripleIstance.predicate.isNegated,
        );
        newEdge.source = newNodeInstance;
        newEdge.target = tripleIstance.object;
        changes.push(new Change(newEdge, ChangeType.Add));
        changes.push(new Change(tripleIstance.predicate, ChangeType.Delete));
      } else if (tripleIstance.object.individual.title === node.node.id) {
        const newEdge: EdgeInstance = new EdgeInstance(
          tripleIstance.predicate.property,
          tripleIstance.predicate.isNegated,
        );
        newEdge.source = tripleIstance.object;
        newEdge.target = newNodeInstance;
        changes.push(new Change(newEdge, ChangeType.Add));
        changes.push(new Change(tripleIstance.predicate, ChangeType.Delete));
      } else {
        throw new Error(
          'Node ' +
            node.node.id +
            " doesn't belong to triple " +
            tripleIstance.object.individual.title +
            ' ' +
            tripleIstance.subject.individual.title,
        );
      }
    });
    return changes;
  };

  private deleteNode = (node: MergedNode): Change[] => {
    const changes: Change[] = [];
    changes.push(new Change(node.node, ChangeType.Delete));
    node.belongsToTripleInstances.forEach((tripleIstance) => {
      if (
        tripleIstance.subject.id === node.node.id ||
        tripleIstance.object.id === node.node.id
      ) {
        changes.push(new Change(tripleIstance.predicate, ChangeType.Delete));
      } else {
        throw new Error(
          'Node ' +
            node.node.id +
            " doesn't belong to triple " +
            tripleIstance.object.individual.title +
            ' ' +
            tripleIstance.subject.individual.title,
        );
      }
    });
    return changes;
  };
}
