export type RootStackParamList = {
  MainTabs: undefined;
  PostDetail: { postId: number };
  CategoryPosts: { categoryId: number; categoryName: string };
  ProductDetail: { productId: number };
};

export type BottomTabParamList = {
  Home: undefined;
  Categories: undefined;
  Products: undefined;
  Search: undefined;
};
