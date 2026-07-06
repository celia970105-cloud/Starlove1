export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  avatar: string;
  background: string;
  star_coins?: number;
  is_guest?: boolean;
  bio?: string;
  created_at?: string;
  solo_pet?: {
    name: string;
    fullness: number;
    love: number;
    coins: number;
    furniture: any[];
    fridge: Record<string, number>;
    custom_skin: string;
    level?: number;
    exp?: number;
    pets?: any[];
    currentHomeId?: string;
    focusedPetId?: string;
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
  likes_count?: number;
  favorites_count?: number;
  comments_count?: number;
  liked_by_me?: boolean;
  favorited_by_me?: boolean;
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
  likes_count?: number;
  favorites_count?: number;
  comments_count?: number;
  liked_by_me?: boolean;
  favorited_by_me?: boolean;
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
  likes_count?: number;
  favorites_count?: number;
  comments_count?: number;
  liked_by_me?: boolean;
  favorited_by_me?: boolean;
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
  likes_count?: number;
  favorites_count?: number;
  comments_count?: number;
  liked_by_me?: boolean;
  favorited_by_me?: boolean;
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
  likes_count?: number;
  favorites_count?: number;
  comments_count?: number;
  liked_by_me?: boolean;
  favorited_by_me?: boolean;
}

export interface CandyPost {
  id: string;
  title: string;       // Candy Name (糖果名稱)
  content: string;     // Sugar Point Analysis (糖點分析內容)
  is_anonymous: boolean;
  user_id: string;
  username: string;    // Submitter
  status: "pending" | "approved" | "rejected";
  created_at: string;
  likes_count?: number;
  favorites_count?: number;
  comments_count?: number;
  liked_by_me?: boolean;
  favorited_by_me?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  avatar: string;
  content: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar?: string;
  type: "like" | "favorite" | "comment" | "announcement";
  post_id?: string;
  post_title?: string;
  post_type?: string;
  content?: string;
  is_read: boolean;
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
  candies: CandyPost[];
}

export interface AdminAllData {
  photos: PhotoPost[];
  videos: VideoPost[];
  letters: LetterPost[];
  artworks: ArtworkPost[];
  music: MusicPost[];
  candies: CandyPost[];
  users: Omit<User, "password">[];
  pets: Pet[];
}
