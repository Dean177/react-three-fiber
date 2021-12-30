'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var index = require('../../dist/index-d05fc587.cjs.prod.js');
var THREE = require('three');
var expoAsset = require('expo-asset');
var expoFileSystem = require('expo-file-system');
var base64Arraybuffer = require('base64-arraybuffer');
var suspendReact = require('suspend-react');
var _extends = require('@babel/runtime/helpers/extends');
var React = require('react');
var reactNative = require('react-native');
var expoGl = require('expo-gl');
var Pressability = require('react-native/Libraries/Pressability/Pressability');
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

var THREE__namespace = /*#__PURE__*/_interopNamespace(THREE);
var React__namespace = /*#__PURE__*/_interopNamespace(React);
var Pressability__default = /*#__PURE__*/_interopDefault(Pressability);

/**
 * Generates an asset based on input type.
 */

const getAsset = input => {
  if (input instanceof expoAsset.Asset) return input;

  switch (typeof input) {
    case 'string':
      return expoAsset.Asset.fromURI(input);

    case 'number':
      return expoAsset.Asset.fromModule(input);

    default:
      throw 'Invalid asset! Must be a URI or module.';
  }
};
/**
 * Downloads from a local URI and decodes into an ArrayBuffer.
 */


const toBuffer = async localUri => expoFileSystem.readAsStringAsync(localUri, {
  encoding: 'base64'
}).then(base64Arraybuffer.decode);

function loadingFn(extensions, onProgress) {
  return function (Proto, ...input) {
    // Construct new loader and run extensions
    const loader = new Proto();
    if (extensions) extensions(loader); // Go through the urls and load them

    return Promise.all(input.map(entry => new Promise(async (res, reject) => {
      // Construct URL
      const url = typeof entry === 'string' ? loader.path + entry : entry; // There's no Image in native, so we create & pass a data texture instead

      if (loader instanceof THREE__namespace.TextureLoader) {
        const asset = await getAsset(url).downloadAsync();
        const texture = new THREE__namespace.Texture();
        texture.isDataTexture = true;
        texture.image = {
          data: asset,
          width: asset.width,
          height: asset.height
        };
        texture.needsUpdate = true;
        return res(texture);
      } // Do similar for CubeTextures


      if (loader instanceof THREE__namespace.CubeTextureLoader) {
        const texture = new THREE__namespace.CubeTexture();
        texture.isDataTexture = true;
        texture.images = await Promise.all(url.map(async src => {
          const asset = await getAsset(src).downloadAsync();
          return {
            data: asset,
            width: asset.width,
            height: asset.height
          };
        }));
        texture.needsUpdate = true;
        return res(texture);
      } // If asset is external and not an Image, load it


      if (url.startsWith != null && url.startsWith('http') && Proto.prototype.hasOwnProperty('load')) {
        return loader.load(entry, data => {
          if (data.scene) Object.assign(data, index.buildGraph(data.scene));
          res(data);
        }, onProgress, error => reject(`Could not load ${url}: ${error.message}`));
      } // Otherwise, create a localUri and a file buffer


      const {
        localUri
      } = await getAsset(url).downloadAsync();
      const arrayBuffer = await toBuffer(localUri); // Parse it

      const parsed = loader.parse == null ? void 0 : loader.parse(arrayBuffer, undefined, data => {
        if (data.scene) Object.assign(data, index.buildGraph(data.scene));
        res(data);
      }, error => reject(`Could not load ${url}: ${error.message}`)); // Respect synchronous parsers which don't have callbacks

      if (parsed) return res(parsed);
    })));
  };
}

function useLoader(Proto, input, extensions, onProgress) {
  // Use suspense to load async assets
  const keys = Array.isArray(input) ? input : [input];
  const results = suspendReact.suspend(loadingFn(extensions, onProgress), [Proto, ...keys], {
    equal: index.is.equ
  }); // Return the object/s

  return Array.isArray(input) ? results : results[0];
}

useLoader.preload = function (Proto, input, extensions) {
  const keys = Array.isArray(input) ? input : [input];
  return suspendReact.preload(loadingFn(extensions), [Proto, ...keys]);
};

useLoader.clear = function (Proto, input) {
  const keys = Array.isArray(input) ? input : [input];
  return suspendReact.clear([Proto, ...keys]);
};

