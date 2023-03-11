import { parse, valid, HTMLElement } from 'node-html-parser';
import { EmptyAttributeError, IncorrectForParamsError, IncorrectTypeError, NotDefinedError, ValidationError } from './errors';
import { EntityType } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  loops: HTMLElement[];
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
      loops: this.htmlTree.querySelectorAll('[vl-for]'),
    };
  }

  private replaceVariableWithValue(node: HTMLElement, ctx: CTX) {
    const variableName = node.textContent;

    if (!variableName) {
      throw new ValidationError();
    }

    const variableValue = ctx[variableName];

    if (!(variableName in ctx)) {
      throw new NotDefinedError(EntityType.variable, variableName);
    }

    node.replaceWith(variableValue.toString());
  }

  private parseLoop(node: HTMLElement, ctx: CTX) {
    const forParamsStr = node.getAttribute('vl-for');
    const forParamsMatch = forParamsStr?.match(/([_\w\d]+)\s+in\s+([_\w\d]+)/);

    if (!forParamsMatch) {
      throw new IncorrectForParamsError(forParamsStr);
    }

    const [, iteratorVar, ctxVariable] = forParamsMatch;

    if (!(ctxVariable in ctx)) {
      throw new NotDefinedError(EntityType.variable, ctxVariable);
    }

    const ctxValue = ctx[ctxVariable];

    if (!Array.isArray(ctxValue)) {
      throw new IncorrectTypeError(ctxVariable);
    }

    return { array: ctxValue, iteratorVar }
  }

  private handleLoop(node: HTMLElement, ctx: CTX) {
    const { array, iteratorVar } = this.parseLoop(node, ctx);

    node.removeAttribute('vl-for');

    const parent = node.parentNode;
    parent.innerHTML = ''

    array.forEach((value) => {
      const clone = node.clone() as HTMLElement;
      const iterationCtx = { [iteratorVar]: value };

      clone.querySelectorAll('[vl-variable]').forEach((node) => {
        this.replaceVariableWithValue(node, iterationCtx);
      })

      parent.appendChild(clone)
    });
  }

  compile(ctx: CTX = {}) {
    this.nodes.loops.forEach((node) => this.handleLoop(node, ctx))

    this.htmlTree.querySelectorAll('[vl-variable]').forEach((node) => {
      this.replaceVariableWithValue(node, ctx);
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
