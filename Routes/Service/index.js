const express = require("express")
const { addService,getAllServices,getServiceById,updateService,deleteService} = require("../../Controllers/Service");
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../Middlewares/auth")
const { uploadFile } = require("../../Middlewares/upload")
const {addServiceValidator} = require("../../Validator/serviceValidator")

router.post("/addService",authenticatedRoute,uploadFile,addServiceValidator, addService);
router.get("/getAllServices", getAllServices);
router.get("/getServiceById/:id", authenticatedRoute,getServiceById);
router.post("/updateService/:id", authenticatedRoute,uploadFile,updateService);
router.post("/deleteService/:id", authenticatedRoute,deleteService);

module.exports = router