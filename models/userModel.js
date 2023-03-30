const mongoose=require("mongoose");
const { ObjectId } = require("mongodb");
const userSchema = new  mongoose.Schema({             // this one is methode to access easily user password
 name:{
    type:String,
    require:true
 },
 email:{
    type:String,
    require:true
 },
mobile:{
    type:String,
    require:true
},

password:{
    type:String,
    require:true
},
block:{
    type:Boolean,
    require:true

},
is_admin:{
    type:Number,
    require:true
},
is_varified:{
    type:Number,
    default:1
},
token:{
 type:String,
 default:''
},
address:{
    type:Array,
    require:true
},
wallet: {
    type: Number,
    default: 0,
  },
cart:[{
    productId:{type:ObjectId},
    _id:false,
    quantity: { type: String,
        default:1
       
     }
}],
wishlist:[{
    productId:{type:ObjectId},
    _id:false

}],
Address: [{
    
    name: { type: String, required: true },
    country: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postcode: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true }
    
}],




 
});

// verify password


module.exports= mongoose.model("User",userSchema);
