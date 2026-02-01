const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const {
  addAdditionalService,
  getAllAdditionalServices,
  getAdditionalServiceById,
  updateAdditionalService,
  deleteAdditionalService,
  getAdditionalServicesByDealerId,
  saveSelectedServices,
} = require("../controller/additionalServiceController")

/* =====================================================
   ADDITIONAL SERVICES → uploads/additional-services
===================================================== */
const additionalServiceDir = path.join(__dirname, "../uploads/additional-services")
if (!fs.existsSync(additionalServiceDir)) {
  fs.mkdirSync(additionalServiceDir, { recursive: true })
}

const additionalServiceUpload = multer({
  storage: multer.diskStorage({
    destination: additionalServiceDir,
    filename: (req, file, cb) => {
      cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
    },
  }),
})

/* =====================================================
   ROUTES FOR BASE SERVICE PATTERN
===================================================== */

// CREATE - Add new additional service
router.post("/", additionalServiceUpload.single("image"), addAdditionalService)

// READ - Get all additional services
router.get("/", getAllAdditionalServices)

// READ - Get single additional service by ID
router.get("/:id", getAdditionalServiceById)

// READ - Get additional services by dealer ID (with optional CC filter)
router.get("/dealer/:dealerId", getAdditionalServicesByDealerId)

// UPDATE - Update additional service
router.put("/:id", additionalServiceUpload.single("image"), updateAdditionalService)

// DELETE - Delete additional service
router.delete("/:id", deleteAdditionalService)

// ADDITIONAL ACTIONS
// Save selected services for dealer
router.post("/select-services/save", saveSelectedServices)

/* =====================================================
   DEPRECATED ROUTES (Keep for backward compatibility)
===================================================== */
router.post("/add-service", additionalServiceUpload.single("image"), addAdditionalService)
router.get("/all-additional-services", getAllAdditionalServices)
router.get("/single-additional-service/:id", getAdditionalServiceById)
router.put("/updated-additional-service/:id", additionalServiceUpload.single("image"), updateAdditionalService)
router.delete("/delete-additional-service/:id", deleteAdditionalService)
router.post("/select-services", saveSelectedServices)

module.exports = router
