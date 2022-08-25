import * as fs from 'fs';
import { BooleanQuery } from '../../model/BooleanQuery';
import { Triple } from '../../model/Triple';
import { Formula, Operation } from '../../model/Formula';
import { Node, NodeType } from '../../model/ontology/Node';
import { v4 as uuidv4 } from 'uuid';
import { Edge, EdgeType } from '../../model/ontology/Edge';

// NOTE: MINUS can work only if all the vars have bindings or constants (we'll have to reverify otherwise for now)
export class SparqlQueryParser {
  parseQueryFromFile = (filepath: string): BooleanQuery => {
    const query = new BooleanQuery(uuidv4());
    // non-empty lines
    const allLines = fs
      .readFileSync(filepath, 'utf-8')
      .split('\n')
      .filter(Boolean);
    const lines: string[] = this.retrieveWhereLines(allLines);
    if (lines.length < 1) {
      throw new Error('No WHERE within SELECT in ' + filepath);
    }
    const text = lines.join(' ');
    const tokens = text.split(' ').filter((t) => t && t != '\r');
    for (let i = 0; i < tokens.length; i++) {
      tokens[i] = tokens[i].trim().replace('\r', '');
    }

    let index = 0;

    while (index < tokens.length) {
      const [triple, idx, isFail] = this.tryReadTriple(tokens, query, index);
      if (isFail) {
        const [result, idx, isFail] = this.tryReadMinus(tokens, query, index);
        if (isFail) {
          const [result, idx, isFail] = this.tryReadUnion(tokens, query, index);
          if (isFail) {
            const [result, idx, isFail] = this.tryReadFilter(
              tokens,
              query,
              index,
            );
            if (isFail) {
              throw new Error("Didn't find any pattern " + index);
            } else {
              query.and.push(result);
              index = idx;
            }
          } else {
            query.and.push(result);
            index = idx;
          }
        } else {
          query.and.push(result);
          index = idx;
        }
      } else {
        if (triple) {
          query.and.push(triple);
        }
        index = idx;
      }
    }
    return query;
  };

  private tryReadTriple = (
    tokens: string[],
    query: BooleanQuery,
    currentIndex: number,
  ): [triple: Triple, idx: number, isFail: boolean] => {
    if (
      tokens[currentIndex + 3] === '.' ||
      // following lines mean that triple is inside filter or minus
      (tokens[currentIndex + 3] === '}' &&
        tokens[currentIndex + 2] !== '}' &&
        tokens[currentIndex + 1] !== '}' &&
        tokens[currentIndex] !== '}') ||
      (tokens[currentIndex + 3] === ')' &&
        tokens[currentIndex + 2] !== ')' &&
        tokens[currentIndex + 1] !== ')' &&
        tokens[currentIndex] !== ')')
    ) {
      const subject: Node = this.parseNode(tokens[currentIndex]);
      const object: Node = this.parseNode(tokens[currentIndex + 2]);
      const predicate: Edge = this.parseEdge(tokens[currentIndex + 1]);
      predicate.source = subject;
      predicate.target = object;
      if (!predicate.prefix.startsWith('rdf')) {
        return [
          new Triple(subject, predicate, object, false),
          tokens[currentIndex + 3] === '.'
            ? currentIndex + 4
            : currentIndex + 3,
          false,
        ];
      } else {
        return [
          null,
          tokens[currentIndex + 3] === '.'
            ? currentIndex + 4
            : currentIndex + 3,
          false,
        ];
      }
    } else {
      return [null, currentIndex, true];
    }
  };

  private parseEdge = (edgeStr: string): Edge => {
    const edgeType = edgeStr.startsWith('?')
      ? EdgeType.Variable
      : EdgeType.Constant;
    let prefix = '';
    let title = '';
    if (edgeType == EdgeType.Constant) {
      if (edgeStr.split(':').length > 1) {
        prefix = edgeStr.split(':')[0];
        title = edgeStr.split(':')[1];
      } else {
        title = edgeStr;
      }
    } else {
      title = edgeStr.substring(1);
    }
    const specialSymbol =
      title.at(-1) === '*' || title.at(-1) === '+' ? title.at(-1) : '';
    if (specialSymbol) {
      title = title.substring(0, title.length - 2);
    }
    return new Edge(title, edgeType, specialSymbol, prefix);
  };

