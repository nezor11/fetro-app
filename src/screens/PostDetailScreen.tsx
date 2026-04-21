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
import { getPost, WPPost } from '../services/posts';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import FavoriteButton from '../components/FavoriteButton';

type PostDetailRoute = RouteProp<RootStackParamList, 'PostDetail'>;

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

function getFeaturedImageUrl(post: WPPost): string | null {
  try {
    const embedded = (post as any)._embedded;
    if (embedded?.['wp:featuredmedia']?.[0]?.source_url) {
      return embedded['wp:featuredmedia'][0].source_url;
    }
  } catch {}
  return null;
}

function getAuthorName(post: WPPost): string {
  try {
    const embedded = (post as any)._embedded;
    if (embedded?.author?.[0]?.name) {
      return embedded.author[0].name;
    }
  } catch {}
  return '';
}

function getCategoryNames(post: WPPost): string[] {
  try {
    const embedded = (post as any)._embedded;
    if (embedded?.['wp:term']?.[0]) {
      return embedded['wp:term'][0].map((cat: any) => cat.name);
    }
  } catch {}
  return [];
}

export default function PostDetailScreen() {
  const route = useRoute<PostDetailRoute>();
  const { postId } = route.params;
  const { width } = useWindowDimensions();
  const [post, setPost] = useState<WPPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPost(postId)
      .then(setPost)
      .catch(() => setError('Error al cargar el post'))
      .finally(() => setLoading(false));
  }, [postId]);

  const onShare = async () => {
    if (!post) return;
    try {
      await Share.share({
        message: `${decodeHtmlEntities(post.title.rendered)} - ${post.link}`,
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

  if (error || !post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Post no encontrado'}</Text>
      </View>
    );
  }

  const imageUrl = getFeaturedImageUrl(post);
  const title = decodeHtmlEntities(post.title.rendered);
  const author = getAuthorName(post);
  const categories = getCategoryNames(post);
  const date = new Date(post.date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <ScrollView style={styles.container}>
      {imageUrl && <Image source={{ uri: imageUrl }} style={styles.hero} />}
      <View style={styles.content}>
        <View style={styles.meta}>
          <Text style={styles.date}>{date}</Text>
          {author ? <Text style={styles.author}>por {author}</Text> : null}
        </View>
        <Text style={styles.title}>{title}</Text>
        {categories.length > 0 && (
          <View style={styles.categories}>
            {categories.map((cat) => (
              <View key={cat} style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{cat}</Text>
              </View>
            ))}
          </View>
        )}
        <FavoriteButton
          data={{
            kind: 'post',
            id: String(post.id),
            title,
            subtitle: author || categories[0] || undefined,
            imageUrl,
          }}
          style={{ marginVertical: SPACING.md, alignSelf: 'flex-start' }}
        />
        <RenderHtml
          contentWidth={width - SPACING.md * 2}
          source={{ html: post.content.rendered }}
          tagsStyles={{
            p: { color: COLORS.text, fontSize: FONTS.regular, lineHeight: 26 },
            a: { color: COLORS.primary },
            img: { borderRadius: 8 },
          }}
        />
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
  hero: {
    width: '100%',
    height: 250,
    backgroundColor: COLORS.border,
  },
  content: {
    padding: SPACING.md,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  date: {
    fontSize: FONTS.xsmall,
    color: COLORS.textMuted,
  },
  author: {
    fontSize: FONTS.xsmall,
    color: COLORS.textMuted,
  },
  title: {
    fontSize: FONTS.title,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  categoryBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: FONTS.xsmall,
    color: COLORS.primary,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm + 4,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  shareText: {
    color: COLORS.white,
    fontSize: FONTS.regular,
    fontWeight: '600',
  },
});
