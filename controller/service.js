const service = require("../models/service_model");
const additionalService = require("../models/additionalServiceSchema");
const jwt_decode = require("jwt-decode");
const adminservices = require("../models/adminService");
const mongoose = require("mongoose");

async function servicelist(req, res) {
  try {
    const services = await service
      .find()
      .populate("dealer_id", "shopName email")
      .sort({ id: -1 });

    return res.status(200).send({
      status: 200,
      message: services.length > 0 ? "Success" : "No services available",
      data: services,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return res.status(200).send({ status: 500, message: "Internal Server Error" });
  }
}

async function singleService(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(200).send({ status: 400, message: "Service ID is required!" });
    }

    const serviceData = await service.findById(id).populate("dealer_id", "name email");
    return res.status(200).send({
      status: 200,
      message: serviceData ? "Success" : "Service not found!",
      data: serviceData || {},
    });
  } catch (error) {
    console.error("Error fetching service:", error);
    return res.status(200).send({ status: 500, message: "Internal Server Error" });
  }
}

async function updateService(req, res) {
  try {
    const { service_id, name, description, dealer_id, bikes } = req.body;
    if (!service_id || !name || !dealer_id) {
      return res.status(200).send({ status: 400, message: "Service ID, name, and dealer ID are required!" });
    }

    let parsedBikes = [];
    if (bikes) {
      try {
        parsedBikes = JSON.parse(bikes);
      } catch (error) {
        return res.status(200).send({ status: 400, message: "Invalid bikes data format!" });
      }
    }

    const updateData = { name, description, dealer_id };
    if (req.file) {
      updateData.image = req.file.filename;
    }
    if (parsedBikes.length > 0) {
      updateData.bikes = parsedBikes;
    }

    const updatedService = await service.findByIdAndUpdate(service_id, updateData, { new: true });
    return res.status(200).send({
      status: 200,
      message: updatedService ? "Service updated successfully" : "Service not found!",
      data: updatedService || {},
    });
  } catch (error) {
    console.error("Error updating service:", error);
    return res.status(200).send({ status: 500, message: "Internal Server Error" });
  }
}

async function deleteService(req, res) {
  try {
    const { service_id } = req.body;
    if (!service_id) {
      return res.status(200).send({ status: 400, message: "Service ID is required!" });
    }

    const deletedService = await service.findByIdAndDelete(service_id);
    return res.status(200).send({
      status: 200,
      message: deletedService ? "Service deleted successfully" : "Service not found!",
    });
  } catch (error) {
    console.error("Error deleting service:", error);
    return res.status(200).send({ status: 500, message: "Internal Server Error" });
  }
}

async function getServicesByDealer(req, res) {
  try {
    const { dealer_id } = req.params;

    if (!dealer_id) {
      return res.status(200).send({ status: 400, message: "Dealer ID is required!" });
    }

    const services = await service.find({ dealer_id }).populate("dealer_id", "name email");

    return res.status(200).send({
      status: 200,
      message: services.length > 0 ? "Success" : "No services found for this dealer",
      data: services,
    });
  } catch (error) {
    console.error("Error fetching services by dealer:", error);
    return res.status(200).send({ status: 500, message: "Internal Server Error" });
  }
}

