const mongoose = require("mongoose")
const AutoIncrement = require("mongoose-sequence")(mongoose)

const serviceSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
    },
    serviceId: {
      type: String,
      unique: true,
    },
    name: String,
    image: String,
    description: String,

    bikes: [
      {
        cc: Number,
        price: Number,
      },
    ],
    dealer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },
  },
  {
    timestamps: true,
  },
)

serviceSchema.plugin(AutoIncrement, { id: "service_seq", inc_field: "id" })

serviceSchema.pre("validate", async function (next) {
  if (!this.serviceId) {
    const regex = /^MKBDSVC-(\d+)$/

    const lastService = await this.constructor
      .findOne({ serviceId: { $regex: regex } })
      .sort({ serviceId: -1 })
      .exec()

    let maxNumber = 0
    if (lastService) {
      const match = lastService.serviceId.match(regex)
      if (match && match[1]) {
        maxNumber = Number.parseInt(match[1], 10)
      }
    }

    const nextNumber = (maxNumber + 1).toString().padStart(3, "0")
    this.serviceId = `MKBDSVC-${nextNumber}`
  }
  next()
})

module.exports = mongoose.model("service", serviceSchema)
