import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { WPProduct } from '../services/products';

interface ProductCardProps {
  product: WPProduct;
  onPress: () => void;
}

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

function getEspecialidades(product: WPProduct): string[] {
  try {
    const embedded = (product as any)._embedded;
    const terms = embedded?.['wp:term'];
    if (terms) {
      // especialidad is usually the second term group
      for (const group of terms) {
        if (Array.isArray(group) && group[0]?.taxonomy === 'especialidad') {
          return group.map((t: any) => t.name);
        }
      }
    }
  } catch {}
  return [];
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
  const imageUrl = getFeaturedImageUrl(product);
  const title = decodeHtmlEntities(product.title.rendered);
  const excerpt = decodeHtmlEntities(stripHtml(product.excerpt.rendered));
  const especialidades = getEspecialidades(product);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {excerpt ? (
          <Text style={styles.excerpt} numberOfLines={2}>{excerpt}</Text>
        ) : null}
        {especialidades.length > 0 && (
          <View style={styles.tags}>
            {especialidades.map((esp) => (
              <View key={esp} style={styles.tag}>
                <Text style={styles.tagText}>{esp}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: 110,
    height: 110,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.sm + 2,
    justifyContent: 'center',
  },
  title: {
    fontSize: FONTS.regular,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  excerpt: {
    fontSize: FONTS.small,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  tag: {
    backgroundColor: COLORS.secondary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: FONTS.xsmall,
    color: COLORS.secondary,
    fontWeight: '600',
  },
});
