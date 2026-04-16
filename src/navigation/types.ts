export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
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
  Profile: undefined;
};
