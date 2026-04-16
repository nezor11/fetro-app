export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  MainTabs: undefined;
  PostDetail: { postId: number };
  CategoryPosts: { categoryId: number; categoryName: string };
  ProductDetail: { productId: number };
  TrainingDetail: { trainingId: string };
  VetsicsDetail: { raceId: string };
  ConsultaDetail: { groupKey: string; slug: string };
};

// TODO: con Consultas ya vamos 8 tabs. Cuando añadamos Solicitudes (la 9ª)
// hay que refactorizar estas pestañas hacia un hub "Más" para evitar apretar
// el bottom tab bar.
export type BottomTabParamList = {
  Home: undefined;
  Categories: undefined;
  Products: undefined;
  Trainings: undefined;
  Vetsics: undefined;
  Consultas: undefined;
  Search: undefined;
  Profile: undefined;
};
