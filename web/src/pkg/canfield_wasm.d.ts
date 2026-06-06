/* tslint:disable */
/* eslint-disable */

export function auto_move_to_foundation(state_json: string, source_zone: string): string | undefined;

export function check_win(state_json: string): boolean;

export function draw_from_stock(state_json: string): string | undefined;

export function first_face_up_index_in_col(state_json: string, col: number): number;

export function move_tableau_to_tableau(state_json: string, from_col: number, from_index: number, to_col: number): string | undefined;

export function move_to_foundation(state_json: string, source_zone: string, foundation_index: number): string | undefined;

export function move_to_tableau(state_json: string, source_zone: string, to_col: number): string | undefined;

export function new_game(draw_count: number): string;

export function redeal_stock(state_json: string): string | undefined;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly auto_move_to_foundation: (a: number, b: number, c: number, d: number) => [number, number];
    readonly check_win: (a: number, b: number) => number;
    readonly draw_from_stock: (a: number, b: number) => [number, number];
    readonly first_face_up_index_in_col: (a: number, b: number, c: number) => number;
    readonly move_tableau_to_tableau: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly move_to_foundation: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly move_to_tableau: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly new_game: (a: number) => [number, number];
    readonly redeal_stock: (a: number, b: number) => [number, number];
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
