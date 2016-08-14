var DATA_RATE_VALUES = [ 95, 190, 380, 760 ];
var BANDWIDTH_VALUES = [ 12.5, 20, 25, 30, 35, 50, 70, 100 ];
var HIGHPASS_FILTER_CUTOFF_FREQUENCY_VALUES = [ 51.4, 27, 13.5, 7.2, 3.5, 1.8, 0.9, 0.45, 0.18, 0.09, 0.045, 0.018, 0.009 ];

var POWER_DOWN = "Power-down";
var SLEEP = "Sleep";
var NORMAL = "Normal";
var FALSE = "false";
var TRUE = "true";
var HIGH = "High";
var LOW = "Low";
var PUSH_PULL = "Push-pull";
var OPEN_DRAIN = "Open drain";
var _4_WIRE = "4-wire";
var _3_WIRE = "3-wire";
var BIG_ENDIAN = "Big endian";
var LITTLE_ENDIAN = "Little endian";
var _250_DPS = "250dps";
var _500_DPS = "500dps";
var _2000_DPS = "2000dps";
var CONTINUOUS_UPDATE = "Continous update";
var NOT_UPDATED_UNTIL_READING = "Output registers not updated until reading";
var LPF1 = "LPF1";
var HPF = "HPF";
var LPF2 = "LPF2";
var REBOOT_MEMORY_CONTENT = "Reboot memory content";
var BYPASS = "Bypass";
var FIFO = "FIFO";
var STREAM = "Stream";
var STREAM_TO_FIFO = "Stream-to-Fifo";
var BYPASS_TO_STREAM = "Bypass-to-Stream";
var AND = "And";
var OR = "Or";
var NORMAL_WITH_RESET = "Normal with reset.";
var REFERENCE_SIGNAL_FOR_FILTERING = "Reference signal for filtering.";
var AUTORESET_ON_INTERRUPT = "Autoreset on interrupt.";