async function addAdminService(req, res) {
  try {
    // Auth check
    if (!req.headers.token) {
      return res.status(401).json({
        status: false,
        message: "Token required"
      });
    }

    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id || data.id;

    if (!user_id) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized"
      });
    }

    const { name, companies, bikes } = req.body;

    /* =========================
       1. Validate name
    ========================== */
    if (!name || name.trim() === "") {
      return res.status(400).json({
        status: false,
        message: "Service name is required",
        field: "name"
      });
    }

    /* =========================
       2. Validate companies
    ========================== */
    let parsedCompanies = [];
    try {
      parsedCompanies =
        typeof companies === "string" ? JSON.parse(companies) : companies;
    } catch {
      return res.status(400).json({
        status: false,
        message: "Invalid companies format",
        field: "companies"
      });
    }

    if (!Array.isArray(parsedCompanies) || parsedCompanies.length === 0) {
      return res.status(400).json({
        status: false,
        message: "At least one company is required",
        field: "companies"
      });
    }

    for (let i = 0; i < parsedCompanies.length; i++) {
      if (!mongoose.Types.ObjectId.isValid(parsedCompanies[i])) {
        return res.status(400).json({
          status: false,
          message: `Invalid companyId at index ${i}`,
          field: `companies[${i}]`
        });
      }
    }

    /* =========================
       3. Validate CC-wise pricing
    ========================== */
    let parsedBikes = [];
    try {
      parsedBikes =
        typeof bikes === "string" ? JSON.parse(bikes) : bikes;
    } catch {
      return res.status(400).json({
        status: false,
        message: "Invalid bikes format",
        field: "bikes"
      });
    }

    if (!Array.isArray(parsedBikes) || parsedBikes.length === 0) {
      return res.status(400).json({
        status: false,
        message: "At least one CC price is required",
        field: "bikes"
      });
    }

    for (let i = 0; i < parsedBikes.length; i++) {
      const { cc, price } = parsedBikes[i];

      if (!cc || isNaN(cc) || cc <= 0) {
        return res.status(400).json({
          status: false,
          message: `Invalid CC at index ${i}`,
          field: `bikes[${i}].cc`
        });
      }

      if (!price || isNaN(price) || price <= 0) {
        return res.status(400).json({
          status: false,
          message: `Invalid price at index ${i}`,
          field: `bikes[${i}].price`
        });
      }
    }

    /* =========================
       4. Validate image
    ========================== */
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "Service image is required",
        field: "image"
      });
    }

    /* =========================
       5. Create admin service
    ========================== */
    const newService = await adminservices.create({
      name: name.trim(),
      companies: parsedCompanies,
      bikes: parsedBikes,
      image: req.file.filename
    });

    return res.status(201).json({
      status: true,
      message: "Admin service created successfully",
      data: newService
    });

  } catch (error) {
    console.error("Error adding admin service:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error"
    });
  }
}


async function listAdminServices(req, res) {
  try {
    const services = await adminservices
      .find()
      .populate("companies", "name")
      .sort({ id: -1 });

    return res.status(200).json({
      status: true,
      message: services.length ? "Admin services fetched successfully" : "No admin services found",
      data: services
    });
  } catch (error) {
    console.error("Error fetching admin services:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error"
    });
  }
}


async function getAdminServiceById(req, res) {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Valid admin service ID is required"
      });
    }

    const service = await adminservices
      .findById(id)
      .populate("companies", "name")
      .lean();

    if (!service) {
      return res.status(404).json({
        status: false,
        message: "Admin service not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Admin service fetched successfully",
      data: service
    });
  } catch (error) {
    console.error("Error fetching admin service:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error"
    });
  }
}


