import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FixGenerator } from '../helpers/FixGenerator';
import { JenaExecutor } from '../helpers/JenaExecutor';
import { JenaResultParser } from '../helpers/parsers/JenaResultParser';
import { OntologyParser } from '../helpers/parsers/OntologyParser';
import { SparqlQueryParser } from '../helpers/parsers/SparqlQueryParser';
import { BooleanQuery } from '../model/BooleanQuery';
import { Fix } from '../model/fix/Fix';
import { MergedQueryGraphResult } from '../model/fix/MergedQueryGraphResult';
import { QueryGraphResult } from '../model/fix/QueryGraphResult';
import { QueryGraphsIntersection } from '../model/fix/QueryGraphsIntersection';
import { Graph } from '../model/ontology/Graph';
import { SingleQueryResult } from '../model/SingleQueryResult';
import { SparqlQuery } from '../model/SparqlQuery';
import { VerificationService } from '../services/VerificationService';
import { OntologyService } from '../services/OntologyService';

export const editFileName = (req, file, callback) => {
  callback(null, file.originalname);
};

@Controller('ontology')
export class OntologyController {
  constructor(
    private ontologyService: OntologyService,
    private verificationService: VerificationService,
  ) {}

  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads/',
        filename: editFileName,
      }),
    }),
  )
  @Post('upload')
  async upload(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
    // TODO return this when other parts tested
    // this.verificationService.RecordOntologyRelativeFilepath(
    //   `${file.destination}${file.filename}`,
    // );
    // new OntologyParser().parseOntologyFromFile(
    //   'C:/Users/ovsianp1/projects/SEARCH/architecture/sparql/rdf.xml',
    // );

    const query1: BooleanQuery = new SparqlQueryParser().parseQueryFromFile(
      'data/prop13.sparql',
    );
    console.log('parsed 1');
    const query2: BooleanQuery = new SparqlQueryParser().parseQueryFromFile(
      'data/prop4.sparql',
    );
    // console.log(query);

    const response1 = await new JenaExecutor().runQuery(
      'data/rdf.xml',
      'data/prop13.sparql',
    );
    const response2 = await new JenaExecutor().runQuery(
      'data/rdf.xml',
      'data/prop4.sparql',
    );
    const ontology = new OntologyParser().parseOntologyFromFile('data/rdf.xml');
    const queryResult1: SingleQueryResult =
      new JenaResultParser().parseSparqlQueryResult(response1);
    const queryResult2: SingleQueryResult =
      new JenaResultParser().parseSparqlQueryResult(response2);
    const queryGraphResults: QueryGraphResult[] = [];

    let i = 1;
    queryResult1.singleResults.forEach((singleResult) => {
      const queryGraphResult = query1.generateQueryGraphResult(
        singleResult,
        ontology,
        i,
      );
      i++;
      queryGraphResults.push(queryGraphResult);
      // console.log(queryGraphResult);
    });
    let i2 = 11;
    queryResult2.singleResults.forEach((singleResult) => {
      const queryGraphResult = query2.generateQueryGraphResult(
        singleResult,
        ontology,
        i2,
      );
      i2++;
      queryGraphResults.push(queryGraphResult);
      // console.log(queryGraphResult);
    });
    const mergedQueryGraphResult = new MergedQueryGraphResult(
      queryGraphResults,
    );
    let graphIntersections: QueryGraphsIntersection[] =
      mergedQueryGraphResult.getGraphsIntersections();
    console.log(graphIntersections.length);
    graphIntersections = graphIntersections.sort((a, b) =>
      a.queriesIntersected.length > b.queriesIntersected.length ? -1 : 1,
    );
    // graphIntersections[0].edges.forEach((edge) => {
    //   console.log(edge.edge.getId());
    // });
    const fixes: Fix[] = new FixGenerator().generateFixForGraphIntersections(
      graphIntersections,
      ontology,
    );
    console.log(fixes.length);
    fixes.forEach((fix) => console.log(fix.toString()));
  }

  @Post('query')
  runQuery(@Body() query: SparqlQuery) {
    console.log('got query' + query);
    // return this.ontologyService.runQuery(query);
  }

  @Get('check')
  async checkOntology(): Promise<Graph[]> {
    const res = await this.verificationService.RunQueries();
    return res;
  }
}
