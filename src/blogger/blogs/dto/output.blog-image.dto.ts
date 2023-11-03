export type OutputBlogImageDto = {
  wallpaper: PhotoSizeViewModel;
  main: PhotoSizeViewModel[];
};

export type PhotoSizeViewModel = {
  url: string;
  width: number;
  height: number;
  fileSize: number;
};
