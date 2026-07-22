"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type InventoryItem = {
  componentId: string;
  quantity: number;
};

type InventoryContextType = {
  inventory: InventoryItem[];
  addToInventory: (componentId: string, quantity?: number) => void;
  removeFromInventory: (componentId: string) => void;
  clearInventory: () => void;
  getQuantity: (componentId: string) => number;
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('hackhorizon_inventory');
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setInventory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse inventory", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('hackhorizon_inventory', JSON.stringify(inventory));
  }, [inventory]);

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
    <InventoryContext.Provider value={{ inventory, addToInventory, removeFromInventory, clearInventory, getQuantity }}>
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
