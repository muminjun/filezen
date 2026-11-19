// Vendored build of drop-sign (https://github.com/muminjun/drop-sign) @ a35d970
// Rebuild: cd drop-sign && pnpm build, then copy dist/index.js and dist/index.d.ts here.
// src/styles.ts
var STYLES = `
  .ds-button {
    position: fixed;
    padding: 10px 22px;
    background: #0f172a;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    font-family: system-ui, -apple-system, sans-serif;
    cursor: pointer;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                transform 0.1s ease;
  }
  .ds-button:hover {
    background: #1e293b;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }
  .ds-button:active {
    transform: scale(0.96);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  .ds-button[data-no-press]:active {
    transform: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  .ds-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(2px);
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    box-sizing: border-box;
  }

  .ds-modal {
    background: #fff;
    border-radius: 12px;
    padding: 32px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 440px;
    max-width: 90vw;
    box-sizing: border-box;
  }

  @media (max-width: 480px) {
    .ds-modal {
      min-width: 0;
      width: 100%;
      padding: 20px 16px;
      border-radius: 16px;
      gap: 14px;
    }
  }

  .ds-modal-title {
    font-size: 18px;
    font-weight: 600;
    font-family: system-ui, -apple-system, sans-serif;
    color: #0f172a;
    margin: 0;
  }

  .ds-modal-description {
    font-size: 13px;
    color: #64748b;
    margin: -10px 0 0;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .ds-canvas {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: crosshair;
    touch-action: none;
    display: block;
    background: #f8fafc;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .ds-modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .ds-btn-clear, .ds-btn-cancel, .ds-btn-use {
    padding: 8px 18px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    font-family: system-ui, -apple-system, sans-serif;
    cursor: pointer;
    transition: all 0.15s ease;
    min-height: 44px;
    min-width: 44px;
  }

  .ds-btn-clear, .ds-btn-cancel {
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #475569;
  }
  .ds-btn-clear:hover, .ds-btn-cancel:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #1e293b;
  }

  .ds-btn-use {
    background: #0f172a;
    color: #fff;
    border: none;
  }
  .ds-btn-use:hover {
    background: #1e293b;
  }
  .ds-btn-use:disabled {
    background: #94a3b8;
    color: #f8fafc;
    cursor: not-allowed;
  }

  .ds-empty-hint {
    margin: -8px 0 0;
    color: #64748b;
    font-size: 12px;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .ds-placement-overlay {
    position: fixed;
    inset: 0;
    z-index: 9998;
    pointer-events: none;
  }

  .ds-sig-box {
    position: absolute;
    border: 1px dashed #64748b;
    background: rgba(248, 250, 252, 0.4);
    cursor: move;
    pointer-events: all;
    box-sizing: border-box;
    min-width: 60px;
    min-height: 30px;
    transition: border-color 0.2s;
    touch-action: none;
  }
  .ds-sig-box:hover {
    border-color: #0f172a;
  }

  .ds-sig-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    pointer-events: none;
    user-select: none;
  }

  .ds-sig-controls {
    position: absolute;
    top: -40px;
    right: 0;
    display: flex;
    gap: 6px;
    background: #0f172a;
    padding: 4px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  .ds-sig-box--controls-below .ds-sig-controls {
    top: auto;
    bottom: -40px;
  }

  .ds-sig-delete, .ds-sig-confirm {
    border: none;
    border-radius: 4px;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 600;
    font-family: system-ui, -apple-system, sans-serif;
    cursor: pointer;
    pointer-events: all;
    transition: all 0.15s ease;
    min-height: 36px;
    min-width: 44px;
  }

  .ds-sig-delete {
    background: transparent;
    color: #fca5a5;
  }
  .ds-sig-delete:hover {
    background: #ef4444;
    color: #fff;
  }

  .ds-sig-confirm {
    background: #22c55e;
    color: #fff;
  }
  .ds-sig-confirm:hover {
    background: #16a34a;
  }

  .ds-resize-handle {
    position: absolute;
    width: 8px;
    height: 8px;
    background: #fff;
    border: 1.5px solid #0f172a;
    border-radius: 50%;
    pointer-events: all;
    box-sizing: border-box;
    touch-action: none;
  }
  .ds-resize-se {
    bottom: -4px;
    right: -4px;
    cursor: se-resize;
  }
  .ds-resize-sw {
    bottom: -4px;
    left: -4px;
    cursor: sw-resize;
  }
  .ds-resize-ne {
    top: -4px;
    right: -4px;
    cursor: ne-resize;
  }
  .ds-resize-nw {
    top: -4px;
    left: -4px;
    cursor: nw-resize;
  }

  @media (pointer: coarse) {
    .ds-resize-handle {
      width: 16px;
      height: 16px;
    }
    .ds-resize-se { bottom: -8px; right: -8px; }
    .ds-resize-sw { bottom: -8px; left: -8px; }
    .ds-resize-ne { top: -8px; right: -8px; }
    .ds-resize-nw { top: -8px; left: -8px; }
  }
`;

