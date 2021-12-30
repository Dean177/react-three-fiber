'use strict';

var React = require('react');
var suspendReact = require('suspend-react');
var THREE = require('three');
var constants = require('react-reconciler/constants');
var create = require('zustand');
var Reconciler = require('react-reconciler');
var scheduler = require('scheduler');

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
var create__default = /*#__PURE__*/_interopDefault(create);
var Reconciler__default = /*#__PURE__*/_interopDefault(Reconciler);

var threeTypes = /*#__PURE__*/Object.freeze({
  __proto__: null
});

const DEFAULT = '__default';
const isDiffSet = def => def && !!def.memoized && !!def.changes;
function calculateDpr(dpr) {
  return Array.isArray(dpr) ? Math.min(Math.max(dpr[0], window.devicePixelRatio), dpr[1]) : dpr;
}
/**
 * Picks or omits keys from an object
 * `omit` will filter out keys, and otherwise cherry-pick them.
 */

function filterKeys(obj, omit, ...keys) {
  const keysToSelect = new Set(keys);
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const shouldInclude = !omit;

    if (keysToSelect.has(key) === shouldInclude) {
      acc[key] = value;
    }

    return acc;
  }, {});
}
/**
 * Clones an object and cherry-picks keys.
 */

const pick = (obj, keys) => filterKeys(obj, false, ...keys);
/**
 * Clones an object and prunes or omits keys.
 */

const omit = (obj, keys) => filterKeys(obj, true, ...keys); // A collection of compare functions

const is = {
  obj: a => a === Object(a) && !is.arr(a) && typeof a !== 'function',
  fun: a => typeof a === 'function',
  str: a => typeof a === 'string',
  num: a => typeof a === 'number',
  und: a => a === void 0,
  arr: a => Array.isArray(a),

  equ(a, b) {
    // Wrong type or one of the two undefined, doesn't match
    if (typeof a !== typeof b || !!a !== !!b) return false; // Atomic, just compare a against b

    if (is.str(a) || is.num(a) || is.obj(a)) return a === b; // Array, shallow compare first to see if it's a match

    if (is.arr(a) && a == b) return true; // Last resort, go through keys

    let i;

    for (i in a) if (!(i in b)) return false;

    for (i in b) if (a[i] !== b[i]) return false;

    return is.und(i) ? a === b : true;
  }

}; // Collects nodes and materials from a THREE.Object3D

function buildGraph(object) {
  const data = {
    nodes: {},
    materials: {}
  };

  if (object) {
    object.traverse(obj => {
      if (obj.name) data.nodes[obj.name] = obj;
      if (obj.material && !data.materials[obj.material.name]) data.materials[obj.material.name] = obj.material;
    });
  }

  return data;
} // Disposes an object and all its properties

function dispose(obj) {
  if (obj.dispose && obj.type !== 'Scene') obj.dispose();

  for (const p in obj) {
    p.dispose == null ? void 0 : p.dispose();
    delete obj[p];
  }
} // Each object in the scene carries a small LocalState descriptor

function prepare(object, state) {
  const instance = object;

  if (state != null && state.primitive || !instance.__r3f) {
    instance.__r3f = {
      root: null,
      memoizedProps: {},
      eventCount: 0,
      handlers: {},
      objects: [],
      parent: null,
      ...state
    };
  }

  return object;
}

function resolve(instance, key) {
  let target = instance;

  if (key.includes('-')) {
    const entries = key.split('-');
    const last = entries.pop();
    target = entries.reduce((acc, key) => acc[key], instance);
    return {
      target,
      key: last
    };
  } else return {
    target,
    key
  };
}

function attach(parent, child, type) {
  if (is.str(type)) {
    const {
      target,
      key
    } = resolve(parent, type);
    parent.__r3f.previousAttach = target[key];
    target[key] = child;
  } else if (is.arr(type)) {
    const [attach] = type;
    if (is.str(attach)) parent[attach](child);else if (is.fun(attach)) attach(parent, child);
  }
}
function detach(parent, child, type) {
  if (is.str(type)) {
    const {
      target,
      key
    } = resolve(parent, type);
    target[key] = parent.__r3f.previousAttach;
  } else if (is.arr(type)) {
    const [, detach] = type;
    if (is.str(detach)) parent[detach](child);else if (is.fun(detach)) detach(parent, child);
  }
} // Shallow check arrays, but check objects atomically

function checkShallow(a, b) {
  if (is.arr(a) && is.equ(a, b)) return true;
  if (a === b) return true;
  return false;
} // This function prepares a set of changes to be applied to the instance


function diffProps(instance, {
  children: cN,
  key: kN,
  ref: rN,
  ...props
}, {
  children: cP,
  key: kP,
  ref: rP,
  ...previous
} = {}, remove = false) {
  var _instance$__r3f;

  const localState = (_instance$__r3f = instance == null ? void 0 : instance.__r3f) != null ? _instance$__r3f : {};
  const entries = Object.entries(props);
  const changes = []; // Catch removed props, prepend them so they can be reset or removed

  if (remove) {
    const previousKeys = Object.keys(previous);

    for (let i = 0; i < previousKeys.length; i++) {
      if (!props.hasOwnProperty(previousKeys[i])) entries.unshift([previousKeys[i], DEFAULT + 'remove']);
    }
  } // @ts-ignore


  entries.forEach(([key, value]) => {
    var _instance$__r3f2;

    // Bail out on primitive object
    if ((_instance$__r3f2 = instance.__r3f) != null && _instance$__r3f2.primitive && key === 'object') return; // When props match bail out

    if (checkShallow(value, previous[key])) return; // Collect handlers and bail out

    if (/^on(Pointer|Click|DoubleClick|ContextMenu|Wheel)/.test(key)) return changes.push([key, value, true, []]); // Split dashed props

    let entries = [];
    if (key.includes('-')) entries = key.split('-');
    changes.push([key, value, false, entries]);
  });
  const memoized = { ...props
  };
  if (localState.memoizedProps && localState.memoizedProps.args) memoized.args = localState.memoizedProps.args;
  if (localState.memoizedProps && localState.memoizedProps.attach) memoized.attach = localState.memoizedProps.attach;
  return {
    memoized,
    changes
  };
} // This function applies a set of changes to the instance

