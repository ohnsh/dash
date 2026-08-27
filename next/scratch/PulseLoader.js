'use client'

var React = __importStar(require('react'))
var unitConverter_1 = require('./helpers/unitConverter')
var animation_1 = require('./helpers/animation')
var pulse = (0, animation_1.createAnimation)(
  'PulseLoader',
  '0% {transform: scale(1); opacity: 1} 45% {transform: scale(0.1); opacity: 0.7} 80% {transform: scale(1); opacity: 1}',
  'pulse',
)
function PulseLoader(_a) {
  var _b = _a.loading,
    loading = _b === void 0 ? true : _b,
    _c = _a.color,
    color = _c === void 0 ? '#000000' : _c,
    _d = _a.speedMultiplier,
    speedMultiplier = _d === void 0 ? 1 : _d,
    _e = _a.cssOverride,
    cssOverride = _e === void 0 ? {} : _e,
    _f = _a.size,
    size = _f === void 0 ? 15 : _f,
    _g = _a.margin,
    margin = _g === void 0 ? 2 : _g,
    additionalprops = __rest(_a, [
      'loading',
      'color',
      'speedMultiplier',
      'cssOverride',
      'size',
      'margin',
    ])
  var wrapper = __assign({ display: 'inherit' }, cssOverride)
  var style = function (i) {
    return {
      backgroundColor: color,
      width: (0, unitConverter_1.cssValue)(size),
      height: (0, unitConverter_1.cssValue)(size),
      margin: (0, unitConverter_1.cssValue)(margin),
      borderRadius: '100%',
      display: 'inline-block',
      animation: ''
        .concat(pulse, ' ')
        .concat(0.75 / speedMultiplier, 's ')
        .concat(
          (i * 0.12) / speedMultiplier,
          's infinite cubic-bezier(0.2, 0.68, 0.18, 1.08)',
        ),
      animationFillMode: 'both',
    }
  }
  if (!loading) {
    return null
  }
  return React.createElement(
    'span',
    __assign({ style: wrapper }, additionalprops),
    React.createElement('span', { style: style(1) }),
    React.createElement('span', { style: style(2) }),
    React.createElement('span', { style: style(3) }),
  )
}
exports.default = PulseLoader
