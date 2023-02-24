import { parse, valid, HTMLElement } from 'node-html-parser';
import { EmptyAttributeError, NotDefinedError, ValidationError } from './errors';
import { EntityType } from './types';

type CTX = Record<string, any>;

const attrsRegex = /(\s+vl-\w+=["'](\w+|)["'])/g;
const variableRegex = /{{\s*([^\s]+|)\s*}}/g;

function handleVariables(markup: string) {
  return markup.replace(variableRegex, `<span vl-variable>$1</span>`);
}

function handleAttrs(markup: string) {
  return markup.replace(attrsRegex, `$1 vl-attr`);
}

interface NodesHash {
  variables: HTMLElement[];
  attrs: HTMLElement[];
}

class TemplateEngine {
  private markup: string;
  private htmlTree: ReturnType<typeof parse>;
  private nodes: NodesHash;

  constructor(markup: string) {
    this.markup = markup;
    this.markup = handleVariables(this.markup);
    this.markup = handleAttrs(this.markup);

    this.htmlTree = parse(this.markup);

    if (!valid(this.markup)) {
      throw new ValidationError();
    }

    this.nodes = {
      variables: this.htmlTree.querySelectorAll('[vl-variable]'),
      attrs: this.htmlTree.querySelectorAll('[vl-attr]'),
    };
  }

  compile(ctx: CTX = {}) {
    this.nodes.variables.forEach((node) => {
      const variableName = node.textContent;

      if (!variableName) {
        throw new ValidationError();
      }

      const variableValue = ctx[variableName];

      if (!(variableName in ctx)) {
        throw new NotDefinedError(EntityType.variable, variableName);
      }

      node.replaceWith(variableValue);
    });

    this.nodes.attrs.forEach((node) => {
      Object.entries(node.attributes).forEach(([name, value]) => {
        if (!name.startsWith('vl-') || name === 'vl-attr') return;

        const attributeName = name.replace(/^vl-/, '');
        const attributeVariable = value as unknown as string;

        if (!attributeVariable) {
          throw new EmptyAttributeError(attributeName);
        }

        if (!(attributeVariable in ctx)) {
          throw new NotDefinedError(EntityType.attributeInitializer, value);
        }

        node.setAttribute(attributeName, ctx[attributeVariable]);
        node.removeAttribute(name);
      });

      node.removeAttribute('vl-attr');
    });

    return this.htmlTree.toString();
  }
}

module.exports = { TemplateEngine };
