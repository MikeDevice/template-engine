const htmlBeautify = require('js-beautify').html;
const { TemplateEngine } = require('../../dist');

module.exports = (req, res) => {
    try {
        const templateEngine = new TemplateEngine(req.body.code);
        const result = templateEngine.compile(req.body.ctx);

        res.json({
            code: htmlBeautify(
                result,
                { indent_size: 2, max_preserve_newlines: 0 }
            )
        })
    } catch (err) {
        res.status(500).json({ error: `${err.name}: ${err.message}` })
    }
}
