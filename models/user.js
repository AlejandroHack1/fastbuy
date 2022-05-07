var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');


var User = new Schema({

    firstname: {
        type: String, default: ''
    },
    lastname:{
        type: String,
        default: ''
    },
    admin:{
        type: Boolean,
        default: false
    },
    cart:{
        type: [mongoose.Schema.Types.ObjectId],
        ref:'Products',
        default: []
    }
    
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);