export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  avatar: string;
  background: string;
  star_coins?: number;
  is_guest?: boolean;
  solo_pet?: {
    name: string;
    fullness: number;
    love: number;
    coins: number;
    furniture: any[];
    fridge: Record<string, number>;
    custom_skin: string;
  };
}

export interface PhotoPost {
  id: string;
  title: string;
  image_url: string;
  year: string;
  category: string;
  user_id: string;
  username: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface VideoPost {
  id: string;
  title: string;
  video_url: string;
  category: string;
  user_id: string;
  username: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface LetterPost {
  id: string;
  author_name: string;
  content: string;
  is_anonymous: boolean;
  color_theme: string; // 'pink' | 'indigo' | 'violet' | 'amber' | 'emerald'
  user_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface ArtworkPost {
  id: string;
  title: string;
  image_url: string;
  external_link?: string;
  description: string;
  user_id: string;
  username: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface MusicPost {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url: string;
  duration: string;
  user_id: string;
  username: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface Pet {
  id: string;
  name: string;
  owner_id: string;
  owner_name: string;
  xp: number;
  level: number;
  type: string; // 'Star Bunny' | 'Nebula Cat' | 'Cosmic Fox' | 'Stardust Bear'
  color: string;
  custom_appearance: {
    accessory: string;
    vibe: string;
  };
  home_json: {
    decor: string;
    bed: string;
  };
  created_at: string;
}

export interface AdminPending {
  photos: PhotoPost[];
  videos: VideoPost[];
  letters: LetterPost[];
  artworks: ArtworkPost[];
  music: MusicPost[];
}

export interface AdminAllData {
  photos: PhotoPost[];
  videos: VideoPost[];
  letters: LetterPost[];
  artworks: ArtworkPost[];
  music: MusicPost[];
  users: Omit<User, "password">[];
  pets: Pet[];
}
