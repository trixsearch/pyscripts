export const loadAsset = (asset) => {
    try {
      if (asset.includes('static')) return asset;
      return require(`./${asset}`);
    } catch (error) {
      return asset;
    }
  };