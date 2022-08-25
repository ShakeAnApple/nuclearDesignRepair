import { SingleQueryResult } from '../../model/SingleQueryResult';
import { SingleResult } from '../../model/SingleResult';
import { Substitution } from '../../model/Substitution';

export class JenaResultParser {
  parseSparqlQueryResult = (jenaOutput: string): SingleQueryResult => {
    const lines: string[] = jenaOutput.split('\n').filter(Boolean);
    const [variables, isFail] = this.tryReadVariables(lines);
    if (isFail) {
      throw new Error('Cannot read variables');
    }

    const singleResults: SingleResult[] = [];
    for (let idx = 3; idx < lines.length - 1; idx++) {
      const line = lines[idx];
      const valuesStr = line
        .split('|')
        .map((el) => el.trim())
        .filter(Boolean);
      const substitutions: Substitution[] = [];
      for (let valueNum = 0; valueNum < valuesStr.length; valueNum++) {
        const valueCur: string = valuesStr[valueNum];
        const value = valueCur.startsWith(':')
          ? valueCur.substring(1)
          : valueCur.split('#')[1].slice(0, -1);
        const substitution = new Substitution(variables[valueNum], value);
        substitutions.push(substitution);
      }
      const singleResult = new SingleResult(substitutions);
      singleResults.push(singleResult);
    }

    return new SingleQueryResult(singleResults);
  };

  private tryReadVariables = (
    lines: string[],
  ): [variables: string[], isFail: boolean] => {
    if (!lines[0].startsWith('--')) {
      return [null, true];
    }

    const varsNames: string[] = lines[1]
      .split('|')
      .map((el) => el.trim())
      .filter(Boolean);
    return [varsNames, false];
  };
}
