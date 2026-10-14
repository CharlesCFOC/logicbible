const radians = degrees => degrees * Math.PI / 180;

const worldAtlasUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
let bordersRequest;

export function globePoint(latitude, longitude) {
  const lat = radians(latitude);
  const lon = radians(longitude);
  return {
    x: Math.cos(lat) * Math.sin(lon),
    y: Math.sin(lat),
    z: Math.cos(lat) * Math.cos(lon),
  };
}

export function rotateGlobePoint(point, yaw, pitch) {
  const horizontalX = point.x * Math.cos(yaw) + point.z * Math.sin(yaw);
  const horizontalZ = -point.x * Math.sin(yaw) + point.z * Math.cos(yaw);
  return {
    x: horizontalX,
    y: point.y * Math.cos(pitch) - horizontalZ * Math.sin(pitch),
    z: point.y * Math.sin(pitch) + horizontalZ * Math.cos(pitch),
  };
}

export function projectGlobePoint(point, yaw, pitch) {
  const rotated = rotateGlobePoint(point, yaw, pitch);
  return { ...rotated, scale: 0.92 + Math.max(-1, Math.min(1, rotated.z)) * 0.08 };
}

function decodeArc(topology, index) {
  const reversed = index < 0;
  const arc = topology.arcs[reversed ? ~index : index];
  let x = 0;
  let y = 0;
  const points = arc.map(([deltaX, deltaY]) => {
    x += deltaX;
    y += deltaY;
    return globePoint(
      topology.transform.translate[1] + y * topology.transform.scale[1],
      topology.transform.translate[0] + x * topology.transform.scale[0],
    );
  });
  return reversed ? points.reverse() : points;
}

function decodeRing(topology, arcs) {
  return arcs.flatMap((arc, index) => decodeArc(topology, arc).slice(index ? 1 : 0));
}

export function decodeCountryBorders(topology) {
  const geometries = topology?.objects?.countries?.geometries || [];
  return geometries.map(geometry => {
    const rings = geometry.type === 'Polygon' ? geometry.arcs.map(ring => decodeRing(topology, ring))
      : geometry.type === 'MultiPolygon' ? geometry.arcs.flatMap(polygon => polygon.map(ring => decodeRing(topology, ring))) : [];
    return { id: String(Number(geometry.id)), rings: rings.filter(ring => ring.length > 2) };
  }).filter(country => country.rings.length);
}

export function loadCountryBorders() {
  if (!bordersRequest) {
    bordersRequest = fetch(worldAtlasUrl)
      .then(response => response.ok ? response.json() : Promise.reject(new Error('World map unavailable')))
      .then(decodeCountryBorders)
      .catch(() => []);
  }
  return bordersRequest;
}
