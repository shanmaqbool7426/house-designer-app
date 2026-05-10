export interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
  imageUrl: string;
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
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
    styles: ["Modern", "Scandinavian", "Bohemian", "Industrial", "Minimalist", "Traditional", "Art Deco", "Mid-Century"],
  },
  {
    id: "floor",
    icon: "grid",
    title: "Floor Decoration",
    description: "Expert guidance on flooring materials and installation",
    color: "#E67E22",
    imageUrl: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=600&q=80",
    styles: ["Hardwood", "Laminate", "Tile", "Vinyl", "Carpet", "Bamboo", "Cork", "Concrete"],
    floors: ["Hardwood", "Laminate", "Tile", "Vinyl", "Carpet", "Bamboo"],
  },
  {
    id: "furniture",
    icon: "package",
    title: "Redecor Furniture",
    description: "Optimize furniture placement for your space",
    color: "#8E44AD",
    imageUrl: "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&q=80",
    styles: ["Open & Airy", "Cozy & Intimate", "Functional & Clean", "Luxurious & Grand", "Minimalist"],
  },
  {
    id: "cleanup",
    icon: "wind",
    title: "Clean Up Room",
    description: "Declutter and organize any space efficiently",
    color: "#27AE60",
    imageUrl: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&q=80",
    styles: ["Quick Refresh", "Deep Clean", "Minimalist", "Organized", "Zen"],
  },
  {
    id: "garden",
    icon: "feather",
    title: "Garden Designs",
    description: "Create your perfect outdoor sanctuary",
    color: "#16A085",
    imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4aaae?w=600&q=80",
    styles: ["Japanese Zen", "Cottage Garden", "Modern Minimalist", "Tropical", "Mediterranean", "Native Plants"],
  },
  {
    id: "roomdesign",
    icon: "layers",
    title: "Room Design",
    description: "Complete room makeovers with style & budget",
    color: "#2980B9",
    imageUrl: "https://images.unsplash.com/photo-1616137466211-f939a420be84?w=600&q=80",
    styles: ["Modern", "Scandinavian", "Industrial", "Bohemian", "Coastal", "Traditional"],
    rooms: ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Office", "Dining Room", "Kids Room"],
  },
  {
    id: "objects",
    icon: "refresh-cw",
    title: "Replace Objects",
    description: "Find the perfect replacement for any item",
    color: "#C0392B",
    imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80",
    styles: ["Sofa", "Dining Table", "Bed Frame", "Wardrobe", "Coffee Table", "Lighting", "Rug", "Chair"],
  },
  {
    id: "exterior",
    icon: "sun",
    title: "AI Exterior",
    description: "Transform your home's curb appeal with AI",
    color: "#D35400",
    imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
    styles: ["Modern Farmhouse", "Contemporary", "Traditional", "Mediterranean", "Colonial", "Craftsman", "Mid-Century"],
  },
];
