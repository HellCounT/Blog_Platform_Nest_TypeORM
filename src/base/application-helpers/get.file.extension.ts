export function getFileExtension(filename) {
  return filename.substring(filename.lastIndexOf('.') + 1, filename.length);
}
