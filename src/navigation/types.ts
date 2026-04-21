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
  SolicitudDetail: { solicitudId: string };
  EditProfile: undefined;
  MyRequests: undefined;
};

/**
 * El bottom tab bar solo muestra cinco tabs: Home, Categories, Products,
 * More y Profile. Trainings, Vetsics, Consultas y Search siguen siendo
 * rutas de pestaña registradas (para que `navigation.navigate('Vetsics')`
 * desde cualquier parte siga funcionando y se conserve el estado de
 * scroll/listado), pero su botón está oculto vía `tabBarButton: () => null`
 * en `BottomTabs.tsx` y solo se llega a ellas desde `MoreScreen`.
 */
export type BottomTabParamList = {
  Home: undefined;
  Categories: undefined;
  Products: undefined;
  Trainings: undefined;
  Vetsics: undefined;
  Consultas: undefined;
  Solicitudes: undefined;
  Favorites: undefined;
  Asistencias: undefined;
  Search: undefined;
  More: undefined;
  Profile: undefined;
};