function applyProps$1(instance, data) {
  var _instance$__r3f3, _root$getState;

  // Filter equals, events and reserved props
  const localState = (_instance$__r3f3 = instance == null ? void 0 : instance.__r3f) != null ? _instance$__r3f3 : {};
  const root = localState.root;
  const rootState = (_root$getState = root == null ? void 0 : root.getState == null ? void 0 : root.getState()) != null ? _root$getState : {};
  const {
    memoized,
    changes
  } = isDiffSet(data) ? data : diffProps(instance, data);
  const prevHandlers = localState.eventCount; // Prepare memoized props

  if (instance.__r3f) instance.__r3f.memoizedProps = memoized;
  changes.forEach(([key, value, isEvent, keys]) => {
    let currentInstance = instance;
    let targetProp = currentInstance[key]; // Revolve dashed props

    if (keys.length) {
      targetProp = keys.reduce((acc, key) => acc[key], instance); // If the target is atomic, it forces us to switch the root

      if (!(targetProp && targetProp.set)) {
        const [name, ...reverseEntries] = keys.reverse();
        currentInstance = reverseEntries.reverse().reduce((acc, key) => acc[key], instance);
        key = name;
      }
    } // https://github.com/mrdoob/three.js/issues/21209
    // HMR/fast-refresh relies on the ability to cancel out props, but threejs
    // has no means to do this. Hence we curate a small collection of value-classes
    // with their respective constructor/set arguments
    // For removed props, try to set default values, if possible


    if (value === DEFAULT + 'remove') {
      if (targetProp && targetProp.constructor) {
        // use the prop constructor to find the default it should be
        value = new targetProp.constructor(memoized.args);
      } else if (currentInstance.constructor) {
        // create a blank slate of the instance and copy the particular parameter.
        // @ts-ignore
        const defaultClassCall = new currentInstance.constructor(currentInstance.__r3f.memoizedProps.args);
        value = defaultClassCall[targetProp]; // destory the instance

        if (defaultClassCall.dispose) defaultClassCall.dispose(); // instance does not have constructor, just set it to 0
      } else {
        value = 0;
      }
    } // Deal with pointer events ...


    if (isEvent) {
      if (value) localState.handlers[key] = value;else delete localState.handlers[key];
      localState.eventCount = Object.keys(localState.handlers).length;
    } // Special treatment for objects with support for set/copy, and layers
    else if (targetProp && targetProp.set && (targetProp.copy || targetProp instanceof THREE__namespace.Layers)) {
      // If value is an array
      if (Array.isArray(value)) {
        if (targetProp.fromArray) targetProp.fromArray(value);else targetProp.set(...value);
      } // Test again target.copy(class) next ...
      else if (targetProp.copy && value && value.constructor && targetProp.constructor.name === value.constructor.name) {
        targetProp.copy(value);
      } // If nothing else fits, just set the single value, ignore undefined
      // https://github.com/pmndrs/react-three-fiber/issues/274
      else if (value !== undefined) {
        const isColor = targetProp instanceof THREE__namespace.Color; // Allow setting array scalars

        if (!isColor && targetProp.setScalar) targetProp.setScalar(value); // Layers have no copy function, we must therefore copy the mask property
        else if (targetProp instanceof THREE__namespace.Layers && value instanceof THREE__namespace.Layers) targetProp.mask = value.mask; // Otherwise just set ...
        else targetProp.set(value); // Auto-convert sRGB colors, for now ...
        // https://github.com/pmndrs/react-three-fiber/issues/344

        if (!rootState.linear && isColor) targetProp.convertSRGBToLinear();
      } // Else, just overwrite the value

    } else {
      currentInstance[key] = value; // Auto-convert sRGB textures, for now ...
      // https://github.com/pmndrs/react-three-fiber/issues/344

      if (!rootState.linear && currentInstance[key] instanceof THREE__namespace.Texture) {
        currentInstance[key].encoding = THREE__namespace.sRGBEncoding;
      }
    }

    invalidateInstance(instance);
    return instance;
  });

  if (localState.parent && rootState.internal && instance.raycast && prevHandlers !== localState.eventCount) {
    // Pre-emptively remove the instance from the interaction manager
    const index = rootState.internal.interaction.indexOf(instance);
    if (index > -1) rootState.internal.interaction.splice(index, 1); // Add the instance to the interaction manager only when it has handlers

    if (localState.eventCount) rootState.internal.interaction.push(instance);
  } // Call the update lifecycle when it is being updated, but only when it is part of the scene


  if (changes.length && instance.parent) updateInstance(instance);
}
function invalidateInstance(instance) {
  var _instance$__r3f4, _instance$__r3f4$root;

  const state = (_instance$__r3f4 = instance.__r3f) == null ? void 0 : (_instance$__r3f4$root = _instance$__r3f4.root) == null ? void 0 : _instance$__r3f4$root.getState == null ? void 0 : _instance$__r3f4$root.getState();
  if (state && state.internal.frames === 0) state.invalidate();
}
function updateInstance(instance) {
  instance.onUpdate == null ? void 0 : instance.onUpdate(instance);
}

function makeId(event) {
  return (event.eventObject || event.object).uuid + '/' + event.index + event.instanceId;
} // https://github.com/facebook/react/tree/main/packages/react-reconciler#getcurrenteventpriority
// Gives React a clue as to how import the current interaction is


function getEventPriority() {
  var _window, _window$event;

  let name = (_window = window) == null ? void 0 : (_window$event = _window.event) == null ? void 0 : _window$event.type;

  switch (name) {
    case 'click':
    case 'contextmenu':
    case 'dblclick':
    case 'pointercancel':
    case 'pointerdown':
    case 'pointerup':
      return constants.DiscreteEventPriority;

    case 'pointermove':
    case 'pointerout':
    case 'pointerover':
    case 'pointerenter':
    case 'pointerleave':
    case 'wheel':
      return constants.ContinuousEventPriority;

    default:
      return constants.DefaultEventPriority;
  }
}
/**
 * Release pointer captures.
 * This is called by releasePointerCapture in the API, and when an object is removed.
 */

function releaseInternalPointerCapture(capturedMap, obj, captures, pointerId) {
  const captureData = captures.get(obj);

  if (captureData) {
    captures.delete(obj); // If this was the last capturing object for this pointer

    if (captures.size === 0) {
      capturedMap.delete(pointerId);
      captureData.target.releasePointerCapture(pointerId);
    }
  }
}

