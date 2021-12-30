import { UseStore } from 'zustand';
import { RootState } from '../core/store';
import { EventManager } from '../core/events';
import { View } from 'react-native';
export declare function createTouchEvents(store: UseStore<RootState>): EventManager<View>;
