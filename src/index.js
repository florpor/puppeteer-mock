const http = require('http');
const https = require('https');
const puppeteerBrowser = require('puppeteer/lib/cjs/puppeteer/common/Browser').Browser;
const sinon = require('sinon');

let sinonSandbox;

function activate() {
    if (isActive()) {
        throw new Error('puppeteer-mock is already active');
    }

    // use sinon to override puppeteer browser newPage function so that for each newly
    // created page we can register an event handler to intercept requests and do the
    // actual resource fetching ourselves. this allows us to mock puppeteer responses
    // using any http mocking library just the same as we mock normal http fetch responses
    sinonSandbox = sinon.createSandbox();
    const newPageStub = sinonSandbox.stub(puppeteerBrowser.prototype, 'newPage').callsFake(
        sinonSandbox.fake(async () => {
            // create a new page using the original function
            const newPage = await newPageStub.wrappedMethod.call(newPageStub.thisValues[0]);

            // this is required for us to be able to respond with custom responses
            await newPage.setRequestInterception(true);

            // register the request event handler
            newPage.on('request', (request) => {
                // parse the url and prepare client and request options
                const reqUrl = new URL(request.url());
                const postData = request.postData();
                const client = reqUrl.protocol === 'https:' ? https : http;
                const options = {
                    method: request.method(),
                    hostname: reqUrl.hostname,
                    port: reqUrl.port,
                    path: reqUrl.pathname,
                    headers: request.headers()
                };

                // send the request using builtin http/s client
                const req = client.request(options, res => {
                    let responseData = '';

                    res.on('data', chunk => {
                        // collect response data chunk
                        responseData += chunk;
                    });

                    res.on('end', () => {
                        // when response is finished respond to puppeteer's request
                        request.respond({
                            status: res.statusCode,
                            headers: res.headers,
                            body: responseData
                        });
                    });
                });

                req.on('error', error => {
                    // on request error abort with status 500
                    console.error(error);
                    request.abort(500);
                });

                // write post data if provided
                if (postData)
                    req.write(postData);

                req.end();
            });

            // return the new page with the registered event handler
            return newPage;
        })
    );
}

function isActive() {
    return sinonSandbox !== undefined;
}

function deactivate() {
    // restore mocked functions
    sinonSandbox.restore();
    sinonSandbox = undefined;
}

module.exports = {
    activate,
    isActive,
    deactivate
};
