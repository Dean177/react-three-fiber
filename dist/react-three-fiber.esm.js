import { c as createEvents, e as extend, p as pick, o as omit, a as createRoot, u as unmountComponentAtNode } from './index-09b06af8.esm.js';
export { t as ReactThreeFiber, y as _roots, x as act, v as addAfterEffect, s as addEffect, w as addTail, q as advance, l as applyProps, i as context, j as createPortal, a as createRoot, m as dispose, e as extend, n as invalidate, k as reconciler, r as render, u as unmountComponentAtNode, f as useFrame, g as useGraph, h as useLoader, b as useStore, d as useThree } from './index-09b06af8.esm.js';
import _extends from '@babel/runtime/helpers/esm/extends';
import * as React from 'react';
import * as THREE from 'three';
import mergeRefs from 'react-merge-refs';
import useMeasure from 'react-use-measure';
import 'suspend-react';
import 'react-reconciler/constants';
import 'zustand';
import 'react-reconciler';
import 'scheduler';

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
  } = createEvents(store);
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

const Canvas = /*#__PURE__*/React.forwardRef(function Canvas({
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
  React.useMemo(() => extend(THREE), []);
  const [containerRef, {
    width,
    height
  }] = useMeasure({
    scroll: true,
    debounce: {
      scroll: 50,
      resize: 0
    },
    ...resize
  });
  const canvasRef = React.useRef(null);
  const [canvas, setCanvas] = React.useState(null);
  const canvasProps = pick(props, CANVAS_PROPS);
  const divProps = omit(props, CANVAS_PROPS);
  const [block, setBlock] = React.useState(false);
  const [error, setError] = React.useState(false); // Suspend this component if block is a promise (2nd run)

  if (block) throw block; // Throw exception outwards if anything within canvas throws

  if (error) throw error;

  if (width > 0 && height > 0 && canvas) {
    createRoot(canvas, { ...canvasProps,
      size: {
        width,
        height
      },
      events: events || createPointerEvents
    }).render( /*#__PURE__*/React.createElement(ErrorBoundary, {
      set: setError
    }, /*#__PURE__*/React.createElement(React.Suspense, {
      fallback: /*#__PURE__*/React.createElement(Block, {
        set: setBlock
      })
    }, children)));
  }

  React.useLayoutEffect(() => {
    setCanvas(canvasRef.current);
  }, []);
  React.useEffect(() => {
    return () => unmountComponentAtNode(canvas);
  }, [canvas]);
  return /*#__PURE__*/React.createElement("div", _extends({
    ref: containerRef,
    style: {
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      ...style
    }
  }, divProps), /*#__PURE__*/React.createElement("canvas", {
    ref: mergeRefs([canvasRef, forwardedRef]),
    style: {
      display: 'block'
    }
  }, fallback));
});

export { Canvas, createPointerEvents as events };
