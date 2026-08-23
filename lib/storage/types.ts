export type SaveProductImageInput = {
  productId: number;
  file: File;
};

export interface ImageStorage {
  save(input: SaveProductImageInput): Promise<string>;
  delete(imageUrl: string): Promise<void>;
  isPubliclyAccessible(imageUrl: string): boolean;
}
