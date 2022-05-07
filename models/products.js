const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

const commentSchema = new Schema({
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },

    comment: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
})

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },

    image: {
        type: String,
        required: true
    },

    category: {
        type: String,
        required: true
    },

    label: {
        type: String,
        default: ''
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    featured: {
        type: Boolean,
        default: false
    },

    comments: [commentSchema]
},

    {
        timestamps: true
    });

productSchema.plugin(passportLocalMongoose);
var Products = mongoose.model('Products', productSchema);
module.exports = Products;


