const { toMatchInlineSnapshot } = require('jest-snapshot');
const {
  NotDefinedError,
  ValidationError,
  EmptyAttributeError,
  IncorrectForParamsError,
  IncorrectConditionParamsError,
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

describe('just markup', () => {
  test('valid', async () => {
    const fileName = 'plain.html';

    const markup = await loadTemplate(fileName);
    const code = await compileFromFile(fileName);

    expect(code).toBe(markup);
  });

  test('not valid', async () => {
    expect(compile('<div>')).rejects.toThrow(new ValidationError());
  });
});

describe('variables', () => {
  test('empty variable', async () => {
    expect(compile('<div>{{}}</div>')).rejects.toThrow(new ValidationError());
  });

  test('variable is not defined', async () => {
    expect(compile('<div>{{text}}</div>')).rejects.toThrow(new NotDefinedError(EntityType.variable, 'text'));
  });

  test('valid variable', async () => {
    const markup = '<div>{{text}}</div>';
    const ctx = { text: 'hello' };
    const result = await compile(markup, ctx);

    expect(result).toBe('<div>hello</div>');
  });
});

describe('attributes', () => {
  test('attribute value is not defined', async () => {
    expect(compile('<div vl-class="className"></div>')).rejects.toThrow(
      new NotDefinedError(EntityType.attributeInitializer, 'className'),
    );
  });

  test('attribute with empty initializer', async () => {
    expect(compile('<div vl-class=""></div>')).rejects.toThrow(new EmptyAttributeError('class'));
  });

  test('correct attributes', async () => {
    const markup = '<div vl-class="className" vl-id="some-id"></div>';

    const ctx = {
      className: 'hello',
      'some-id': 'root',
    };

    expect(await compile(markup, ctx)).toBe('<div class="hello" id="root"></div>');
  });
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

describe('conditions', () => {
  test('empty param', async () => {
    expect(compile('<div vl-if=""></div>')).rejects.toThrow(new IncorrectConditionParamsError(''));
  });

  test('param is not a one word', async () => {
    expect(compile('<div vl-if="some string"></div>')).rejects.toThrow(new IncorrectConditionParamsError('some string'));
  });

  test('no variable in context', async () => {
    expect(compile('<div vl-if="item"></div>')).rejects.toThrow(new NotDefinedError(EntityType.variable, 'item'));
  });

  test('condition is truthy', async () => {
    const markup = '<div vl-if="item">hello</div>';

    const ctx = {
      item: true,
    };

    expect(await compile(markup, ctx)).toMatchTemplate(`
      <div>hello</div>
    `);
  });

  test('condition is falsy', async () => {
    const markup = '<div vl-if="item">hello</div>';

    const ctx = {
      item: false,
    };

    expect(await compile(markup, ctx)).toMatchTemplate('');
  });

  test('condition is truthy with "else" branch', async () => {
    const markup = `
      <div>
        <div vl-if="conditionItem">
          <h1>it's true</h1>
        </div>
        <p vl-else>it's false</p>
      </div>
    `;

    const ctx = {
      conditionItem: true,
    };

    expect(await compile(markup, ctx)).toMatchTemplate(`
      <div>
        <div>
          <h1>it's true</h1>
        </div>
      </div>
    `);
  });

  test('condition is falsy with "else" branch', async () => {
    const markup = `
      <div>
        <div vl-if="conditionItem">
          <h1>it's true</h1>
        </div>
        <p vl-else>it's false</p>
      </div>
    `;

    const ctx = {
      conditionItem: false,
    };

    expect(await compile(markup, ctx)).toMatchTemplate(`
      <div>
        <p>it's false</p>
      </div>
    `);
  });

  test('nested condition: true, true', async () => {
    const markup = `
      <main>
        <section vl-if="shouldShowSection" class="section">
          <h1>it's true</h1>
          <img src="/some-image.png" vl-if="shouldShowImage">
          <p vl-else>no image</p>
        </section>
        <div vl-else>
          <h2>Hello!</h2>
          <img src="/some-image.png" vl-if="shouldShowImage">
        </div>
      </main>
    `;

    const ctx = {
      shouldShowSection: true,
      shouldShowImage: true,
    };

    expect(await compile(markup, ctx)).toMatchTemplate(`
      <main>
        <section class="section">
          <h1>it's true</h1>
          <img src="/some-image.png">
        </section>
      </main>
    `);
  });

  test('nested condition: true, false', async () => {
    const markup = `
      <main>
        <section vl-if="shouldShowSection" class="section">
          <h1>it's true</h1>
          <img src="/some-image.png" vl-if="shouldShowImage">
          <p vl-else>no image</p>
        </section>
        <div vl-else>
          <h2>Hello!</h2>
          <img src="/some-image.png" vl-if="shouldShowImage">
        </div>
      </main>
    `;

    const ctx = {
      shouldShowSection: true,
      shouldShowImage: false,
    };

    expect(await compile(markup, ctx)).toMatchTemplate(`
      <main>
        <section class="section">
          <h1>it's true</h1>
          <p>no image</p>
        </section>
      </main>
    `);
  });

  test('nested condition: false, true', async () => {
    const markup = `
      <main>
        <section vl-if="shouldShowSection" class="section">
          <h1>it's true</h1>
          <img src="/some-image.png" vl-if="shouldShowImage">
          <p vl-else>no image</p>
        </section>
        <div vl-else>
          <h2>Hello!</h2>
          <img src="/some-image.png" vl-if="shouldShowImage">
        </div>
      </main>
    `;

    const ctx = {
      shouldShowSection: false,
      shouldShowImage: true,
    };

    expect(await compile(markup, ctx)).toMatchTemplate(`
      <main>
        <div>
          <h2>Hello!</h2>
          <img src="/some-image.png">
        </div>
      </main>
    `);
  });

  test('nested condition: false, false', async () => {
    const markup = `
      <main>
        <section vl-if="shouldShowSection" class="section">
          <h1>it's true</h1>
          <img src="/some-image.png" vl-if="shouldShowImage">
          <p vl-else>no image</p>
        </section>
        <div vl-else>
          <h2>Hello!</h2>
          <img src="/some-image.png" vl-if="shouldShowImage">
        </div>
      </main>
    `;

    const ctx = {
      shouldShowSection: false,
      shouldShowImage: false,
    };

    expect(await compile(markup, ctx)).toMatchTemplate(`
      <main>
        <div>
          <h2>Hello!</h2>
        </div>
      </main>
    `);
  });
});
