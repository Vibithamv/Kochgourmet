import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export interface FolderThumb {
  uri: string;
  recipeId: string;
}

export interface Folder {
  id: string;
  title: string;
  count: number;
  thumbnails: FolderThumb[];
}

const INITIAL_FOLDERS: Folder[] = [
  {
    id: 'sommer-cocktails',
    title: 'Sommer Cocktails',
    count: 28,
    thumbnails: [
      { uri: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400', recipeId: 'cocktail-aperol' },
      { uri: 'https://images.unsplash.com/photo-1587223962930-cb7f31384c19?w=400', recipeId: 'cocktail-hugo' },
      { uri: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', recipeId: 'cocktail-mojito' },
      { uri: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', recipeId: 'cocktail-eistee' },
      { uri: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400', recipeId: 'cocktail-glitzer' },
      { uri: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400', recipeId: 'cocktail-corona' },
    ],
  },
  {
    id: 'dessert',
    title: 'Dessert',
    count: 12,
    thumbnails: [
      { uri: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400', recipeId: '4' },
      { uri: 'https://images.unsplash.com/photo-1481070414801-51fd732d7184?w=400', recipeId: '5' },
      { uri: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400', recipeId: 'dessert-tiramisu' },
      { uri: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400', recipeId: 'dessert-eis' },
      { uri: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400', recipeId: 'dessert-mousse' },
      { uri: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400', recipeId: 'dessert-pannacotta' },
    ],
  },
  {
    id: 'meal-prep',
    title: 'Meal Prep für die Woche',
    count: 18,
    thumbnails: [
      { uri: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400', recipeId: '8' },
      { uri: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400', recipeId: 'prep-bowl' },
      { uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400', recipeId: 'prep-pasta' },
      { uri: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400', recipeId: 'prep-curry' },
      { uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', recipeId: 'prep-bowl' },
      { uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', recipeId: 'prep-curry' },
    ],
  },
  {
    id: 'vegan',
    title: 'Vegane Klassiker',
    count: 24,
    thumbnails: [
      { uri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400', recipeId: 'vegan-buddha' },
      { uri: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400', recipeId: 'vegan-bolo' },
      { uri: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=400', recipeId: 'vegan-buddha' },
      { uri: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400', recipeId: '2' },
      { uri: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', recipeId: 'vegan-curry' },
      { uri: 'https://images.unsplash.com/photo-1494859802809-d069c3b71a8a?w=400', recipeId: 'vegan-bolo' },
    ],
  },
  {
    id: 'brunch',
    title: 'Sonntagsbrunch',
    count: 9,
    thumbnails: [
      { uri: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400', recipeId: 'brunch-avo' },
      { uri: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400', recipeId: 'brunch-pancakes' },
      { uri: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400', recipeId: 'brunch-eggs' },
      { uri: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400', recipeId: 'brunch-avo' },
      { uri: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400', recipeId: 'brunch-pancakes' },
      { uri: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?w=400', recipeId: 'brunch-eggs' },
    ],
  },
  {
    id: 'grillen',
    title: 'Grillsaison',
    count: 16,
    thumbnails: [
      { uri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', recipeId: 'grill-veggie' },
      { uri: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400', recipeId: 'grill-steak' },
      { uri: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400', recipeId: 'grill-ribs' },
      { uri: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400', recipeId: 'grill-chicken' },
    ],
  },
  {
    id: 'kuchen',
    title: 'Kuchen & Torten',
    count: 21,
    thumbnails: [
      { uri: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400', recipeId: 'cake-schoko' },
      { uri: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400', recipeId: 'cake-schoko' },
      { uri: 'https://images.unsplash.com/photo-1464195244916-405fa0a82545?w=400', recipeId: 'cake-erdbeer' },
      { uri: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=400', recipeId: 'cake-apfel' },
      { uri: 'https://images.unsplash.com/photo-1542124948-dc391252a940?w=400', recipeId: 'cake-erdbeer' },
      { uri: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400', recipeId: 'cake-apfel' },
    ],
  },
  {
    id: 'asiatisch',
    title: 'Asiatische Küche',
    count: 14,
    thumbnails: [
      { uri: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', recipeId: 'asia-sushi' },
      { uri: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400', recipeId: 'asia-pad' },
      { uri: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400', recipeId: 'asia-ramen' },
      { uri: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400', recipeId: 'asia-curry' },
      { uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', recipeId: 'asia-pad' },
      { uri: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400', recipeId: 'asia-sushi' },
    ],
  },
];

interface FoldersContextType {
  folders: Folder[];
  getFolder: (id: string) => Folder | undefined;
  renameFolder: (id: string, title: string) => void;
  removeRecipeFromFolder: (folderId: string, recipeId: string, thumbUri: string) => void;
}

const FoldersContext = createContext<FoldersContextType | undefined>(undefined);

type FoldersProviderProps = Readonly<{ children: React.ReactNode }>;

export function FoldersProvider({ children }: FoldersProviderProps) {
  const [folders, setFolders] = useState<Folder[]>(INITIAL_FOLDERS);

  const getFolder = useCallback(
    (id: string) => folders.find(f => f.id === id),
    [folders]
  );

  const renameFolder = useCallback((id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setFolders(prev => prev.map(f => f.id === id ? { ...f, title: trimmed } : f));
  }, []);

  const removeRecipeFromFolder = useCallback((folderId: string, recipeId: string, thumbUri: string) => {
    setFolders(prev => prev.map(f => {
      if (f.id !== folderId) return f;
      const thumbnails = f.thumbnails.filter(t => !(t.recipeId === recipeId && t.uri === thumbUri));
      return { ...f, thumbnails, count: Math.max(0, f.count - 1) };
    }));
  }, []);

  const value = useMemo(
    () => ({ folders, getFolder, renameFolder, removeRecipeFromFolder }),
    [folders, getFolder, renameFolder, removeRecipeFromFolder]
  );

  return (
    <FoldersContext.Provider value={value}>
      {children}
    </FoldersContext.Provider>
  );
}

export function useFolders() {
  const ctx = useContext(FoldersContext);
  if (!ctx) throw new Error('useFolders must be used within FoldersProvider');
  return ctx;
}
