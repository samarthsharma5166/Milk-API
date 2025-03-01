import jwt from 'jsonwebtoken'
export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface dataProps {
  id: string;
  name: string;
  email: string;
}

export function generateToken(data:dataProps){
  return jwt.sign(data,process.env.JWT_SECRET as string)
}


// utils/distance.js
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const toRad = (value: number): number => (value * Math.PI) / 180;
  const earthRadius = 6371; // Radius of Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c; // Distance in km
};

