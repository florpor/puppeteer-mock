# puppeteer-mock

Build a bridge between Puppeteer and your favourite HTTP mocking library

puppeteer-mock makes the testing of Puppeteer-backed code easy by enabling the mocking of page responses which arrive at the headless browser.

puppeteer-mock should work with any library which mocks Node.js's http/https module responses and is not dependent on a specific mocking library.

## Installation

```bash
$ npm install --save-dev puppeteer-mock
```

## Usage

You can enable puppeteer-mock simply by calling its activate function:

```js
const puppeteerMock = require('puppeteer-mock');

puppeteerMock.activate();
```

**NOTE:** puppeteer-mock does not do the actual HTTP response mocking. You will need to use some library such as [nock](https://github.com/nock/nock) for that. What puppeteer-mock does is the routing of Puppeteer requests through Node.js's http/https modules so that the responses can be mocked using any supported HTTP mocking library.

A recommended way to use puppeteer-mock is to activate it in your tests' setup hook and deactivate it in your teardown hook:

```js
const puppeteerMock = require('puppeteer-mock');

describe('test suite', function() {
    beforeEach(function () {
        // activate puppeteer-mock
        if (!puppeteerMock.isActive())
            puppeteerMock.activate();
    }); 

    afterEach(function() {
        // restore puppeteer requests
        puppeteerMock.deactivate();
    });

    it('some test', function() {
        // test code goes here
    });
});
```

## API

**puppeteerMock.activate()**

Activate puppeteer-mock to route Puppeteer requests through the library.

**puppeteerMock.deactivate()**

Deactivate puppeteer-mock and have Puppeteer requests routed normally.

**puppeteerMock.isActive()**

Check if puppeteer-mock is currently active.