// src/overlay.ts
var styleInjected = false;
var styleEl = null;
function injectStyles() {
  if (styleInjected) return;
  styleEl = document.createElement("style");
  styleEl.setAttribute("data-drop-sign", "");
  styleEl.textContent = STYLES;
  document.head.appendChild(styleEl);
  styleInjected = true;
}
function removeStyles() {
  styleEl?.remove();
  styleEl = null;
  styleInjected = false;
}
function createOverlayContainer() {
  const el = document.createElement("div");
  el.className = "ds-placement-overlay";
  el.style.position = "fixed";
  el.style.inset = "0";
  el.style.zIndex = "9998";
  el.style.pointerEvents = "none";
  document.body.appendChild(el);
  return {
    el,
    destroy() {
      el.remove();
    }
  };
}

// node_modules/.pnpm/signature_pad@4.2.0/node_modules/signature_pad/dist/signature_pad.js
var Point = class {
  constructor(x, y, pressure, time) {
    if (isNaN(x) || isNaN(y)) {
      throw new Error(`Point is invalid: (${x}, ${y})`);
    }
    this.x = +x;
    this.y = +y;
    this.pressure = pressure || 0;
    this.time = time || Date.now();
  }
  distanceTo(start) {
    return Math.sqrt(Math.pow(this.x - start.x, 2) + Math.pow(this.y - start.y, 2));
  }
  equals(other) {
    return this.x === other.x && this.y === other.y && this.pressure === other.pressure && this.time === other.time;
  }
  velocityFrom(start) {
    return this.time !== start.time ? this.distanceTo(start) / (this.time - start.time) : 0;
  }
};
var Bezier = class _Bezier {
  static fromPoints(points, widths) {
    const c2 = this.calculateControlPoints(points[0], points[1], points[2]).c2;
    const c3 = this.calculateControlPoints(points[1], points[2], points[3]).c1;
    return new _Bezier(points[1], c2, c3, points[2], widths.start, widths.end);
  }
  static calculateControlPoints(s1, s2, s3) {
    const dx1 = s1.x - s2.x;
    const dy1 = s1.y - s2.y;
    const dx2 = s2.x - s3.x;
    const dy2 = s2.y - s3.y;
    const m1 = { x: (s1.x + s2.x) / 2, y: (s1.y + s2.y) / 2 };
    const m2 = { x: (s2.x + s3.x) / 2, y: (s2.y + s3.y) / 2 };
    const l1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const l2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    const dxm = m1.x - m2.x;
    const dym = m1.y - m2.y;
    const k = l2 / (l1 + l2);
    const cm = { x: m2.x + dxm * k, y: m2.y + dym * k };
    const tx = s2.x - cm.x;
    const ty = s2.y - cm.y;
    return {
      c1: new Point(m1.x + tx, m1.y + ty),
      c2: new Point(m2.x + tx, m2.y + ty)
    };
  }
  constructor(startPoint, control2, control1, endPoint, startWidth, endWidth) {
    this.startPoint = startPoint;
    this.control2 = control2;
    this.control1 = control1;
    this.endPoint = endPoint;
    this.startWidth = startWidth;
    this.endWidth = endWidth;
  }
  length() {
    const steps = 10;
    let length = 0;
    let px;
    let py;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const cx = this.point(t, this.startPoint.x, this.control1.x, this.control2.x, this.endPoint.x);
      const cy = this.point(t, this.startPoint.y, this.control1.y, this.control2.y, this.endPoint.y);
      if (i > 0) {
        const xdiff = cx - px;
        const ydiff = cy - py;
        length += Math.sqrt(xdiff * xdiff + ydiff * ydiff);
      }
      px = cx;
      py = cy;
    }
    return length;
  }
  point(t, start, c1, c2, end) {
    return start * (1 - t) * (1 - t) * (1 - t) + 3 * c1 * (1 - t) * (1 - t) * t + 3 * c2 * (1 - t) * t * t + end * t * t * t;
  }
};
var SignatureEventTarget = class {
  constructor() {
    try {
      this._et = new EventTarget();
    } catch (error) {
      this._et = document;
    }
  }
  addEventListener(type, listener, options) {
    this._et.addEventListener(type, listener, options);
  }
  dispatchEvent(event) {
    return this._et.dispatchEvent(event);
  }
  removeEventListener(type, callback, options) {
    this._et.removeEventListener(type, callback, options);
  }
};
function throttle(fn, wait = 250) {
  let previous = 0;
  let timeout = null;
  let result;
  let storedContext;
  let storedArgs;
  const later = () => {
    previous = Date.now();
    timeout = null;
    result = fn.apply(storedContext, storedArgs);
    if (!timeout) {
      storedContext = null;
      storedArgs = [];
    }
  };
  return function wrapper(...args) {
    const now = Date.now();
    const remaining = wait - (now - previous);
    storedContext = this;
    storedArgs = args;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = fn.apply(storedContext, storedArgs);
      if (!timeout) {
        storedContext = null;
        storedArgs = [];
      }
    } else if (!timeout) {
      timeout = window.setTimeout(later, remaining);
    }
    return result;
  };
}
var SignaturePad = class _SignaturePad extends SignatureEventTarget {
  constructor(canvas, options = {}) {
    super();
    this.canvas = canvas;
    this._drawingStroke = false;
    this._isEmpty = true;
    this._lastPoints = [];
    this._data = [];
    this._lastVelocity = 0;
    this._lastWidth = 0;
    this._handleMouseDown = (event) => {
      if (event.buttons === 1) {
        this._strokeBegin(event);
      }
    };
    this._handleMouseMove = (event) => {
      this._strokeMoveUpdate(event);
    };
    this._handleMouseUp = (event) => {
      if (event.buttons === 1) {
        this._strokeEnd(event);
      }
    };
    this._handleTouchStart = (event) => {
      if (event.cancelable) {
        event.preventDefault();
      }
      if (event.targetTouches.length === 1) {
        const touch = event.changedTouches[0];
        this._strokeBegin(touch);
      }
    };
    this._handleTouchMove = (event) => {
      if (event.cancelable) {
        event.preventDefault();
      }
      const touch = event.targetTouches[0];
      this._strokeMoveUpdate(touch);
    };
    this._handleTouchEnd = (event) => {
      const wasCanvasTouched = event.target === this.canvas;
      if (wasCanvasTouched) {
        if (event.cancelable) {
          event.preventDefault();
        }
        const touch = event.changedTouches[0];
        this._strokeEnd(touch);
      }
    };
    this._handlePointerStart = (event) => {
      event.preventDefault();
      this._strokeBegin(event);
    };
    this._handlePointerMove = (event) => {
      this._strokeMoveUpdate(event);
    };
    this._handlePointerEnd = (event) => {
      if (this._drawingStroke) {
        event.preventDefault();
        this._strokeEnd(event);
      }
    };
    this.velocityFilterWeight = options.velocityFilterWeight || 0.7;
    this.minWidth = options.minWidth || 0.5;
    this.maxWidth = options.maxWidth || 2.5;
    this.throttle = "throttle" in options ? options.throttle : 16;
    this.minDistance = "minDistance" in options ? options.minDistance : 5;
    this.dotSize = options.dotSize || 0;
    this.penColor = options.penColor || "black";
    this.backgroundColor = options.backgroundColor || "rgba(0,0,0,0)";
    this.compositeOperation = options.compositeOperation || "source-over";
    this.canvasContextOptions = "canvasContextOptions" in options ? options.canvasContextOptions : {};
    this._strokeMoveUpdate = this.throttle ? throttle(_SignaturePad.prototype._strokeUpdate, this.throttle) : _SignaturePad.prototype._strokeUpdate;
    this._ctx = canvas.getContext("2d", this.canvasContextOptions);
    this.clear();
    this.on();
  }
  clear() {
    const { _ctx: ctx, canvas } = this;
    ctx.fillStyle = this.backgroundColor;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this._data = [];
    this._reset(this._getPointGroupOptions());
    this._isEmpty = true;
  }
  fromDataURL(dataUrl, options = {}) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const ratio = options.ratio || window.devicePixelRatio || 1;
      const width = options.width || this.canvas.width / ratio;
      const height = options.height || this.canvas.height / ratio;
      const xOffset = options.xOffset || 0;
      const yOffset = options.yOffset || 0;
      this._reset(this._getPointGroupOptions());
      image.onload = () => {
        this._ctx.drawImage(image, xOffset, yOffset, width, height);
        resolve();
      };
      image.onerror = (error) => {
        reject(error);
      };
      image.crossOrigin = "anonymous";
      image.src = dataUrl;
      this._isEmpty = false;
    });
  }
  toDataURL(type = "image/png", encoderOptions) {
    switch (type) {
      case "image/svg+xml":
        if (typeof encoderOptions !== "object") {
          encoderOptions = void 0;
        }
        return `data:image/svg+xml;base64,${btoa(this.toSVG(encoderOptions))}`;
      default:
        if (typeof encoderOptions !== "number") {
          encoderOptions = void 0;
        }
        return this.canvas.toDataURL(type, encoderOptions);
    }
  }
  on() {
    this.canvas.style.touchAction = "none";
    this.canvas.style.msTouchAction = "none";
    this.canvas.style.userSelect = "none";
    const isIOS = /Macintosh/.test(navigator.userAgent) && "ontouchstart" in document;
    if (window.PointerEvent && !isIOS) {
      this._handlePointerEvents();
    } else {
      this._handleMouseEvents();
      if ("ontouchstart" in window) {
        this._handleTouchEvents();
      }
    }
  }
  off() {
    this.canvas.style.touchAction = "auto";
    this.canvas.style.msTouchAction = "auto";
    this.canvas.style.userSelect = "auto";
    this.canvas.removeEventListener("pointerdown", this._handlePointerStart);
    this.canvas.removeEventListener("pointermove", this._handlePointerMove);
    this.canvas.ownerDocument.removeEventListener("pointerup", this._handlePointerEnd);
    this.canvas.removeEventListener("mousedown", this._handleMouseDown);
    this.canvas.removeEventListener("mousemove", this._handleMouseMove);
    this.canvas.ownerDocument.removeEventListener("mouseup", this._handleMouseUp);
    this.canvas.removeEventListener("touchstart", this._handleTouchStart);
    this.canvas.removeEventListener("touchmove", this._handleTouchMove);
    this.canvas.removeEventListener("touchend", this._handleTouchEnd);
  }
  isEmpty() {
    return this._isEmpty;
  }
  fromData(pointGroups, { clear = true } = {}) {
    if (clear) {
      this.clear();
    }
    this._fromData(pointGroups, this._drawCurve.bind(this), this._drawDot.bind(this));
    this._data = this._data.concat(pointGroups);
  }
  toData() {
    return this._data;
  }
  _getPointGroupOptions(group) {
    return {
      penColor: group && "penColor" in group ? group.penColor : this.penColor,
      dotSize: group && "dotSize" in group ? group.dotSize : this.dotSize,
      minWidth: group && "minWidth" in group ? group.minWidth : this.minWidth,
      maxWidth: group && "maxWidth" in group ? group.maxWidth : this.maxWidth,
      velocityFilterWeight: group && "velocityFilterWeight" in group ? group.velocityFilterWeight : this.velocityFilterWeight,
      compositeOperation: group && "compositeOperation" in group ? group.compositeOperation : this.compositeOperation
    };
  }
  _strokeBegin(event) {
    const cancelled = !this.dispatchEvent(new CustomEvent("beginStroke", { detail: event, cancelable: true }));
    if (cancelled) {
      return;
    }
    this._drawingStroke = true;
    const pointGroupOptions = this._getPointGroupOptions();
    const newPointGroup = Object.assign(Object.assign({}, pointGroupOptions), { points: [] });
    this._data.push(newPointGroup);
    this._reset(pointGroupOptions);
    this._strokeUpdate(event);
  }
  _strokeUpdate(event) {
    if (!this._drawingStroke) {
      return;
    }
    if (this._data.length === 0) {
      this._strokeBegin(event);
      return;
    }
    this.dispatchEvent(new CustomEvent("beforeUpdateStroke", { detail: event }));
    const x = event.clientX;
    const y = event.clientY;
    const pressure = event.pressure !== void 0 ? event.pressure : event.force !== void 0 ? event.force : 0;
    const point = this._createPoint(x, y, pressure);
    const lastPointGroup = this._data[this._data.length - 1];
    const lastPoints = lastPointGroup.points;
    const lastPoint = lastPoints.length > 0 && lastPoints[lastPoints.length - 1];
    const isLastPointTooClose = lastPoint ? point.distanceTo(lastPoint) <= this.minDistance : false;
    const pointGroupOptions = this._getPointGroupOptions(lastPointGroup);
    if (!lastPoint || !(lastPoint && isLastPointTooClose)) {
      const curve = this._addPoint(point, pointGroupOptions);
      if (!lastPoint) {
        this._drawDot(point, pointGroupOptions);
      } else if (curve) {
        this._drawCurve(curve, pointGroupOptions);
      }
      lastPoints.push({
        time: point.time,
        x: point.x,
        y: point.y,
        pressure: point.pressure
      });
    }
    this.dispatchEvent(new CustomEvent("afterUpdateStroke", { detail: event }));
  }
  _strokeEnd(event) {
    if (!this._drawingStroke) {
      return;
    }
    this._strokeUpdate(event);
    this._drawingStroke = false;
    this.dispatchEvent(new CustomEvent("endStroke", { detail: event }));
  }
  _handlePointerEvents() {
    this._drawingStroke = false;
    this.canvas.addEventListener("pointerdown", this._handlePointerStart);
    this.canvas.addEventListener("pointermove", this._handlePointerMove);
    this.canvas.ownerDocument.addEventListener("pointerup", this._handlePointerEnd);
  }
  _handleMouseEvents() {
    this._drawingStroke = false;
    this.canvas.addEventListener("mousedown", this._handleMouseDown);
    this.canvas.addEventListener("mousemove", this._handleMouseMove);
    this.canvas.ownerDocument.addEventListener("mouseup", this._handleMouseUp);
  }
  _handleTouchEvents() {
    this.canvas.addEventListener("touchstart", this._handleTouchStart);
    this.canvas.addEventListener("touchmove", this._handleTouchMove);
    this.canvas.addEventListener("touchend", this._handleTouchEnd);
  }
  _reset(options) {
    this._lastPoints = [];
    this._lastVelocity = 0;
    this._lastWidth = (options.minWidth + options.maxWidth) / 2;
    this._ctx.fillStyle = options.penColor;
    this._ctx.globalCompositeOperation = options.compositeOperation;
  }
  _createPoint(x, y, pressure) {
    const rect = this.canvas.getBoundingClientRect();
    return new Point(x - rect.left, y - rect.top, pressure, (/* @__PURE__ */ new Date()).getTime());
  }
  _addPoint(point, options) {
    const { _lastPoints } = this;
    _lastPoints.push(point);
    if (_lastPoints.length > 2) {
      if (_lastPoints.length === 3) {
        _lastPoints.unshift(_lastPoints[0]);
      }
      const widths = this._calculateCurveWidths(_lastPoints[1], _lastPoints[2], options);
      const curve = Bezier.fromPoints(_lastPoints, widths);
      _lastPoints.shift();
      return curve;
    }
    return null;
  }
  _calculateCurveWidths(startPoint, endPoint, options) {
    const velocity = options.velocityFilterWeight * endPoint.velocityFrom(startPoint) + (1 - options.velocityFilterWeight) * this._lastVelocity;
    const newWidth = this._strokeWidth(velocity, options);
    const widths = {
      end: newWidth,
      start: this._lastWidth
    };
    this._lastVelocity = velocity;
    this._lastWidth = newWidth;
    return widths;
  }
  _strokeWidth(velocity, options) {
    return Math.max(options.maxWidth / (velocity + 1), options.minWidth);
  }
  _drawCurveSegment(x, y, width) {
    const ctx = this._ctx;
    ctx.moveTo(x, y);
    ctx.arc(x, y, width, 0, 2 * Math.PI, false);
    this._isEmpty = false;
  }
  _drawCurve(curve, options) {
    const ctx = this._ctx;
    const widthDelta = curve.endWidth - curve.startWidth;
    const drawSteps = Math.ceil(curve.length()) * 2;
    ctx.beginPath();
    ctx.fillStyle = options.penColor;
    for (let i = 0; i < drawSteps; i += 1) {
      const t = i / drawSteps;
      const tt = t * t;
      const ttt = tt * t;
      const u = 1 - t;
      const uu = u * u;
      const uuu = uu * u;
      let x = uuu * curve.startPoint.x;
      x += 3 * uu * t * curve.control1.x;
      x += 3 * u * tt * curve.control2.x;
      x += ttt * curve.endPoint.x;
      let y = uuu * curve.startPoint.y;
      y += 3 * uu * t * curve.control1.y;
      y += 3 * u * tt * curve.control2.y;
      y += ttt * curve.endPoint.y;
      const width = Math.min(curve.startWidth + ttt * widthDelta, options.maxWidth);
      this._drawCurveSegment(x, y, width);
    }
    ctx.closePath();
    ctx.fill();
  }
  _drawDot(point, options) {
    const ctx = this._ctx;
    const width = options.dotSize > 0 ? options.dotSize : (options.minWidth + options.maxWidth) / 2;
    ctx.beginPath();
    this._drawCurveSegment(point.x, point.y, width);
    ctx.closePath();
    ctx.fillStyle = options.penColor;
    ctx.fill();
  }
  _fromData(pointGroups, drawCurve, drawDot) {
    for (const group of pointGroups) {
      const { points } = group;
      const pointGroupOptions = this._getPointGroupOptions(group);
      if (points.length > 1) {
        for (let j = 0; j < points.length; j += 1) {
          const basicPoint = points[j];
          const point = new Point(basicPoint.x, basicPoint.y, basicPoint.pressure, basicPoint.time);
          if (j === 0) {
            this._reset(pointGroupOptions);
          }
          const curve = this._addPoint(point, pointGroupOptions);
          if (curve) {
            drawCurve(curve, pointGroupOptions);
          }
        }
      } else {
        this._reset(pointGroupOptions);
        drawDot(points[0], pointGroupOptions);
      }
    }
  }
  toSVG({ includeBackgroundColor = false } = {}) {
    const pointGroups = this._data;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const minX = 0;
    const minY = 0;
    const maxX = this.canvas.width / ratio;
    const maxY = this.canvas.height / ratio;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    svg.setAttribute("viewBox", `${minX} ${minY} ${maxX} ${maxY}`);
    svg.setAttribute("width", maxX.toString());
    svg.setAttribute("height", maxY.toString());
    if (includeBackgroundColor && this.backgroundColor) {
      const rect = document.createElement("rect");
      rect.setAttribute("width", "100%");
      rect.setAttribute("height", "100%");
      rect.setAttribute("fill", this.backgroundColor);
      svg.appendChild(rect);
    }
    this._fromData(pointGroups, (curve, { penColor }) => {
      const path = document.createElement("path");
      if (!isNaN(curve.control1.x) && !isNaN(curve.control1.y) && !isNaN(curve.control2.x) && !isNaN(curve.control2.y)) {
        const attr = `M ${curve.startPoint.x.toFixed(3)},${curve.startPoint.y.toFixed(3)} C ${curve.control1.x.toFixed(3)},${curve.control1.y.toFixed(3)} ${curve.control2.x.toFixed(3)},${curve.control2.y.toFixed(3)} ${curve.endPoint.x.toFixed(3)},${curve.endPoint.y.toFixed(3)}`;
        path.setAttribute("d", attr);
        path.setAttribute("stroke-width", (curve.endWidth * 2.25).toFixed(3));
        path.setAttribute("stroke", penColor);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-linecap", "round");
        svg.appendChild(path);
      }
    }, (point, { penColor, dotSize, minWidth, maxWidth }) => {
      const circle = document.createElement("circle");
      const size = dotSize > 0 ? dotSize : (minWidth + maxWidth) / 2;
      circle.setAttribute("r", size.toString());
      circle.setAttribute("cx", point.x.toString());
      circle.setAttribute("cy", point.y.toString());
      circle.setAttribute("fill", penColor);
      svg.appendChild(circle);
    });
    return svg.outerHTML;
  }
};

