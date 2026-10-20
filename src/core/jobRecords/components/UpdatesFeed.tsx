import { useState } from 'react';
import { Text, View } from 'react-native';
import type { JobFile } from '@/core/jobFiles';
import { Button, Card, ErrorText, Heading, Loading, Muted, TextField, colors, styles } from '@/core/ui';
import type { JobUpdate } from '../api';
import { firstName, whenLabel } from '../rules';
import { PhotoStrip } from './PhotoStrip';

type Props = {
  updates: JobUpdate[] | undefined; isLoading: boolean; error: unknown;
  files: JobFile[] | undefined; tz: string; today: string;
  createdLine: string;
  /** Who may edit or delete which update (the database checks again). */
  canChange: (u: JobUpdate) => boolean;
  onEdit: (id: string, body: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
};

/** The job's updates, newest first: who, when, what, and the photos posted with it. */
export function UpdatesFeed({ updates, isLoading, error, files, tz, today, createdLine, canChange, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null);
  const [failed, setFailed] = useState<unknown>(null);
  const list = updates ?? [];

  return (
    <Card>
      <Heading>{`Updates · ${list.length}`}</Heading>
      {isLoading ? <Loading /> : null}
      <ErrorText error={error ?? failed} />
      {!isLoading && list.length === 0 ? <Muted>No updates yet. Post the first one when work starts.</Muted> : null}
      {list.map((u) => {
        const photos = (files ?? []).filter((f) => f.updateId === u.id && f.thumbUrl);
        return (
          <View key={u.id} style={{ gap: 6, paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
            <Text style={styles.muted}>
              <Text style={{ fontWeight: '700', color: colors.text }}>{firstName(u.authorName)}</Text>
              {` · ${whenLabel(u.createdAt, tz, today)}${u.editedAt ? ' · edited' : ''}`}
            </Text>
            {editing?.id === u.id ? (
              <View style={{ gap: 8 }}>
                <TextField label="Update" value={editing.body} onChange={(body) => setEditing({ id: u.id, body })} multiline />
                <View style={styles.row}>
                  <View style={{ flex: 1 }}><Button title="Save" onPress={() => { setFailed(null); onEdit(u.id, editing.body).then(() => setEditing(null), setFailed); }} /></View>
                  <View style={{ flex: 1 }}><Button title="Cancel" variant="secondary" onPress={() => setEditing(null)} /></View>
                </View>
              </View>
            ) : u.body ? <Text style={{ fontSize: 15, color: colors.text }}>{u.body}</Text> : null}
            {photos.length ? <PhotoStrip size={72} photos={photos.map((p) => ({ id: p.id, thumbUrl: p.thumbUrl, url: p.url }))} /> : null}
            {canChange(u) && editing?.id !== u.id ? (
              <View style={styles.row}>
                <Button title="Edit" variant="secondary" onPress={() => setEditing({ id: u.id, body: u.body ?? '' })} />
                <Button title="Delete" variant="secondary" onPress={() => { setFailed(null); onDelete(u.id).catch(setFailed); }} />
              </View>
            ) : null}
          </View>
        );
      })}
      <View style={{ paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
        <Muted>{createdLine}</Muted>
      </View>
    </Card>
  );
}
