import { QueryGraphResult } from '../fix/QueryGraphResult';
import { Class } from './Class';
import { Individual } from './Individual';
import { Property } from './Property';
import { PropertyValue } from './PropertyValue';

export class Ontology {
  constructor(
    properties: Property[],
    classes: Class[],
    individuals: Individual[],
  ) {
    this.properties = properties;
    this.classes = classes;
    this.individuals = individuals;
  }
  properties: Property[];
  classes: Class[];
  individuals: Individual[];

  findIndividualByName = (individualName: string) => {
    return this.individuals.find(
      (individual) => individual.title === individualName,
    );
  };

  findPropertyByName = (propertyName: string) => {
    return this.properties.find((property) => property.title === propertyName);
  };

  findSimilarProperties = (property: Property): Property => {
    if (
      (!property.domain || property.domain.length == 0) &&
      (!property.range || property.range.length == 0)
    ) {
      return null;
    }
    const sameDomainProperties: Property[] = [];
    if (property.domain && property.domain.length > 0) {
      property.domain.forEach((domain) => {
        sameDomainProperties.push(
          ...this.properties.filter(
            (otherProp) =>
              otherProp.title !== property.title &&
              otherProp.domain.some(
                (otherDomain) =>
                  otherDomain &&
                  (otherDomain.title == domain.title ||
                    (otherDomain.parent &&
                      domain.parent &&
                      otherDomain.parent.title == domain.parent.title)),
              ),
          ),
        );
      });
    }
    const propertiesToChooseRange =
      sameDomainProperties.length > 0 ? sameDomainProperties : this.properties;
    const candidates =
      property.range && property.range.length > 0
        ? []
        : propertiesToChooseRange;
    if (property.range && property.range.length > 0) {
      property.range.forEach((range) => {
        propertiesToChooseRange.forEach((otherProp) => {
          if (
            otherProp.title !== property.title &&
            otherProp.range.some(
              (otherRange) =>
                otherRange.title == range.title ||
                (otherRange.parent &&
                  range.parent &&
                  otherRange.parent.title == range.parent.title),
            )
          ) {
            candidates.push(otherProp);
          }
        });
      });
    }
    let maxSimilarityScore = 0;
    let newProperty: Property;
    candidates.forEach((candidate) => {
      let similarityScore = 0;
      if (property.domain && property.domain.length > 0) {
        candidate.domain.forEach((otherDomain) => {
          if (
            property.domain.some((domain) => domain.title == otherDomain.title)
          ) {
            similarityScore += 1;
          } else if (
            otherDomain.parent &&
            property.domain.some(
              (domain) =>
                domain.parent &&
                domain.parent.title == otherDomain.parent.title,
            )
          ) {
            similarityScore += 0.5;
          }
        });
      }
      if (property.range && property.range.length > 0) {
        candidate.range.forEach((otherRange) => {
          if (property.range.some((range) => range.title == otherRange.title)) {
            similarityScore += 1;
          } else if (
            otherRange.parent &&
            property.range.some(
              (range) =>
                range.parent && range.parent.title == otherRange.parent.title,
            )
          ) {
            similarityScore += 0.5;
          }
        });
      }
      if (similarityScore > maxSimilarityScore) {
        maxSimilarityScore = similarityScore;
        newProperty = candidate;
      }
    });
    return newProperty;
  };

  findSimilarIndividualWithQuery = (
    individual: Individual,
    queryGraphResult: QueryGraphResult,
  ) => {};

  // NOTE: outputs the first max
  findSimilarIndividual = (individual: Individual): Individual => {
    let newIndividual: Individual;
    const incomingProperties: [PropertyValue, Individual][] =
      this.getIncomingProperties(individual);
    let maxSimilarityScore = 0;
    this.individuals.forEach((otherIndividual) => {
      if (otherIndividual.title !== individual.title) {
        if (
          otherIndividual.class.title === individual.class.title ||
          otherIndividual.class.parent === individual.class.parent
        ) {
          let similarityScore = 0.5; // 0.5 for being of the same class
          otherIndividual.properties.forEach((otherProp) => {
            const prop: PropertyValue = individual.properties.find(
              (property) =>
                property.property.title === otherProp.property.title,
            );
            if (prop) {
              similarityScore += 1; // 1 for having the same outgoing property
              if (prop.value == otherProp.value) {
                similarityScore += 2; // 2 for having the same value
              }
            }
          });
          const otherIncomingProperties =
            this.getIncomingProperties(otherIndividual);
          otherIncomingProperties.forEach((otherPropIndividual) => {
            const prop = incomingProperties.find(
              (propertyIndividual) =>
                propertyIndividual[0].property.title ===
                otherPropIndividual[0].property.title,
            );
            if (prop) {
              similarityScore += 1; // 1 for having the same incoming property
              if (prop[1].title === otherPropIndividual[1].title) {
                similarityScore += 2; // 2 for having the same value
              }
            }
          });

          if (similarityScore > maxSimilarityScore) {
            maxSimilarityScore = similarityScore;
            newIndividual = otherIndividual;
          }
        }
      }
    });
    return newIndividual;
  };

  private getIncomingProperties = (
    individual: Individual,
  ): [PropertyValue, Individual][] => {
    const incomingProperties: [PropertyValue, Individual][] = [];
    this.individuals.forEach((currIndividual) => {
      currIndividual.properties.forEach((property) => {
        if (
          property.value instanceof Individual &&
          (property.value as Individual).title === individual.title
        ) {
          incomingProperties.push([property, currIndividual]);
        }
      });
    });
    return incomingProperties;
  };
}
