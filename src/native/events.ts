import { UseStore } from 'zustand'
import { RootState } from '../core/store'
import { createEvents, EventManager, Events } from '../core/events'
import { GestureResponderEvent, View } from 'react-native'
// @ts-ignore
import Pressability from 'react-native/Libraries/Pressability/Pressability'

const EVENTS = {
  PRESS: 'onPress',
  PRESSIN: 'onPressIn',
  PRESSOUT: 'onPressOut',
  LONGPRESS: 'onLongPress',

  HOVERIN: 'onHoverIn',
  HOVEROUT: 'onHoverOut',
  PRESSMOVE: 'onPressMove',
} as const

const DOM_EVENTS = {
  onPress: 'onClick',
  onPressIn: 'onPointerDown',
  onPressOut: 'onPointerUp',
  onLongPress: 'onDoubleClick',

  onHoverIn: 'onPointerOver',
  onHoverOut: 'onPointerOut',
  onPressMove: 'onPointerMove',
} as const

export function createTouchEvents(store: UseStore<RootState>): EventManager<View> {
  const { handlePointer } = createEvents(store)

  const handleTouch = (event: GestureResponderEvent, name: string) => {
    event.persist()
    // console.info('handledTouch for', name)

    // Apply offset
    ;(event as any).nativeEvent.offsetX = event.nativeEvent.locationX
    ;(event as any).nativeEvent.offsetY = event.nativeEvent.locationY

    // Emulate DOM event
    // @ts-ignore
    const callback = handlePointer(DOM_EVENTS[name] ?? name)
    return callback(event.nativeEvent as any)
  }

  const handlers = {} as Events
  Object.values(EVENTS).forEach((name) => {
    // @ts-ignore
    handlers[DOM_EVENTS[name]] = (event: GestureResponderEvent) => handleTouch(event, name as keyof typeof EVENTS)
    // @ts-ignore
    handlers[name] = (event: GestureResponderEvent) => handleTouch(event, name as keyof typeof EVENTS)
  })

  return {
    connected: false,
    handlers,
    connect: () => {
      const { set, events } = store.getState()
      events.disconnect?.()

      const connected = new Pressability(events?.handlers)
      set((state) => ({ events: { ...state.events, connected } }))

      const handlers = connected.getEventHandlers()
      return handlers
    },
    disconnect: () => {
      const { set, events } = store.getState()

      if (events.connected) {
        events.connected.reset()
        set((state) => ({ events: { ...state.events, connected: false } }))
      }
    },
  }
}
