import { UseStore } from 'zustand';
import { RootState } from '../core/store';
import { EventManager } from '../core/events';
export declare function createPointerEvents(store: UseStore<RootState>): EventManager<HTMLElement>;
