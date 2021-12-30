'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var index = require('./index-d05fc587.cjs.prod.js');
var _extends = require('@babel/runtime/helpers/extends');
var React = require('react');
var THREE = require('three');
var mergeRefs = require('react-merge-refs');
var useMeasure = require('react-use-measure');
require('suspend-react');
require('react-reconciler/constants');
require('zustand');
require('react-reconciler');
require('scheduler');

function _interopDefault (e) { return e && e.__esModule ? e : { 'default': e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespace(React);
var THREE__namespace = /*#__PURE__*/_interopNamespace(THREE);
var mergeRefs__default = /*#__PURE__*/_interopDefault(mergeRefs);
var useMeasure__default = /*#__PURE__*/_interopDefault(useMeasure);

const DOM_EVENTS = {
  onClick: ['click', false],
  onContextMenu: ['contextmenu', false],
  onDoubleClick: ['dblclick', false],
  onWheel: ['wheel', true],
  onPointerDown: ['pointerdown', true],
  onPointerUp: ['pointerup', true],
  onPointerLeave: ['pointerleave', true],
  onPointerMove: ['pointermove', true],
  onPointerCancel: ['pointercancel', true],
  onLostPointerCapture: ['lostpointercapture', true]
};
function createPointerEvents(store) {
  const {
    handlePointer
  } = index.createEvents(store);
  return {
    connected: false,
    handlers: Object.keys(DOM_EVENTS).reduce((acc, key) => ({ ...acc,
      [key]: handlePointer(key)
    }), {}),
    connect: target => {
      var _events$handlers;

      const {
        set,
        events
      } = store.getState();
      events.disconnect == null ? void 0 : events.disconnect();
      set(state => ({
        events: { ...state.events,
          connected: target
        }
      }));
      Object.entries((_events$handlers = events == null ? void 0 : events.handlers) != null ? _events$handlers : []).forEach(([name, event]) => {
        const [eventName, passive] = DOM_EVENTS[name];
        target.addEventListener(eventName, event, {
          passive
        });
      });
    },
    disconnect: () => {
      const {
        set,
        events
      } = store.getState();

      if (events.connected) {
        var _events$handlers2;

        Object.entries((_events$handlers2 = events.handlers) != null ? _events$handlers2 : []).forEach(([name, event]) => {
          if (events && events.connected instanceof HTMLElement) {
            const [eventName] = DOM_EVENTS[name];
            events.connected.removeEventListener(eventName, event);
          }
        });
        set(state => ({
          events: { ...state.events,
            connected: false
          }
        }));
      }
    }
  };
}

const CANVAS_PROPS = ['gl', 'events', 'shadows', 'linear', 'flat', 'orthographic', 'frameloop', 'dpr', 'performance', 'clock', 'raycaster', 'camera', 'onPointerMissed', 'onCreated'];

function Block({
  set
}) {
  React__namespace.useLayoutEffect(() => {
    set(new Promise(() => null));
    return () => set(false);
  }, [set]);
  return null;
}

class ErrorBoundary extends React__namespace.Component {
  constructor(...args) {
    super(...args);
    this.state = {
      error: false
    };
  }

  componentDidCatch(error) {
    this.props.set(error);
  }

  render() {
    return this.state.error ? null : this.props.children;
  }

}

ErrorBoundary.getDerivedStateFromError = () => ({
  error: true
});

const Canvas = /*#__PURE__*/React__namespace.forwardRef(function Canvas({
  children,
  fallback,
  resize,
  style,
  events,
  ...props
}, forwardedRef) {
  // Create a known catalogue of Threejs-native elements
  // This will include the entire THREE namespace by default, users can extend
  // their own elements by using the createRoot API instead
  React__namespace.useMemo(() => index.extend(THREE__namespace), []);
  const [containerRef, {
    width,
    height
  }] = useMeasure__default["default"]({
    scroll: true,
    debounce: {
      scroll: 50,
      resize: 0
    },
    ...resize
  });
  const canvasRef = React__namespace.useRef(null);
  const [canvas, setCanvas] = React__namespace.useState(null);
  const canvasProps = index.pick(props, CANVAS_PROPS);
  const divProps = index.omit(props, CANVAS_PROPS);
  const [block, setBlock] = React__namespace.useState(false);
  const [error, setError] = React__namespace.useState(false); // Suspend this component if block is a promise (2nd run)

  if (block) throw block; // Throw exception outwards if anything within canvas throws

  if (error) throw error;

  if (width > 0 && height > 0 && canvas) {
    index.createRoot(canvas, { ...canvasProps,
      size: {
        width,
        height
      },
      events: events || createPointerEvents
    }).render( /*#__PURE__*/React__namespace.createElement(ErrorBoundary, {
      set: setError
    }, /*#__PURE__*/React__namespace.createElement(React__namespace.Suspense, {
      fallback: /*#__PURE__*/React__namespace.createElement(Block, {
        set: setBlock
      })
    }, children)));
  }

  React__namespace.useLayoutEffect(() => {
    setCanvas(canvasRef.current);
  }, []);
  React__namespace.useEffect(() => {
    return () => index.unmountComponentAtNode(canvas);
  }, [canvas]);
  return /*#__PURE__*/React__namespace.createElement("div", _extends({
    ref: containerRef,
    style: {
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      ...style
    }
  }, divProps), /*#__PURE__*/React__namespace.createElement("canvas", {
    ref: mergeRefs__default["default"]([canvasRef, forwardedRef]),
    style: {
      display: 'block'
    }
  }, fallback));
});

exports.ReactThreeFiber = index.threeTypes;
exports._roots = index.roots;
exports.act = index.act;
exports.addAfterEffect = index.addAfterEffect;
exports.addEffect = index.addEffect;
exports.addTail = index.addTail;
exports.advance = index.advance;
exports.applyProps = index.applyProps;
exports.context = index.context;
exports.createPortal = index.createPortal;
exports.createRoot = index.createRoot;
exports.dispose = index.dispose;
exports.extend = index.extend;
exports.invalidate = index.invalidate;
exports.reconciler = index.reconciler;
exports.render = index.render;
exports.unmountComponentAtNode = index.unmountComponentAtNode;
exports.useFrame = index.useFrame;
exports.useGraph = index.useGraph;
exports.useLoader = index.useLoader;
exports.useStore = index.useStore;
exports.useThree = index.useThree;
exports.Canvas = Canvas;
exports.events = createPointerEvents;
