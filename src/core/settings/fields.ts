// Field metadata used to generate the owner's Settings screen.
// The mapped types tie metadata to the module's schema: every setting needs a field,
// and choice options can only use values the schema allows.

export type ChoiceOption<V extends string> = {
  value: V;
  label: string;
  description?: string;
};

type Common<T> = {
  label: string;
  description?: string;
  /** Hide the field when it doesn't apply (e.g. break length when breaks are off). */
  showIf?: (settings: T) => boolean;
};

export type ChoiceField<V extends string, T> = Common<T> & {
  kind: 'choice';
  options: ChoiceOption<V>[];
};

export type NumberField<T> = Common<T> & {
  kind: 'number';
  min: number;
  max: number;
  unit?: string;
  /** If set, the field can be left empty (stored as null) and shows this text when empty. */
  emptyLabel?: string;
};

export type ToggleField<T> = Common<T> & {
  kind: 'toggle';
};

/** Choice for string unions and numeric literal unions; number for numbers; toggle for booleans. */
export type FieldFor<V, T> = [V] extends [boolean]
  ? ToggleField<T>
  : [V] extends [string]
    ? ChoiceField<V, T>
    : [V] extends [number | null]
      ? number extends V
        ? NumberField<T>
        : ChoiceField<`${Exclude<V, null>}`, T> | NumberField<T>
      : never;

export type SettingsFields<T> = { [K in keyof T]: FieldFor<T[K], T> };

export type AnySettingField = {
  kind: 'choice' | 'number' | 'toggle';
  label: string;
  description?: string;
  showIf?: (settings: never) => boolean;
  options?: ChoiceOption<string>[];
  min?: number;
  max?: number;
  unit?: string;
  emptyLabel?: string;
};
