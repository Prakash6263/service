var express = require("express")
var multer = require("multer")
var fs = require("fs")
var path = require("path")

var {
  servicelist,
  updateService,
  deleteService,
  singleService,
  getServicesByDealer,
  addAdminService,
  listAdminServices,
  getServiceById,
  updateServiceById,
  addAdditionalService,
  additionalservicelist,
  deleteAdditionaalService,
  getAdditionalServiceById,
  updateAdditionalServiceById,
  getAdminServiceById,
  updateAdminService,
  deleteAdminService,
  getDealerServices,
} = require("../controller/service")

var {
  createBaseService,
  listBaseServices,
  getBaseServiceById,
  updateBaseService,
  deleteBaseService,
} = require("../controller/baseService")

var { PicknDrop } = require("../controller/pickupndrop")

const router = express.Router()

/* =====================================================
   DEALER SERVICES → uploads/services
===================================================== */
const dealerServiceDir = path.join(__dirname, "../uploads/services")
if (!fs.existsSync(dealerServiceDir)) {
  fs.mkdirSync(dealerServiceDir, { recursive: true })
}

const dealerServiceUpload = multer({
  storage: multer.diskStorage({
    destination: dealerServiceDir,
    filename: (req, file, cb) => {
      cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
    },
  }),
})

/* =====================================================
   ADMIN SERVICES → uploads/admin-services
===================================================== */
const adminServiceDir = path.join(__dirname, "../uploads/admin-services")
if (!fs.existsSync(adminServiceDir)) {
  fs.mkdirSync(adminServiceDir, { recursive: true })
}

const adminServiceUpload = multer({
  storage: multer.diskStorage({
    destination: adminServiceDir,
    filename: (req, file, cb) => {
      cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
    },
  }),
})

/* =====================================================
   BASE SERVICES → uploads/base-services
===================================================== */
const baseServiceDir = path.join(__dirname, "../uploads/base-services")
if (!fs.existsSync(baseServiceDir)) {
  fs.mkdirSync(baseServiceDir, { recursive: true })
}

const baseServiceUpload = multer({
  storage: multer.diskStorage({
    destination: baseServiceDir,
    filename: (req, file, cb) => {
      cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
    },
  }),
})

/* =====================================================
   ADDITIONAL SERVICES → uploads/additional-options
===================================================== */
const additionalServiceDir = path.join(__dirname, "../uploads/additional-options")
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
   DEALER SERVICE ROUTES
===================================================== */
router.get("/servicelist", servicelist)
router.get("/edit-service/:id", getServiceById)

router.put("/update-service/:id", dealerServiceUpload.single("images"), updateServiceById)

router.put("/updateservice", dealerServiceUpload.fields([{ name: "service_image", maxCount: 1 }]), updateService)

router.delete("/deleteService", deleteService)
router.get("/service/:id", singleService)

/* =====================================================
   NEW: DEALER SERVICES (Read-Only) - MUST BE BEFORE :dealer_id
===================================================== */
router.get("/dealer/services", getDealerServices)

/* =====================================================
   DEALER SERVICES BY ID
===================================================== */
router.get("/dealer/:dealer_id", getServicesByDealer)

/* =====================================================
   PICK & DROP
===================================================== */
router.post("/PicknDrop", PicknDrop)

/* =====================================================
   BASE SERVICE ROUTES (Admin Only)
===================================================== */
router.post("/admin/base-services", baseServiceUpload.single("image"), createBaseService)

router.get("/admin/base-services", listBaseServices)

router.get("/admin/base-services/:id", getBaseServiceById)

router.put("/admin/base-services/:id", baseServiceUpload.single("image"), updateBaseService)

router.delete("/admin/base-services/:id", deleteBaseService)

/* =====================================================
   ADMIN SERVICE ROUTES (Refactored)
===================================================== */
router.post("/adminservices/create", adminServiceUpload.single("image"), addAdminService)

router.get("/adminservices", listAdminServices)
router.get("/admin/services/:id", getAdminServiceById)

router.put("/admin/services/:id", adminServiceUpload.single("image"), updateAdminService)

router.delete("/admin/services/:id", deleteAdminService)

/* =====================================================
   ADDITIONAL SERVICE ROUTES
===================================================== */
router.post("/create-additional-service", additionalServiceUpload.single("images"), addAdditionalService)

router.get("/additionalservicelist", additionalservicelist)

router.delete("/deleteAdditionalService/:id", deleteAdditionaalService)

router.get("/getAdditionalService/:id", getAdditionalServiceById)

router.put("/updateAdditionalService/:id", additionalServiceUpload.single("image"), updateAdditionalServiceById)

module.exports = router
