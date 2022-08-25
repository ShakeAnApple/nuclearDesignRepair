import { Substitution } from './Substitution';

export class SingleResult {
  constructor(substitutions: Substitution[]) {
    this.substitutions = substitutions;
  }
  substitutions: Substitution[];
}
