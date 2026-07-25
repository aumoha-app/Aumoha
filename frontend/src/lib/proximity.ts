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

export const getCoordinatesForLocation = (location: string, baseCoords?: [number, number]): [number, number] => {
  const clean = (location || '').toLowerCase();

  // Check if the string contains coordinate patterns like "[28.4595, 77.0266]" or "Current Coordinates: 28.4595, 77.0266"
  const coordRegex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
  const match = coordRegex.exec(location || '');
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
  }

  // Bhubaneswar, Odisha landmarks (correct coordinates)
  if (clean.includes('saheed nagar')) return [20.2882, 85.8440];
  if (clean.includes('vss nagar')) return [20.3012, 85.8491];
  if (clean.includes('acharya vihar')) return [20.2937, 85.8340];
  if (clean.includes('jaydev vihar')) return [20.2974, 85.8229];
  if (clean.includes('master canteen')) return [20.2642, 85.8400];

  // City-level fallbacks
  if (clean.includes('bhubaneswar') || clean.includes('bhubaneshwar') || clean.includes('odisha')) {
    const bhubBase: [number, number] = [20.2882, 85.8440];
    let hash = 0;
    for (let i = 0; i < clean.length; i++) {
      hash = clean.charCodeAt(i) + ((hash << 5) - hash);
    }
    const latOffset = ((hash % 100) / 5000);
    const lngOffset = (((hash >> 4) % 100) / 5000);
    return [bhubBase[0] + latOffset, bhubBase[1] + lngOffset];
  }

  if (clean.includes('rourkela')) {
    const rourBase: [number, number] = [22.2519, 84.8826];
    let hash = 0;
    for (let i = 0; i < clean.length; i++) {
      hash = clean.charCodeAt(i) + ((hash << 5) - hash);
    }
    const latOffset = ((hash % 100) / 5000);
    const lngOffset = (((hash >> 4) % 100) / 5000);
    return [rourBase[0] + latOffset, rourBase[1] + lngOffset];
  }

  // Gurugram, Haryana landmarks
  if (clean.includes('sector 45')) return [28.4595, 77.0266];
  if (clean.includes('sector 4,')) return [28.4575, 77.0246];
  if (clean.includes('downtown')) return [28.4625, 77.0306];
  if (clean.includes('market')) return [28.4715, 77.0356];

  // Default to dynamic offset based on location string hash
  const actualBase = baseCoords || [28.4595, 77.0266];
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = ((hash % 100) / 5000);
  const lngOffset = (((hash >> 4) % 100) / 5000);
  return [actualBase[0] + latOffset, actualBase[1] + lngOffset];
};

const haversineDistance = (coords1: [number, number], coords2: [number, number]): number => {
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const getDistanceBetweenCoordinates = (coords1: [number, number], coords2: [number, number]): DistanceInfo => {
  const distanceInMeters = haversineDistance(coords1, coords2);
  
  if (distanceInMeters < 1000) {
    const meters = Math.max(10, Math.round(distanceInMeters / 10) * 10); // round to nearest 10m
    return { distanceVal: meters, display: `${meters} m` };
  } else {
    const km = distanceInMeters / 1000;
    return { distanceVal: Math.round(distanceInMeters), display: `${km.toFixed(1)} km` };
  }
};

export const getDistance = (location1: string, location2: string): DistanceInfo => {
  const coords1 = getCoordinatesForLocation(location1);
  const coords2 = getCoordinatesForLocation(location2);
  return getDistanceBetweenCoordinates(coords1, coords2);
};

