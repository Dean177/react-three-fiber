import { z as buildGraph, A as is, c as createEvents, e as extend, p as pick, o as omit, a as createRoot, u as unmountComponentAtNode } from '../../dist/index-09b06af8.esm.js';
export { t as ReactThreeFiber, y as _roots, x as act, v as addAfterEffect, s as addEffect, w as addTail, q as advance, l as applyProps, i as context, j as createPortal, a as createRoot, m as dispose, e as extend, n as invalidate, k as reconciler, r as render, u as unmountComponentAtNode, f as useFrame, g as useGraph, b as useStore, d as useThree } from '../../dist/index-09b06af8.esm.js';
import * as THREE from 'three';
import { Asset } from 'expo-asset';
import { readAsStringAsync } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { suspend, preload, clear } from 'suspend-react';
import _extends from '@babel/runtime/helpers/esm/extends';
import * as React from 'react';
import { PixelRatio, View, StyleSheet } from 'react-native';
import { GLView } from 'expo-gl';
import Pressability from 'react-native/Libraries/Pressability/Pressability';
import 'react-reconciler/constants';
import 'zustand';
import 'react-reconciler';
import 'scheduler';

/**
 * Generates an asset based on input type.
 */

const getAsset = input => {
  if (input instanceof Asset) return input;

  switch (typeof input) {
    case 'string':
      return Asset.fromURI(input);

    case 'number':
      return Asset.fromModule(input);

    default:
      throw 'Invalid asset! Must be a URI or module.';
  }
};
/**
 * Downloads from a local URI and decodes into an ArrayBuffer.
 */


const toBuffer = async localUri => readAsStringAsync(localUri, {
  encoding: 'base64'
}).then(decode);

function loadingFn(extensions, onProgress) {
  return function (Proto, ...input) {
    // Construct new loader and run extensions
    const loader = new Proto();
    if (extensions) extensions(loader); // Go through the urls and load them

    return Promise.all(input.map(entry => new Promise(async (res, reject) => {
      // Construct URL
      const url = typeof entry === 'string' ? loader.path + entry : entry; // There's no Image in native, so we create & pass a data texture instead

      if (loader instanceof THREE.TextureLoader) {
        const asset = await getAsset(url).downloadAsync();
        const texture = new THREE.Texture();
        texture.isDataTexture = true;
        texture.image = {
          data: asset,
          width: asset.width,
          height: asset.height
        };
        texture.needsUpdate = true;
        return res(texture);
      } // Do similar for CubeTextures


      if (loader instanceof THREE.CubeTextureLoader) {
        const texture = new THREE.CubeTexture();
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
          if (data.scene) Object.assign(data, buildGraph(data.scene));
          res(data);
        }, onProgress, error => reject(`Could not load ${url}: ${error.message}`));
      } // Otherwise, create a localUri and a file buffer


      const {
        localUri
      } = await getAsset(url).downloadAsync();
      const arrayBuffer = await toBuffer(localUri); // Parse it

      const parsed = loader.parse == null ? void 0 : loader.parse(arrayBuffer, undefined, data => {
        if (data.scene) Object.assign(data, buildGraph(data.scene));
        res(data);
      }, error => reject(`Could not load ${url}: ${error.message}`)); // Respect synchronous parsers which don't have callbacks

      if (parsed) return res(parsed);
    })));
  };
}

function useLoader(Proto, input, extensions, onProgress) {
  // Use suspense to load async assets
  const keys = Array.isArray(input) ? input : [input];
  const results = suspend(loadingFn(extensions, onProgress), [Proto, ...keys], {
    equal: is.equ
  }); // Return the object/s

  return Array.isArray(input) ? results : results[0];
}

useLoader.preload = function (Proto, input, extensions) {
  const keys = Array.isArray(input) ? input : [input];
  return preload(loadingFn(extensions), [Proto, ...keys]);
};

useLoader.clear = function (Proto, input) {
  const keys = Array.isArray(input) ? input : [input];
  return clear([Proto, ...keys]);
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
  } = createEvents(store);

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
      const connected = new Pressability(events == null ? void 0 : events.handlers);
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
  React.useLayoutEffect(() => {
    set(new Promise(() => null));
    return () => set(false);
  }, [set]);
  return null;
}

class ErrorBoundary extends React.Component {
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

const Canvas = /*#__PURE__*/React.forwardRef(({
  children,
  fallback,
  style,
  events,
  ...props
}, forwardedRef) => {
  // Create a known catalogue of Threejs-native elements
  // This will include the entire THREE namespace by default, users can extend
  // their own elements by using the createRoot API instead
  React.useMemo(() => extend(THREE), []);
  const [{
    width,
    height
  }, setSize] = React.useState({
    width: 0,
    height: 0
  });
  const [canvas, setCanvas] = React.useState(null);
  const [bind, setBind] = React.useState();
  const canvasProps = pick(props, CANVAS_PROPS);
  const viewProps = omit(props, CANVAS_PROPS);
  const [block, setBlock] = React.useState(false);
  const [error, setError] = React.useState(false); // Suspend this component if block is a promise (2nd run)

  if (block) throw block; // Throw exception outwards if anything within canvas throws

  if (error) throw error;
  const onLayout = React.useCallback(e => {
    const {
      width,
      height
    } = e.nativeEvent.layout;
    setSize({
      width,
      height
    });
  }, []);
  const onContextCreate = React.useCallback(context => {
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

    createRoot(canvas, { ...canvasProps,
      // expo-gl can only render at native dpr/resolution
      // https://github.com/expo/expo-three/issues/39
      dpr: PixelRatio.get(),
      size: {
        width,
        height
      },
      events: events || createTouchEvents,
      onCreated
    }).render( /*#__PURE__*/React.createElement(ErrorBoundary, {
      set: setError
    }, /*#__PURE__*/React.createElement(React.Suspense, {
      fallback: /*#__PURE__*/React.createElement(Block, {
        set: setBlock
      })
    }, children)));
  }

  React.useEffect(() => {
    return () => unmountComponentAtNode(canvas);
  }, [canvas]);
  return /*#__PURE__*/React.createElement(View, _extends({}, viewProps, {
    ref: forwardedRef,
    onLayout: onLayout,
    style: {
      flex: 1,
      ...style
    }
  }, bind), width > 0 && /*#__PURE__*/React.createElement(GLView, {
    onContextCreate: onContextCreate,
    style: StyleSheet.absoluteFill
  }));
});

export { Canvas, createTouchEvents as events, useLoader };
