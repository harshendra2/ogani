const mongoose=require('mongoose')


const categorySchema= mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    icon:{
        type:String,

    },
    color:{
        type:String
    },
    block:{
        type:Boolean,
        require:false
    
    }
})

//exports.Category=mongoose.model('Category',categorySchema)
module.exports=mongoose.model('Category',categorySchema)