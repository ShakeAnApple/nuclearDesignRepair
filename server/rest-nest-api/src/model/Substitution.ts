export class Substitution {
  // TODO: should be types but we'll just search by name for now
  constructor(variableName: string, variableValue: string) {
    this.variableName = variableName;
    this.variableValue = variableValue;
  }
  variableName: string;
  variableValue: string;
}
