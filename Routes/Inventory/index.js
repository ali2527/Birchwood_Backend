const express = require("express")
const { addInventory,getAllInventorys,getInventoryById,getInventoryByCategory,updateInventory,toggleStatus,deleteInventory} = require("../../Controllers/Inventory");
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../Middlewares/auth")
const {uploadProduct, uploadFile} = require("../../Middlewares/upload")
const {addInventoryValidator} = require("../../Validator/inventoryValidator")

router.post("/addInventory",authenticatedRoute,uploadProduct,addInventoryValidator, addInventory);
router.get("/getAllInventorys",authenticatedRoute,getAllInventorys);
router.get("/getInventoryById/:id",authenticatedRoute,getInventoryById);   
router.get("/getInventoryByCategory/:id",authenticatedRoute,getInventoryByCategory);
router.post("/updateInventory/:id",authenticatedRoute,uploadProduct,updateInventory);
router.get("/toggleStatus/:id",authenticatedRoute,toggleStatus);
router.get("/deleteInventory/:id",authenticatedRoute,deleteInventory);

module.exports = router