export const isValidFileName = (name: string): boolean => {
  if (!name || name.trim() === '') return false;
  
  // Basic reserved characters in typical filesystems (Windows/Unix hybrid restrictions for safety)
  const reservedChars = /[\\/:\*\?"<>\|]/;
  if (reservedChars.test(name)) return false;

  // Don't allow strictly '.' or '..'
  if (name === '.' || name === '..') return false;

  // Max length
  if (name.length > 255) return false;

  return true;
};

export const getUniqueName = (
  desiredName: string, 
  existingNames: string[],
  isDirectory: boolean = false
): string => {
  if (!existingNames.includes(desiredName)) return desiredName;

  let counter = 1;
  let baseName = desiredName;
  let ext = '';

  if (!isDirectory) {
    const lastDotIndex = desiredName.lastIndexOf('.');
    if (lastDotIndex > 0) {
      baseName = desiredName.substring(0, lastDotIndex);
      ext = desiredName.substring(lastDotIndex);
    }
  }

  let newName = '';
  do {
    newName = `${baseName} (${counter})${ext}`;
    counter++;
  } while (existingNames.includes(newName));

  return newName;
};