// By Prashant 
// add service
async function addservice(req, res) {
  try {
    const { name, description, dealer_id, bikes } = req.body;

    // Validate: name
    if (!name || name.trim() === "") {
      return res.status(200).send({
        status: 400,
        message: "Service name is required.",
        field: "name",
      });
    }

    // Validate: dealer_id
    if (!dealer_id || !mongoose.Types.ObjectId.isValid(dealer_id)) {
      return res.status(200).send({
        status: 400,
        message: "Valid dealer ID is required.",
        field: "dealer_id",
      });
    }

    // Validate and parse bikes
    let parsedBikes = [];

    if (!bikes) {
      return res.status(200).send({
        status: 400,
        message: "Bikes field is required.",
        field: "bikes",
      });
    }

    try {
      if (typeof bikes === "string") {
        if (bikes.trim() === "") {
          return res.status(200).send({
            status: 400,
            message: "Bikes field is required.",
            field: "bikes",
          });
        }
        parsedBikes = JSON.parse(bikes);
      } else {
        parsedBikes = bikes;
      }

      if (!Array.isArray(parsedBikes) || parsedBikes.length === 0) {
        return res.status(200).send({
          status: 400,
          message: "Bikes must be a non-empty array.",
          field: "bikes",
        });
      }

      for (let i = 0; i < parsedBikes.length; i++) {
        const bike = parsedBikes[i];

        // Convert to numbers
        bike.cc = Number(bike.cc);
        bike.price = Number(bike.price);

        if (
          isNaN(bike.cc) ||
          isNaN(bike.price)
        ) {
          return res.status(200).send({
            status: 400,
            message: `Bike at index ${i} must have numeric 'cc' and 'price' values.`,
            field: "bikes",
          });
        }
      }
    } catch (err) {
      return res.status(200).send({
        status: 400,
        message: "Invalid bikes format. Must be JSON array.",
        field: "bikes",
      });
    }

    // Handle image
    const image = req.file?.filename || ""; // multer will save image file

    // Create service
    const newService = await service.create({
      name: name.trim(),
      description: description?.trim() || "",
      image,
      dealer_id,
      bikes: parsedBikes,
    });

    return res.status(200).send({
      status: 200,
      message: "Service added successfully",
      data: newService,
    });
  } catch (error) {
    console.error("Error adding service:", error);
    return res.status(200).send({
      status: 500,
      message: "Internal Server Error",
    });
  }
}

async function getServiceById(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(200).send({
        status: 400,
        message: "Service ID is required!"
      });
    }

    const serviceData = await service.findById(id)
      .populate("dealer_id", "shopName email phone")
      .lean();

    if (!serviceData) {
      return res.status(200).send({
        status: 404,
        message: "Service not found!"
      });
    }

    // Format the response data
    const responseData = {
      _id: serviceData._id,
      name: serviceData.name,
      image: serviceData.image,
      description: serviceData.description,
      dealer_id: {
        _id: serviceData.dealer_id?._id,
        shopName: serviceData.dealer_id?.shopName,
        email: serviceData.dealer_id?.email,
        phone: serviceData.dealer_id?.phone
      },
      bikes: serviceData.bikes || [],
      createdAt: serviceData.createdAt,
      updatedAt: serviceData.updatedAt
    };

    return res.status(200).send({
      status: 200,
      message: "Service retrieved successfully",
      data: responseData
    });

  } catch (error) {
    console.error("Error fetching service by ID:", error);

    if (error instanceof mongoose.Error.CastError) {
      return res.status(200).send({
        status: 400,
        message: "Invalid service ID format"
      });
    }

    return res.status(200).send({
      status: 500,
      message: "Internal Server Error"
    });
  }
}

