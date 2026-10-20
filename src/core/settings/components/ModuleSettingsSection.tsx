import { Card, Heading, Muted } from '@/core/ui';
import type { AnySettingField } from '../fields';
import type { ModuleSettingsDefinition } from '../registry';
import { SettingField } from './SettingField';

type Props = {
  definition: ModuleSettingsDefinition<string, any>;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  readOnly: boolean;
};

/** Renders every field the module declared, in declaration order, hiding ones that don't apply. */
export function ModuleSettingsSection({ definition, values, onChange, readOnly }: Props) {
  const fields = Object.entries(definition.fields) as [string, AnySettingField][];
  return (
    <Card>
      <Heading>{definition.title}</Heading>
      {definition.description ? <Muted>{definition.description}</Muted> : null}
      {fields
        .filter(([, field]) => !field.showIf || (field.showIf as (s: unknown) => boolean)(values))
        .map(([key, field]) => (
          <SettingField
            key={key}
            field={field}
            value={values[key]}
            readOnly={readOnly}
            onChange={(value) => onChange(key, value)}
          />
        ))}
    </Card>
  );
}
