import * as fs from 'fs';
import { Ontology } from '../../model/ontology/Ontology';
import { XMLParser } from 'fast-xml-parser';
import { Property, PropertyType } from '../../model/ontology/Property';
import { Class } from '../../model/ontology/Class';
import { Individual } from '../../model/ontology/Individual';
import { DataType, PropertyValue } from '../../model/ontology/PropertyValue';

export class OntologyParser {
  parseOntologyFromFile = (filepath: string) => {
    const options = {
      attributeNamePrefix: '',
      //attrNodeName: false,
      //textNodeName : "#text",
      ignoreAttributes: false,
      ignoreNameSpace: false,
    };
    const parser = new XMLParser(options);
    const allLines = fs.readFileSync(filepath, 'utf-8');
    const ontologyJson = parser.parse(allLines)['rdf:RDF'];
    // console.log(ontologyJson);
    const classes: Class[] = this.parseClasses(ontologyJson['owl:Class']);
    const objectProperties: Property[] = this.parseObjectProperties(
      ontologyJson['owl:ObjectProperty'],
      classes,
    );
    const datatypeProperties: Property[] = this.parseDatatypeProperties(
      ontologyJson['owl:DatatypeProperty'],
      classes,
    );
    const properties = datatypeProperties.concat(objectProperties);
    const individuals: Individual[] = this.parseIndividuals(
      ontologyJson['owl:NamedIndividual'],
      properties,
      classes,
    );
    const ontology = new Ontology(properties, classes, individuals);
    // console.log(ontology);
    return ontology;
  };

  private parseProperties = (
    propertiesJson: any,
    classes: Class[],
    isObjectProperties: boolean,
  ): Property[] => {
    const properties: Property[] = [];
    const parentsNamesByPropertiesNames: { [key: string]: string } = {};
    const propertiesByNames: { [key: string]: Property } = {};
    propertiesJson.forEach((propertyJson) => {
      const title = propertyJson['rdf:about'].split('#')[1];
      const property = new Property(
        title,
        isObjectProperties ? PropertyType.Object : PropertyType.DataType,
      );
      //////////// domain
      if (
        propertyJson['rdfs:domain'] &&
        propertyJson['rdfs:domain']['rdf:resource']
      ) {
        const classDomainTitle =
          propertyJson['rdfs:domain']['rdf:resource'].split('#')[1];
        const classDomain = classes.find(
          (classObj) => classObj.title === classDomainTitle,
        );
        property.domain.push(classDomain);
      } else if (
        propertyJson['rdfs:domain'] &&
        propertyJson['rdfs:domain']['owl:Class'] &&
        propertyJson['rdfs:domain']['owl:Class']['owl:unionOf']
      ) {
        const domains: Class[] = [];
        propertyJson['rdfs:domain']['owl:Class']['owl:unionOf'][
          'rdf:Description'
        ].forEach((descr) => {
          const classDomainTitle = descr['rdf:about'].split('#')[1];
          const classDomain = classes.find(
            (classObj) => classObj.title === classDomainTitle,
          );
          domains.push(classDomain);
        });
        property.domain.push(...domains);
      }
      ////////////////////// range
      if (
        propertyJson['rdfs:range'] &&
        propertyJson['rdfs:range']['rdf:resource']
      ) {
        const classRangeTitle =
          propertyJson['rdfs:range']['rdf:resource'].split('#')[1];
        const classRange = classes.find(
          (classObj) => classObj.title === classRangeTitle,
        );
        property.range.push(classRange);
      } else if (
        propertyJson['rdfs:range'] &&
        propertyJson['rdfs:range']['owl:Class'] &&
        propertyJson['rdfs:range']['owl:Class']['owl:unionOf']
      ) {
        const ranges: Class[] = [];
        propertyJson['rdfs:range']['owl:Class']['owl:unionOf'][
          'rdf:Description'
        ].forEach((descr) => {
          const classRangeTitle = descr['rdf:about'].split('#')[1];
          const classRange = classes.find(
            (classObj) => classObj.title === classRangeTitle,
          );
          ranges.push(classRange);
        });
        property.range.push(...ranges);
      }

      propertiesByNames[title] = property;
      if (
        propertyJson['rdfs:subPropertyOf'] &&
        propertyJson['rdfs:subPropertyOf']['rdf:resource']
      ) {
        const parentName =
          propertyJson['rdfs:subPropertyOf']['rdf:resource'].split('#')[1];
        parentsNamesByPropertiesNames[title] = parentName;
      }
      properties.push(property);
    });

    for (const [className, parentName] of Object.entries(
      parentsNamesByPropertiesNames,
    )) {
      propertiesByNames[className].parent = propertiesByNames[parentName];
    }

    return properties;
  };

