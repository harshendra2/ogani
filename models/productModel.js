const mongoose = require('mongoose')
const Schema=mongoose.Schema

const productSchema=new Schema({
    productName:{
        type:String,
        required:true
    },
    price:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    stock:{
        type:Number,
        required:true,
        min:0,
        max:255
    },
    img1:{
        type:Array,
        // required:true
    },
    
    
    brand:{
        type:String,
        default:''
    },
     category:{
         type: mongoose.Schema.Types.ObjectId,
         ref:'Category',
         required:true
     },
     rating:{
        type:Number,
        default:0
     },
     numReviews:{
    type:Number,
     default:0,
    },
    
    dateCreated:{
        type:Date,
        default:Date.now
    }

    
    ,isDeleted:{
        type:Boolean
    }

})
module.exports=mongoose.model('Product',productSchema)
