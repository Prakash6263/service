var express = require("express")
var multer = require("multer")
var fs = require("fs")
var path = require("path")
const { verifyToken } = require("../helper/verifyAuth")
var { addbanner, bannerlist, deletebanner, editbanner } = require("../controller/banner")
const router = express.Router()

// Define the folder path
const uploadDir = path.join(process.cwd(), "uploads/banners")

// Ensure the folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Set up Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir)
  },
  filename: (req, file, callback) => {
    const ext = path.extname(file.originalname)
    const uniqueName = `image-${Date.now()}${ext}`
    callback(null, uniqueName)
  },
})

// Configure Multer without size limit
const upload = multer({
  storage: storage,
})

/* POST users listing. */
router.post("/addbanner", upload.single("images"), addbanner)
router.get("/bannerlist", bannerlist)
router.delete("/deletebanner", deletebanner)
router.put("/editbanner", editbanner)

module.exports = router
