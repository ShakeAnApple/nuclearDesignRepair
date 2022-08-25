import { SingleResult } from './SingleResult';

export class SingleQueryResult {
  constructor(singleResults: SingleResult[]) {
    this.singleResults = singleResults;
  }
  singleResults: SingleResult[];
}
