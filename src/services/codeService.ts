import * as leftPad from "left-pad";
function generateCode(max) {
  return leftPad(_getRandomInt(max), max.length, 0);
}

function _getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

export { generateCode };
