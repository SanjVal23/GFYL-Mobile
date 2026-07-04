import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface SavedItem {
  id: string;
  title: string;
  type: 'verse' | 'course' | 'video' | 'meditation' | 'lesson';
  icon: string;
}

interface UserContextType {
  user: User;
  updateUser: (userData: Partial<User>) => void;
  savedItems: SavedItem[];
  removeSavedItem: (id: string) => void;
  addSavedItem: (item: SavedItem) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const defaultSavedItems: SavedItem[] = [
    { id: '1', title: 'Bhagavad Gita Chapter 2, Verse 47', type: 'verse', icon: 'book' },
    { id: '2', title: 'Leadership Module 1', type: 'course', icon: 'school' },
    { id: '3', title: 'Krishna Consciousness', type: 'video', icon: 'play-circle' },
    { id: '4', title: 'Bhagavad Gita Chapter 6, Verse 5', type: 'verse', icon: 'book' },
    { id: '5', title: 'Meditation Basics', type: 'course', icon: 'school' },
  ];

export const UserProvider = ({ children, initialUser }: { children: ReactNode; initialUser: User }) => {
  const [user, setUser] = useState<User>(initialUser);
  const [savedItems, setSavedItems] = useState<SavedItem[]>(
    initialUser.isGuest ? defaultSavedItems : []
  );

  useEffect(() => {
    const loadUserData = async () => {
      if (user.isGuest || !user.id) {
        setSavedItems(defaultSavedItems);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name,email,language,notifications,avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Failed to load profile', profileError);
      }

      if (profile) {
        const { avatar_url, ...rest } = profile;
        setUser(prev => ({ ...prev, ...rest, avatarUrl: avatar_url ?? prev.avatarUrl }));
      } else if (!profileError) {
        // No row yet for this account (e.g. an older account created before
        // profiles existed, or a session restored before signup finished
        // writing it) — create it now so this doesn't keep failing on every
        // app open, and so the row exists for saved items / community posts.
        const { error: createError } = await supabase.from('profiles').upsert({
          id: user.id,
          name: user.name,
          email: user.email,
          language: user.language ?? 'English',
          notifications: user.notifications ?? true,
          avatar_url: user.avatarUrl ?? null,
        });

        if (createError) {
          console.error('Failed to create profile', createError);
        }
      }

      const { data: items, error: itemsError } = await supabase
        .from('saved_items')
        .select('id,title,type,icon')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (itemsError) {
        console.error('Failed to load saved items', itemsError);
      }

      if (items) {
        setSavedItems(items as SavedItem[]);
      } else {
        setSavedItems([]);
      }
    };

    loadUserData();
  }, [user.id, user.isGuest]);

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => ({ ...prev, ...userData }));
    if (!user.isGuest && user.id) {
      supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: userData.name ?? user.name,
          email: userData.email ?? user.email,
          language: userData.language ?? user.language ?? 'English',
          notifications:
            userData.notifications ?? (user.notifications ?? true),
          avatar_url: userData.avatarUrl ?? user.avatarUrl,
        });
    }
  };

  const removeSavedItem = (id: string) => {
    setSavedItems(prev => prev.filter(item => item.id !== id));
    if (!user.isGuest && user.id) {
      supabase
        .from('saved_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error('Failed to remove saved item', error);
          }
        });
    }
  };

  const addSavedItem = (item: SavedItem) => {
    const storageId = !user.isGuest && user.id ? `${user.id}:${item.id}` : item.id;
    const storedItem = { ...item, id: storageId };
    setSavedItems(prev => [...prev, storedItem]);
    if (!user.isGuest && user.id) {
      supabase
        .from('saved_items')
        .insert({
          id: storageId,
          user_id: user.id,
          title: item.title,
          type: item.type,
          icon: item.icon,
        })
        .then(({ error }) => {
          if (error) {
            console.error('Failed to save item', error);
            setSavedItems(prev => prev.filter(saved => saved.id !== storageId));
          }
        });
    }
  };

  return (
    <UserContext.Provider value={{ user, updateUser, savedItems, removeSavedItem, addSavedItem }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