// Update Service API
async function updateServiceById(req, res) {
  try {
    const { id } = req.params;
    const { name, description, dealer_id, bikes } = req.body;

    // Validate required fields
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        message: "Valid service ID is required"
      });
    }

    if (!name || name.trim() === "") {
      return res.status(400).json({
        status: 400,
        message: "Service name is required",
        field: "name"
      });
    }

    if (!dealer_id || !mongoose.Types.ObjectId.isValid(dealer_id)) {
      return res.status(400).json({
        status: 400,
        message: "Valid dealer ID is required",
        field: "dealer_id"
      });
    }

    // Parse bikes data
    let parsedBikes = [];
    try {
      parsedBikes = bikes ? JSON.parse(bikes) : [];
    } catch (error) {
      return res.status(400).json({
        status: 400,
        message: "Invalid bikes data format",
        field: "bikes"
      });
    }

    // Validate bikes array
    if (!Array.isArray(parsedBikes) || parsedBikes.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "At least one bike configuration is required",
        field: "bikes"
      });
    }

    // Validate each bike object
    for (let i = 0; i < parsedBikes.length; i++) {
      const bike = parsedBikes[i];
      if (!bike.cc || isNaN(bike.cc) || bike.cc <= 0) {
        return res.status(400).json({
          status: 400,
          message: `Bike at index ${i} must have valid CC > 0`,
          field: `bikes[${i}].cc`
        });
      }
      if (!bike.price || isNaN(bike.price) || bike.price <= 0) {
        return res.status(400).json({
          status: 400,
          message: `Bike at index ${i} must have valid price > 0`,
          field: `bikes[${i}].price`
        });
      }
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
      description: description?.trim() || "",
      dealer_id,
      bikes: parsedBikes
    };

    // Handle image upload if exists
    if (req.file) {
      updateData.image = req.file.filename;
    }

    // Update the service
    const updatedService = await service.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("dealer_id", "shopName email phone");

    if (!updatedService) {
      return res.status(404).json({
        status: 404,
        message: "Service not found"
      });
    }

    // Format the response
    const responseData = {
      _id: updatedService._id,
      name: updatedService.name,
      image: updatedService.image,
      description: updatedService.description,
      dealer_id: {
        _id: updatedService.dealer_id?._id,
        shopName: updatedService.dealer_id?.shopName,
        email: updatedService.dealer_id?.email,
        phone: updatedService.dealer_id?.phone
      },
      bikes: updatedService.bikes || [],
      createdAt: updatedService.createdAt,
      updatedAt: updatedService.updatedAt
    };

    return res.status(200).json({
      status: 200,
      message: "Service updated successfully",
      data: responseData
    });

  } catch (error) {
    console.error("Error updating service:", error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error"
    });
  }
}

// Additional Services API 
async function additionalservicelist(req, res) {
  try {
    const services = await additionalService
      .find()
      .populate("dealer_id", "name email")
      .sort({ id: -1 });

    return res.status(200).send({
      status: 200,
      message: services.length > 0 ? "Success" : "No services available",
      data: services,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return res.status(200).send({ status: 500, message: "Internal Server Error" });
  }
}

async function addAdditionalService(req, res) {
  try {
    const { name, description, dealer_id, bikes: bikesString } = req.body;
    console.log("Raw Request Body:", req.body);

    // Validate: name
    if (!name || name.trim() === "") {
      return res.status(400).json({
        status: 400,
        message: "Additional Service name is required.",
        field: "name",
      });
    }

    // Validate: dealer_id
    if (!dealer_id || !mongoose.Types.ObjectId.isValid(dealer_id)) {
      return res.status(400).json({
        status: 400,
        message: "Valid dealer ID is required.",
        field: "dealer_id",
      });
    }

    // Parse and validate bikes
    let parsedBikes = [];
    try {
      // Parse the JSON string to array
      parsedBikes = JSON.parse(bikesString);

      if (!Array.isArray(parsedBikes)) {
        throw new Error("Bikes must be an array");
      }

      // Validate each bike object
      parsedBikes = parsedBikes.map((bike, index) => {
        if (!bike || typeof bike !== 'object') {
          throw new Error(`Bike at index ${index} is not a valid object`);
        }

        const cc = Number(bike.cc);
        const price = Number(bike.price);

        if (isNaN(cc)) {
          throw new Error(`Invalid cc value at index ${index}`);
        }
        if (isNaN(price)) {
          throw new Error(`Invalid price value at index ${index}`);
        }

        return {
          cc,
          price
        };
      });

    } catch (err) {
      console.error("Bikes parsing error:", err);
      return res.status(400).json({
        status: 400,
        message: "Invalid bikes data: " + err.message,
        field: "bikes",
      });
    }

    if (parsedBikes.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "At least one bike configuration is required",
        field: "bikes",
      });
    }

    // Handle image
    const image = req.file?.filename || "";

    // Create service
    const newService = await additionalService.create({
      name: name.trim(),
      description: description?.trim() || "",
      dealer_id,
      bikes: parsedBikes,
      image,
    });

    console.log("New Additional Service with Bikes:", newService);

    return res.status(201).json({
      status: 201,
      message: "Additional Service added successfully",
      data: newService,
    });
  } catch (error) {
    console.error("Error adding service:", error);
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error: " + error.message,
    });
  }
}

