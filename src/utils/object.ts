import { pick, get, set } from 'lodash';

export function mapObject<T extends object>(
  obj: T,
  mapping: Record<string, string>,
) {
  const result = {};

  for (const [key, source] of Object.entries(mapping)) {
    set(result, key, get(obj, source));
  }

  return result;
}

export const assignExistingKey = <T extends object, P extends object>(
  target: T,
  source: P,
) => {
  Object.assign(target, pick(source, Object.keys(target)));
};
