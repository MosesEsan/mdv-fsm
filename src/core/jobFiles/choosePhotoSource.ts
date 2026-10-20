import { Alert, Platform } from 'react-native';

/** One "Take or choose photos" button: asks Camera or Library (the web only has the library). */
export function choosePhotoSource(pick: (source: 'camera' | 'library') => void, title = 'Add photos'): void {
  if (Platform.OS === 'web') { pick('library'); return; }
  Alert.alert(title, undefined, [
    { text: 'Take photo', onPress: () => pick('camera') },
    { text: 'Choose from library', onPress: () => pick('library') },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