// src/signature-pad.ts
function createSignaturePadModal(onUse, onCancel, messages, signatureOptions) {
  let backdrop = null;
  let pad = null;
  const FALLBACK_CANVAS_WIDTH = 480;
  const FALLBACK_CANVAS_HEIGHT = 200;
  let resizeHandler = null;
  function resizeCanvas(canvas, currentPad) {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width || FALLBACK_CANVAS_WIDTH;
    const displayHeight = rect.height || FALLBACK_CANVAS_HEIGHT;
    canvas.width = Math.round(displayWidth * ratio);
    canvas.height = Math.round(displayHeight * ratio);
    canvas.getContext("2d")?.scale(ratio, ratio);
    currentPad?.clear();
  }
  function open() {
    backdrop = document.createElement("div");
    backdrop.className = "ds-modal-backdrop";
    const modal = document.createElement("div");
    modal.className = "ds-modal";
    const title = document.createElement("p");
    title.className = "ds-modal-title";
    title.textContent = messages.signingTitle;
    const description = document.createElement("p");
    description.className = "ds-modal-description";
    description.textContent = messages.signingDescription;
    const canvas = document.createElement("canvas");
    canvas.className = "ds-canvas";
    canvas.style.touchAction = "none";
    canvas.width = 480;
    canvas.height = 200;
    const actions = document.createElement("div");
    actions.className = "ds-modal-actions";
    const clearBtn = document.createElement("button");
    clearBtn.className = "ds-btn-clear";
    clearBtn.textContent = messages.clear;
    clearBtn.type = "button";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "ds-btn-cancel";
    cancelBtn.textContent = messages.cancel;
    cancelBtn.type = "button";
    const useBtn = document.createElement("button");
    useBtn.className = "ds-btn-use";
    useBtn.textContent = messages.useSignature;
    useBtn.type = "button";
    const emptyHint = document.createElement("p");
    emptyHint.className = "ds-empty-hint";
    emptyHint.textContent = messages.emptySignatureHint;
    let hasSignature = false;
    function setHasSignature(next) {
      hasSignature = next;
      useBtn.disabled = !hasSignature;
      emptyHint.hidden = hasSignature;
    }
    setHasSignature(false);
    actions.append(clearBtn, cancelBtn, useBtn);
    modal.append(title, description, canvas, emptyHint, actions);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    pad = new SignaturePad(canvas, {
      backgroundColor: "rgba(0,0,0,0)",
      penColor: signatureOptions.penColor,
      minWidth: signatureOptions.minWidth,
      maxWidth: signatureOptions.maxWidth,
      velocityFilterWeight: signatureOptions.velocityFilterWeight
    });
    resizeCanvas(canvas, pad);
    pad.addEventListener("beginStroke", () => {
      emptyHint.hidden = true;
    });
    pad.addEventListener("endStroke", () => {
      setHasSignature(Boolean(pad && !pad.isEmpty()));
    });
    resizeHandler = () => {
      if (!pad || !pad.isEmpty()) return;
      resizeCanvas(canvas, pad);
      setHasSignature(false);
    };
    window.addEventListener("resize", resizeHandler);
    clearBtn.addEventListener("click", () => {
      pad?.clear();
      setHasSignature(false);
    });
    cancelBtn.addEventListener("click", () => {
      destroy();
      onCancel();
    });
    useBtn.addEventListener("click", () => {
      if (!pad || pad.isEmpty()) return;
      const dataUrl = pad.toDataURL("image/png");
      destroy();
      onUse(dataUrl);
    });
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        destroy();
        onCancel();
      }
    });
  }
  function destroy() {
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }
    pad?.off();
    pad = null;
    backdrop?.remove();
    backdrop = null;
  }
  return { open, destroy };
}