function removeInteractivity(store, object) {
  const {
    internal
  } = store.getState(); // Removes every trace of an object from the data store

  internal.interaction = internal.interaction.filter(o => o !== object);
  internal.initialHits = internal.initialHits.filter(o => o !== object);
  internal.hovered.forEach((value, key) => {
    if (value.eventObject === object || value.object === object) {
      internal.hovered.delete(key);
    }
  });
  internal.capturedMap.forEach((captures, pointerId) => {
    releaseInternalPointerCapture(internal.capturedMap, object, captures, pointerId);
  });
}
function createEvents(store) {
  const temp = new THREE__namespace.Vector3();
  /** Sets up defaultRaycaster */

  function prepareRay(event) {
    var _raycaster$computeOff;

    const state = store.getState();
    const {
      raycaster,
      mouse,
      camera,
      size
    } = state; // https://github.com/pmndrs/react-three-fiber/pull/782
    // Events trigger outside of canvas when moved

    const {
      offsetX,
      offsetY
    } = (_raycaster$computeOff = raycaster.computeOffsets == null ? void 0 : raycaster.computeOffsets(event, state)) != null ? _raycaster$computeOff : event;
    const {
      width,
      height
    } = size;
    mouse.set(offsetX / width * 2 - 1, -(offsetY / height) * 2 + 1);
    raycaster.setFromCamera(mouse, camera);
  }
  /** Calculates delta */


  function calculateDistance(event) {
    const {
      internal
    } = store.getState();
    const dx = event.offsetX - internal.initialClick[0];
    const dy = event.offsetY - internal.initialClick[1];
    return Math.round(Math.sqrt(dx * dx + dy * dy));
  }
  /** Returns true if an instance has a valid pointer-event registered, this excludes scroll, clicks etc */


  function filterPointerEvents(objects) {
    return objects.filter(obj => ['Move', 'Over', 'Enter', 'Out', 'Leave'].some(name => {
      var _r3f;

      return (_r3f = obj.__r3f) == null ? void 0 : _r3f.handlers['onPointer' + name];
    }));
  }

  function intersect(filter) {
    const state = store.getState();
    const {
      raycaster,
      internal
    } = state; // Skip event handling when noEvents is set

    if (!raycaster.enabled) return [];
    const seen = new Set();
    const intersections = []; // Allow callers to eliminate event objects

    const eventsObjects = filter ? filter(internal.interaction) : internal.interaction; // Intersect known handler objects and filter against duplicates

    let intersects = raycaster.intersectObjects(eventsObjects, true).filter(item => {
      const id = makeId(item);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    }); // https://github.com/mrdoob/three.js/issues/16031
    // Allow custom userland intersect sort order

    if (raycaster.filter) intersects = raycaster.filter(intersects, state);

    for (const intersect of intersects) {
      let eventObject = intersect.object; // Bubble event up

      while (eventObject) {
        var _r3f2;

        if ((_r3f2 = eventObject.__r3f) != null && _r3f2.eventCount) intersections.push({ ...intersect,
          eventObject
        });
        eventObject = eventObject.parent;
      }
    }

    return intersections;
  }
  /**  Creates filtered intersects and returns an array of positive hits */


  function patchIntersects(intersections, event) {
    const {
      internal
    } = store.getState(); // If the interaction is captured, make all capturing targets  part of the
    // intersect.

    if ('pointerId' in event && internal.capturedMap.has(event.pointerId)) {
      for (let captureData of internal.capturedMap.get(event.pointerId).values()) {
        intersections.push(captureData.intersection);
      }
    }

    return intersections;
  }
  /**  Handles intersections by forwarding them to handlers */


  function handleIntersects(intersections, event, delta, callback) {
    const {
      raycaster,
      mouse,
      camera,
      internal
    } = store.getState(); // If anything has been found, forward it to the event listeners

    if (intersections.length) {
      const unprojectedPoint = temp.set(mouse.x, mouse.y, 0).unproject(camera);
      const localState = {
        stopped: false
      };

      for (const hit of intersections) {
        const hasPointerCapture = id => {
          var _internal$capturedMap, _internal$capturedMap2;

          return (_internal$capturedMap = (_internal$capturedMap2 = internal.capturedMap.get(id)) == null ? void 0 : _internal$capturedMap2.has(hit.eventObject)) != null ? _internal$capturedMap : false;
        };

        const setPointerCapture = id => {
          const captureData = {
            intersection: hit,
            target: event.target
          };

          if (internal.capturedMap.has(id)) {
            // if the pointerId was previously captured, we add the hit to the
            // event capturedMap.
            internal.capturedMap.get(id).set(hit.eventObject, captureData);
          } else {
            // if the pointerId was not previously captured, we create a map
            // containing the hitObject, and the hit. hitObject is used for
            // faster access.
            internal.capturedMap.set(id, new Map([[hit.eventObject, captureData]]));
          } // Call the original event now
          event.target.setPointerCapture(id);
        };

        const releasePointerCapture = id => {
          const captures = internal.capturedMap.get(id);

          if (captures) {
            releaseInternalPointerCapture(internal.capturedMap, hit.eventObject, captures, id);
          }
        }; // Add native event props


        let extractEventProps = {}; // This iterates over the event's properties including the inherited ones. Native PointerEvents have most of their props as getters which are inherited, but polyfilled PointerEvents have them all as their own properties (i.e. not inherited). We can't use Object.keys() or Object.entries() as they only return "own" properties; nor Object.getPrototypeOf(event) as that *doesn't* return "own" properties, only inherited ones.

        for (let prop in event) {
          let property = event[prop]; // Only copy over atomics, leave functions alone as these should be
          // called as event.nativeEvent.fn()

          if (typeof property !== 'function') extractEventProps[prop] = property;
        }

        let raycastEvent = { ...hit,
          ...extractEventProps,
          spaceX: mouse.x,
          spaceY: mouse.y,
          intersections,
          stopped: localState.stopped,
          delta,
          unprojectedPoint,
          ray: raycaster.ray,
          camera: camera,
          // Hijack stopPropagation, which just sets a flag
          stopPropagation: () => {
            // https://github.com/pmndrs/react-three-fiber/issues/596
            // Events are not allowed to stop propagation if the pointer has been captured
            const capturesForPointer = 'pointerId' in event && internal.capturedMap.get(event.pointerId); // We only authorize stopPropagation...

            if ( // ...if this pointer hasn't been captured
            !capturesForPointer || // ... or if the hit object is capturing the pointer
            capturesForPointer.has(hit.eventObject)) {
              raycastEvent.stopped = localState.stopped = true; // Propagation is stopped, remove all other hover records
              // An event handler is only allowed to flush other handlers if it is hovered itself

              if (internal.hovered.size && Array.from(internal.hovered.values()).find(i => i.eventObject === hit.eventObject)) {
                // Objects cannot flush out higher up objects that have already caught the event
                const higher = intersections.slice(0, intersections.indexOf(hit));
                cancelPointer([...higher, hit]);
              }
            }
          },
          // there should be a distinction between target and currentTarget
          target: {
            hasPointerCapture,
            setPointerCapture,
            releasePointerCapture
          },
          currentTarget: {
            hasPointerCapture,
            setPointerCapture,
            releasePointerCapture
          },
          sourceEvent: event,
          // deprecated
          nativeEvent: event
        }; // Call subscribers

        callback(raycastEvent); // Event bubbling may be interrupted by stopPropagation

        if (localState.stopped === true) break;
      }
    }

    return intersections;
  }

  function cancelPointer(hits) {
    const {
      internal
    } = store.getState();
    Array.from(internal.hovered.values()).forEach(hoveredObj => {
      // When no objects were hit or the the hovered object wasn't found underneath the cursor
      // we call onPointerOut and delete the object from the hovered-elements map
      if (!hits.length || !hits.find(hit => hit.object === hoveredObj.object && hit.index === hoveredObj.index && hit.instanceId === hoveredObj.instanceId)) {
        const eventObject = hoveredObj.eventObject;
        const instance = eventObject.__r3f;
        const handlers = instance == null ? void 0 : instance.handlers;
        internal.hovered.delete(makeId(hoveredObj));

        if (instance != null && instance.eventCount) {
          // Clear out intersects, they are outdated by now
          const data = { ...hoveredObj,
            intersections: hits || []
          };
          handlers.onPointerOut == null ? void 0 : handlers.onPointerOut(data);
          handlers.onPointerLeave == null ? void 0 : handlers.onPointerLeave(data);
        }
      }
    });
  }

  const handlePointer = name => {
    // console.info('handlePointer', name)
    // Deal with cancellation
    switch (name) {
      case 'onPointerLeave':
      case 'onPointerCancel':
        return () => cancelPointer([]);

      case 'onLostPointerCapture':
        return event => {
          const {
            internal
          } = store.getState();

          if ('pointerId' in event && !internal.capturedMap.has(event.pointerId)) {
            // If the object event interface had onLostPointerCapture, we'd call it here on every
            // object that's getting removed.
            internal.capturedMap.delete(event.pointerId);
            cancelPointer([]);
          }
        };
    } // Any other pointer goes here ...


    return event => {
      // console.info('handlePointer', name)
      const {
        onPointerMissed,
        internal
      } = store.getState();
      prepareRay(event);
      internal.lastEvent.current = event; // Get fresh intersects

      const isPointerMove = name === 'onPointerMove';
      const isClickEvent = name === 'onClick' || name === 'onContextMenu' || name === 'onDoubleClick';
      const filter = isPointerMove ? filterPointerEvents : undefined;
      const hits = patchIntersects(intersect(filter), event);
      const delta = isClickEvent ? calculateDistance(event) : 0; // Save initial coordinates on pointer-down

      if (name === 'onPointerDown') {
        internal.initialClick = [event.offsetX, event.offsetY];
        internal.initialHits = hits.map(hit => hit.eventObject);
      } // If a click yields no results, pass it back to the user as a miss
      // Missed events have to come first in order to establish user-land side-effect clean up


      if (isClickEvent && !hits.length) {
        if (delta <= 2) {
          pointerMissed(event, internal.interaction);
          if (onPointerMissed) onPointerMissed(event);
        }
      } // Take care of unhover


      if (isPointerMove) cancelPointer(hits);
      handleIntersects(hits, event, delta, data => {
        const eventObject = data.eventObject;
        const instance = eventObject.__r3f;
        const handlers = instance == null ? void 0 : instance.handlers; // Check presence of handlers

        if (!(instance != null && instance.eventCount)) return;

        if (isPointerMove) {
          // Move event ...
          if (handlers.onPointerOver || handlers.onPointerEnter || handlers.onPointerOut || handlers.onPointerLeave) {
            // When enter or out is present take care of hover-state
            const id = makeId(data);
            const hoveredItem = internal.hovered.get(id);

            if (!hoveredItem) {
              // If the object wasn't previously hovered, book it and call its handler
              internal.hovered.set(id, data);
              handlers.onPointerOver == null ? void 0 : handlers.onPointerOver(data);
              handlers.onPointerEnter == null ? void 0 : handlers.onPointerEnter(data);
            } else if (hoveredItem.stopped) {
              // If the object was previously hovered and stopped, we shouldn't allow other items to proceed
              data.stopPropagation();
            }
          } // Call mouse move


          handlers.onPointerMove == null ? void 0 : handlers.onPointerMove(data);
        } else {
          // All other events ...
          const handler = handlers[name];

          if (handler) {
            // Forward all events back to their respective handlers with the exception of click events,
            // which must use the initial target
            if (!isClickEvent || internal.initialHits.includes(eventObject)) {
              // Missed events have to come first
              pointerMissed(event, internal.interaction.filter(object => !internal.initialHits.includes(object))); // Now call the handler

              handler(data);
            }
          } else {
            // Trigger onPointerMissed on all elements that have pointer over/out handlers, but not click and weren't hit
            if (isClickEvent && internal.initialHits.includes(eventObject)) {
              pointerMissed(event, internal.interaction.filter(object => !internal.initialHits.includes(object)));
            }
          }
        }
      });
    };
  };

  function pointerMissed(event, objects) {
    objects.forEach(object => {
      var _r3f3;

      return (_r3f3 = object.__r3f) == null ? void 0 : _r3f3.handlers.onPointerMissed == null ? void 0 : _r3f3.handlers.onPointerMissed(event);
    });
  }

  return {
    handlePointer
  };
}

