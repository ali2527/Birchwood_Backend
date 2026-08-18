const sanitizeUser = (user) => {
  if (!user) return user;
  const obj = typeof user.toObject === "function" ? user.toObject() : { ...user };
  delete obj.hashed_password;
  delete obj.salt;
  delete obj.tokens;
  delete obj.password;
  return obj;
};

module.exports = sanitizeUser;
