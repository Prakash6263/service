const express = require("express")
const router = express.Router()
const {
  generateUPIQRCode,
  checkPaymentStatus,
  cashfreeWebhook,
  getPaymentByBooking,
  regenerateQRCode,
  cancelPayment,
  getAllQRPayments,
} = require("../controller/cashfreeQRController")

/**
 * Cashfree UPI QR Payment Routes
 * Base path: /bikedoctor/cashfree
 */

// Generate UPI QR Code for payment (Dealer App)
// POST /bikedoctor/cashfree/generate-qr
router.post("/generate-qr", generateUPIQRCode)

// Check payment status (Polling from Dealer App)
// GET /bikedoctor/cashfree/status/:order_id
router.get("/status/:order_id", checkPaymentStatus)

// Cashfree Webhook (Called by Cashfree)
// POST /bikedoctor/cashfree/webhook
router.post("/webhook", cashfreeWebhook)

// Get payment details by booking ID
// GET /bikedoctor/cashfree/booking/:booking_id
router.get("/booking/:booking_id", getPaymentByBooking)

// Regenerate QR code for pending payment
// POST /bikedoctor/cashfree/regenerate/:payment_id
router.post("/regenerate/:payment_id", regenerateQRCode)

// Cancel pending payment
// DELETE /bikedoctor/cashfree/cancel/:order_id
router.delete("/cancel/:order_id", cancelPayment)

// Get all QR payments with filters
// GET /bikedoctor/cashfree/payments
router.get("/payments", getAllQRPayments)

module.exports = router
