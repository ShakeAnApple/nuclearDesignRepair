import { Class } from './Class';

export class Property {
  constructor(title: string, type: PropertyType) {
    this.title = title;
    this.type = type;
    this.domain = [];
    this.range = [];
  }

  title: string;
  domain: Class[];
  range: Class[];
  parent: Property;
  type: PropertyType;
}

export enum PropertyType {
  Object,
  DataType,
}
