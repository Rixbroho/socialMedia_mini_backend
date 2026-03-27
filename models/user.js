const mongoose=require('mongoose');

mongoose.connect('mongodb://localhost:27017/miniproject');

const userSchema=mongoose.Schema({
    username: String,
    name: String,
    email: String,
    password : String,
    age: Number,
    profilepic:{
        type: String,
        default: 'pp.webp'
    },
    posts : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'posts',
        default:[]
    }]
});

module.exports=mongoose.model('user',userSchema);