import * as React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { UseStore } from 'zustand';
import { RenderProps } from '../core';
import { RootState } from '../core/store';
import { EventManager } from '../core/events';
export interface Props extends Omit<RenderProps<HTMLCanvasElement>, 'size' | 'events'>, ViewProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    style?: ViewStyle;
    events?: (store: UseStore<RootState>) => EventManager<any>;
}
export declare const Canvas: React.ForwardRefExoticComponent<Props & React.RefAttributes<View>>;
