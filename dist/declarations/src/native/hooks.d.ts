import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { ObjectMap } from '../core/utils';
import { Extensions, LoaderResult, BranchingReturn, useStore, useThree, useFrame, useGraph } from '../core/hooks';
declare function useLoader<T, U extends string | string[]>(Proto: new () => LoaderResult<T>, input: U, extensions?: Extensions, onProgress?: (event: ProgressEvent<EventTarget>) => void): U extends any[] ? BranchingReturn<T, GLTF, GLTF & ObjectMap>[] : BranchingReturn<T, GLTF, GLTF & ObjectMap>;
declare namespace useLoader {
    var preload: <T, U extends string | string[]>(Proto: new () => LoaderResult<T>, input: U, extensions?: Extensions | undefined) => undefined;
    var clear: <T, U extends string | string[]>(Proto: new () => LoaderResult<T>, input: U) => void;
}
export { useStore, useThree, useFrame, useGraph, useLoader };
