import { Injectable } from '@nestjs/common';
import { Graph } from '../model/ontology/Graph';
import { GraphHelper } from '../helpers/GraphHelper';
import { JenaExecutor } from '../helpers/JenaExecutor';

@Injectable()
export class OntologyService {
  private _sparqlExecutor: JenaExecutor;
  constructor() {
    this._sparqlExecutor = new JenaExecutor();
  }
  // run jena
  // feed ontology from the file
  // run query
  // get response
  // parse response into graph

  // public runQuery(query: string): Graph {
  //   const result = this._sparqlExecutor.runQuery(query);
  //   return GraphHelper.convertSparqlResultToGraph(result);
  // }
}
