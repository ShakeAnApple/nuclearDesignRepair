import { Class } from './Class';
import { PropertyValue } from './PropertyValue';

export class Individual {
  constructor(title: string, classObj: Class) {
    this.title = title;
    this.class = classObj;
    this.properties = [];
  }
  title: string;
  class: Class;
  properties: PropertyValue[];
}
