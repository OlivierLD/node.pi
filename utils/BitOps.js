const BitOps = {
  checkBit: function(value, position) {
    var mask = 1 << position;
    return ((value & mask) === mask);
  },
  setBit: function(value, position) {
    return (value | (1 << position));
  },
  clearBit: function(value, position) {
    return (value & ~(1 << position));
  },
  flipBit: function(value, position) {
    return (value ^ (1 << position));
  },
  checkBits: function(value, mask) {
    return ((value & mask) == mask);
  },
  setBits: function(value, mask) {
    return (value | mask);
  },
  clearBits: function(value, mask) {
    return (value & (~mask));
  },
  flipBits: function(value, mask) {
    return value ^ mask;
  },
  setValueUnderMask: function(valueToSet, currentValue, mask) {
    let currentValueCleared = this.clearBits(currentValue, mask);
    let i = 0;
    while (mask % 2 === 0 && mask !== 0x00) {
      mask >>= 1;
      i++;
    }
    return this.setBits(valueToSet << i, currentValueCleared);
  },
  getValueUnderMask: function(currentValue, mask) {
	  let currentValueCleared = this.clearBits(currentValue, ~mask); // clear bits not under mask
	  let i = 0;
    while (mask % 2 === 0 && mask !== 0x00) {
      mask >>= 1;
      i++;
    }
    return currentValueCleared >> i;
  },
  twosComplementToByte: function(value) {
    if (value >= 0 && value <= 0x7f) {
      return value;
    } else {
      return value - 0x100;
    }
  },
  twosComplementToCustom: function(value, signBitPosition) {
    if (value >= 0 && value <= (1 << signBitPosition) - 1) {
      return value;
    } else {
      return value - (2 << signBitPosition);
    }
  }
};

exports.BitOps = BitOps;