  private parseNode = (nodeStr: string): Node => {
    const nodeType = nodeStr.startsWith('?')
      ? NodeType.Variable
      : NodeType.Constant;
    let prefix = '';
    let title = '';
    if (nodeType == NodeType.Constant) {
      if (nodeStr.split(':').length > 1) {
        prefix = nodeStr.split(':')[0];
        title = nodeStr.split(':')[1];
      } else {
        title = nodeStr;
      }
    } else {
      title = nodeStr.substring(1);
    }
    return new Node(title, prefix, uuidv4(), nodeType);
  };

  private tryReadMinus = (
    tokens: string[],
    query: BooleanQuery,
    currentIndex: number,
  ): [triple: Triple, idx: number, isFail: boolean] => {
    if (tokens[currentIndex] == 'MINUS') {
      const [triple, idx, isFail] = this.tryReadTriple(
        tokens,
        query,
        currentIndex + 2,
      );
      if (isFail) {
        return [null, currentIndex, true];
      }
      triple.isNegated = true;
      return [triple, idx + 1, false];
    }
    return [null, currentIndex, true];
  };

  private tryReadFilter = (
    tokens: string[],
    query: BooleanQuery,
    currentIndex: number,
  ): [triple: Triple, idx: number, isFail: boolean] => {
    if (tokens[currentIndex] === 'FILTER') {
      const [triple, idx, isFail] = this.tryReadTriple(
        tokens,
        query,
        currentIndex + 2,
      );
      if (isFail) {
        return [null, currentIndex, true];
      } else {
        return [triple, idx + 1, false];
      }
    }
    return [null, currentIndex, true];
  };

  private tryReadUnion = (
    tokens: string[],
    query: BooleanQuery,
    currentIndex: number,
  ): [formula: Formula, idx: number, isFail: boolean] => {
    const formula: Formula = new Formula();
    if (tokens[currentIndex] === '{') {
      const [idx, leftPart] = this.parseUnionOperand(
        tokens,
        query,
        currentIndex + 1,
      );
      currentIndex = idx + 1;
      formula.left = leftPart;
      formula.op = Operation.Or;
    } else {
      return [null, currentIndex, true];
    }
    if (tokens[currentIndex] === 'UNION') {
      currentIndex = currentIndex + 1;
    } else {
      return [null, currentIndex, true];
    }
    if (tokens[currentIndex] === '{') {
      const formula: Formula = new Formula();
      const [idx, rightPart] = this.parseUnionOperand(
        tokens,
        query,
        currentIndex + 1,
      );
      currentIndex = idx + 1;
      formula.right = rightPart;
    } else {
      return [null, currentIndex, true];
    }
    return [formula, currentIndex, false];
  };

  private parseUnionOperand = (
    tokens: string[],
    query: BooleanQuery,
    currentIndex: number,
  ): [number, Triple | Formula] => {
    let operand: Triple | Formula = null;
    const triples: Triple[] = [];
    while (tokens[currentIndex] !== '}') {
      const [triple, idx, isFail] = this.tryReadTriple(
        tokens,
        query,
        currentIndex + 1,
      );
      if (isFail) {
        const [triple, idx, isFail] = this.tryReadMinus(
          tokens,
          query,
          currentIndex + 1,
        );
        if (isFail) {
          throw new Error('Cannot parse left part of UNION');
        } else {
          triples.push(triple);
          currentIndex = idx;
        }
      } else {
        triples.push(triple);
        currentIndex = idx;
      }
    }
    if (triples.length == 2) {
      operand = new Formula();
      operand.left = triples[0];
      operand.right = triples[1];
      operand.op = Operation.And;
    } else if (triples.length == 1) {
      operand = triples[0];
    } else {
      throw new Error('More than 2 triples in UNION is not yet supported');
    }
    return [currentIndex + 1, operand];
  };

  private retrieveWhereLines = (allLines: string[]): string[] => {
    const result: string[] = [];
    let isSelectFound = false;
    let isWhereFound = false;
    allLines.forEach((line) => {
      if (isWhereFound && !line.startsWith('ORDER')) {
        result.push(line);
      }
      if (line.includes('SELECT')) {
        console.log('SELECT found');
        isSelectFound = true;
      }
      if (isSelectFound && line.includes('WHERE')) {
        console.log('WHERE within SELECT found');
        isWhereFound = true;
      }
    });
    return result.slice(0, result.length - 2);
  };
}
