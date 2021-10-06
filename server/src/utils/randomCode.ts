function generateCode() {
  var minm = 100000;
  var maxm = 999999;
  return String(Math.floor(Math.random() * (maxm - minm + 1)) + minm);
}

export default generateCode;
