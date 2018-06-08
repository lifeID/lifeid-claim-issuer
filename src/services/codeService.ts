import * as leftPad from "left-pad";

function generateCode(max: number): string {
  const maxLength = max.toString().length;
  return leftPad(_getRandomInt(max), maxLength, 0);
}

function _getRandomInt(max: number): number {
  return Math.floor(Math.random() * Math.floor(max));
}

export { generateCode };