async function deleteAdditionaalService(req, res) {
  try {
    const { id } = req.params;
    console.log("Delete Service ID:", id);
    if (!id) {
      return res.status(200).send({ status: 400, message: "Service ID is required!" });
    }

    const deletedService = await additionalService.findByIdAndDelete(id);
    return res.status(200).send({
      status: 200,
      message: deletedService ? "Service deleted successfully" : "Service not found!",
    });
  } catch (error) {
    console.error("Error deleting service:", error);
    return res.status(200).send({ status: 500, message: "Internal Server Error" });
  }
}

async function getAdditionalServiceById(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(200).send({
        status: 400,
        message: "Service ID is required!"
      });
    }

    const serviceData = await additionalService.findById(id)
      .populate("dealer_id", "shopName email phone")
      .lean();

    if (!serviceData) {
      return res.status(200).send({
        status: 404,
        message: "Service not found!"
      });
    }

    // Format the response data
    const responseData = {
      _id: serviceData._id,
      name: serviceData.name,
      image: serviceData.image,
      description: serviceData.description,
      dealer_id: {
        _id: serviceData.dealer_id?._id,
        shopName: serviceData.dealer_id?.shopName,
        email: serviceData.dealer_id?.email,
        phone: serviceData.dealer_id?.phone
      },
      bikes: serviceData.bikes || [],
      createdAt: serviceData.createdAt,
      updatedAt: serviceData.updatedAt
    };

    return res.status(200).send({
      status: 200,
      message: "Service retrieved successfully",
      data: responseData
    });

  } catch (error) {
    console.error("Error fetching service by ID:", error);

    if (error instanceof mongoose.Error.CastError) {
      return res.status(200).send({
        status: 400,
        message: "Invalid service ID format"
      });
    }

    return res.status(200).send({
      status: 500,
      message: "Internal Server Error"
    });
  }
}

async function updateAdditionalServiceById(req, res) {
  try {
    const { id } = req.params;
    console.log("Id:", id);
    const { name, description, dealer_id, bikes } = req.body;

    console.log("Request Body for Update:", req.body);

    // Validate required fields
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        message: "Valid service ID is required"
      });
    }

    if (!name || name.trim() === "") {
      return res.status(400).json({
        status: 400,
        message: "Service name is required",
        field: "name"
      });
    }

    if (!dealer_id || !mongoose.Types.ObjectId.isValid(dealer_id)) {
      return res.status(400).json({
        status: 400,
        message: "Valid dealer ID is required",
        field: "dealer_id"
      });
    }

    // Parse bikes data
    let parsedBikes = [];
    try {
      parsedBikes = bikes ? JSON.parse(bikes) : [];
    } catch (error) {
      return res.status(400).json({
        status: 400,
        message: "Invalid bikes data format",
        field: "bikes"
      });
    }

    // Validate bikes array
    if (!Array.isArray(parsedBikes) || parsedBikes.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "At least one bike configuration is required",
        field: "bikes"
      });
    }

    // Validate each bike object
    for (let i = 0; i < parsedBikes.length; i++) {
      const bike = parsedBikes[i];
      if (!bike.cc || isNaN(bike.cc) || bike.cc <= 0) {
        return res.status(400).json({
          status: 400,
          message: `Bike at index ${i} must have valid CC > 0`,
          field: `bikes[${i}].cc`
        });
      }
      if (!bike.price || isNaN(bike.price) || bike.price <= 0) {
        return res.status(400).json({
          status: 400,
          message: `Bike at index ${i} must have valid price > 0`,
          field: `bikes[${i}].price`
        });
      }
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
      description: description?.trim() || "",
      dealer_id,
      bikes: parsedBikes
    };

    // Handle image upload if exists
    if (req.file) {
      updateData.image = req.file.filename;
    }

    // Update the service
    const updatedService = await additionalService.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("dealer_id", "shopName email phone");

    if (!updatedService) {
      return res.status(404).json({
        status: 404,
        message: "Service not found"
      });
    }

    // Format the response
    const responseData = {
      _id: updatedService._id,
      name: updatedService.name,
      image: updatedService.image,
      description: updatedService.description,
      dealer_id: {
        _id: updatedService.dealer_id?._id,
        shopName: updatedService.dealer_id?.shopName,
        email: updatedService.dealer_id?.email,
        phone: updatedService.dealer_id?.phone
      },
      bikes: updatedService.bikes || [],
      createdAt: updatedService.createdAt,
      updatedAt: updatedService.updatedAt
    };

    return res.status(200).json({
      status: 200,
      message: "Service updated successfully",
      data: responseData
    });

  } catch (error) {
    console.error("Error updating service:", error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error"
    });
  }
}

