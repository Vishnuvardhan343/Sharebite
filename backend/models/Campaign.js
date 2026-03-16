const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a campaign name']
    },
    description: {
        type: String,
        required: [true, 'Please add a campaign description']
    },
    image: {
        type: String,
        default: 'linear-gradient(135deg, #10b981, #059669)'
    },
    donationGoal: {
        type: Number,
        required: [true, 'Please add a donation goal']
    },
    donationCurrent: {
        type: Number,
        default: 0
    },
    pickupGoal: {
        type: Number,
        required: [true, 'Please add a pickup goal']
    },
    pickupCurrent: {
        type: Number,
        default: 0
    },
    endDate: {
        type: String,
        required: [true, 'Please add an end date']
    },
    active: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Campaign', CampaignSchema);
