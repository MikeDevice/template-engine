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