async function updateAdminService(req, res) {
  try {
    const { id } = req.params;
    const { name, companies, bikes } = req.body;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Valid admin service ID is required"
      });
    }

    const updateData = {};

    /* =========================
       1. Name (optional)
    ========================== */
    if (name && name.trim() !== "") {
      updateData.name = name.trim();
    }

    /* =========================
       2. Companies (optional)
    ========================== */
    if (companies) {
      let parsedCompanies;
      try {
        parsedCompanies =
          typeof companies === "string" ? JSON.parse(companies) : companies;
      } catch {
        return res.status(400).json({
          status: false,
          message: "Invalid companies format",
          field: "companies"
        });
      }

      if (!Array.isArray(parsedCompanies) || parsedCompanies.length === 0) {
        return res.status(400).json({
          status: false,
          message: "At least one company is required",
          field: "companies"
        });
      }

      for (let i = 0; i < parsedCompanies.length; i++) {
        if (!mongoose.Types.ObjectId.isValid(parsedCompanies[i])) {
          return res.status(400).json({
            status: false,
            message: `Invalid companyId at index ${i}`,
            field: `companies[${i}]`
          });
        }
      }

      updateData.companies = parsedCompanies;
    }

    /* =========================
       3. Bikes (optional)
    ========================== */
    if (bikes) {
      let parsedBikes;
      try {
        parsedBikes =
          typeof bikes === "string" ? JSON.parse(bikes) : bikes;
      } catch {
        return res.status(400).json({
          status: false,
          message: "Invalid bikes format",
          field: "bikes"
        });
      }

      if (!Array.isArray(parsedBikes) || parsedBikes.length === 0) {
        return res.status(400).json({
          status: false,
          message: "At least one CC price is required",
          field: "bikes"
        });
      }

      for (let i = 0; i < parsedBikes.length; i++) {
        const { cc, price } = parsedBikes[i];

        if (!cc || isNaN(cc) || cc <= 0) {
          return res.status(400).json({
            status: false,
            message: `Invalid CC at index ${i}`,
            field: `bikes[${i}].cc`
          });
        }

        if (!price || isNaN(price) || price <= 0) {
          return res.status(400).json({
            status: false,
            message: `Invalid price at index ${i}`,
            field: `bikes[${i}].price`
          });
        }
      }

      updateData.bikes = parsedBikes;
    }

    /* =========================
       4. Image (optional)
    ========================== */
    if (req.file) {
      updateData.image = req.file.filename;
    }

    /* =========================
       5. Update DB
    ========================== */
    const updatedService = await adminservices.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("companies", "name");

    if (!updatedService) {
      return res.status(404).json({
        status: false,
        message: "Admin service not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Admin service updated successfully",
      data: updatedService
    });

  } catch (error) {
    console.error("Error updating admin service:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error"
    });
  }
}


async function deleteAdminService(req, res) {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Valid admin service ID is required"
      });
    }

    const deletedService = await adminservices.findByIdAndDelete(id);

    if (!deletedService) {
      return res.status(404).json({
        status: false,
        message: "Admin service not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Admin service deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting admin service:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error"
    });
  }
}

module.exports = {
  addservice,
  servicelist,
  singleService,
  updateService,
  deleteService,
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
  deleteAdminService
};