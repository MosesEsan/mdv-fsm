// Taking or choosing photos on the device and shrinking them before upload.
// Needs: npx expo install expo-image-picker expo-image-manipulator
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { PHOTO_MAX_SIDE, PHOTO_QUALITY, THUMB_MAX_SIDE, fitWithin } from './paths';

export type PreparedPhoto = { uri: string; thumbUri: string; width: number; height: number };

async function shrink(uri: string, width: number, height: number, maxSide: number) {
  const ctx = ImageManipulator.manipulate(uri);
  const target = fitWithin(width, height, maxSide);
  if (target) ctx.resize(target);
  const image = await ctx.renderAsync();
  return image.saveAsync({ compress: PHOTO_QUALITY, format: SaveFormat.JPEG });
}

async function prepare(assets: ImagePicker.ImagePickerAsset[]): Promise<PreparedPhoto[]> {
  const out: PreparedPhoto[] = [];
  for (const a of assets) {
    const main = await shrink(a.uri, a.width, a.height, PHOTO_MAX_SIDE);
    const thumb = await shrink(main.uri, main.width, main.height, THUMB_MAX_SIDE);
    out.push({ uri: main.uri, thumbUri: thumb.uri, width: main.width, height: main.height });
  }
  return out;
}

/** Opens the camera (or the photo library) and returns shrunk copies ready to upload. */
export async function takePhotos(source: 'camera' | 'library'): Promise<PreparedPhoto[]> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error('Allow camera access in your phone settings to take photos.');
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
    return r.canceled ? [] : prepare(r.assets);
  }
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 10, quality: 1 });
  return r.canceled ? [] : prepare(r.assets);
}