  private parseObjectProperties = (
    propertiesJson: any,
    classes: Class[],
  ): Property[] => {
    return this.parseProperties(propertiesJson, classes, true);
  };

  private parseDatatypeProperties = (
    propertiesJson: any,
    classes: Class[],
  ): Property[] => {
    return this.parseProperties(propertiesJson, classes, false);
  };

  private parseClasses = (classesJson: any): Class[] => {
    const classes: Class[] = [];
    const parentsNamesByClassesNames: { [key: string]: string } = {};
    const classesByNames: { [key: string]: Class } = {};

    classesJson.forEach((classJson) => {
      const title = classJson['rdf:about'].split('#')[1];
      const classObj = new Class(title);
      classesByNames[title] = classObj;
      if (
        classJson['rdfs:subClassOf'] &&
        classJson['rdfs:subClassOf']['rdf:resource']
      ) {
        const parentName =
          classJson['rdfs:subClassOf']['rdf:resource'].split('#')[1];
        parentsNamesByClassesNames[title] = parentName;
      }
      classes.push(classObj);
    });

    for (const [className, parentName] of Object.entries(
      parentsNamesByClassesNames,
    )) {
      classesByNames[className].parent = classesByNames[parentName];
    }

    return classes;
  };

  private parseIndividuals = (
    individualsJson: any,
    properties: Property[],
    classes: Class[],
  ): Individual[] => {
    const individuals: Individual[] = [];
    const individualsByTitle: { [key: string]: Individual } = {};

    individualsJson.forEach((individualJson) => {
      const individualTitle = individualJson['rdf:about'].split('#')[1];
      const individualClassTitle =
        individualJson['rdf:type']['rdf:resource'].split('#')[1];
      const individualClass = classes.find(
        (classObj) => classObj.title === individualClassTitle,
      );
      const individual = new Individual(individualTitle, individualClass);
      individuals.push(individual);
      individualsByTitle[individualTitle] = individual;
    });

    individualsJson.forEach((individualJson) => {
      const individualTitle = individualJson['rdf:about'].split('#')[1];

      for (const [key, value] of Object.entries(individualJson)) {
        if (key.startsWith('rdf')) {
          continue;
        }
        const property = properties.find((prop) => prop.title === key);
        if (!property) {
          console.log('Cannot find property with title ' + key);
          continue;
        }
        // single resource (individual)
        if (value['rdf:resource']) {
          const resourceTitle = value['rdf:resource'].split('#')[1];
          const valueObj = individualsByTitle[resourceTitle];
          if (!valueObj) {
            console.log('Cannot find ' + resourceTitle);
          } else {
            const propValue = new PropertyValue(
              property,
              valueObj,
              DataType.Individual,
            );
            individualsByTitle[individualTitle].properties.push(propValue);
          }
        }
        // array of resources (individuals)
        else if (Array.isArray(value)) {
          const valuesObj = [];
          value.forEach((propertyValue) => {
            const resourceTitle = propertyValue['rdf:resource'].split('#')[1];
            const valueObj = individualsByTitle[resourceTitle];
            if (!valueObj) {
              console.log('Cannot find ' + resourceTitle);
            } else {
              valuesObj.push(valueObj);
            }
          });
          const propValue = new PropertyValue(
            property,
            valuesObj,
            DataType.Individual,
          );
          individualsByTitle[individualTitle].properties.push(propValue);
        } else {
          const valueObjDatatypeStr = value['rdf:datatype'].split('#')[1];
          const valueObjDatatype =
            valueObjDatatypeStr === 'integer'
              ? DataType.Int
              : valueObjDatatypeStr === 'boolean'
              ? DataType.Bool
              : DataType.Unknown;
          if (valueObjDatatype == DataType.Unknown) {
            console.log('Unsupported datatype ' + valueObjDatatypeStr);
            continue;
          }
          const valueObj = value['#text'];
          const propValue = new PropertyValue(
            property,
            valueObj,
            valueObjDatatype,
          );
          individualsByTitle[individualTitle].properties.push(propValue);
        }
      }
    });
    return individuals;
  };
}
