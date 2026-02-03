const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const {
  createBaseAdditionalService,
  listBaseAdditionalServices,
  getBaseAdditionalServiceById,
  updateBaseAdditionalService,
  deleteBaseAdditionalService,
} = require("../controller/baseAdditionalServiceController")

/* =====================================================
   BASE ADDITIONAL SERVICES → uploads/base-additional-services
===================================================== */
const baseAdditionalServiceDir = path.join(
  __dirname,
  "../uploads/base-additional-services"
)
if (!fs.existsSync(baseAdditionalServiceDir)) {
  fs.mkdirSync(baseAdditionalServiceDir, { recursive: true })
}

const baseAdditionalServiceUpload = multer({
  storage: multer.diskStorage({
    destination: baseAdditionalServiceDir,
    filename: (req, file, cb) => {
      cb(
        null,
        `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
      )
    },
  }),
})

// Admin only routes
router.post(
  "/",
  baseAdditionalServiceUpload.single("image"),
  createBaseAdditionalService
)
router.get("/", listBaseAdditionalServices)
router.get("/:id", getBaseAdditionalServiceById)
router.put(
  "/:id",
  baseAdditionalServiceUpload.single("image"),
  updateBaseAdditionalService
)
router.delete("/:id", deleteBaseAdditionalService)

module.exports = router
