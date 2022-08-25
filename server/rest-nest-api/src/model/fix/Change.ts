import { EdgeInstance } from './EdgeInstance';
import { NodeInstance } from './NodeInstance';

export class Change {
  constructor(element: NodeInstance | EdgeInstance, changeType: ChangeType) {
    this.element = element;
    this.changeType = changeType;
  }
  element: NodeInstance | EdgeInstance;
  changeType: ChangeType;

  toString = () => {
    return (
      (this.changeType == ChangeType.Delete ? 'DELETE ' : 'ADD ') +
      this.element.toString()
    );
  };
}

export enum ChangeType {
  Delete,
  Add,
}
