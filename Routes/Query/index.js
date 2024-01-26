const express = require("express")
const { addQuery,getAllQueries,getQueryById,deleteQuery} = require("../../Controllers/Query");
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../Middlewares/auth")
const {addQueryValidator} = require("../../Validator/queryValidator")

router.post("/addQuery",addQueryValidator, addQuery);
router.get("/getAllQueries", authenticatedRoute,getAllQueries);
router.get("/getQueryById/:id", authenticatedRoute,getQueryById);
router.post("/deleteQuery/:id", authenticatedRoute,deleteQuery);

module.exports = router