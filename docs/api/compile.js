const { TemplateEngine } = require('../../dist');

module.exports = (req, res) => {
    try {
        const templateEngine = new TemplateEngine(req.body.code);
        const result = templateEngine.compile(req.body.ctx);

        res.json({ code: result })
    } catch (err) {
        res.status(500).json({ error: `${err.name}: ${err.message}` })
    }
}