// src/placement.ts
function createPlacementBox(signatureDataUrl, targetEl, onConfirm, onDelete, messages) {
  const box = document.createElement("div");
  box.className = "ds-sig-box";
  const img = document.createElement("img");
  img.className = "ds-sig-img";
  img.src = signatureDataUrl;
  img.alt = "Signature";
  const controls = document.createElement("div");
  controls.className = "ds-sig-controls";
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "ds-sig-delete";
  deleteBtn.textContent = messages.delete;
  deleteBtn.type = "button";
  const confirmBtn = document.createElement("button");
  confirmBtn.className = "ds-sig-confirm";
  confirmBtn.textContent = messages.confirm;
  confirmBtn.type = "button";
  controls.append(deleteBtn, confirmBtn);
  const seHandle = resizeHandle("ds-resize-se");
  const swHandle = resizeHandle("ds-resize-sw");
  const neHandle = resizeHandle("ds-resize-ne");
  const nwHandle = resizeHandle("ds-resize-nw");
  box.append(controls, img, seHandle, swHandle, neHandle, nwHandle);
  const initW = Math.min(200, window.innerWidth * 0.25);
  const initH = 80;
  box.style.left = `${(window.innerWidth - initW) / 2}px`;
  box.style.top = `${(window.innerHeight - initH) / 2}px`;
  box.style.width = `${initW}px`;
  box.style.height = `${initH}px`;
  function updateControlPlacement() {
    const top = parseFloat(box.style.top) || 0;
    const controlsHeight = controls.offsetHeight || 40;
    const gap = 8;
    box.classList.toggle("ds-sig-box--controls-below", top < controlsHeight + gap);
  }
  const ac = new AbortController();
  const { signal } = ac;
  setupDrag(box, signal, updateControlPlacement);
  setupResize(box, seHandle, 1, 1, signal, updateControlPlacement);
  setupResize(box, swHandle, -1, 1, signal, updateControlPlacement);
  setupResize(box, neHandle, 1, -1, signal, updateControlPlacement);
  setupResize(box, nwHandle, -1, -1, signal, updateControlPlacement);
  updateControlPlacement();
  deleteBtn.addEventListener("click", () => {
    destroy();
    onDelete();
  });
  confirmBtn.addEventListener("click", onConfirm);
  document.addEventListener("keydown", handleKeydown);
  function handleKeydown(e) {
    if (e.key === "Enter") onConfirm();
    if (e.key === "Escape") {
      destroy();
      onDelete();
    }
  }
  function getPlacement() {
    const boxLeft = parseFloat(box.style.left);
    const boxTop = parseFloat(box.style.top);
    const boxW = parseFloat(box.style.width);
    const boxH = parseFloat(box.style.height);
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      return {
        x: (boxLeft - rect.left) / rect.width,
        y: (boxTop - rect.top) / rect.height,
        width: boxW / rect.width,
        height: boxH / rect.height
      };
    }
    return {
      x: boxLeft / window.innerWidth,
      y: boxTop / window.innerHeight,
      width: boxW / window.innerWidth,
      height: boxH / window.innerHeight
    };
  }
  function destroy() {
    document.removeEventListener("keydown", handleKeydown);
    ac.abort();
    box.remove();
  }
  return { element: box, getPlacement, destroy };
}
function resizeHandle(cls) {
  const el = document.createElement("div");
  el.className = `ds-resize-handle ${cls}`;
  return el;
}
function setupDrag(box, signal, onMove) {
  let dragging = false;
  let startX = 0, startY = 0, startLeft = 0, startTop = 0;
  box.addEventListener("pointerdown", (e) => {
    const target = e.target;
    if (target.closest(".ds-resize-handle") || target.tagName === "BUTTON" || target.tagName === "IMG") return;
    dragging = true;
    box.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseFloat(box.style.left) || 0;
    startTop = parseFloat(box.style.top) || 0;
    e.preventDefault();
  }, { signal });
  box.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const boxW = parseFloat(box.style.width) || 0;
    const boxH = parseFloat(box.style.height) || 0;
    const newLeft = Math.max(0, Math.min(window.innerWidth - boxW, startLeft + e.clientX - startX));
    const newTop = Math.max(0, Math.min(window.innerHeight - boxH, startTop + e.clientY - startY));
    box.style.left = `${newLeft}px`;
    box.style.top = `${newTop}px`;
    onMove();
  }, { signal });
  box.addEventListener("pointerup", () => {
    dragging = false;
  }, { signal });
  box.addEventListener("pointercancel", () => {
    dragging = false;
  }, { signal });
}
function setupResize(box, handle, dirX, dirY, signal, onMove) {
  let resizing = false;
  let startX = 0, startY = 0;
  let startW = 0, startH = 0, startLeft = 0, startTop = 0;
  handle.addEventListener("pointerdown", (e) => {
    resizing = true;
    handle.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startY = e.clientY;
    startW = parseFloat(box.style.width) || 0;
    startH = parseFloat(box.style.height) || 0;
    startLeft = parseFloat(box.style.left) || 0;
    startTop = parseFloat(box.style.top) || 0;
    e.preventDefault();
    e.stopPropagation();
  }, { signal });
  handle.addEventListener("pointermove", (e) => {
    if (!resizing) return;
    const dx = (e.clientX - startX) * dirX;
    const dy = (e.clientY - startY) * dirY;
    let newW = Math.max(60, startW + dx);
    let newH = Math.max(30, startH + dy);
    let newLeft = startLeft;
    let newTop = startTop;
    if (dirX === -1) {
      newLeft = startLeft - (newW - startW);
      newLeft = Math.max(0, newLeft);
      newW = startLeft + startW - newLeft;
    }
    if (dirY === -1) {
      newTop = startTop - (newH - startH);
      newTop = Math.max(0, newTop);
      newH = startTop + startH - newTop;
    }
    newW = Math.min(newW, window.innerWidth - newLeft);
    newH = Math.min(newH, window.innerHeight - newTop);
    box.style.width = `${newW}px`;
    box.style.height = `${newH}px`;
    box.style.left = `${newLeft}px`;
    box.style.top = `${newTop}px`;
    onMove();
  }, { signal });
  handle.addEventListener("pointerup", () => {
    resizing = false;
  }, { signal });
  handle.addEventListener("pointercancel", () => {
    resizing = false;
  }, { signal });
}

