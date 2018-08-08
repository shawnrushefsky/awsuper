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
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    _id: false
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
            values: ['PENDING', 'RUNNING', 'COMPLETED', 'CANCELLED', 'FAILED'],
            message: '{VALUE} is not a valid status.'
        },
        default: 'PENDING'
    },
}, {
    versionKey: false,
    timestamps: {
        createdAt: 'date_created',
        updatedAt: 'date_updated'
    },
});

module.exports = mongoose.model('LayerRollingRestart', LayerRollingRestart);