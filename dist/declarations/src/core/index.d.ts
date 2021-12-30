/// <reference types="react-reconciler" />
import * as THREE from 'three';
import * as React from 'react';
import { UseStore } from 'zustand';
import { dispose } from '../core/utils';
import { Renderer, StoreProps, context, RootState, Size } from '../core/store';
import { extend, Root } from '../core/renderer';
import { addEffect, addAfterEffect, addTail } from '../core/loop';
import { EventManager } from './events';
declare const roots: Map<Element, Root>;
declare const invalidate: (state?: RootState | undefined) => void, advance: (timestamp: number, runGlobalEffects?: boolean, state?: RootState | undefined) => void;
declare const reconciler: import("react-reconciler").Reconciler<unknown, unknown, unknown, unknown, unknown>, applyProps: typeof import("../core/utils").applyProps;
declare type Properties<T> = Pick<T, {
    [K in keyof T]: T[K] extends (_: any) => any ? never : K;
}[keyof T]>;
declare type GLProps = Renderer | ((canvas: HTMLCanvasElement) => Renderer) | Partial<Properties<THREE.WebGLRenderer> | THREE.WebGLRendererParameters> | undefined;
export declare type RenderProps<TCanvas extends Element> = Omit<StoreProps, 'gl' | 'events' | 'size'> & {
    gl?: GLProps;
    events?: (store: UseStore<RootState>) => EventManager<TCanvas>;
    size?: Size;
    onCreated?: (state: RootState) => void;
};
declare function createRoot<TCanvas extends Element>(canvas: TCanvas, config?: RenderProps<TCanvas>): {
    render: (element: React.ReactNode) => UseStore<RootState, import("zustand").StoreApi<RootState>>;
    unmount: () => void;
};
declare function render<TCanvas extends Element>(element: React.ReactNode, canvas: TCanvas, config?: RenderProps<TCanvas>): UseStore<RootState>;
declare function unmountComponentAtNode<TElement extends Element>(canvas: TElement, callback?: (canvas: TElement) => void): void;
declare const act: any;
declare function createPortal(children: React.ReactNode, container: THREE.Object3D): React.ReactNode;
export { context, render, createRoot, unmountComponentAtNode, createPortal, reconciler, applyProps, dispose, invalidate, advance, extend, addEffect, addAfterEffect, addTail, act, roots as _roots, };
