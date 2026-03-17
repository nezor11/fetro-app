import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  Share,
  TouchableOpacity,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import RenderHtml from 'react-native-render-html';
import { getProduct, WPProduct } from '../services/products';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

type Route = RouteProp<RootStackParamList, 'ProductDetail'>;

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&hellip;/g, '…')
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function getFeaturedImageUrl(product: WPProduct): string | null {
  try {
    const embedded = (product as any)._embedded;
    if (embedded?.['wp:featuredmedia']?.[0]?.source_url) {
      return embedded['wp:featuredmedia'][0].source_url;
    }
  } catch {}
  return null;
}

function getTermsByTaxonomy(product: WPProduct, taxonomy: string): string[] {
  try {
    const embedded = (product as any)._embedded;
    const terms = embedded?.['wp:term'];
    if (terms) {
      for (const group of terms) {
        if (Array.isArray(group) && group[0]?.taxonomy === taxonomy) {
          return group.map((t: any) => t.name);
        }
      }
    }
  } catch {}
  return [];
}

export default function ProductDetailScreen() {
  const route = useRoute<Route>();
  const { productId } = route.params;
  const { width } = useWindowDimensions();
  const [product, setProduct] = useState<WPProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProduct(productId)
      .then(setProduct)
      .catch(() => setError('Error al cargar el producto'))
      .finally(() => setLoading(false));
  }, [productId]);

  const onShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `${decodeHtmlEntities(product.title.rendered)} - ${product.link}`,
      });
    } catch {}
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Producto no encontrado'}</Text>
      </View>
    );
  }

  const imageUrl = getFeaturedImageUrl(product);
  const title = decodeHtmlEntities(product.title.rendered);
  const excerpt = decodeHtmlEntities(stripHtml(product.excerpt.rendered));
  const especialidades = getTermsByTaxonomy(product, 'especialidad');
  const terapeuticas = getTermsByTaxonomy(product, 'especialidad-terapeutica');
  const productCats = getTermsByTaxonomy(product, 'product_cat');
  const hasContent = product.content.rendered.trim().length > 0;

  return (
    <ScrollView style={styles.container}>
      {imageUrl && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {excerpt ? <Text style={styles.excerpt}>{excerpt}</Text> : null}

        {productCats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Especies</Text>
            <View style={styles.tags}>
              {productCats.map((cat) => (
                <View key={cat} style={styles.tag}>
                  <Text style={styles.tagText}>{cat}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {especialidades.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Especialidad</Text>
            <View style={styles.tags}>
              {especialidades.map((esp) => (
                <View key={esp} style={[styles.tag, styles.tagSecondary]}>
                  <Text style={[styles.tagText, styles.tagTextSecondary]}>{esp}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {terapeuticas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Área terapéutica</Text>
            <View style={styles.tags}>
              {terapeuticas.map((t) => (
                <View key={t} style={[styles.tag, styles.tagTertiary]}>
                  <Text style={[styles.tagText, styles.tagTextTertiary]}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {hasContent && (
          <View style={styles.section}>
            <RenderHtml
              contentWidth={width - SPACING.md * 2}
              source={{ html: product.content.rendered }}
              tagsStyles={{
                p: { color: COLORS.text, fontSize: FONTS.regular, lineHeight: 26 },
                a: { color: COLORS.primary },
              }}
            />
          </View>
        )}

        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
          <Text style={styles.shareText}>Compartir</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: FONTS.regular,
    color: COLORS.error,
  },
  imageContainer: {
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  image: {
    width: 250,
    height: 250,
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONTS.title,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  excerpt: {
    fontSize: FONTS.large,
    color: COLORS.textLight,
    lineHeight: 26,
    marginBottom: SPACING.md,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.small,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 1,
    borderRadius: 6,
  },
  tagText: {
    fontSize: FONTS.xsmall,
    color: COLORS.primary,
    fontWeight: '600',
  },
  tagSecondary: {
    backgroundColor: COLORS.secondary + '20',
  },
  tagTextSecondary: {
    color: COLORS.secondary,
  },
  tagTertiary: {
    backgroundColor: '#4CAF5020',
  },
  tagTextTertiary: {
    color: '#4CAF50',
  },
  shareButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm + 4,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  shareText: {
    color: COLORS.white,
    fontSize: FONTS.regular,
    fontWeight: '600',
  },
});
