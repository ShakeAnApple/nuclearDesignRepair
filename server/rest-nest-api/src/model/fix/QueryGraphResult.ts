import { BooleanQuery } from '../BooleanQuery';
import { TripleInstance } from './TripleInstance';
import { v4 as uuidv4 } from 'uuid';
import { Fix } from './Fix';

export class QueryGraphResult {
  constructor(originalQuery: BooleanQuery, id?: number) {
    this.originalQuery = originalQuery;
    this.triplesInstances = [];
    this.id = id ? id.toString() : uuidv4();
  }
  id: string;
  triplesInstances: TripleInstance[];
  originalQuery: BooleanQuery;

  // TODO: maybe implement? probably not
  isFixApplicable = (fix: Fix): boolean => {
    return true;
  };
}
