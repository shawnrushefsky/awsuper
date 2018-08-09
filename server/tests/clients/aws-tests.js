const chai = require('chai');
const { expect } = chai;

describe('AWS Client', () => {
    it('Includes an Authorized EC2 client', () => {
        const { EC2 } = require('../../src/clients/aws');

        expect(EC2.config.accessKeyId).to.not.be.undefined;
        expect(EC2.config.secretAccessKey).to.not.be.undefined;
        expect(EC2.endpoint.host).to.include('ec2');
    });

    it('Includes an Authorized OpsWorks client', () => {
        const { OpsWorks } = require('../../src/clients/aws');

        expect(OpsWorks.config.accessKeyId).to.not.be.undefined;
        expect(OpsWorks.config.secretAccessKey).to.not.be.undefined;
        expect(OpsWorks.endpoint.host).to.include('opsworks');
    });
});