/** Kochgourmet proxy operation keys. */
export const KOCHGOURMET_OPERATIONS = {
  refresh: 'refresh',
  login: 'login',
  register: 'register',
  registerResend: 'registerResend',
  registerConfirm: 'registerConfirm',
  passwordResetInit: 'passwordResetInit',
  changePassword: 'changePassword',
  getProfile: 'getProfile',
  updateProfile: 'updateProfile',
  uploadProfileImage: 'uploadProfileImage',
  deleteAccount: 'deleteAccount',
  listRecipes: 'listRecipes',
  recipeDetail: 'recipeDetail',
  recipeFilterOptions: 'recipeFilterOptions',
  listMagazinePosts: 'listMagazinePosts',
  magazinePostDetail: 'magazinePostDetail',
  listFolders: 'listFolders',
  folderDetail: 'folderDetail',
  createFolder: 'createFolder',
  renameFolder: 'renameFolder',
  addRecipeToFolder: 'addRecipeToFolder',
  removeRecipeFromFolder: 'removeRecipeFromFolder',
  deleteFolder: 'deleteFolder',
  addFavorite: 'addFavorite',
  removeFavorite: 'removeFavorite',
  pageImpressum: 'pageImpressum',
  pageDatenschutz: 'pageDatenschutz',
} as const;

export type KochgourmetOperationType =
  (typeof KOCHGOURMET_OPERATIONS)[keyof typeof KOCHGOURMET_OPERATIONS];

export type KochgourmetPathParams = Record<string, string | number>;
