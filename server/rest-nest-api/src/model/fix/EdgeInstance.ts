import { Property } from '../ontology/Property';
import { NodeInstance } from './NodeInstance';

export class EdgeInstance {
  constructor(property: Property, isNegated: boolean) {
    this.property = property;
    this.isNegated = isNegated;
  }
  source: NodeInstance;
  property: Property;
  target: NodeInstance;
  isNegated: boolean;

  getId = (): string => {
    return (
      this.source.id +
      this.property.title +
      this.target.id +
      String(this.isNegated)
    );
  };

  toString = () => {
    return (
      'Edge: ' +
      this.source.id +
      ' ' +
      this.property.title +
      ' ' +
      this.target.id +
      ' ' +
      String(this.isNegated)
    );
  };
}