// src/messages.ts
var DEFAULT_MESSAGES = {
  sign: "Sign",
  clear: "Clear",
  cancel: "Cancel",
  useSignature: "Use signature",
  confirm: "Confirm",
  delete: "Delete",
  signingTitle: "Draw your signature",
  signingDescription: "Use your mouse, trackpad, Apple Pencil, or finger.",
  emptySignatureHint: "Draw a signature to continue."
};
function mergeMessages(user) {
  if (!user) return { ...DEFAULT_MESSAGES };
  return { ...DEFAULT_MESSAGES, ...user };
}
var DEFAULT_SIGNATURE_OPTIONS = {
  penColor: "#111827",
  minWidth: 0.7,
  maxWidth: 2.5,
  velocityFilterWeight: 0.7
};
function mergeSignatureOptions(user) {
  if (!user) return { ...DEFAULT_SIGNATURE_OPTIONS };
  return { ...DEFAULT_SIGNATURE_OPTIONS, ...user };
}

// src/trigger.ts
function resolveElement(ref) {
  if (typeof ref === "string") {
    const el = document.querySelector(ref);
    return el instanceof HTMLElement ? el : null;
  }
  return ref;
}
function applyPositionStyles(btn, position = "bottom-right") {
  const isBottom = position.startsWith("bottom");
  const isRight = position.endsWith("right");
  btn.style.bottom = isBottom ? "24px" : "auto";
  btn.style.top = isBottom ? "auto" : "24px";
  btn.style.right = isRight ? "24px" : "auto";
  btn.style.left = isRight ? "auto" : "24px";
}
function createGlobalTrigger(trigger, label, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = label;
  btn.className = "ds-button";
  applyPositionStyles(btn, trigger.position);
  document.body.appendChild(btn);
  btn.addEventListener("click", onClick);
  return {
    element: btn,
    destroy() {
      btn.removeEventListener("click", onClick);
      btn.remove();
    }
  };
}
function attachCustomTrigger(trigger, onClick) {
  const el = resolveElement(trigger.element);
  if (!el) {
    throw new Error("[drop-sign] Custom trigger element not found");
  }
  el.addEventListener("click", onClick);
  return {
    element: null,
    destroy() {
      el.removeEventListener("click", onClick);
    }
  };
}

