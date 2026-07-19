//Models
const User = require("../../Models/User");
const Service = require("../../Models/Service");
const fs = require("fs")

//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { generateEmail } = require("../../Helpers/email");
const sanitizeUser = require("../../Helpers/sanitizeUser");
const {
  createResetToken,
  validateResetToken,
} = require("../../Helpers/verification");



//signup
exports.addService = async (req, res) => {
  const { title, description, image } = req.body;
  try {
  
    let service = await Service.findOne({title})

    if (service) {
      return res
        .status(400)
        .json(ApiResponse({}, "Service with this title already exists",false,));
    }

    service = new Service({
      title,
      description,
      image: req.body.image || "",
      status: "ACTIVE",
    });

    await service.save();

    return res
      .status(200)
      .json(
        ApiResponse(
          { service },
          
          "Service Created Successfully",
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

exports.getAllServices = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let finalAggregate = [];

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
              },
              {
                description: {
                  $regex: ".*" + req.query.keyword.toLowerCase() + ".*",
                  $options: "i",
                },
              },
            ],
          },
        });
      }
    }

    const myAggregate =
      finalAggregate.length > 0
        ? Service.aggregate(finalAggregate)
        : Service.aggregate([]);

    Service.aggregatePaginate(myAggregate, { page, limit }).then(
      (categories) => {
        res.json(ApiResponse(categories));
      }
    );
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getServiceById = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);

    if (!service) {
      return res.json(ApiResponse({}, "Service not found", true));
    }
    return res.json(ApiResponse({ service }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.updateService = async (req, res) => {
  try {
   

    if (req.body.image) {
      let currentService = await Service.findById(req.params.id);
      
      if (currentService.image) {
        const filePath = `./Uploads/${currentService.image}`;
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`File '${filePath}' deleted.`);
        } else {
          console.log(`File '${filePath}' does not exist.`);
        }
      }
    }


    let service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!service) {
      return res.json(ApiResponse({}, "No service found", false));
    }
    return res.json(ApiResponse(service, "Service updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.deleteService =async  (req, res) => {
  try {
    let service = await  Service.findByIdAndRemove(req.params.id)
      
      if (!service) {
        return res.json(ApiResponse({}, "Service not found", false));
      }
      if (service.image) {
        fs.unlinkSync(`./Uploads/${service.image}`);
      }


      return res.json(ApiResponse({},"Service Deleted Successfully",true));
    
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
