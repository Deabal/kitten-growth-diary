export interface Cat {
  id: string;
  name: string;
  avatar: string | null;
  birthday: string;
  characteristics: string;
}

export interface Behavior {
  id: string;
  cat_id: string;
  date: string;
  type: 'weight' | 'photo' | 'audio' | 'video';
  value: string;
  notes: string;
}

export interface Care {
  id: string;
  cat_id: string;
  date: string;
  type: string;
  notes: string;
}

export interface Abnormality {
  id: string;
  cat_id: string;
  date: string;
  type: string;
  severity: number;
  notes: string;
  photos?: string[];
}
