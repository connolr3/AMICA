const sharp = require("sharp");
const fs = require("fs/promises");

const handleUpload = async(req, res) => {

    const imageFileData = req.files.userImage;

    const uploadedFilename = `assets/${imageFileData.name}`;
    await imageFileData.mv(uploadedFilename);

    const editedUrl = `posts-images/${imageFileData.name}`;
    const editedFilename = `assets/${editedUrl}`;
    await sharp(uploadedFilename).resize(750).toFile(editedFilename);

    await fs.unlink(uploadedFilename);
    console.log("Filename:" + uploadedFilename);

};

module.exports = { handleUpload };