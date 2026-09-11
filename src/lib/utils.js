import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}




// export interface Star {
//   position: string;
//   size: string;
//   blur: string;
//   color: string;
// }

export const createStars = (count, color) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const vw = Math.random() * 100 - 50; // -50vw ile 50vw arasında
    const vh = Math.random() * 100 - 50; // -50vh ile 50vh arasında
    const size = Math.random() * 2; // 0px ile 2px arasında
    const blur = Math.random() * 2; // 0px ile 2px arasında
    stars.push({
      position: `${vw}vw ${vh}vh`,
      size: `${size}px`,
      blur: `${blur}px`,
      color,
    });
  }
  return stars;
};