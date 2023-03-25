function debounce(fn, delay = 0) {
    let id;

    return (...args) => {
        if (id) {
            clearTimeout(id);
        }

        id = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}

async function compile(code, ctx) {
    try {
        const response = await fetch(
            '/api/compile',
            {
                method: 'post',
                body: JSON.stringify({ code, ctx }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const result = await response?.json();

        if (!response.ok) {
            throw new Error(result.error)
        }

        return result?.code;
    } catch (err) {
        return err;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    var $source = document.getElementById('source');
    var $context = document.getElementById('context');
    var $dest = document.getElementById('dest');

    async function init() {
        const src  = `
            <body vl-class="cssPage">
              <h1 vl-class="cssPage__Header">
                {{title}}
              </h1>
              <p vl-class="cssPage__Description">
                {{description}}
              </p>
              <h2>Condition example</h2>
              <p vl-if="conditionValue">value is truthy</p>
              <p vl-else>value is falsy</p>
              <ul>
                <li vl-for="item in array">it's a {{item}}</li>
              </ul>
            </body>
        `
        .trim()
        .replace(/^\s{12}/mg, '');

        const context = JSON.stringify({
            title: 'Template Engine',
            description: 'Look! It\'s a template engine',
            conditionValue: true,
            array: ['book', 'teapot', 'cup'],
            cssPage: 'page',
            cssPage__Header: 'page__header',
            cssPage__Description: 'page__description',
        }, null, 2)

        $source.innerHTML = src;
        $context.innerHTML = context;
        $dest.innerHTML = await compile(src, JSON.parse(context));
    }

    function sync() {
        async function _compileWithInsertToPage(code, ctx) {
            $dest.innerHTML = 'compiling...';

            try {
                $dest.innerHTML = await compile(code, JSON.parse(ctx));
            } catch (err) {
                $dest.innerHTML = 'Error: compiling error. Check your context JSON';
            }
        };

        const compileWithInsertToPage = debounce(_compileWithInsertToPage, 400);

        $source.addEventListener('input', (e) => {
            compileWithInsertToPage(e.target.value, $context.value);
        });

        $context.addEventListener('input', (e) => {
            compileWithInsertToPage($source.value, e.target.value);
        });
    }

    init();
    sync();
})
