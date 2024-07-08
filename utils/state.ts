export const checkIfNodeIn = (nodeType: string, path: string[] | Object[]): boolean => {
  for (const index in path) {
    const element: number | Object = path[index];

    if (typeof element !== 'object') {
      continue;
    }

    if (element.type?.name === nodeType) {
      return true;
    }
  }

  return false;
};
