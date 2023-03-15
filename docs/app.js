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
            <body vl-class="rootClassName">
                <h1 vl-class="titleClassName">
                    {{title}}
                </h1>
                <p vl-class="descriptionClassName">
                    {{description}}
                </p>
            </body>
        `
        .trim()
        .replace(/^\s{12}/mg, '');

        const context = JSON.stringify({
            title: 'this is a title',
            description: 'hello',
            rootClassName: 'page',
            titleClassName: 'page__header',
            descriptionClassName: 'page__description'
        }, null, 2)

        $source.innerHTML = src;
        $context.innerHTML = context;
        $dest.innerHTML = await compile(src, JSON.parse(context));
    }

    function syncSource() {
        $source.addEventListener('input', debounce((e) => {
            $dest.innerHTML = 'compiling...';

            compile(e.target.value, JSON.parse($context.value))
                .then(text => {
                    $dest.innerHTML = text;
                })
        }, 400));
    }

    init();
    syncSource();
})
