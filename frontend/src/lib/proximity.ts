export const getKeywordMatches = (addr1: string, addr2: string): number => {
  if (!addr1 || !addr2) return 0;
  
  const stopWords = new Set([
    'near', 'opp', 'opposite', 'road', 'street', 'lane', 'flat', 'house', 
    'apartment', 'building', 'floor', 'block', 'sector', 'area', 'beside', 
    'behind', 'at', 'in', 'of', 'and', 'the', 'to', 'for', 'with', 'by'
  ]);

  const cleanWords = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  };

  const words1 = cleanWords(addr1);
  const words2 = new Set(cleanWords(addr2));

  let matchCount = 0;
  for (const word of words1) {
    if (words2.has(word)) {
      matchCount++;
    }
  }
  return matchCount;
};

export interface DistanceInfo {
  distanceVal: number; // In meters
  display: string;     // e.g. "800 m", "1.2 km"
}

export const getDistance = (location1: string, location2: string): DistanceInfo => {
  const matches = getKeywordMatches(location1, location2);
  
  // Deterministic hash based on characters to add realistic variation
  const getHash = (str1: string, str2: string) => {
    let hash = 0;
    const combined = (str1 || '') + (str2 || '');
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };
  
  const hash = getHash(location1, location2);
  
  if (matches >= 3) {
    // Very close: 100m to 300m
    const meters = 100 + (hash % 5) * 50;
    return { distanceVal: meters, display: `${meters} m` };
  } else if (matches === 2) {
    // Close: 400m to 800m
    const meters = 400 + (hash % 5) * 100;
    return { distanceVal: meters, display: `${meters} m` };
  } else if (matches === 1) {
    // Nearby: 1.1km to 1.5km
    const km = 1.1 + (hash % 5) * 0.1;
    return { distanceVal: Math.round(km * 1000), display: `${km.toFixed(1)} km` };
  } else {
    // Further: 2.1km to 3.5km
    const km = 2.1 + (hash % 15) * 0.1;
    return { distanceVal: Math.round(km * 1000), display: `${km.toFixed(1)} km` };
  }
};
