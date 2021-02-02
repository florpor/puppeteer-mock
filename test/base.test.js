const assert = require('chai').assert;

const puppeteerMock = require('../src');

describe('test mocking using nock', function() {
    it('activate and deactivate work', function() {
        assert.equal(puppeteerMock.isActive(), false, 'puppeteer-mock should not be active yet');

        // activate puppeteer-mock
        puppeteerMock.activate();

        assert.equal(puppeteerMock.isActive(), true, 'puppeteer-mock should now be active');

        // deactivate puppeteer-mock
        puppeteerMock.deactivate();

        assert.equal(puppeteerMock.isActive(), false, 'puppeteer-mock should not be active again');
    });

    it('cannot activate if already active', function() {
        // activate puppeteer-mock
        puppeteerMock.activate();

        // activate puppeteer-mock again
        assert.throws(puppeteerMock.activate, 'puppeteer-mock is already active', 'activating puppeteer-mock when it is active throws');
    });
});
