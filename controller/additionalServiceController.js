const AdditionalService = require("../models/additionalServiceSchema");
const mongoose = require("mongoose");
const jwt_decode = require("jwt-decode");
const AdditionalOptions = require("../models/additionalOptionsSchema"); // Import AdditionalOptions
const Dealer = require("../models/dealerSchema"); // Import Dealer

/**
 * CREATE Additional Service (Dealer Only)
 * POST /dealer/additional-services
 */
// 1. Add Additional Service
const addAdditionalService = async (req, res) => {
    try {
        // Auth check
        if (!req.headers.token) {
            return res.status(401).json({
                status: false,
                message: "Token required",
            });
        }

        const data = jwt_decode(req.headers.token);
        const user_id = data.user_id || data.id;

        if (!user_id) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized",
            });
        }

        const { name, description, bikes } = req.body;
        const { dealer_id } = req.body;

        /* =========================
           1. Validate name
        ========================== */
        if (!name || name.trim() === "") {
            return res.status(400).json({
                status: false,
                message: "Service name is required",
                field: "name",
            });
        }

        /* =========================
           2. Validate dealer_id
        ========================== */
        if (!dealer_id || !mongoose.Types.ObjectId.isValid(dealer_id)) {
            return res.status(400).json({
                status: false,
                message: "Valid dealer ID is required",
                field: "dealer_id",
            });
        }

        /* =========================
           3. Validate image
        ========================== */
        if (!req.file) {
            return res.status(400).json({
                status: false,
                message: "Service image is required",
                field: "image",
            });
        }

        // Parse bikes if provided
        let parsedBikes = [];
        if (bikes) {
            try {
                parsedBikes = typeof bikes === 'string' ? JSON.parse(bikes) : bikes;
                
                // Validate bikes structure
                if (Array.isArray(parsedBikes)) {
                    parsedBikes = parsedBikes.filter(bike => bike.cc && bike.price);
                }
            } catch (error) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid bikes data format",
                    field: "bikes",
                });
            }
        }

        // Build service data with image path
        const serviceData = {
            name: name.trim(),
            description: description || "",
            dealer_id,
            image: `uploads/additional-services/${req.file.filename}`,
        };

        // Add bikes if provided
        if (parsedBikes.length > 0) {
            serviceData.bikes = parsedBikes;
        }

        const newService = await AdditionalService.create(serviceData);

        res.status(201).json({
            status: true,
            message: "Additional service created successfully",
            data: newService
        });
    } catch (error) {
        console.error("Error creating additional service:", error);
        res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

/**
 * LIST Additional Services (Dealer Only)
 * GET /dealer/additional-services
 */
// 2. Get All Additional Services
const getAllAdditionalServices = async (req, res) => {
    try {
        const services = await AdditionalService.find()
            .populate("dealer_id", "shopName email")
            .sort({ id: -1 });

        return res.status(200).json({
            status: true,
            message: services.length > 0 ? "Additional services fetched successfully" : "No additional services found",
            data: services
        });
    } catch (error) {
        console.error("Error fetching additional services:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

/**
 * GET Additional Service By ID (Dealer Only)
 * GET /dealer/additional-services/:id
 */
// 3. Get Single Additional Service
const getAdditionalServiceById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: false,
                message: "Valid service ID is required"
            });
        }

        const service = await AdditionalService.findById(id).populate("dealer_id", "shopName email");

        if (!service) {
            return res.status(404).json({
                status: false,
                message: "Additional service not found"
            });
        }

        return res.status(200).json({
            status: true,
            message: "Additional service fetched successfully",
            data: service
        });
    } catch (error) {
        console.error("Error fetching additional service:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

/**
 * UPDATE Additional Service (Dealer Only)
 * PUT /dealer/additional-services/:id
 */
// 4. Update Additional Service
const updateAdditionalService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, bikes } = req.body;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: false,
                message: "Valid service ID is required"
            });
        }

        if (name && name.trim() === "") {
            return res.status(400).json({
                status: false,
                message: "Service name cannot be empty",
                field: "name",
            });
        }

        const updateData = {};
        if (name) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description;

        // Add image with uploads/additional-services folder path
        if (req.file) {
            updateData.image = `uploads/additional-services/${req.file.filename}`;
        }

        // Parse and add bikes if provided
        if (bikes) {
            try {
                let parsedBikes = typeof bikes === 'string' ? JSON.parse(bikes) : bikes;
                if (Array.isArray(parsedBikes)) {
                    parsedBikes = parsedBikes.filter(bike => bike.cc && bike.price);
                }
                updateData.bikes = parsedBikes;
            } catch (error) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid bikes data format",
                    field: "bikes",
                });
            }
        }

        const updatedService = await AdditionalService.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate("dealer_id", "shopName email");

        if (!updatedService) {
            return res.status(404).json({
                status: false,
                message: "Additional service not found"
            });
        }

        return res.status(200).json({
            status: true,
            message: "Additional service updated successfully",
            data: updatedService
        });
    } catch (error) {
        console.error("Error updating additional service:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

/**
 * DELETE Additional Service (Dealer Only)
 * DELETE /dealer/additional-services/:id
 */
// 5. Delete Additional Service
const deleteAdditionalService = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: false,
                message: "Valid service ID is required"
            });
        }

        const deletedService = await AdditionalService.findByIdAndDelete(id);

        if (!deletedService) {
            return res.status(404).json({
                status: false,
                message: "Additional service not found"
            });
        }

        return res.status(200).json({
            status: true,
            message: "Additional service deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting additional service:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

/**
 * GET Additional Services by Dealer ID (With optional CC filter)
 * GET /dealer/additional-services/dealer/:dealerId?cc=100
 */
// 6. Get Additional Services by Dealer ID
// Get Additional Services by Dealer ID with optional CC filter
const getAdditionalServicesByDealerId = async (req, res) => {
    try {
        const { dealerId } = req.params;
        const { cc } = req.query; // Get CC from query params

        if (!dealerId || !mongoose.Types.ObjectId.isValid(dealerId)) {
            return res.status(400).json({
                status: false,
                message: "Valid dealer ID is required"
            });
        }

        // Build the query object
        const query = { dealer_id: dealerId };

        // Add CC filter if provided
        if (cc) {
            query['bikes.cc'] = Number(cc);
        }

        const services = await AdditionalService.find(query)
            .populate("dealer_id", "shopName email")
            .sort({ id: -1 });

        // Filter bikes array if CC was specified
        let result = services;
        if (cc) {
            result = services.map(service => ({
                ...service.toObject(),
                bikes: service.bikes.filter(bike => bike.cc === Number(cc))
            }));
        }

        return res.status(200).json({
            status: true,
            message: result.length > 0 ? "Additional services fetched successfully" : "No additional services found",
            data: result
        });
    } catch (error) {
        console.error("Error fetching additional services by dealer:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

/**
 * SAVE Selected Additional Services for Dealer
 * POST /dealer/additional-services/select-services
 */
const saveSelectedServices = async (req, res) => {
    try {
        // Auth check
        if (!req.headers.token) {
            return res.status(401).json({
                status: false,
                message: "Token required",
            });
        }

        const data = jwt_decode(req.headers.token);
        const user_id = data.user_id || data.id;

        if (!user_id) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized",
            });
        }

        const { dealer_id, selected_services } = req.body;

        // Validate dealer_id
        if (!dealer_id || !mongoose.Types.ObjectId.isValid(dealer_id)) {
            return res.status(400).json({
                status: false,
                message: "Valid dealer ID is required",
                field: "dealer_id"
            });
        }

        // Validate selected services
        if (!Array.isArray(selected_services) || selected_services.length === 0) {
            return res.status(400).json({
                status: false,
                message: "Please select at least one service",
                field: "selected_services"
            });
        }

        // Check if all selected services are valid ObjectIds
        const validIds = selected_services.every(id => mongoose.Types.ObjectId.isValid(id));
        if (!validIds) {
            return res.status(400).json({
                status: false,
                message: "Invalid service ID format in selected_services"
            });
        }

        // Check if services exist
        const validServices = await AdditionalService.find({
            _id: { $in: selected_services }
        });

        if (validServices.length !== selected_services.length) {
            const invalidServices = selected_services.filter(
                id => !validServices.some(s => s._id.toString() === id)
            );
            return res.status(400).json({
                status: false,
                message: "Some selected services do not exist",
                invalidServices
            });
        }

        return res.status(200).json({
            status: true,
            message: "Services selected successfully",
            data: {
                selectedServices: validServices.map(s => ({
                    _id: s._id,
                    name: s.name,
                    serviceId: s.serviceId
                }))
            }
        });

    } catch (error) {
        console.error("Error saving selected services:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

module.exports = {
    addAdditionalService,
    getAllAdditionalServices,
    getAdditionalServiceById,
    updateAdditionalService,
    deleteAdditionalService,
    getAdditionalServicesByDealerId,
    saveSelectedServices
};
