import { SparqlQueryParser } from '../helpers/parsers/SparqlQueryParser';
import { BooleanQuery } from '../model/BooleanQuery';
import { SingleQueryResult } from '../model/SingleQueryResult';

export class BooleanQueryService {
  getResultGraph = (queryResult: SingleQueryResult) => {
    return null;
  };

  parseQueryFromFile = (filepath: string): BooleanQuery => {
    const parser = new SparqlQueryParser();
    return parser.parseQueryFromFile(filepath);
  };
}
