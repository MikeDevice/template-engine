# Template engine

## Why?

One day I decided to realize how modern web applications work, so I decided to create own frameworks and relative tools for the purpose of self-education.

## What is here?

Here is the first part of my experiment — a template engine. It allows you to convert html markups with data to real html template.

## Usage

First of all you have to import the engine `class` and initialize it with markup:

```ts
const { TemplateEngine } = require('template-engine');

// here you can use any template
const markup = '<div>Hello, {{name}}!</div>';
const templateEngine = new TemplateEngine(markup);

// <div>Hello, World!</div>
templateEngine.compile({ name: 'World' });

// <div>Hello, whatever else!</div>
templateEngine.compile({ name: 'whatever else' });
```

## Features

### Variables inside texts

You can use variables wrapping them with double curly braces

```html
// markup
<div>Hello, {{name}}!</div>

// script templateEngine.compile({ name: 'World' }); // result
<div>Hello, World!</div>
```

### Variables inside html attributes

Usage variables inside html attributes is possible when you prefix any html attribute with `vl` keyword:

```html
<div vl-class="someVariable1" vl-id="someVariable2" vl-style="someVariable3" vl-anyAttr="..."></div>
```

The real example:

```html
// markup
<div vl-class="className" vl-id="some-id">Hello!</div>

// script templateEngine.compile({ className: 'root', 'some-id': 'hello' }); // result
<div class="root" id="hello">Hello!</div>
```

### Loops

To create loop, use the `vl-for` keyword:

```html
<div vl-for="item in items">
  <p>hello {{item}}</p>
  <p>{{item}} hello</p>
</div>
```

### Conditions

To create condition, use the `vl-if` keyword:

```html
<main>
  <section vl-if="shouldShowSection" class="section">
    <h1>it's true</h1>
    <img src="/some-image.png" vl-if="shouldShowImage" />
    <p vl-else>no image</p>
  </section>
  <div vl-else>
    <h2>Hello!</h2>
    <img src="/some-image.png" vl-if="shouldShowImage" />
  </div>
</main>
```

## TODO

1. Add **nested** loops.
