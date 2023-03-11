import { EntityType } from './types';

export class NotDefinedError extends Error {
  constructor(entityType: EntityType, name: string) {
    super(`${entityType} "${name}" is not defined`);

    this.name = 'NotDefinedError';
  }
}

export class ValidationError extends Error {
  constructor() {
    super('markup is not valid');

    this.name = 'ValidationError';
  }
}

export class EmptyAttributeError extends Error {
  constructor(attributeName: string) {
    super(`attribute "${attributeName}" has an empty initializer`);

    this.name = 'EmptyAttributeError';
  }
}

export class IncorrectForParamsError extends Error {
  constructor(params: string | undefined) {
    super(`params for attribute vl-for are incorrect: "${params}"`);

    this.name = 'IncorrectForParamsError';
  }
}

export class IncorrectTypeError extends Error {
  constructor(name: string) {
    super(`variable "${name}" has an incorrect type`);

    this.name = 'IncorrectTypeError';
  }
}
