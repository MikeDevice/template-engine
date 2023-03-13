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

document.addEventListener('DOMContentLoaded', () => {
    var $source = document.getElementById('source');
    var $dest = document.getElementById('dest');

    function compile(src) {
        return src;
    }

    function init() {
        const src  = `
            <div vl-class="rootClassName" vl-id="rootId">
                <h1 vl-class="titleClassName">
                    {{title}}
                </h1>
                <p vl-class="descriptionClassName">
                    {{description}}
                </p>
            </div>
        `
        .trim()
        .replace(/^\s{12}/mg, '');

        $source.innerHTML = src;
        $dest.innerHTML = compile(src);
    }

    function syncSource() {
        $source.addEventListener('input', debounce((e) => {
            $dest.innerHTML = compile(e.target.value);
        }, 400));
    }

    init();
    syncSource();
})
