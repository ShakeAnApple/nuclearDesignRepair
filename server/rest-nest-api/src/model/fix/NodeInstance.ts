import { Individual } from '../ontology/Individual';
import { NodeType } from '../ontology/Node';
import { DataType } from '../ontology/PropertyValue';

export class NodeInstance {
  constructor(
    individual: Individual,
    nodeType: NodeType,
    nodeDataType: DataType,
    nodeConstantValue?: any,
  ) {
    this.individual = individual;
    this.nodeType = nodeType;
    this.nodeDataType = nodeDataType;

    if (!individual && nodeConstantValue) {
      if (Number(nodeConstantValue)) {
        this.nodeDataType == DataType.Int;
      } else if (Boolean(nodeConstantValue)) {
        this.nodeDataType = DataType.Bool;
      } else {
        throw new Error('Cannot determine datatype of ' + nodeConstantValue);
      }
      this.nodeConstantValue = nodeConstantValue;
    }
    this.id = individual ? individual.title : nodeConstantValue;
  }
  individual: Individual;
  nodeConstantValue: any;
  nodeDataType: DataType;
  nodeType: NodeType;
  id: string;

  toString = () => {
    return 'Node: ' + this.id;
  };
}
