const {
    DATE_FORMATS,
    coerceValue,
    coerceBoolean,
    coerceNumber,
    coerceObjectId,
    coerceDate
} = require('../../src/utils/coerce');

const moment = require('moment');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const chai = require('chai');
const { expect } = chai;

const field = 'testfield';

const schema = new mongoose.Schema({
    strField: String,
    numField: Number,
    boolField: Boolean,
    dateField: Date,
    mixedField: mongoose.Schema.Types.Mixed
});

const model = mongoose.model('test', schema);

describe('Type Coercion', () => {
    describe('coerceBoolean', () => {
        it('returns a boolean true for the string "true"', () => {
            let { value, error } = coerceBoolean(field, 'true');
            expect(value).to.be.true;
            expect(error).to.be.undefined;
        });

        it('returns a boolean true for the string "TRUE"', () => {
            let { value, error } = coerceBoolean(field, 'TRUE');
            expect(value).to.be.true;
            expect(error).to.be.undefined;
        });

        it('returns a boolean false for the string "false"', () => {
            let { value, error } = coerceBoolean(field, 'false');
            expect(value).to.be.false;
            expect(error).to.be.undefined;
        });

        it('returns a boolean false for the string "FALSE"', () => {
            let { value, error } = coerceBoolean(field, 'FALSE');
            expect(value).to.be.false;
            expect(error).to.be.undefined;
        });

        it('returns an error if anything else', () => {
            // other strings
            let { value: strVal, error: strErr } = coerceBoolean(field, 'maybe');
            expect(strVal).to.be.undefined;
            expect(strErr).to.equal(`Expected type:Boolean for field ${field}`);

            // numbers
            let { value: numVal, error: numErr } = coerceBoolean(field, 27);
            expect(numVal).to.be.undefined;
            expect(numErr).to.equal(`Expected type:Boolean for field ${field}`);

            // arrays
            let { value: arrVal, error: arrErr } = coerceBoolean(field, [27, 'something']);
            expect(arrVal).to.be.undefined;
            expect(arrErr).to.equal(`Expected type:Boolean for field ${field}`);

            // objects
            let { value: objVal, error: objErr } = coerceBoolean(field, { key: 'value' });
            expect(objVal).to.be.undefined;
            expect(objErr).to.equal(`Expected type:Boolean for field ${field}`);
        });
    });

    describe('coerceNumber', () => {
        it('returns a number for a string that is a number', () => {
            // Works with integers
            let { value: intVal, error: intErr } = coerceNumber(field, '123');
            expect(intVal).to.equal(123);
            expect(intErr).to.be.undefined;

            // Works with floating point numbers
            let { value: floatVal, error: floatErr } = coerceNumber(field, '123.456');
            expect(floatVal).to.equal(123.456);
            expect(floatErr).to.be.undefined;
        });

        it('returns an error in all other cases', () => {
            // other strings
            let { value: strVal, error: strErr } = coerceNumber(field, 'maybe');
            expect(strVal).to.be.undefined;
            expect(strErr).to.equal(`Expected type:Number for field ${field}`);

            // arrays
            let { value: arrVal, error: arrErr } = coerceNumber(field, [27, 'something']);
            expect(arrVal).to.be.undefined;
            expect(arrErr).to.equal(`Expected type:Number for field ${field}`);

            // objects
            let { value: objVal, error: objErr } = coerceNumber(field, { key: 'value' });
            expect(objVal).to.be.undefined;
            expect(objErr).to.equal(`Expected type:Number for field ${field}`);
        });
    });

    describe('coerceObjectId', () => {
        it('returns an ObjectId for a string which can be cast to an ObjectId', () => {
            let id = new ObjectId;

            let { value, error } = coerceObjectId(field, id.toString());
            expect(value.toString()).to.equal(id.toString());
            expect(error).to.be.undefined;
        });

        it('returns an error in all other cases', () => {
            // other strings
            let { value: strVal, error: strErr } = coerceObjectId(field, 'maybe');
            expect(strVal).to.be.undefined;
            expect(strErr).to.equal(`Expected type:ObjectId for field ${field}`);

            // numbers
            let { value: numVal, error: numErr } = coerceObjectId(field, 27);
            expect(numVal).to.be.undefined;
            expect(numErr).to.equal(`Expected type:ObjectId for field ${field}`);

            // arrays
            let { value: arrVal, error: arrErr } = coerceObjectId(field, [27, 'something']);
            expect(arrVal).to.be.undefined;
            expect(arrErr).to.equal(`Expected type:ObjectId for field ${field}`);

            // objects
            let { value: objVal, error: objErr } = coerceObjectId(field, { key: 'value' });
            expect(objVal).to.be.undefined;
            expect(objErr).to.equal(`Expected type:ObjectId for field ${field}`);
        });
    });

    describe('coerceDate', () => {
        it('returns a date range query if a date is provided - Day resolution', () => {
            let { value, error } = coerceDate(field, '2018-8-6');

            expect(value).to.be.an('object');

            const expectedBeginning = moment('2018-8-6', DATE_FORMATS);

            expect(moment(value.$gte, DATE_FORMATS).isSame(expectedBeginning)).to.be.true;
            expect(moment(value.$lte).isSame('2018-08-06T23:59:59.999Z'));

            expect(error).to.be.undefined;
        });

        it('returns a date range query if a date is provided - Hour resolution', () => {
            let { value, error } = coerceDate(field, '2018-8-6 10');

            expect(value).to.be.an('object');

            const expectedBeginning = moment('2018-8-6 10', DATE_FORMATS);

            expect(moment(value.$gte, DATE_FORMATS).isSame(expectedBeginning)).to.be.true;
            expect(moment(value.$lte).isSame('2018-08-06T10:59:59.999Z'));

            expect(error).to.be.undefined;
        });

        it('returns a date range query if a date is provided - Minute resolution', () => {
            let { value, error } = coerceDate(field, '2018-8-6 10:30');

            expect(value).to.be.an('object');

            const expectedBeginning = moment('2018-8-6 10:30', DATE_FORMATS);

            expect(moment(value.$gte, DATE_FORMATS).isSame(expectedBeginning)).to.be.true;
            expect(moment(value.$lte).isSame('2018-08-06T10:30:59.999Z'));

            expect(error).to.be.undefined;
        });

        it('returns a date range query if a date is provided - Second resolution', () => {
            let { value, error } = coerceDate(field, '2018-8-6 10:30:45');

            expect(value).to.be.an('object');

            const expectedBeginning = moment('2018-8-6 10:30:45', DATE_FORMATS);

            expect(moment(value.$gte, DATE_FORMATS).isSame(expectedBeginning)).to.be.true;
            expect(moment(value.$lte).isSame('2018-08-06T10:30:45.999Z'));

            expect(error).to.be.undefined;
        });

        it('returns an error object if it cannot be coerced to a date', () => {
            // other strings
            let { value: strVal, error: strErr } = coerceDate(field, 'maybe');
            expect(strVal).to.be.undefined;
            expect(strErr).to.equal(`Expected type:Date for field ${field}`);

            // arrays
            let { value: arrVal, error: arrErr } = coerceDate(field, [27, 'something']);
            expect(arrVal).to.be.undefined;
            expect(arrErr).to.equal(`Expected type:Date for field ${field}`);

            // objects
            let { value: objVal, error: objErr } = coerceDate(field, { key: 'value' });
            expect(objVal).to.be.undefined;
            expect(objErr).to.equal(`Expected type:Date for field ${field}`);
        });
    });

    describe('coerceValue', () => {
        it('Returns a String value for a field is that is String type', () => {
            let { value, error } = coerceValue('strField', 'some string', model);
            expect(value).to.equal('some string');
            expect(error).to.be.undefined;
        });

        it('Returns an unmodified value for a field is that is Mixed type', () => {
            let rawValue = { key: 'value' };
            let { value, error } = coerceValue('mixedField', rawValue, model);
            expect(value).to.deep.equal(rawValue);
            expect(error).to.be.undefined;
        });

        it('Returns a Number value for a field is that is Number type', () => {
            let { value, error } = coerceValue('numField', '123.456', model);
            expect(value).to.equal(123.456);
            expect(error).to.be.undefined;
        });

        it('Returns a Boolean value for a field is that is Boolean type', () => {
            let { value, error } = coerceValue('boolField', 'true', model);
            expect(value).to.be.true;
            expect(error).to.be.undefined;
        });

        it('Returns an ObjectId value for a field is that is ObjectId type', () => {
            let id = new ObjectId();
            let { value, error } = coerceValue('_id', id.toString(), model);
            expect(ObjectId.isValid(value)).to.be.true;
            expect(value.toString()).to.equal(id.toString());
            expect(error).to.be.undefined;
        });

        it('returns an error if the field does not exist', () => {
            let { value, error } = coerceValue('superfake', 'alsofake', model);
            expect(value).to.be.undefined;
            expect(error).to.equal('superfake is not a valid field.');
        });
    });
});