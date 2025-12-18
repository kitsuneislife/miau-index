import { DataSource } from '../types/common';

/**
 * Character model
 */
export interface Character {
  id: string;
  name: {
    full?: string;
    native?: string;
    alternative?: string[];
  };
  description?: string;
  image?: string;
  role?: CharacterRole;
  voiceActors?: VoiceActor[];
  externalIds: Array<{ source: DataSource; id: string }>;
  createdAt: Date;
  updatedAt: Date;
}

export enum CharacterRole {
  MAIN = 'MAIN',
  SUPPORTING = 'SUPPORTING',
  BACKGROUND = 'BACKGROUND',
}

/**
 * Voice Actor model
 */
export interface VoiceActor {
  id: string;
  name: {
    full?: string;
    native?: string;
  };
  language?: string;
  image?: string;
  externalIds: Array<{ source: DataSource; id: string }>;
}

/**
 * Staff member model
 */
export interface StaffMember {
  id: string;
  name: {
    full?: string;
    native?: string;
  };
  role?: string;
  image?: string;
  externalIds: Array<{ source: DataSource; id: string }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Studio model
 */
export interface Studio {
  id: string;
  name: string;
  favorites?: number;
  externalIds: Array<{ source: DataSource; id: string }>;
  createdAt: Date;
  updatedAt: Date;
}