// src/DropSign.ts
function resolveTarget(target) {
  if (typeof target === "string") {
    const el = document.querySelector(target);
    if (!el) throw new Error(`[drop-sign] Target element not found: "${target}"`);
    if (!(el instanceof HTMLElement))
      throw new Error(`[drop-sign] Target is not an HTMLElement: "${target}"`);
    return el;
  }
  return target;
}
function resolveTriggerLabel(trigger, msgs) {
  if (trigger && "label" in trigger && trigger.label) return trigger.label;
  return msgs.sign;
}
async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}
var DropSign = class {
  static init(options) {
    const { target, trigger, messages, signature, onComplete, onCancel, onError } = options;
    let targetEl;
    if (target !== void 0) {
      try {
        targetEl = resolveTarget(target);
      } catch (err) {
        onError?.(err);
        return { destroy: () => void 0 };
      }
    }
    injectStyles();
    const msgs = mergeMessages(messages);
    const sigOpts = mergeSignatureOptions(signature);
    const label = resolveTriggerLabel(trigger, msgs);
    let overlayContainer = null;
    let placementBox = null;
    let currentSigDataUrl = "";
    const modal = createSignaturePadModal(
      (dataUrl) => {
        currentSigDataUrl = dataUrl;
        showPlacement(dataUrl);
      },
      () => {
        onCancel?.();
      },
      msgs,
      sigOpts
    );
    let triggerHandle;
    try {
      if (!trigger || trigger.type === "global") {
        const globalTrigger = trigger?.type === "global" ? trigger : { type: "global" };
        triggerHandle = createGlobalTrigger(globalTrigger, label, () => modal.open());
      } else if (trigger.type === "custom") {
        triggerHandle = attachCustomTrigger(trigger, () => modal.open());
      } else {
        throw new Error(`[drop-sign] Unknown trigger type`);
      }
    } catch (err) {
      modal.destroy();
      removeStyles();
      onError?.(err);
      return { destroy: () => void 0 };
    }
    function showPlacement(dataUrl) {
      overlayContainer?.destroy();
      overlayContainer = createOverlayContainer();
      function cleanup() {
        placementBox?.destroy();
        placementBox = null;
        overlayContainer?.destroy();
        overlayContainer = null;
      }
      placementBox = createPlacementBox(
        dataUrl,
        targetEl,
        async () => {
          if (!placementBox) return;
          const placement = placementBox.getPlacement();
          cleanup();
          try {
            const signatureBlob = await dataUrlToBlob(currentSigDataUrl);
            await onComplete?.({ signatureDataUrl: currentSigDataUrl, signatureBlob, placement });
          } catch (err) {
            onError?.(err);
          }
        },
        () => {
          placementBox = null;
          overlayContainer?.destroy();
          overlayContainer = null;
          onCancel?.();
        },
        { confirm: msgs.confirm, delete: msgs.delete }
      );
      overlayContainer.el.style.pointerEvents = "all";
      overlayContainer.el.appendChild(placementBox.element);
    }
    function destroy() {
      triggerHandle.destroy();
      modal.destroy();
      placementBox?.destroy();
      overlayContainer?.destroy();
      removeStyles();
    }
    return { destroy };
  }
};
/*! Bundled license information:

signature_pad/dist/signature_pad.js:
  (*!
   * Signature Pad v4.2.0 | https://github.com/szimek/signature_pad
   * (c) 2024 Szymon Nowak | Released under the MIT license
   *)
*/

export { DropSign };
