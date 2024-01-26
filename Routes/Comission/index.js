const express = require("express")
const { addComission,getComission} = require("../../Controllers/Comission");
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../Middlewares/auth")

router.post("/addComission",authenticatedRoute, addComission);
router.get("/getComission", authenticatedRoute,getComission);

module.exports = router