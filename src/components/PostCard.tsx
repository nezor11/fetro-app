import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { WPPost } from '../services/posts';

interface PostCardProps {
  post: WPPost;
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

function getFeaturedImageUrl(post: WPPost): string | null {
  try {
    const embedded = (post as any)._embedded;
    if (embedded?.['wp:featuredmedia']?.[0]?.source_url) {
      return embedded['wp:featuredmedia'][0].source_url;
    }
  } catch {}
  return null;
}

export default function PostCard({ post, onPress }: PostCardProps) {
  const imageUrl = getFeaturedImageUrl(post);
  const title = decodeHtmlEntities(post.title.rendered);
  const excerpt = decodeHtmlEntities(stripHtml(post.excerpt.rendered));
  const date = new Date(post.date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      )}
      <View style={styles.content}>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.excerpt} numberOfLines={3}>
          {excerpt}
        </Text>
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
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.border,
  },
  content: {
    padding: SPACING.md,
  },
  date: {
    fontSize: FONTS.xsmall,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONTS.large,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  excerpt: {
    fontSize: FONTS.small,
    color: COLORS.textLight,
    lineHeight: 20,
  },
});
