const mongoose = require('mongoose');

const Instance = new mongoose.Schema({
    Hostname: {
        type: String,
        required: true
    },
    InstanceId: {
        type: String,
        required: true
    },
}, {
    _id: false,
    timestamps: {
        createdAt: 'timestamp',
        updatedAd: false
    }
});

const LayerRollingRestart = new mongoose.Schema({
    stackName: {
        type: String,
        required: true
    },
    layerName: {
        type: String,
        required: true
    },
    window: {
        type: Number,
        required: false,
        default: 1
    },
    totalInstances: {
        type: Number,
        required: false
    },
    instancesShutdown: {
        type: [Instance],
        required: false
    },
    instancesStarted: {
        type: [Instance],
        required: false
    },
    instancesOnline: {
        type: [Instance],
        required: false
    },
    status: {
        type: String,
        trim: true,
        enum: {
            values: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'],
            message: '{VALUE} is not a valid status.'
        },
        default: 'PENDING'
    },
}, {
    timestamps: {
        createdAt: 'date_created',
        updatedAt: 'date_updated'
    },
});

module.exports = mongoose.model('LayerRollingRestart', LayerRollingRestart);