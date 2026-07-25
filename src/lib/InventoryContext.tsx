"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type InventoryItem = {
  componentId: string;
  quantity: number;
};

export type AIProject = {
  id?: string;
  title: string;
  description: string;
  difficultyLevel?: string;
  estimatedTime?: string;
  requirements?: any[];
  steps?: string[];
} | null;

type InventoryContextType = {
  inventory: InventoryItem[];
  addToInventory: (componentId: string, quantity?: number) => void;
  removeFromInventory: (componentId: string) => void;
  clearInventory: () => void;
  getQuantity: (componentId: string) => number;
  aiProject: AIProject;
  setAiProject: (project: AIProject) => void;
  clearAiProject: () => void;
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [aiProject, setAiProjectState] = useState<AIProject>(null);

  // Load inventory & persistent aiProject from local storage on mount
  useEffect(() => {
    const savedInventory = localStorage.getItem('bob_inventory') || localStorage.getItem('hackhorizon_inventory');
    if (savedInventory) {
      try {
        setInventory(JSON.parse(savedInventory));
      } catch (e) {
        console.error("Failed to parse inventory", e);
      }
    }

    const savedAiProject = localStorage.getItem('bob_ai_project');
    if (savedAiProject) {
      try {
        setAiProjectState(JSON.parse(savedAiProject));
      } catch (e) {
        console.error("Failed to parse AI project from storage", e);
      }
    }
  }, []);

  // Save inventory to local storage on change
  useEffect(() => {
    localStorage.setItem('bob_inventory', JSON.stringify(inventory));
    localStorage.setItem('hackhorizon_inventory', JSON.stringify(inventory));
  }, [inventory]);

  // Save AI project to local storage on change
  const setAiProject = (project: AIProject) => {
    setAiProjectState(project);
    if (project) {
      localStorage.setItem('bob_ai_project', JSON.stringify(project));
    } else {
      localStorage.removeItem('bob_ai_project');
    }
  };

  const clearAiProject = () => {
    setAiProjectState(null);
    localStorage.removeItem('bob_ai_project');
  };

  const addToInventory = (componentId: string, quantity: number = 1) => {
    setInventory(prev => {
      const existing = prev.find(item => item.componentId === componentId);
      if (existing) {
        return prev.map(item => 
          item.componentId === componentId 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { componentId, quantity }];
    });
  };

  const removeFromInventory = (componentId: string) => {
    setInventory(prev => prev.filter(item => item.componentId !== componentId));
  };

  const clearInventory = () => setInventory([]);

  const getQuantity = (componentId: string) => {
    const item = inventory.find(i => i.componentId === componentId);
    return item ? item.quantity : 0;
  };

  return (
    <InventoryContext.Provider 
      value={{ 
        inventory, 
        addToInventory, 
        removeFromInventory, 
        clearInventory, 
        getQuantity, 
        aiProject, 
        setAiProject, 
        clearAiProject 
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
