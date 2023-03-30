const multer = require('multer')
const path = require('path')

let storage = multer.diskStorage({
  destination:(req,file,cb) => {
    cb(null,'public/images')
  },
  filename:(req,file,cb) => {
    let ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + Date.now() + ext)
  }
})

const checkFileType =function(file,cb){
  //allow the file extention
  const fileTypes=/jpeg|jpg|png|gif|svg|webp/;
  //check the extention name
  const extName=fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType=fileTypes.test(file.mimeType);
  if(mimeType && extName){
    return cb(null,true);
  }else{
    cb("Error: you can only upload Image !!");
  }
};

const upload =multer({
  storage:storage
  
});

module.exports = upload;