const EVENTS = {
  PRESS: 'onPress',
  PRESSIN: 'onPressIn',
  PRESSOUT: 'onPressOut',
  LONGPRESS: 'onLongPress',
  HOVERIN: 'onHoverIn',
  HOVEROUT: 'onHoverOut',
  PRESSMOVE: 'onPressMove'
};
const DOM_EVENTS = {
  onPress: 'onClick',
  onPressIn: 'onPointerDown',
  onPressOut: 'onPointerUp',
  onLongPress: 'onDoubleClick',
  onHoverIn: 'onPointerOver',
  onHoverOut: 'onPointerOut',
  onPressMove: 'onPointerMove'
};
function createTouchEvents(store) {
  const {
    handlePointer
  } = index.createEvents(store);

  const handleTouch = (event, name) => {
    var _DOM_EVENTS$name;

    event.persist() // console.info('handledTouch for', name)
    // Apply offset
    ;
    event.nativeEvent.offsetX = event.nativeEvent.locationX;
    event.nativeEvent.offsetY = event.nativeEvent.locationY; // Emulate DOM event
    // @ts-ignore

    const callback = handlePointer((_DOM_EVENTS$name = DOM_EVENTS[name]) != null ? _DOM_EVENTS$name : name);
    return callback(event.nativeEvent);
  };

  const handlers = {};
  Object.values(EVENTS).forEach(name => {
    // @ts-ignore
    handlers[DOM_EVENTS[name]] = event => handleTouch(event, name); // @ts-ignore


    handlers[name] = event => handleTouch(event, name);
  });
  return {
    connected: false,
    handlers,
    connect: () => {
      const {
        set,
        events
      } = store.getState();
      events.disconnect == null ? void 0 : events.disconnect();
      const connected = new Pressability__default["default"](events == null ? void 0 : events.handlers);
      set(state => ({
        events: { ...state.events,
          connected
        }
      }));
      const handlers = connected.getEventHandlers();
      return handlers;
    },
    disconnect: () => {
      const {
        set,
        events
      } = store.getState();

      if (events.connected) {
        events.connected.reset();
        set(state => ({
          events: { ...state.events,
            connected: false
          }
        }));
      }
    }
  };
}

const CANVAS_PROPS = ['gl', 'events', 'shadows', 'linear', 'flat', 'orthographic', 'frameloop', 'performance', 'clock', 'raycaster', 'camera', 'onPointerMissed', 'onCreated'];

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

const Canvas = /*#__PURE__*/React__namespace.forwardRef(({
  children,
  fallback,
  style,
  events,
  ...props
}, forwardedRef) => {
  // Create a known catalogue of Threejs-native elements
  // This will include the entire THREE namespace by default, users can extend
  // their own elements by using the createRoot API instead
  React__namespace.useMemo(() => index.extend(THREE__namespace), []);
  const [{
    width,
    height
  }, setSize] = React__namespace.useState({
    width: 0,
    height: 0
  });
  const [canvas, setCanvas] = React__namespace.useState(null);
  const [bind, setBind] = React__namespace.useState();
  const canvasProps = index.pick(props, CANVAS_PROPS);
  const viewProps = index.omit(props, CANVAS_PROPS);
  const [block, setBlock] = React__namespace.useState(false);
  const [error, setError] = React__namespace.useState(false); // Suspend this component if block is a promise (2nd run)

  if (block) throw block; // Throw exception outwards if anything within canvas throws

  if (error) throw error;
  const onLayout = React__namespace.useCallback(e => {
    const {
      width,
      height
    } = e.nativeEvent.layout;
    setSize({
      width,
      height
    });
  }, []);
  const onContextCreate = React__namespace.useCallback(context => {
    const canvasShim = {
      width: context.drawingBufferWidth,
      height: context.drawingBufferHeight,
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      clientHeight: context.drawingBufferHeight,
      getContext: () => context
    };
    setCanvas(canvasShim);
  }, []);

  if (width > 0 && height > 0 && canvas) {
    // Overwrite onCreated to apply RN bindings
    const onCreated = state => {
      // Bind events after creation
      const handlers = state.events.connect == null ? void 0 : state.events.connect(canvas);
      setBind(handlers); // Bind render to RN bridge

      const context = state.gl.getContext();
      const renderFrame = state.gl.render.bind(state.gl);

      state.gl.render = (scene, camera) => {
        renderFrame(scene, camera);
        context.endFrameEXP();
      };

      return canvasProps == null ? void 0 : canvasProps.onCreated == null ? void 0 : canvasProps.onCreated(state);
    };

    index.createRoot(canvas, { ...canvasProps,
      // expo-gl can only render at native dpr/resolution
      // https://github.com/expo/expo-three/issues/39
      dpr: reactNative.PixelRatio.get(),
      size: {
        width,
        height
      },
      events: events || createTouchEvents,
      onCreated
    }).render( /*#__PURE__*/React__namespace.createElement(ErrorBoundary, {
      set: setError
    }, /*#__PURE__*/React__namespace.createElement(React__namespace.Suspense, {
      fallback: /*#__PURE__*/React__namespace.createElement(Block, {
        set: setBlock
      })
    }, children)));
  }

  React__namespace.useEffect(() => {
    return () => index.unmountComponentAtNode(canvas);
  }, [canvas]);
  return /*#__PURE__*/React__namespace.createElement(reactNative.View, _extends({}, viewProps, {
    ref: forwardedRef,
    onLayout: onLayout,
    style: {
      flex: 1,
      ...style
    }
  }, bind), width > 0 && /*#__PURE__*/React__namespace.createElement(expoGl.GLView, {
    onContextCreate: onContextCreate,
    style: reactNative.StyleSheet.absoluteFill
  }));
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
exports.useStore = index.useStore;
exports.useThree = index.useThree;
exports.Canvas = Canvas;
exports.events = createTouchEvents;
exports.useLoader = useLoader;
