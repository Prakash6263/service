const mongoose = require("mongoose")

const suadminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["Telecaller", "Manager", "Admin", "Subadmin", "Executive"],
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    mobile: { type: String, required: true },
    image: { type: String },
    ID: { type: String, unique: true, required: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
)

suadminSchema.pre("validate", async function (next) {
  if (!this.ID) {
    const rolePrefixes = {
      Telecaller: "T",
      Manager: "M",
      Admin: "A",
      Subadmin: "SA",
      Executive: "SE",
    }

    const prefix = rolePrefixes[this.role]
    if (!prefix) {
      return next(new Error("Invalid role"))
    }

    // Create regex to find IDs like MLBDA-001, MLBDT-001, MLBDSA-001, etc.
    const regex = new RegExp(`^MKBD${prefix}-(\\d+)$`)

    const lastEmployee = await this.constructor
      .findOne({ ID: { $regex: regex } })
      .sort({ ID: -1 })
      .exec()

    let maxNumber = 0
    if (lastEmployee) {
      const match = lastEmployee.ID.match(regex)
      if (match && match[1]) {
        maxNumber = Number.parseInt(match[1], 10)
      }
    }

    const nextNumber = (maxNumber + 1).toString().padStart(3, "0")
    this.ID = `MKBD${prefix}-${nextNumber}`
  }
  next()
})

module.exports = mongoose.model("admin", suadminSchema)
