const express = require("express");
const { assignChild } = require("../../../Controllers/Children/childProfileController");
const router = express.Router();
const { authenticatedRoute } = require("../../../Middlewares/auth");
const { assignChildValidator } = require("../../../Validator/childValidator");

router.post("/assignChild", authenticatedRoute, assignChildValidator, assignChild);
// router.post("/updateProfile",authenticatedRoute,uploadFile, updateProfile);
// router.post("/changePassword",authenticatedRoute,changePasswordValidator,changePassword);

module.exports = router