// @ts-ignore

// Type guard to tell a store from a portal
const isStore = def => def && !!def.getState;

const getContainer = (container, child) => {
  var _container$__r3f$root, _container$__r3f;

  return {
    // If the container is not a root-store then it must be a THREE.Object3D into which part of the
    // scene is portalled into. Now there can be two variants of this, either that object is part of
    // the regular jsx tree, in which case it already has __r3f with a valid root attached, or it lies
    // outside react, in which case we must take the root of the child that is about to be attached to it.
    root: isStore(container) ? container : (_container$__r3f$root = (_container$__r3f = container.__r3f) == null ? void 0 : _container$__r3f.root) != null ? _container$__r3f$root : child.__r3f.root,
    // The container is the eventual target into which objects are mounted, it has to be a THREE.Object3D
    container: isStore(container) ? container.getState().scene : container
  };
};

let catalogue = {};

let extend = objects => void (catalogue = { ...catalogue,
  ...objects
});

function createRenderer(roots, getEventPriority) {
  function createInstance(type, {
    args = [],
    attach,
    ...props
  }, root, hostContext, // @ts-ignore
  internalInstanceHandle) {
    let name = `${type[0].toUpperCase()}${type.slice(1)}`;
    let instance; // https://github.com/facebook/react/issues/17147
    // Portals do not give us a root, they are themselves treated as a root by the reconciler
    // In order to figure out the actual root we have to climb through fiber internals :(

    if (!isStore(root) && internalInstanceHandle) {
      // @ts-ignore
      const fn = node => {
        if (!node.return) return node.stateNode && node.stateNode.containerInfo;else return fn(node.return);
      };

      root = fn(internalInstanceHandle);
    } // Assert that by now we have a valid root


    if (!root || !isStore(root)) throw `No valid root for ${name}!`; // Auto-attach geometries and materials

    if (attach === undefined) {
      if (name.endsWith('Geometry')) attach = 'geometry';else if (name.endsWith('Material')) attach = 'material';
    }

    if (type === 'primitive') {
      if (props.object === undefined) throw `Primitives without 'object' are invalid!`;
      const object = props.object;
      instance = prepare(object, {
        root,
        attach,
        primitive: true
      });
    } else {
      const target = catalogue[name];

      if (!target) {
        throw `${name} is not part of the THREE namespace! Did you forget to extend? See: https://github.com/pmndrs/react-three-fiber/blob/master/markdown/api.md#using-3rd-party-objects-declaratively`;
      } // Throw if an object or literal was passed for args


      if (!Array.isArray(args)) throw 'The args prop must be an array!'; // Instanciate new object, link it to the root
      // Append memoized props with args so it's not forgotten

      instance = prepare(new target(...args), {
        root,
        attach,
        // TODO: Figure out what this is for
        memoizedProps: {
          args: args.length === 0 ? null : args
        }
      });
    } // It should NOT call onUpdate on object instanciation, because it hasn't been added to the
    // view yet. If the callback relies on references for instance, they won't be ready yet, this is
    // why it passes "true" here


    applyProps$1(instance, props);
    return instance;
  }

  function appendChild(parentInstance, child) {
    let added = false;

    if (child) {
      // The attach attribute implies that the object attaches itself on the parent
      if (child.__r3f.attach) {
        attach(parentInstance, child, child.__r3f.attach);
      } else if (child.isObject3D && parentInstance.isObject3D) {
        // add in the usual parent-child way
        parentInstance.add(child);
        added = true;
      } // This is for anything that used attach, and for non-Object3Ds that don't get attached to props;
      // that is, anything that's a child in React but not a child in the scenegraph.


      if (!added) parentInstance.__r3f.objects.push(child);
      if (!child.__r3f) prepare(child, {});
      child.__r3f.parent = parentInstance;
      updateInstance(child);
      invalidateInstance(child);
    }
  }

  function insertBefore(parentInstance, child, beforeChild) {
    let added = false;

    if (child) {
      if (child.__r3f.attach) {
        attach(parentInstance, child, child.__r3f.attach);
      } else if (child.isObject3D && parentInstance.isObject3D) {
        child.parent = parentInstance;
        child.dispatchEvent({
          type: 'added'
        });
        const restSiblings = parentInstance.children.filter(sibling => sibling !== child);
        const index = restSiblings.indexOf(beforeChild);
        parentInstance.children = [...restSiblings.slice(0, index), child, ...restSiblings.slice(index)];
        added = true;
      }

      if (!added) parentInstance.__r3f.objects.push(child);
      if (!child.__r3f) prepare(child, {});
      child.__r3f.parent = parentInstance;
      updateInstance(child);
      invalidateInstance(child);
    }
  }

  function removeRecursive(array, parent, dispose = false) {
    if (array) [...array].forEach(child => removeChild(parent, child, dispose));
  }

  function removeChild(parentInstance, child, dispose) {
    if (child) {
      var _parentInstance$__r3f, _child$__r3f2;

      // Clear the parent reference
      if (child.__r3f) child.__r3f.parent = null; // Remove child from the parents objects

      if ((_parentInstance$__r3f = parentInstance.__r3f) != null && _parentInstance$__r3f.objects) parentInstance.__r3f.objects = parentInstance.__r3f.objects.filter(x => x !== child); // Remove attachment

      if (child.__r3f.attach) {
        detach(parentInstance, child, child.__r3f.attach);
      } else if (child.isObject3D && parentInstance.isObject3D) {
        var _child$__r3f;

        parentInstance.remove(child); // Remove interactivity

        if ((_child$__r3f = child.__r3f) != null && _child$__r3f.root) {
          removeInteractivity(child.__r3f.root, child);
        }
      } // Allow objects to bail out of recursive dispose alltogether by passing dispose={null}
      // Never dispose of primitives because their state may be kept outside of React!
      // In order for an object to be able to dispose it has to have
      //   - a dispose method,
      //   - it cannot be a <primitive object={...} />
      //   - it cannot be a THREE.Scene, because three has broken it's own api
      //
      // Since disposal is recursive, we can check the optional dispose arg, which will be undefined
      // when the reconciler calls it, but then carry our own check recursively


      const isPrimitive = (_child$__r3f2 = child.__r3f) == null ? void 0 : _child$__r3f2.primitive;
      const shouldDispose = dispose === undefined ? child.dispose !== null && !isPrimitive : dispose; // Remove nested child objects. Primitives should not have objects and children that are
      // attached to them declaratively ...

      if (!isPrimitive) {
        var _child$__r3f3;

        removeRecursive((_child$__r3f3 = child.__r3f) == null ? void 0 : _child$__r3f3.objects, child, shouldDispose);
        removeRecursive(child.children, child, shouldDispose);
      } // Remove references


      if (child.__r3f) {
        delete child.__r3f.root;
        delete child.__r3f.objects;
        delete child.__r3f.handlers;
        delete child.__r3f.memoizedProps;
        if (!isPrimitive) delete child.__r3f;
      } // Dispose item whenever the reconciler feels like it


      if (shouldDispose && child.dispose && child.type !== 'Scene') {
        scheduler.unstable_scheduleCallback(scheduler.unstable_IdlePriority, () => {
          try {
            child.dispose();
          } catch (e) {
            /* ... */
          }
        });
      }

      invalidateInstance(parentInstance);
    }
  }

  function switchInstance(instance, type, newProps, fiber) {
    var _instance$__r3f;

    const parent = (_instance$__r3f = instance.__r3f) == null ? void 0 : _instance$__r3f.parent;
    if (!parent) return;
    const newInstance = createInstance(type, newProps, instance.__r3f.root); // https://github.com/pmndrs/react-three-fiber/issues/1348
    // When args change the instance has to be re-constructed, which then
    // forces r3f to re-parent the children and non-scene objects
    // This can not include primitives, which should not have declarative children

    if (type !== 'primitive' && instance.children) {
      instance.children.forEach(child => appendChild(newInstance, child));
      instance.children = [];
    }

    instance.__r3f.objects.forEach(child => appendChild(newInstance, child));

    instance.__r3f.objects = [];
    removeChild(parent, instance);
    appendChild(parent, newInstance) // This evil hack switches the react-internal fiber node
    // https://github.com/facebook/react/issues/14983
    // https://github.com/facebook/react/pull/15021
    ;
    [fiber, fiber.alternate].forEach(fiber => {
      if (fiber !== null) {
        fiber.stateNode = newInstance;

        if (fiber.ref) {
          if (typeof fiber.ref === 'function') fiber.ref(newInstance); // @ts-ignore
          else fiber.ref.current = newInstance;
        }
      }
    });
  }

  const reconciler = Reconciler__default["default"]({
    appendChildToContainer: (parentInstance, child) => {
      const {
        container,
        root
      } = getContainer(parentInstance, child); // Link current root to the default scene

      container.__r3f.root = root;
      appendChild(container, child);
    },
    removeChildFromContainer: (parentInstance, child) => removeChild(getContainer(parentInstance, child).container, child),
    insertInContainerBefore: (parentInstance, child, beforeChild) => insertBefore(getContainer(parentInstance, child).container, child, beforeChild),

    prepareUpdate(instance, type, oldProps, newProps) {
      if (instance.__r3f.primitive && newProps.object && newProps.object !== instance) {
        return [true];
      } else {
        // This is a data object, let's extract critical information about it
        const {
          args: argsNew = [],
          children: cN,
          ...restNew
        } = newProps;
        const {
          args: argsOld = [],
          children: cO,
          ...restOld
        } = oldProps; // Throw if an object or literal was passed for args

        if (!Array.isArray(argsNew)) throw 'The args prop must be an array!'; // If it has new props or arguments, then it needs to be re-instanciated

        if (argsNew.some((value, index) => value !== argsOld[index])) return [true]; // Create a diff-set, flag if there are any changes

        const diff = diffProps(instance, restNew, restOld, true);
        if (diff.changes.length) return [false, diff]; // Otherwise do not touch the instance

        return null;
      }
    },

    commitUpdate(instance, [reconstruct, diff], type, oldProps, newProps, // @ts-ignore
    fiber) {
      // Reconstruct when args or <primitive object={...} have changes
      if (reconstruct) switchInstance(instance, type, newProps, fiber); // Otherwise just overwrite props
      else applyProps$1(instance, diff);
    },

    hideInstance(instance) {
      var _instance$__r3f2;

      // Deatch while the instance is hidden
      const {
        attach: type,
        parent
      } = (_instance$__r3f2 = instance == null ? void 0 : instance.__r3f) != null ? _instance$__r3f2 : {};
      if (type && parent) detach(parent, instance, type);
      if (instance.isObject3D) instance.visible = false;
      invalidateInstance(instance);
    },

    unhideInstance(instance, props) {
      var _instance$__r3f3;

      // Re-attach when the instance is unhidden
      const {
        attach: type,
        parent
      } = (_instance$__r3f3 = instance == null ? void 0 : instance.__r3f) != null ? _instance$__r3f3 : {};
      if (type && parent) attach(parent, instance, type);
      if (instance.isObject3D && props.visible == null || props.visible) instance.visible = true;
      invalidateInstance(instance);
    },

    createInstance,
    removeChild,
    appendChild,
    appendInitialChild: appendChild,
    insertBefore,
    warnsIfNotActing: true,
    supportsMutation: true,
    isPrimaryRenderer: false,
    getCurrentEventPriority: () => getEventPriority ? getEventPriority() : constants.DefaultEventPriority,
    // @ts-ignore
    now: is.fun(performance.now) ? performance.now : is.fun(Date.now) ? Date.now : undefined,
    // @ts-ignore
    scheduleTimeout: is.fun(setTimeout) ? setTimeout : undefined,
    // @ts-ignore
    cancelTimeout: is.fun(clearTimeout) ? clearTimeout : undefined,
    setTimeout: is.fun(setTimeout) ? setTimeout : undefined,
    clearTimeout: is.fun(clearTimeout) ? clearTimeout : undefined,
    noTimeout: -1,
    hideTextInstance: () => {
      throw new Error('Text is not allowed in the R3F tree.');
    },
    // prettier-ignore
    getPublicInstance: instance => instance,
    getRootHostContext: () => null,
    getChildHostContext: parentHostContext => parentHostContext,
    createTextInstance: () => {},

    finalizeInitialChildren(instance) {
      var _instance$__r3f4;

      // https://github.com/facebook/react/issues/20271
      // Returning true will trigger commitMount
      const localState = (_instance$__r3f4 = instance == null ? void 0 : instance.__r3f) != null ? _instance$__r3f4 : {};
      return !!localState.handlers;
    },

    commitMount(instance) {
      var _instance$__r3f5;

      // https://github.com/facebook/react/issues/20271
      // This will make sure events are only added once to the central container
      const localState = (_instance$__r3f5 = instance == null ? void 0 : instance.__r3f) != null ? _instance$__r3f5 : {};

      if (instance.raycast && localState.handlers && localState.eventCount) {
        instance.__r3f.root.getState().internal.interaction.push(instance);
      }
    },

    shouldDeprioritizeSubtree: () => false,
    prepareForCommit: () => null,
    preparePortalMount: containerInfo => prepare(containerInfo),
    resetAfterCommit: () => {},
    shouldSetTextContent: () => false,
    clearContainer: () => false,
    detachDeletedInstance: () => {}
  });
  return {
    reconciler,
    applyProps: applyProps$1
  };
}

