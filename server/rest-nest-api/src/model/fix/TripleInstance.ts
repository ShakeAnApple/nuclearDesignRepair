import { Triple } from '../Triple';
import { EdgeInstance } from './EdgeInstance';
import { NodeInstance } from './NodeInstance';

export class TripleInstance {
  constructor(
    subject: NodeInstance,
    predicate: EdgeInstance,
    object: NodeInstance,
    originalTriple: Triple,
  ) {
    this.subject = subject;
    this.predicate = predicate;
    this.object = object;
    this.originalTriple = originalTriple;
  }
  subject: NodeInstance;
  predicate: EdgeInstance;
  object: NodeInstance;
  originalTriple: Triple;
}
