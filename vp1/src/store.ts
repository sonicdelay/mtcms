import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/shallow";

export interface WaveDataPoint {
  time: number;
  sin: number;
}

export interface WaveState {
  edit: boolean;
  time: number;
  sin: number;
  cos: number;
  tan: number;
  data: WaveDataPoint[];
  toggleEdit: () => void;
  tick: () => void;
  start: () => number;
  stop: (id: number) => void;
}

export type DeepKeys<T, Prefix extends string = ""> = T extends (infer U)[]
  ? `${Prefix}${number}` | (U extends object ? DeepKeys<U, `${Prefix}${number}.`> : never)
  : T extends object
  ? {
    [K in keyof T & string]: T[K] extends object
    ? `${Prefix}${K}` | DeepKeys<T[K], `${Prefix}${K}.`>
    : `${Prefix}${K}`;
  }[keyof T & string]
  : never;

const getByPath = (obj: any, path: string): any =>
  path.split(".").reduce((acc, key) => {
    const index = Number(key);
    return acc?.[Number.isNaN(index) ? key : index];
  }, obj);

export const useStoreValue = <P extends DeepKeys<WaveState>>(path: P) =>
  useWaveStore(useShallow((state) => getByPath(state, path)));

export const useStoreValues = <P extends DeepKeys<WaveState>>(...paths: P[]) =>
  useWaveStore(
    useShallow((state) => paths.map((p) => getByPath(state, p)))
  );

export const useWaveStore = create<WaveState>()(
  devtools(
    (set) => ({
      edit: true,
      time: 0,
      sin: 0,
      cos: 1,
      tan: 0,
      data: [{ time: 0, sin: 20 }, { time: 0, sin: 9 }, { time: 0, sin: 3 }],

      toggleEdit: () => set((state) => ({ edit: !state.edit })),

      tick: () =>
        set((state) => {
          const t = state.time + 0.05;
          return {
            time: t,
            sin: Math.sin(t),
            cos: Math.cos(t),
            tan: 1 / Math.tan(t),
            data: [
              { time: t.toPrecision(2), sin: Math.sin(t).toPrecision(2) },
              { time: t.toPrecision(2), sin: Math.sin(t).toPrecision(2) },
            ]
          };
        }),

      start: () => {
        const id = window.setInterval(() => {
          useWaveStore.getState().tick();
        }, 100);
        return id;
      },

      stop: (id: number) => {
        window.clearInterval(id);
      },
    }),
    { name: "WaveStore" }
  )
);