const isRenderer = def => !!(def != null && def.render);
const isOrthographicCamera = def => def && def.isOrthographicCamera;
const context = /*#__PURE__*/React__namespace.createContext(null);

const createStore = (applyProps, invalidate, advance, props) => {
  const {
    gl,
    size,
    shadows = false,
    linear = false,
    flat = false,
    orthographic = false,
    frameloop = 'always',
    dpr = [1, 2],
    performance,
    clock = new THREE__namespace.Clock(),
    raycaster: raycastOptions,
    camera: cameraOptions,
    onPointerMissed
  } = props; // Set shadowmap

  if (shadows) {
    gl.shadowMap.enabled = true;
    if (typeof shadows === 'object') Object.assign(gl.shadowMap, shadows);else gl.shadowMap.type = THREE__namespace.PCFSoftShadowMap;
  } // Set color preferences


  if (linear) gl.outputEncoding = THREE__namespace.LinearEncoding;
  if (flat) gl.toneMapping = THREE__namespace.NoToneMapping; // clock.elapsedTime is updated using advance(timestamp)

  if (frameloop === 'never') {
    clock.stop();
    clock.elapsedTime = 0;
  }

  const rootState = create__default["default"]((set, get) => {
    // Create custom raycaster
    const raycaster = new THREE__namespace.Raycaster();
    const {
      params,
      ...options
    } = raycastOptions || {};
    applyProps(raycaster, {
      enabled: true,
      ...options,
      params: { ...raycaster.params,
        ...params
      }
    }); // Create default camera

    const isCamera = cameraOptions instanceof THREE__namespace.Camera;
    const camera = isCamera ? cameraOptions : orthographic ? new THREE__namespace.OrthographicCamera(0, 0, 0, 0, 0.1, 1000) : new THREE__namespace.PerspectiveCamera(75, 0, 0.1, 1000);

    if (!isCamera) {
      camera.position.z = 5;
      if (cameraOptions) applyProps(camera, cameraOptions); // Always look at center by default

      if (!(cameraOptions != null && cameraOptions.rotation)) camera.lookAt(0, 0, 0);
    }

    const initialDpr = calculateDpr(dpr);
    const position = new THREE__namespace.Vector3();
    const defaultTarget = new THREE__namespace.Vector3();
    const tempTarget = new THREE__namespace.Vector3();

    function getCurrentViewport(camera = get().camera, target = defaultTarget, size = get().size) {
      const {
        width,
        height
      } = size;
      const aspect = width / height;
      if (target instanceof THREE__namespace.Vector3) tempTarget.copy(target);else tempTarget.set(...target);
      const distance = camera.getWorldPosition(position).distanceTo(tempTarget);

      if (isOrthographicCamera(camera)) {
        return {
          width: width / camera.zoom,
          height: height / camera.zoom,
          factor: 1,
          distance,
          aspect
        };
      } else {
        const fov = camera.fov * Math.PI / 180; // convert vertical fov to radians

        const h = 2 * Math.tan(fov / 2) * distance; // visible height

        const w = h * (width / height);
        return {
          width: w,
          height: h,
          factor: width / w,
          distance,
          aspect
        };
      }
    }

    let performanceTimeout = undefined;

    const setPerformanceCurrent = current => set(state => ({
      performance: { ...state.performance,
        current
      }
    })); // Handle frame behavior in WebXR


    const handleXRFrame = timestamp => {
      const state = get();
      if (state.frameloop === 'never') return;
      advance(timestamp, true);
    }; // Toggle render switching on session


    const handleSessionChange = () => {
      gl.xr.enabled = gl.xr.isPresenting;
      gl.setAnimationLoop(gl.xr.isPresenting ? handleXRFrame : null); // If exiting session, request frame

      if (!gl.xr.isPresenting) invalidate(get());
    }; // WebXR session manager


    const xr = {
      connect() {
        gl.xr.addEventListener('sessionstart', handleSessionChange);
        gl.xr.addEventListener('sessionend', handleSessionChange);
      },

      disconnect() {
        gl.xr.removeEventListener('sessionstart', handleSessionChange);
        gl.xr.removeEventListener('sessionend', handleSessionChange);
      }

    }; // Subscribe to WebXR session events

    if (gl.xr) xr.connect();
    return {
      gl,
      set,
      get,
      invalidate: () => invalidate(get()),
      advance: (timestamp, runGlobalEffects) => advance(timestamp, runGlobalEffects, get()),
      linear,
      flat,
      scene: prepare(new THREE__namespace.Scene()),
      camera,
      controls: null,
      raycaster,
      clock,
      mouse: new THREE__namespace.Vector2(),
      frameloop,
      onPointerMissed,
      performance: {
        current: 1,
        min: 0.5,
        max: 1,
        debounce: 200,
        ...performance,
        regress: () => {
          const state = get(); // Clear timeout

          if (performanceTimeout) clearTimeout(performanceTimeout); // Set lower bound performance

          if (state.performance.current !== state.performance.min) setPerformanceCurrent(state.performance.min); // Go back to upper bound performance after a while unless something regresses meanwhile

          performanceTimeout = setTimeout(() => setPerformanceCurrent(get().performance.max), state.performance.debounce);
        }
      },
      size: {
        width: 0,
        height: 0
      },
      viewport: {
        initialDpr,
        dpr: initialDpr,
        width: 0,
        height: 0,
        aspect: 0,
        distance: 0,
        factor: 0,
        getCurrentViewport
      },
      setSize: (width, height) => {
        const size = {
          width,
          height
        };
        set(state => ({
          size,
          viewport: { ...state.viewport,
            ...getCurrentViewport(camera, defaultTarget, size)
          }
        }));
      },
      setDpr: dpr => set(state => ({
        viewport: { ...state.viewport,
          dpr: calculateDpr(dpr)
        }
      })),
      setFrameloop: (frameloop = 'always') => set(() => ({
        frameloop
      })),
      events: {
        connected: false
      },
      internal: {
        active: false,
        priority: 0,
        frames: 0,
        lastProps: props,
        lastEvent: /*#__PURE__*/React__namespace.createRef(),
        interaction: [],
        hovered: new Map(),
        subscribers: [],
        initialClick: [0, 0],
        initialHits: [],
        capturedMap: new Map(),
        xr,
        subscribe: (ref, priority = 0) => {
          set(({
            internal
          }) => ({
            internal: { ...internal,
              // If this subscription was given a priority, it takes rendering into its own hands
              // For that reason we switch off automatic rendering and increase the manual flag
              // As long as this flag is positive there can be no internal rendering at all
              // because there could be multiple render subscriptions
              priority: internal.priority + (priority > 0 ? 1 : 0),
              // Register subscriber and sort layers from lowest to highest, meaning,
              // highest priority renders last (on top of the other frames)
              subscribers: [...internal.subscribers, {
                ref,
                priority
              }].sort((a, b) => a.priority - b.priority)
            }
          }));
          return () => {
            set(({
              internal
            }) => ({
              internal: { ...internal,
                // Decrease manual flag if this subscription had a priority
                priority: internal.priority - (priority > 0 ? 1 : 0),
                // Remove subscriber from list
                subscribers: internal.subscribers.filter(s => s.ref !== ref)
              }
            }));
          };
        }
      }
    };
  });
  const state = rootState.getState(); // Resize camera and renderer on changes to size and pixelratio

  let oldSize = state.size;
  let oldDpr = state.viewport.dpr;
  rootState.subscribe(() => {
    const {
      camera,
      size,
      viewport,
      internal
    } = rootState.getState();

    if (size !== oldSize || viewport.dpr !== oldDpr) {
      // https://github.com/pmndrs/react-three-fiber/issues/92
      // Do not mess with the camera if it belongs to the user
      if (!camera.manual && !(internal.lastProps.camera instanceof THREE__namespace.Camera)) {
        if (isOrthographicCamera(camera)) {
          camera.left = size.width / -2;
          camera.right = size.width / 2;
          camera.top = size.height / 2;
          camera.bottom = size.height / -2;
        } else {
          camera.aspect = size.width / size.height;
        }

        camera.updateProjectionMatrix(); // https://github.com/pmndrs/react-three-fiber/issues/178
        // Update matrix world since the renderer is a frame late

        camera.updateMatrixWorld();
      } // Update renderer


      gl.setPixelRatio(viewport.dpr);
      gl.setSize(size.width, size.height);
      oldSize = size;
      oldDpr = viewport.dpr;
    }
  }); // Update size

  if (size) state.setSize(size.width, size.height); // Invalidate on any change

  rootState.subscribe(state => invalidate(state)); // Return root state

  return rootState;
};

