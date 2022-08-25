import { NodeInstance } from '../fix/NodeInstance';
import { Ontology } from './Ontology';
import { DataType } from './PropertyValue';

export class Node {
  constructor(title: string, prefix: string, id: string, type: NodeType) {
    this.title = title;
    this.id = id;
    this.type = type;
    this.prefix = prefix;
  }

  title: string;
  prefix: string;
  id: string;
  class: string;
  type: NodeType;

  generateNodeInstance = (value: string, ontology: Ontology): NodeInstance => {
    const individual = ontology.findIndividualByName(value);
    if (individual) {
      return new NodeInstance(
        ontology.findIndividualByName(value),
        this.type,
        DataType.Individual,
      );
    } else {
      const nodeInstance = new NodeInstance(
        null,
        this.type,
        DataType.Unknown,
        value,
      );
      return nodeInstance;
    }
  };
}

export enum NodeType {
  Constant,
  Variable,
}
