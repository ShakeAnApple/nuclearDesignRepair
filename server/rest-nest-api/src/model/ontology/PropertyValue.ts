import { Property } from './Property';

export class PropertyValue {
  constructor(property: Property, value: any, datatype: DataType) {
    this.property = property;
    this.value = value;
    this.dataType = datatype;
  }
  property: Property;
  value: any;
  dataType: DataType;
}

export enum DataType {
  Int,
  Bool,
  Individual,
  Unknown,
}
