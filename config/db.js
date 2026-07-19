const mongoose = require('mongoose');

mongoose.connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Database Connected")
}).catch((err) => {
    console.log("Error in Database Connection",err)
})

module.exports = mongoose