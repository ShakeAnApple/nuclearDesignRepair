import { Injectable } from '@nestjs/common';
import { GraphHelper } from '../helpers/GraphHelper';
import { SparqlQuery } from '../model/SparqlQuery';
import { JenaExecutor } from '../helpers/JenaExecutor';
import { Graph } from '../model/ontology/Graph';
import { get } from 'http';

@Injectable()
export class VerificationService {
  private _sparqlExecutor: JenaExecutor;
  private _queries: SparqlQuery[];
  private _ontologyFilename: string;

  constructor() {
    this._sparqlExecutor = new JenaExecutor();
  }

  public RecordOntologyRelativeFilepath(filename: string): void {
    this._ontologyFilename = filename;
    console.log(`Recorded filename ${filename}`);
  }

  public RecordQueries(filename: string): void {
    this.parseQueries(filename);
    console.log(`Recorded queries ${filename}`);
  }

  private parseQueries(filename: string) {
    // this._queries = [{ query: 'querystub' }];
    console.log('Method parseQueries not implemented.');
  }

  public async RunQueries(): Promise<Graph[]> {
    // const result: Promise<Graph>[] = this._queries.map(async (query) => {
    //   // const res: string = await this._sparqlExecutor.runQuery(query);
    //   const res: string = await this._sparqlExecutor.runQuery();
    //   console.log(res);
    //   const graph: Graph = GraphHelper.convertSparqlResultToGraph(res);
    //   return graph;
    // });
    // const result: string = await this._sparqlExecutor.runQuery(
    //   this._queries[0],
    // );
    // const graph: Graph = GraphHelper.convertSparqlResultToGraph(result);
    // return Promise.all(result);
    return [];
  }
}
