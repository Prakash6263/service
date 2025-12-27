const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const adminServiceSchema = new mongoose.Schema(
  {
    id: {
      type: Number
    },

    // Service Name
    name: {
      type: String,
      required: true,
      trim: true
    },

    // Select company
    companies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BikeCompany",
        required: true
      }
    ],

    // CC-wise base pricing
    bikes: [
      {
        cc: {
          type: Number,
          required: true
        },
        price: {
          type: Number,
          required: true
        }
      }
    ],

    // Service image
    image: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

adminServiceSchema.plugin(AutoIncrement, {
  id: "admin_service_seq",
  inc_field: "id"
});

module.exports = mongoose.model("AdminService", adminServiceSchema);