function useStore() {
  const store = React__namespace.useContext(context);
  if (!store) throw `R3F hooks can only be used within the Canvas component!`;
  return store;
}
function useThree(selector = state => state, equalityFn) {
  return useStore()(selector, equalityFn);
}
function useFrame(callback, renderPriority = 0) {
  const subscribe = useStore().getState().internal.subscribe; // Update ref

  const ref = React__namespace.useRef(callback);
  React__namespace.useLayoutEffect(() => void (ref.current = callback), [callback]); // Subscribe on mount, unsubscribe on unmount

  React__namespace.useLayoutEffect(() => subscribe(ref, renderPriority), [renderPriority, subscribe]);
  return null;
}
function useGraph(object) {
  return React__namespace.useMemo(() => buildGraph(object), [object]);
}

function loadingFn(extensions, onProgress) {
  return function (Proto, ...input) {
    // Construct new loader and run extensions
    const loader = new Proto();
    if (extensions) extensions(loader); // Go through the urls and load them

    return Promise.all(input.map(input => new Promise((res, reject) => loader.load(input, data => {
      if (data.scene) Object.assign(data, buildGraph(data.scene));
      res(data);
    }, onProgress, error => reject(`Could not load ${input}: ${error.message}`)))));
  };
}

function useLoader(Proto, input, extensions, onProgress) {
  // Use suspense to load async assets
  const keys = Array.isArray(input) ? input : [input];
  const results = suspendReact.suspend(loadingFn(extensions, onProgress), [Proto, ...keys], {
    equal: is.equ
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

function createSubs(callback, subs) {
  const index = subs.length;
  subs.push(callback);
  return () => void subs.splice(index, 1);
}

let i;
let globalEffects = [];
let globalAfterEffects = [];
let globalTailEffects = [];
const addEffect = callback => createSubs(callback, globalEffects);
const addAfterEffect = callback => createSubs(callback, globalAfterEffects);
const addTail = callback => createSubs(callback, globalTailEffects);

function run(effects, timestamp) {
  for (i = 0; i < effects.length; i++) effects[i](timestamp);
}

function render$1(timestamp, state) {
  // Run local effects
  let delta = state.clock.getDelta(); // In frameloop='never' mode, clock times are updated using the provided timestamp

  if (state.frameloop === 'never' && typeof timestamp === 'number') {
    delta = timestamp - state.clock.elapsedTime;
    state.clock.oldTime = state.clock.elapsedTime;
    state.clock.elapsedTime = timestamp;
  } // Call subscribers (useFrame)


  for (i = 0; i < state.internal.subscribers.length; i++) state.internal.subscribers[i].ref.current(state, delta); // Render content


  if (!state.internal.priority && state.gl.render) state.gl.render(state.scene, state.camera); // Decrease frame count

  state.internal.frames = Math.max(0, state.internal.frames - 1);
  return state.frameloop === 'always' ? 1 : state.internal.frames;
}

function createLoop(roots) {
  let running = false;
  let repeat;

  function loop(timestamp) {
    running = true;
    repeat = 0; // Run effects

    run(globalEffects, timestamp); // Render all roots

    roots.forEach(root => {
      var _state$gl$xr;

      const state = root.store.getState(); // If the frameloop is invalidated, do not run another frame

      if (state.internal.active && (state.frameloop === 'always' || state.internal.frames > 0) && !((_state$gl$xr = state.gl.xr) != null && _state$gl$xr.isPresenting)) {
        repeat += render$1(timestamp, state);
      }
    }); // Run after-effects

    run(globalAfterEffects, timestamp); // Keep on looping if anything invalidates the frameloop

    if (repeat > 0) return requestAnimationFrame(loop); // Tail call effects, they are called when rendering stops
    else run(globalTailEffects, timestamp); // Flag end of operation

    running = false;
  }

  function invalidate(state) {
    var _state$gl$xr2;

    if (!state) return roots.forEach(root => invalidate(root.store.getState()));
    if ((_state$gl$xr2 = state.gl.xr) != null && _state$gl$xr2.isPresenting || !state.internal.active || state.frameloop === 'never') return; // Increase frames, do not go higher than 60

    state.internal.frames = Math.min(60, state.internal.frames + 1); // If the render-loop isn't active, start it

    if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
  }

  function advance(timestamp, runGlobalEffects = true, state) {
    if (runGlobalEffects) run(globalEffects, timestamp);
    if (!state) roots.forEach(root => render$1(timestamp, root.store.getState()));else render$1(timestamp, state);
    if (runGlobalEffects) run(globalAfterEffects, timestamp);
  }

  return {
    loop,
    invalidate,
    advance
  };
}

const roots = new Map();
const {
  invalidate,
  advance
} = createLoop(roots);
const {
  reconciler,
  applyProps
} = createRenderer(roots, getEventPriority);

const createRendererInstance = (gl, canvas) => {
  const customRenderer = typeof gl === 'function' ? gl(canvas) : gl;
  if (isRenderer(customRenderer)) return customRenderer;
  const renderer = new THREE__namespace.WebGLRenderer({
    powerPreference: 'high-performance',
    canvas: canvas,
    antialias: true,
    alpha: true,
    ...gl
  }); // Set color management

  renderer.outputEncoding = THREE__namespace.sRGBEncoding;
  renderer.toneMapping = THREE__namespace.ACESFilmicToneMapping; // Set gl props

  if (gl) applyProps(renderer, gl);
  return renderer;
};

function createRoot(canvas, config) {
  return {
    render: element => {
      var _store;

      let {
        gl,
        size,
        events,
        onCreated,
        ...props
      } = config || {}; // Allow size to take on container bounds initially

      if (!size) {
        var _canvas$parentElement, _canvas$parentElement2, _canvas$parentElement3, _canvas$parentElement4;

        size = {
          width: (_canvas$parentElement = (_canvas$parentElement2 = canvas.parentElement) == null ? void 0 : _canvas$parentElement2.clientWidth) != null ? _canvas$parentElement : 0,
          height: (_canvas$parentElement3 = (_canvas$parentElement4 = canvas.parentElement) == null ? void 0 : _canvas$parentElement4.clientHeight) != null ? _canvas$parentElement3 : 0
        };
      }

      let root = roots.get(canvas);
      let fiber = root == null ? void 0 : root.fiber;
      let store = root == null ? void 0 : root.store;
      let state = (_store = store) == null ? void 0 : _store.getState();

      if (fiber && state) {
        // When a root was found, see if any fundamental props must be changed or exchanged
        // Check pixelratio
        if (props.dpr !== undefined && state.viewport.dpr !== calculateDpr(props.dpr)) state.setDpr(props.dpr); // Check size

        if (state.size.width !== size.width || state.size.height !== size.height) state.setSize(size.width, size.height); // Check frameloop

        if (state.frameloop !== props.frameloop) state.setFrameloop(props.frameloop); // For some props we want to reset the entire root
        // Changes to the color-space

        const linearChanged = props.linear !== state.internal.lastProps.linear;

        if (linearChanged) {
          unmountComponentAtNode(canvas);
          fiber = undefined;
        }
      }

      if (!fiber) {
        // If no root has been found, make one
        // Create gl
        const glRenderer = createRendererInstance(gl, canvas); // Create store

        store = createStore(applyProps, invalidate, advance, {
          gl: glRenderer,
          size,
          ...props
        });
        const state = store.getState(); // Create renderer

        fiber = reconciler.createContainer(store, constants.ConcurrentRoot, false, null); // Map it

        roots.set(canvas, {
          fiber,
          store
        }); // Store events internally

        if (events) state.set({
          events: events(store)
        });
      }

      if (store && fiber) {
        reconciler.updateContainer( /*#__PURE__*/React__namespace.createElement(Provider, {
          store: store,
          element: element,
          onCreated: onCreated,
          target: canvas
        }), fiber, null, () => undefined);
        return store;
      } else {
        throw 'Error creating root!';
      }
    },
    unmount: () => unmountComponentAtNode(canvas)
  };
}

function render(element, canvas, config = {}) {
  console.warn('R3F.render is no longer supported in React 18. Use createRoot instead!');
  return createRoot(canvas, config).render(element);
}

function Provider({
  store,
  element,
  onCreated,
  target
}) {
  React__namespace.useEffect(() => {
    const state = store.getState(); // Flag the canvas active, rendering will now begin

    state.set(state => ({
      internal: { ...state.internal,
        active: true
      }
    })); // Connect events

    state.events.connect == null ? void 0 : state.events.connect(target); // Notifiy that init is completed, the scene graph exists, but nothing has yet rendered

    if (onCreated) onCreated(state); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return /*#__PURE__*/React__namespace.createElement(context.Provider, {
    value: store
  }, element);
}

function unmountComponentAtNode(canvas, callback) {
  const root = roots.get(canvas);
  const fiber = root == null ? void 0 : root.fiber;

  if (fiber) {
    const state = root == null ? void 0 : root.store.getState();
    if (state) state.internal.active = false;
    reconciler.updateContainer(null, fiber, null, () => {
      if (state) {
        setTimeout(() => {
          try {
            var _state$gl, _state$gl$renderLists, _state$gl2, _state$gl3;

            state.events.disconnect == null ? void 0 : state.events.disconnect();
            (_state$gl = state.gl) == null ? void 0 : (_state$gl$renderLists = _state$gl.renderLists) == null ? void 0 : _state$gl$renderLists.dispose == null ? void 0 : _state$gl$renderLists.dispose();
            (_state$gl2 = state.gl) == null ? void 0 : _state$gl2.forceContextLoss == null ? void 0 : _state$gl2.forceContextLoss();
            if ((_state$gl3 = state.gl) != null && _state$gl3.xr) state.internal.xr.disconnect();
            dispose(state);
            roots.delete(canvas);
            if (callback) callback(canvas);
          } catch (e) {
            /* ... */
          }
        }, 500);
      }
    });
  }
}

const act = React__namespace.unstable_act;

function createPortal(children, container) {
  return reconciler.createPortal(children, container, null, null);
}

reconciler.injectIntoDevTools({
  bundleType: process.env.NODE_ENV === 'production' ? 0 : 1,
  rendererPackageName: '@react-three/fiber',
  version: '18.0.0'
});

exports.act = act;
exports.addAfterEffect = addAfterEffect;
exports.addEffect = addEffect;
exports.addTail = addTail;
exports.advance = advance;
exports.applyProps = applyProps;
exports.buildGraph = buildGraph;
exports.context = context;
exports.createEvents = createEvents;
exports.createPortal = createPortal;
exports.createRoot = createRoot;
exports.dispose = dispose;
exports.extend = extend;
exports.invalidate = invalidate;
exports.is = is;
exports.omit = omit;
exports.pick = pick;
exports.reconciler = reconciler;
exports.render = render;
exports.roots = roots;
exports.threeTypes = threeTypes;
exports.unmountComponentAtNode = unmountComponentAtNode;
exports.useFrame = useFrame;
exports.useGraph = useGraph;
exports.useLoader = useLoader;
exports.useStore = useStore;
exports.useThree = useThree;
