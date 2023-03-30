const mongoose=require('mongoose')


const addressSchema= mongoose.Schema({
    firstname:{
        type:String,
        required:true
    },
    lastname:{
        type:String,
        required:true
    },
    country:{
        type:String,
        required:true,
        
    },
    address:{
        type:String,
        required:true
    },
    
    
    city:{
        type:String,
        required:true
    },

    state:{
        type:String,
        required:true
    },
    postcode:{
        type:Number,
        required:true
    },
    phone:{
        type:Number,
        required:true
    },
    email:{
        type:String,
        required:true
    },
     userdata:{
         type: mongoose.Schema.Types.ObjectId,
         ref:'User',
         required:true
     }
})

//exports.Category=mongoose.model('Category',categorySchema)
module.exports=mongoose.model('address',addressSchema)