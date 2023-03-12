const { toMatchInlineSnapshot } = require('jest-snapshot');
const {
  NotDefinedError,
  ValidationError,
  EmptyAttributeError,
  IncorrectForParamsError,
  IncorrectTypeError,
} = require('../dist/errors');
const { EntityType } = require('../dist/types');
const {
  compile, compileFromFile, loadTemplate, trimTemplate,
} = require('./helpers');

expect.extend({
  toMatchTemplate(received, expected) {
    return toMatchInlineSnapshot.call(this, trimTemplate(received), `"${trimTemplate(expected)}"`);
  },
});

describe('Errors', () => {
  test('not valid markup', async () => {
    expect(compile('<div>')).rejects.toThrow(new ValidationError());
  });

  test('empty variable', async () => {
    expect(compile('<div>{{}}</div>')).rejects.toThrow(new ValidationError());
  });

  test('variable is not defined', async () => {
    expect(compile('<div>{{text}}</div>')).rejects.toThrow(new NotDefinedError(EntityType.variable, 'text'));
  });

  test('attribute value is not defined', async () => {
    expect(compile('<div vl-class="className"></div>')).rejects.toThrow(
      new NotDefinedError(EntityType.attributeInitializer, 'className'),
    );
  });

  test('attribute with empty initializer', async () => {
    expect(compile('<div vl-class=""></div>')).rejects.toThrow(new EmptyAttributeError('class'));
  });
});

describe('Correct rendering', () => {
  test('plain markup', async () => {
    const fileName = 'plain.html';

    const markup = await loadTemplate(fileName);
    const code = await compileFromFile(fileName);

    expect(code).toBe(markup);
  });

  test('variable', async () => {
    const markup = '<div>{{text}}</div>';
    const ctx = { text: 'hello' };
    const result = await compile(markup, ctx);

    expect(result).toBe('<div>hello</div>');
  });

  test('attributes', async () => {
    const markup = '<div vl-class="className" vl-id="some-id"></div>';

    const ctx = {
      className: 'hello',
      'some-id': 'root',
    };

    expect(await compile(markup, ctx)).toBe('<div class="hello" id="root"></div>');
  });

  describe('loops', () => {
    describe('errors', () => {
      test('empty params', async () => {
        expect(compile('<div vl-for=""></div>')).rejects.toThrow(new IncorrectForParamsError(''));
      });
      test('wrong params: one word', async () => {
        expect(compile('<div vl-for="test"></div>')).rejects.toThrow(new IncorrectForParamsError('test'));
      });
      test('wrong params: multiple words', async () => {
        expect(compile('<div vl-for="test word"></div>')).rejects.toThrow(new IncorrectForParamsError('test word'));
      });
      test('no variable in context ', async () => {
        expect(compile('<div vl-for="item in items"></div>')).rejects.toThrow(new NotDefinedError(EntityType.variable, 'items'));
      });
      test('incorrect variable in context ', async () => {
        expect(compile('<div vl-for="item in items"></div>', { items: 'something' })).rejects.toThrow(new IncorrectTypeError('items'));
      });
    });

    describe('correct', () => {
      test('simple markup', async () => {
        const markup = '<div vl-for="item in items">{{item}}</div>';

        const ctx = {
          items: [1, 2, 3],
        };

        expect(await compile(markup, ctx)).toMatchTemplate(`
          <div>1</div>
          <div>2</div>
          <div>3</div>
        `);
      });

      test('heavy markup', async () => {
        const markup = `
          <div vl-for="item in items" class="main">
            <p class="main__data">this is {{item}}</p>
          </div>
        `;

        const ctx = {
          items: ['hello', 'test', 'something'],
        };

        expect(await compile(markup, ctx)).toMatchTemplate(`
          <div class="main">
            <p class="main__data">this is hello</p>
          </div>
          <div class="main">
            <p class="main__data">this is test</p>
          </div>
          <div class="main">
            <p class="main__data">this is something</p>
          </div>
        `);
      });

      test('multiple loops', async () => {
        const markup = `
          <section vl-for="sectionData in sections">
            <div>{{sectionData}}</div>
          </section>

          <p vl-for="word in words">{{word}}</p>
        `;

        const ctx = {
          sections: ['section1', 'section2'],
          words: ['word1', 'word2', 'word3'],
        };

        expect(await compile(markup, ctx)).toMatchTemplate(`
          <section>
            <div>section1</div>
          </section>
          <section>
            <div>section2</div>
          </section>
          <p>word1</p>
          <p>word2</p>
          <p>word3</p>
        `);
      });
    });
  });
});
