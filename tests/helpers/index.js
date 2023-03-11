const fs = require('fs');
const path = require('path');
const util = require('util');
const { TemplateEngine } = require('../../dist');

const readFile = util.promisify(fs.readFile);

async function loadTemplate(fileName) {
  const data = await readFile(path.resolve(__dirname, `../fixtures/${fileName}`), {});
  return data.toString();
}

async function compile(code, data) {
  const templateEngine = new TemplateEngine(code);

  return templateEngine.compile(data);
}

exports.compileFromFile = async function (fileName, ...args) {
  const code = await loadTemplate(fileName);
  return compile(code, ...args);
};

exports.trimTemplate = function (template) {
  return template.replace(/\s*(<[^>]+>)\s*/gm, '$1')
}

exports.compile = compile;
exports.loadTemplate = loadTemplate;
