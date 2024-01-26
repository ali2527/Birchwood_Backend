//Models
const User = require("../../Models/User");
const Classroom = require("../../Models/Classroom");
const Inventory = require("../../Models/Inventory");
const fs = require("fs");
const crypto = require("crypto");
const KJUR = require("jsrsasign");
const moment = require("moment");
//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const {
  sendNotificationToAdmin,
  sendNotificationToUser,
} = require("../../Helpers/notification");
const sanitizeUser = require("../../Helpers/sanitizeUser");
const {
  createResetToken,
  validateResetToken,
} = require("../../Helpers/verification");
const mongoose = require("mongoose");

//addInventory
exports.addInventory = async (req, res) => {
  const {
    title,
    description,
    quantity,
    manufacturer,
    purchaseDate,
    unitPrice,
    lastAuditDate,
    notes,
    category,
  } = req.body;

  try {
    const inventory = new Inventory({
      title,
      description,
      quantity,
      manufacturer,
      purchaseDate,
      unitPrice,
      lastAuditDate,
      notes,
      category,
      image: req.files.image ? req.files.image[0].filename : "",
      gallery: req.files.gallery
        ? req.files.gallery.map((item) => item.filename)
        : "",
    });

    await inventory.save();

    return res.status(200).json(
      ApiResponse(
        { Inventory },

        "Inventory Created Successfully",
        true
      )
    );
  } catch (error) {
    return res.json(
      ApiResponse(
        {},
        errorHandler(error) ? errorHandler(error) : error.message,
        false
      )
    );
  }
};

exports.getAllInventorys = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let finalAggregate = [
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
    ];

    if (req.query) {
      if (req.query.keyword) {
        finalAggregate.push({
          $match: {
            $or: [
              {
                title: {
                  $regex: ".*" + req.query.keyword.toLowerCase() + ".*",
                  $options: "i",
                },
                description: {
                  $regex: ".*" + req.query.keyword.toLowerCase() + ".*",
                  $options: "i",
                },
              },
            ],
          },
        });
      }
      if (req.query.category) {
        finalAggregate.push({
          $match: {
            category: req.query.category,
          },
        });
      }
      if (req.query.status) {
        finalAggregate.push({
          $match: {
            status: req.query.status,
          },
        });
      }
    }

    const myAggregate =
      finalAggregate.length > 0
        ? Inventory.aggregate(finalAggregate)
        : Inventory.aggregate([]);

    Inventory.aggregatePaginate(myAggregate, { page, limit }).then(
      (inventorys) => {
        res.json(ApiResponse(inventorys));
      }
    );
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Get inventory by ID
exports.getInventoryById = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.json(ApiResponse({}, "Inventory not found", true));
    }

    return res.json(ApiResponse({ inventory }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Get inventory by Category
exports.getInventoryByCategory = async (req, res) => {
  try {
    const inventorys = await Inventory.findOne({ category: req.params.id });

    if (!inventorys) {
      return res.json(ApiResponse({}, "Inventorys not found", true));
    }

    return res.json(ApiResponse({ inventorys }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.updateInventory = async (req, res) => {
  try {
    let inventory = await Inventory.findById(req.params.id);
    let oldImages = req.body.oldImages ? JSON.parse(req.body.oldImages) : [];
    let allImages = [];

    inventory.title = req.body.title ? req.body.title : inventory.title || "";
    inventory.description = req.body.description
      ? req.body.description
      : inventory.description || "";
    inventory.unitPrice = req.body.unitPrice
      ? req.body.unitPrice
      : inventory.unitPrice || 0;
    inventory.quantity = req.body.quantity
      ? req.body.quantity
      : inventory.quantity || 0;
    inventory.manufacturer = req.body.manufacturer
      ? req.body.manufacturer
      : inventory.manufacturer || "";
    inventory.purchaseDate = req.body.purchaseDate
      ? req.body.purchaseDate
      : inventory.purchaseDate;
    inventory.lastAuditDate = req.body.lastAuditDate
      ? req.body.lastAuditDate
      : inventory.lastAuditDate;
    inventory.notes = req.body.notes ? req.body.notes : inventory.notes;
    inventory.category = req.body.category
      ? req.body.category
      : inventory.category || "";

    let temp = req.files.gallery
      ? req.files.gallery.map((item) => item.filename)
      : [];
    allImages = [...inventory.gallery, ...temp];

    if (oldImages && oldImages.length > 0) {
      oldImages.map((item) => {
        const filePath = `./Uploads/${item}`;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    inventory.gallery =
      allImages.filter((image) => !oldImages.includes(image)) || [];

    await inventory.save();
    return res.json(ApiResponse(inventory, "Inventory updated successfully"));
  } catch (error) {
    // Handle errors
    console.error(error);
    return res.json(ApiResponse({}, error.message, false));
  }
};
//toggleStatus
exports.toggleStatus = async (req, res) => {
  try {
    
    let inventory = await Inventory.findById(req.params.id);


      inventory.status = inventory.status == "ACTIVE" ? "INACTIVE" : "ACTIVE"
      await inventory.save();     

      return res.json(ApiResponse(inventory, "Inventory Status Changed"));
  
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};



// Delete a inventory
exports.deleteInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndRemove(req.params.id);

    if (!inventory) {
      return res.json(ApiResponse({}, "Inventory not found", false));
    }

    return res.json(ApiResponse({}, "Inventory Deleted Successfully", true));
  } catch (error) {
    return res.json(
      ApiResponse(
        {},
        errorHandler(error) ? errorHandler(error) : error.message,
        false
      )
    );
  }
};
