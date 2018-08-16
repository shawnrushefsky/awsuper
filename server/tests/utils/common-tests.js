const chai = require('chai');
const { mapByName } = require('../../src/utils/common');
const { expect } = chai;

describe('Common Utilities', () => {
    describe('mapByName', () => {
        it('Takes an array of Objects from the aws-sdk, and maps them by Name, Hostname, and Shortname', () => {
            const testArray = [
                { Name: 'long-test1' },
                { Hostname: 'test2' },
                { Shortname: 'test3' }
            ];

            const map = mapByName(testArray);

            expect(map).to.haveOwnProperty('long-test1');
            expect(map['long-test1'].Name).to.equal('long-test1');

            expect(map).to.haveOwnProperty('test2');
            expect(map['test2'].Hostname).to.equal('test2');

            expect(map).to.haveOwnProperty('test3');
            expect(map['test3'].Shortname).to.equal('test3');
        });
    });
});