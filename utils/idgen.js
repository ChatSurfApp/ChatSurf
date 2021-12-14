module.exports = class Generator {
  constuctor() {
    this.inc = Math.floor(Math.random * 100);
  }

  generate() {
    return Buffer.concat([
      Buffer.from([Date.now(), this.inc++]),
      require("crypto").randomBytes(16)
    ]).toString("hex");
  }
};
