import * as THREE from 'three';
import { UseStore } from 'zustand';
import Reconciler from 'react-reconciler';
import { prepare, applyProps } from './utils';
import { RootState } from './store';
import { EventHandlers } from './events';
export declare type Root = {
    fiber: Reconciler.FiberRoot;
    store: UseStore<RootState>;
};
export declare type LocalState = {
    root: UseStore<RootState>;
    objects: Instance[];
    parent: Instance | null;
    primitive?: boolean;
    eventCount: number;
    handlers: Partial<EventHandlers>;
    attach?: AttachType;
    previousAttach?: any;
    memoizedProps: {
        [key: string]: any;
    };
};
export declare type AttachFnType = (parent: Instance, self: Instance) => void;
export declare type AttachType = string | [attach: string | AttachFnType, detach: string | AttachFnType];
export declare type BaseInstance = Omit<THREE.Object3D, 'children' | 'attach' | 'add' | 'remove' | 'raycast'> & {
    __r3f: LocalState;
    children: Instance[];
    remove: (...object: Instance[]) => Instance;
    add: (...object: Instance[]) => Instance;
    raycast?: (raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) => void;
};
export declare type Instance = BaseInstance & {
    [key: string]: any;
};
export declare type InstanceProps = {
    [key: string]: unknown;
} & {
    args?: any[];
    object?: object;
    visible?: boolean;
    dispose?: null;
    attach?: AttachType;
};
declare let extend: (objects: object) => void;
declare function createRenderer<TCanvas>(roots: Map<TCanvas, Root>, getEventPriority?: () => any): {
    reconciler: Reconciler.Reconciler<unknown, unknown, unknown, unknown, unknown>;
    applyProps: typeof applyProps;
};
export { prepare, createRenderer, extend };
