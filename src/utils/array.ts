export function sortByLengthAndLexicographically(arr: string[]) {
  return arr.sort((a, b) => {
    if (a.length !== b.length) {
      return b.length - a.length;
    } else {
      return a.localeCompare(b);
    }
  });
}

export function getArrayMap<T extends object>(arr: T[], key: keyof T) {
  const map = new Map<any, T>();

  for (const obj of arr) {
    map.set(obj[key], obj);
  }

  return map;
}

export function mergeArrayByKey<T extends object>(
  arr1: T[],
  arr2: T[],
  key: keyof T,
  replace?: boolean,
) {
  const map = new Map<any, T>();

  for (const obj of arr1) {
    map.set(obj[key], obj);
  }

  for (const obj of arr2) {
    if (map.has(obj[key])) {
      if (replace) {
        map.set(obj[key], obj);
      }
    } else {
      map.set(obj[key], obj);
    }
  }

  return Array.from(map.values());
}