var L3GD20Dictionaries = {
  POWER_DOWN: POWER_DOWN,
  SLEEP: SLEEP,
  NORMAL: NORMAL,
  FALSE: FALSE,
  TRUE: TRUE,
  HIGH: HIGH,
  LOW: LOW,
  PUSH_PULL: PUSH_PULL,
  OPEN_DRAIN: OPEN_DRAIN,
  _4_WIRE: _4_WIRE,
  _3_WIRE: _3_WIRE,
  BIG_ENDIAN: BIG_ENDIAN,
  LITTLE_ENDIAN: LITTLE_ENDIAN,
  _250_DPS:  _250_DPS,
  _500_DPS:  _500_DPS,
  _2000_DPS: _2000_DPS,
  CONTINUOUS_UPDATE: CONTINUOUS_UPDATE,
  NOT_UPDATED_UNTIL_READING: NOT_UPDATED_UNTIL_READING,
  LPF1: LPF1,
  HPF: HPF,
  LPF2: LPF2,
  REBOOT_MEMORY_CONTENT: REBOOT_MEMORY_CONTENT,
  BYPASS: BYPASS,
  FIFO: FIFO,
  STREAM: STREAM,
  STREAM_TO_FIFO: STREAM_TO_FIFO,
  BYPASS_TO_STREAM: BYPASS_TO_STREAM,
  AND: AND,
  OR: OR,
  NORMAL_WITH_RESET: NORMAL_WITH_RESET,
  REFERENCE_SIGNAL_FOR_FILTERING: REFERENCE_SIGNAL_FOR_FILTERING,
  AUTORESET_ON_INTERRUPT: AUTORESET_ON_INTERRUPT,

  PowerModeMap: [
    { key: POWER_DOWN, val: 0 },
    { key: SLEEP, val:      1 },
    { key: NORMAL, val:     2 }
  ],
  EnabledMap: [
    { key: FALSE, val: 0 },
    { key: TRUE, val:  1 }
  ],
  LevelMap: [
    { key: HIGH, val: 0 },
    { key: LOW, val:  1 }
  ],
  OutputMap: [
    { key: PUSH_PULL, val:  0 },
    { key: OPEN_DRAIN, val: 1 }
  ],
  SimModeMap: [
    { key: _4_WIRE, val: 0 },
    { key: _3_WIRE, val: 1 }
  ],
  BigLittleEndianMap: [
    { key: BIG_ENDIAN, val:    0 },
    { key: LITTLE_ENDIAN, val: 1 }
  ],
  FullScaleMap: [
    { key: _250_DPS, val:  0 },
    { key: _500_DPS, val:  1 },
    { key: _2000_DPS, val: 2 }
  ],
  BlockDataUpdateMap: [
    { key: CONTINUOUS_UPDATE, val:         0 },
    { key: NOT_UPDATED_UNTIL_READING, val: 1 }
  ],
  OutSelMap: [
    { key: LPF1, val: 0 },
    { key: HPF, val:  1 },
    { key: LPF2, val: 2 }
  ],
  IntSelMap: [
    { key: LPF1, val: 0 },
    { key: HPF, val:  1 },
    { key: LPF2, val: 2 }
  ],
  BootModeMap: [
    { key: NORMAL, val:                0 },
    { key: REBOOT_MEMORY_CONTENT, val: 1 }
  ],
  FifoModeMap: [
    { key: BYPASS, val:           0 },
    { key: FIFO, val:             1 },
    { key: STREAM, val:           2 },
    { key: STREAM_TO_FIFO, val:   3 },
    { key: BYPASS_TO_STREAM, val: 4 }
  ],
  AndOrMap: [
    { key: AND, val: 0 },
    { key: OR, val:  1 }
  ],
  HighPassFilterMap: [
    { key: NORMAL_WITH_RESET, val:              0 },
    { key: REFERENCE_SIGNAL_FOR_FILTERING, val: 1 },
    { key: NORMAL, val:                         2 },
    { key: AUTORESET_ON_INTERRUPT, val:         3 }
  ],
  DataRateBandWidthMap: [
    {
      dr: DATA_RATE_VALUES[0],
      bw: [
        { key: BANDWIDTH_VALUES[0], val: 0 },
        { key: BANDWIDTH_VALUES[2], val: 1 }
      ]
    },
    {
      dr: DATA_RATE_VALUES[1],
      bw: [
        { key: BANDWIDTH_VALUES[0], val: 0x4 },
        { key: BANDWIDTH_VALUES[2], val: 0x5 },
        { key: BANDWIDTH_VALUES[5], val: 0x6 },
        { key: BANDWIDTH_VALUES[6], val: 0x7 }
      ]
    },
    {
      dr: DATA_RATE_VALUES[2],
      bw: [
        { key: BANDWIDTH_VALUES[1], val: 0x8 },
        { key: BANDWIDTH_VALUES[2], val: 0x9 },
        { key: BANDWIDTH_VALUES[5], val: 0xa },
        { key: BANDWIDTH_VALUES[7], val: 0xb }
      ]
    },
    {
      dr: DATA_RATE_VALUES[3],
      bw: [
        { key: BANDWIDTH_VALUES[3], val: 0xc },
        { key: BANDWIDTH_VALUES[4], val: 0xd },
        { key: BANDWIDTH_VALUES[5], val: 0xe },
        { key: BANDWIDTH_VALUES[7], val: 0xf }
      ]
    }
  ],
  HighPassCutOffMap: [
    [
      { key: DATA_RATE_VALUES[3], val: 0 }
    ],
    [
      { key: DATA_RATE_VALUES[2], val: 0x0 },
      { key: DATA_RATE_VALUES[3], val: 0x1 }
    ],
    [
      { key: DATA_RATE_VALUES[1], val: 0x0 },
      { key: DATA_RATE_VALUES[2], val: 0x1 },
      { key: DATA_RATE_VALUES[3], val: 0x2 }
    ],
    [
      { key: DATA_RATE_VALUES[0], val: 0x0 },
      { key: DATA_RATE_VALUES[1], val: 0x1 },
      { key: DATA_RATE_VALUES[2], val: 0x2 },
      { key: DATA_RATE_VALUES[3], val: 0x3 }
    ],
    [
      { key: DATA_RATE_VALUES[0], val: 0x1 },
      { key: DATA_RATE_VALUES[1], val: 0x2 },
      { key: DATA_RATE_VALUES[2], val: 0x3 },
      { key: DATA_RATE_VALUES[3], val: 0x4 }
    ],
    [
      { key: DATA_RATE_VALUES[0], val: 0x2 },
      { key: DATA_RATE_VALUES[1], val: 0x3 },
      { key: DATA_RATE_VALUES[2], val: 0x4 },
      { key: DATA_RATE_VALUES[3], val: 0x5 }
    ],
    [
      { key: DATA_RATE_VALUES[0], val: 0x3 },
      { key: DATA_RATE_VALUES[1], val: 0x4 },
      { key: DATA_RATE_VALUES[2], val: 0x5 },
      { key: DATA_RATE_VALUES[3], val: 0x6 }
    ],
    [
      { key: DATA_RATE_VALUES[0], val: 0x4 },
      { key: DATA_RATE_VALUES[1], val: 0x5 },
      { key: DATA_RATE_VALUES[2], val: 0x6 },
      { key: DATA_RATE_VALUES[3], val: 0x7 }
    ],
    [
      { key: DATA_RATE_VALUES[0], val: 0x5 },
      { key: DATA_RATE_VALUES[1], val: 0x6 },
      { key: DATA_RATE_VALUES[2], val: 0x7 },
      { key: DATA_RATE_VALUES[3], val: 0x8 }
    ],
    [
      { key: DATA_RATE_VALUES[0], val: 0x6 },
      { key: DATA_RATE_VALUES[1], val: 0x7 },
      { key: DATA_RATE_VALUES[2], val: 0x8 },
      { key: DATA_RATE_VALUES[3], val: 0x9 }
    ],
    [
      { key: DATA_RATE_VALUES[0], val: 0x7 },
      { key: DATA_RATE_VALUES[1], val: 0x8 },
      { key: DATA_RATE_VALUES[2], val: 0x9 }
    ],
    [
      { key: DATA_RATE_VALUES[0], val: 0x8 },
      { key: DATA_RATE_VALUES[1], val: 0x9 }
    ],
    [
      { key: DATA_RATE_VALUES[0], val: 0x9 }
    ]
  ]
};

exports.L3GD20Dictionaries = L3GD20Dictionaries;
