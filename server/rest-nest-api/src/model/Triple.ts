import { EdgeInstance } from './fix/EdgeInstance';
import { NodeInstance } from './fix/NodeInstance';
import { TripleInstance } from './fix/TripleInstance';
import { Edge, EdgeType } from './ontology/Edge';
import { Node, NodeType } from './ontology/Node';
import { Ontology } from './ontology/Ontology';
import { SingleResult } from './SingleResult';

export class Triple {
  constructor(
    subject: Node,
    predicate: Edge,
    object: Node,
    isNegated: boolean,
  ) {
    this.subject = subject;
    this.predicate = predicate;
    this.object = object;
    this.isNegated = isNegated;
  }

  subject: Node;
  predicate: Edge;
  object: Node;
  isNegated: boolean;

  generateTripleInstance = (
    singleResult: SingleResult,
    ontology: Ontology,
  ): TripleInstance => {
    let subjectNodeInstance: NodeInstance;
    let objectNodeInstance: NodeInstance;
    let edgeInstance: EdgeInstance;
    if (
      this.subject.type == NodeType.Variable ||
      this.predicate.edgeType == EdgeType.Variable ||
      this.object.type == NodeType.Variable
    ) {
      singleResult.substitutions.forEach((substitution) => {
        if (
          this.subject.type == NodeType.Variable &&
          this.subject.title === substitution.variableName
        ) {
          subjectNodeInstance = this.subject.generateNodeInstance(
            substitution.variableValue,
            ontology,
          );
        } else if (
          this.predicate.edgeType == EdgeType.Variable &&
          this.predicate.title === substitution.variableName
        ) {
          edgeInstance = this.predicate.generateEdgeInstance(
            substitution.variableValue,
            this.isNegated,
            ontology,
          );
        } else if (
          this.object.type == NodeType.Variable &&
          this.object.title === substitution.variableName
        ) {
          objectNodeInstance = this.subject.generateNodeInstance(
            substitution.variableValue,
            ontology,
          );
        }
      });
    }
    if (this.subject.type == NodeType.Constant) {
      subjectNodeInstance = this.subject.generateNodeInstance(
        this.subject.title,
        ontology,
      );
    }
    if (this.predicate.edgeType == EdgeType.Constant) {
      edgeInstance = this.predicate.generateEdgeInstance(
        this.predicate.title,
        this.isNegated,
        ontology,
      );
    }
    if (this.object.type == NodeType.Constant) {
      objectNodeInstance = this.object.generateNodeInstance(
        this.object.title,
        ontology,
      );
    }
    edgeInstance.source = subjectNodeInstance;
    edgeInstance.target = objectNodeInstance;
    return new TripleInstance(
      subjectNodeInstance,
      edgeInstance,
      objectNodeInstance,
      this,
    );
  };
}
