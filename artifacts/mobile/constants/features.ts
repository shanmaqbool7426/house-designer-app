export interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
  styles: string[];
  rooms?: string[];
  floors?: string[];
}

export const FEATURES: Feature[] = [
  {
    id: "home",
    icon: "home",
    title: "AI Home Design",
    description: "Redesign any room with AI-powered style recommendations",
    color: "#FF4C1E",
    styles: ["Modern", "Scandinavian", "Bohemian", "Industrial", "Minimalist", "Traditional", "Art Deco", "Mid-Century"],
  },
  {
    id: "floor",
    icon: "grid",
    title: "Floor Decoration",
    description: "Expert guidance on flooring materials and installation",
    color: "#E67E22",
    styles: ["Hardwood", "Laminate", "Tile", "Vinyl", "Carpet", "Bamboo", "Cork", "Concrete"],
    floors: ["Hardwood", "Laminate", "Tile", "Vinyl", "Carpet", "Bamboo"],
  },
  {
    id: "furniture",
    icon: "package",
    title: "Redecor Furniture",
    description: "Optimize furniture placement for your space",
    color: "#8E44AD",
    styles: ["Open & Airy", "Cozy & Intimate", "Functional & Clean", "Luxurious & Grand", "Minimalist"],
  },
  {
    id: "cleanup",
    icon: "wind",
    title: "Clean Up Room",
    description: "Declutter and organize any space efficiently",
    color: "#27AE60",
    styles: ["Quick Refresh", "Deep Clean", "Minimalist", "Organized", "Zen"],
  },
  {
    id: "garden",
    icon: "feather",
    title: "Garden Designs",
    description: "Create your perfect outdoor sanctuary",
    color: "#16A085",
    styles: ["Japanese Zen", "Cottage Garden", "Modern Minimalist", "Tropical", "Mediterranean", "Native Plants"],
  },
  {
    id: "roomdesign",
    icon: "layers",
    title: "Room Design",
    description: "Complete room makeovers with style & budget",
    color: "#2980B9",
    styles: ["Modern", "Scandinavian", "Industrial", "Bohemian", "Coastal", "Traditional"],
    rooms: ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Office", "Dining Room", "Kids Room"],
  },
  {
    id: "objects",
    icon: "refresh-cw",
    title: "Replace Objects",
    description: "Find the perfect replacement for any item",
    color: "#C0392B",
    styles: ["Sofa", "Dining Table", "Bed Frame", "Wardrobe", "Coffee Table", "Lighting", "Rug", "Chair"],
  },
  {
    id: "exterior",
    icon: "sun",
    title: "AI Exterior",
    description: "Transform your home's curb appeal with AI",
    color: "#D35400",
    styles: ["Modern Farmhouse", "Contemporary", "Traditional", "Mediterranean", "Colonial", "Craftsman", "Mid-Century"],
  },
];
