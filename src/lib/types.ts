export type CatalogComponent = {
  id: string | number;
  name: string;
  category: string;
  description?: string;
  imageUrl?: string;
  image_url?: string;
};
export type CatalogRequirement = {
  componentId: string;
  requiredQuantity: number;
  isOptional: boolean;
};

export type CatalogProject = {
  id: string;
  title: string;
  description: string;
  difficultyLevel: string;
  estimatedTime: string;
  steps: string[];
  requirements: CatalogRequirement[];
};