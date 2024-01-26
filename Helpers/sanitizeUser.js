const sanitizeUser = (user) => {
    user.hashed_password = undefined
    user.salt = undefined
    return user
}
module.exports = sanitizeUser;