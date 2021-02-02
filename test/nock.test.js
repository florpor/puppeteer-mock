const assert = require('chai').assert;
const nock = require('nock');
const puppeteer = require('puppeteer');

const puppeteerMock = require('../src');

describe('test mocking using nock', function() {
    let browser;

    beforeEach(async function () {
        // activate puppeteer-mock
        if (!puppeteerMock.isActive())
            puppeteerMock.activate();

        // make sure nock is active
        if (!nock.isActive())
            nock.activate();

        // launch a browser
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }); 

    afterEach(async function() {
        // close browser
        await browser.close();
        browser = undefined;

        // restore unmocked networking
        nock.restore();
        
        // restore puppeteer requests
        puppeteerMock.deactivate();
    });

    it('unmocked urls are normal', async function() {
        const page = await browser.newPage();

        // navigate and wait for all network requests to complete
        await page.goto('https://example.org', { waitUntil: 'networkidle0' });

        // content should be the actual live content of the page
        const content = await page.content();
        assert.include(content, '<title>Example Domain</title>', 'original page contains correct title');
    });

    it('mocked page', async function() {
        // mock example.org
        const nockScope = nock('https://example.org', { allowUnmocked: false })
            .get('/')
            .reply(
                200,
                '<html><head><title>Mocked Domain</title></head><body></body></html>',
                {'Content-Type': 'text/html'}
            );

        const page = await browser.newPage();

        // navigate and wait for all network requests to complete
        await page.goto('https://example.org', { waitUntil: 'networkidle0' });

        // make sure mocked url was hit
        nockScope.done();

        // content should be the mocked content we set
        const content = await page.content();
        assert.notInclude(content, '<title>Example Domain</title>', 'mocked page does not contain original title');
        assert.include(content, '<title>Mocked Domain</title>', 'mocked page contains correct title');
    });

    it('mocked xhr', async function() {
        // mock example.org and api methods - the base page has an onload script which
        // will fire multiple xhr requests to "/api" url using different methods
        const nockScope = nock('https://example.org', { allowUnmocked: false })
            .get('/')
            .reply(
                200,
                `<html>
                    <head>
                        <title>Mocked Domain Xhr</title>
                        <script>
                            window.onload = function() {
                                ["get", "post", "put", "head", "delete", "patch", "options", "merge"].forEach((method) => {
                                    let xhr = new XMLHttpRequest();
                                    xhr.open(method, "/api");
                                    xhr.onload = () => { document.body.innerHTML += xhr.responseText; };
                                    xhr.send();
                                });
                            }
                        </script>
                    </head>
                    <body></body>
                </html>`,
                {'Content-Type': 'text/html'}
            )
            .get('/api')
            .reply(200, '{"status": "success", "method": "get"}', {'Content-Type': 'application/json'})
            .post('/api')
            .reply(200, '{"status": "success", "method": "post"}', {'Content-Type': 'application/json'})
            .put('/api')
            .reply(200, '{"status": "success", "method": "put"}', {'Content-Type': 'application/json'})
            .head('/api')
            .reply(200, '{"status": "success", "method": "head"}', {'Content-Type': 'application/json'})
            .delete('/api')
            .reply(200, '{"status": "success", "method": "delete"}', {'Content-Type': 'application/json'})
            .patch('/api')
            .reply(200, '{"status": "success", "method": "patch"}', {'Content-Type': 'application/json'})
            .options('/api')
            .reply(200, '{"status": "success", "method": "options"}', {'Content-Type': 'application/json'})
            .merge('/api')
            .reply(200, '{"status": "success", "method": "merge"}', {'Content-Type': 'application/json'});

        const page = await browser.newPage();

        // navigate and wait for all network requests to complete
        await page.goto('https://example.org', { waitUntil: 'networkidle0' });

        // make sure all mocked urls were hit
        nockScope.done();

        // content should be the mocked content we set and the body should include all
        // api responses since we wrote them into the html
        const content = await page.content();
        assert.notInclude(content, '<title>Example Domain</title>', 'mocked page does not contain original title');
        assert.include(content, '<title>Mocked Domain Xhr</title>', 'mocked page contains correct title');
        assert.include(content, '{"status": "success", "method": "get"}', 'mocked page contains get xhr result');
        assert.include(content, '{"status": "success", "method": "post"}', 'mocked page contains post xhr result');
        assert.include(content, '{"status": "success", "method": "put"}', 'mocked page contains put xhr result');
        assert.include(content, '{"status": "success", "method": "head"}', 'mocked page contains head xhr result');
        assert.include(content, '{"status": "success", "method": "delete"}', 'mocked page contains delete xhr result');
        assert.include(content, '{"status": "success", "method": "patch"}', 'mocked page contains patch xhr result');
        assert.include(content, '{"status": "success", "method": "options"}', 'mocked page contains options xhr result');
        assert.include(content, '{"status": "success", "method": "merge"}', 'mocked page contains merge xhr result');
    });
});
