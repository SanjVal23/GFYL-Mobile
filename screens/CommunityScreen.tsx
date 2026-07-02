import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../services/supabaseClient';
import { useLocalization } from '../contexts/LocalizationContext';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';

interface Comment {
  id: string;
  author: string;
  text: string;
  likes: number;
  replies: Reply[];
  timestamp: string;
  liked: boolean;
}

interface Reply {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

interface Post {
  id: string;
  author: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  timestamp: string;
  liked: boolean;
}

const initialPosts: Post[] = [
  {
    id: '1',
    author: 'Krishna Das',
    title: 'Understanding Karma Yoga',
    content: 'I\'ve been reflecting on Chapter 3 and wanted to discuss how we can apply the principles of Karma Yoga in our daily work. What are your thoughts?',
    likes: 45,
    comments: 12,
    timestamp: '2 hours ago',
    liked: false,
  },
  {
    id: '2',
    author: 'Radha Sharma',
    title: 'Question about Meditation',
    content: 'For those practicing meditation regularly, how do you handle the restless mind? Chapter 6 mentions controlling the mind, but I find it very challenging.',
    likes: 38,
    comments: 23,
    timestamp: '5 hours ago',
    liked: true,
  },
  {
    id: '3',
    author: 'Arjun Patel',
    title: 'Daily Gita Reading',
    content: 'Just completed reading the entire Gita for the first time! The journey has been transformative. Happy to answer any questions for beginners.',
    likes: 92,
    comments: 34,
    timestamp: '1 day ago',
    liked: true,
  },
];

const initialComments: { [key: string]: Comment[] } = {
  '1': [
    {
      id: 'c1',
      author: 'Sita Devi',
      text: 'Great question! I try to perform all my work as an offering without attachment to results.',
      likes: 12,
      replies: [
        {
          id: 'r1',
          author: 'Krishna Das',
          text: 'That\'s a wonderful perspective! How do you maintain that mindset during stressful situations?',
          timestamp: '1 hour ago',
        },
      ],
      timestamp: '1 hour ago',
      liked: false,
    },
  ],
  '2': [
    {
      id: 'c2',
      author: 'Gopal Menon',
      text: 'Start with just 5 minutes daily. Consistency is more important than duration.',
      likes: 18,
      replies: [],
      timestamp: '3 hours ago',
      liked: true,
    },
  ],
};

export default function CommunityScreen() {
  const { user } = useUser();
  const { t } = useLocalization();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>(initialComments);
  const [newPostModalVisible, setNewPostModalVisible] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const currentAuthor = useMemo(
    () => (user?.isGuest ? 'Guest User' : user?.name || 'User'),
    [user?.isGuest, user?.name]
  );

  const formatTimestamp = (iso: string | null | undefined) => {
    if (!iso) return 'Just now';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'Just now';
    return date.toLocaleString();
  };

  useEffect(() => {
    const loadCommunityData = async () => {
      if (user.isGuest || !user.id) return;

      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select('id,author,title,content,likes,comments,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Failed to load community posts', postsError);
      }

      const { data: commentsData, error: commentsError } = await supabase
        .from('community_comments')
        .select('id,post_id,author,text,likes,created_at');

      if (commentsError) {
        console.error('Failed to load community comments', commentsError);
      }

      const { data: repliesData, error: repliesError } = await supabase
        .from('community_replies')
        .select('id,comment_id,author,text,created_at');

      if (repliesError) {
        console.error('Failed to load community replies', repliesError);
      }

      const { data: postLikes, error: postLikesError } = await supabase
        .from('community_post_likes')
        .select('post_id')
        .eq('user_id', user.id);

      if (postLikesError) {
        console.error('Failed to load community post likes', postLikesError);
      }

      const { data: commentLikes, error: commentLikesError } = await supabase
        .from('community_comment_likes')
        .select('comment_id')
        .eq('user_id', user.id);

      if (commentLikesError) {
        console.error('Failed to load community comment likes', commentLikesError);
      }

      const likedPosts = new Set((postLikes || []).map(p => p.post_id));
      const likedComments = new Set((commentLikes || []).map(c => c.comment_id));

      const repliesByComment: { [key: string]: Reply[] } = {};
      (repliesData || []).forEach((reply) => {
        if (!repliesByComment[reply.comment_id]) repliesByComment[reply.comment_id] = [];
        repliesByComment[reply.comment_id].push({
          id: reply.id,
          author: reply.author,
          text: reply.text,
          timestamp: formatTimestamp(reply.created_at),
        });
      });

      const commentsByPost: { [key: string]: Comment[] } = {};
      (commentsData || []).forEach((comment) => {
        if (!commentsByPost[comment.post_id]) commentsByPost[comment.post_id] = [];
        commentsByPost[comment.post_id].push({
          id: comment.id,
          author: comment.author,
          text: comment.text,
          likes: comment.likes || 0,
          replies: repliesByComment[comment.id] || [],
          timestamp: formatTimestamp(comment.created_at),
          liked: likedComments.has(comment.id),
        });
      });

      if (postsData) {
        setPosts(
          postsData.map((post) => ({
            id: post.id,
            author: post.author,
            title: post.title,
            content: post.content,
            likes: post.likes || 0,
            comments: post.comments || 0,
            timestamp: formatTimestamp(post.created_at),
            liked: likedPosts.has(post.id),
          }))
        );
      } else {
        setPosts([]);
      }

      setComments(commentsByPost);
    };

    loadCommunityData();
  }, [user.id, user.isGuest]);

  const toggleLike = (postId: string) => {
    setPosts(posts.map(p =>
      p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));

    const post = posts.find(p => p.id === postId);
    if (!post || user.isGuest || !user.id) return;

    const newLikes = post.liked ? post.likes - 1 : post.likes + 1;
    if (post.liked) {
      supabase
        .from('community_post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
    } else {
      supabase
        .from('community_post_likes')
        .insert({ post_id: postId, user_id: user.id });
    }

    supabase
      .from('community_posts')
      .update({ likes: newLikes })
      .eq('id', postId);
  };

  const toggleCommentLike = (postId: string, commentId: string) => {
    setComments({
      ...comments,
      [postId]: comments[postId]?.map(c =>
        c.id === commentId ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 } : c
      ) || [],
    });

    const comment = comments[postId]?.find(c => c.id === commentId);
    if (!comment || user.isGuest || !user.id) return;

    const newLikes = comment.liked ? comment.likes - 1 : comment.likes + 1;
    if (comment.liked) {
      supabase
        .from('community_comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);
    } else {
      supabase
        .from('community_comment_likes')
        .insert({ comment_id: commentId, user_id: user.id });
    }

    supabase
      .from('community_comments')
      .update({ likes: newLikes })
      .eq('id', commentId);
  };

  const addPost = async () => {
    if (newPostTitle.trim() && newPostContent.trim()) {
      const newPost: Post = {
        id: Date.now().toString(),
        author: currentAuthor,
        title: newPostTitle,
        content: newPostContent,
        likes: 0,
        comments: 0,
        timestamp: 'Just now',
        liked: false,
      };
      setPosts([newPost, ...posts]);
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostModalVisible(false);

      if (!user.isGuest && user.id) {
        const { data, error } = await supabase
          .from('community_posts')
          .insert({
            user_id: user.id,
            author: currentAuthor,
            title: newPost.title,
            content: newPost.content,
            likes: 0,
            comments: 0,
          })
          .select('id,author,title,content,likes,comments,created_at')
          .single();

        if (error) {
          console.error('Failed to save community post', error);
        }

        if (data) {
          setPosts(prev => [
            {
              id: data.id,
              author: data.author,
              title: data.title,
              content: data.content,
              likes: data.likes || 0,
              comments: data.comments || 0,
              timestamp: formatTimestamp(data.created_at),
              liked: false,
            },
            ...prev.filter(p => p.id !== newPost.id),
          ]);
        }
      }
    }
  };

  const addComment = async (postId: string) => {
    if (commentText.trim()) {
      const newComment: Comment = {
        id: Date.now().toString(),
        author: currentAuthor,
        text: commentText,
        likes: 0,
        replies: [],
        timestamp: 'Just now',
        liked: false,
      };
      setComments({
        ...comments,
        [postId]: [...(comments[postId] || []), newComment],
      });
      setPosts(posts.map(p =>
        p.id === postId ? { ...p, comments: p.comments + 1 } : p
      ));
      setCommentText('');

      if (!user.isGuest && user.id) {
        const { data, error } = await supabase
          .from('community_comments')
          .insert({
            post_id: postId,
            user_id: user.id,
            author: currentAuthor,
            text: newComment.text,
            likes: 0,
          })
          .select('id,post_id,author,text,likes,created_at')
          .single();

        if (error) {
          console.error('Failed to save community comment', error);
        }

        if (data) {
          setComments(prev => ({
            ...prev,
            [postId]: (prev[postId] || []).map(c =>
              c.id === newComment.id
                ? {
                    id: data.id,
                    author: data.author,
                    text: data.text,
                    likes: data.likes || 0,
                    replies: [],
                    timestamp: formatTimestamp(data.created_at),
                    liked: false,
                  }
                : c
            ),
          }));
        }

        const post = posts.find(p => p.id === postId);
        const newCount = (post?.comments || 0) + 1;
        supabase
          .from('community_posts')
          .update({ comments: newCount })
          .eq('id', postId);
      }
    }
  };

  const addReply = async (postId: string, commentId: string) => {
    if (!replyText.trim()) return;
    const newReply = {
      id: Date.now().toString(),
      author: currentAuthor,
      text: replyText,
      timestamp: 'Just now',
    };

    // Use functional update to avoid stale state issues
    setComments(prev => {
      const postComments = prev[postId] ?? [];
      const updated = postComments.map(c =>
        c.id === commentId ? { ...c, replies: [...c.replies, newReply] } : c
      );
      return { ...prev, [postId]: updated };
    });

    console.log('Added reply', { postId, commentId, newReply });
    setReplyText('');
    setReplyingTo(null);
    // Also update posts comment count if needed (kept unchanged here)

    if (!user.isGuest && user.id) {
      const { data, error } = await supabase
        .from('community_replies')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          author: currentAuthor,
          text: newReply.text,
        })
        .select('id,comment_id,author,text,created_at')
        .single();

      if (error) {
        console.error('Failed to save community reply', error);
      }

      if (data) {
        setComments(prev => {
          const postComments = prev[postId] ?? [];
          const updated = postComments.map(c =>
            c.id === commentId
              ? {
                  ...c,
                  replies: c.replies.map(r =>
                    r.id === newReply.id
                      ? {
                          id: data.id,
                          author: data.author,
                          text: data.text,
                          timestamp: formatTimestamp(data.created_at),
                        }
                      : r
                  ),
                }
              : c
          );
          return { ...prev, [postId]: updated };
        });
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('community.title', 'Community Forums')}</Text>
        <TouchableOpacity
          style={styles.newPostButton}
          onPress={() => setNewPostModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={22} color={colors.accentText} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {posts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.postCard}
            onPress={() => setSelectedPost(post)}
            activeOpacity={0.85}
          >
            <View style={styles.postHeader}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={colors.accentText} />
              </View>
              <View style={styles.postInfo}>
                <Text style={styles.authorName}>{post.author}</Text>
                <Text style={styles.timestamp}>{post.timestamp}</Text>
              </View>
            </View>
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postContent} numberOfLines={3}>
              {post.content}
            </Text>
            <View style={styles.postFooter}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => toggleLike(post.id)}
              >
                <Ionicons
                  name={post.liked ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={16}
                  color={post.liked ? colors.text : colors.textSecondary}
                />
                <Text style={[styles.actionText, post.liked && styles.actionTextActive]}>
                  {post.likes}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.actionText}>{post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Post Detail Modal */}
      <Modal
        visible={selectedPost !== null}
        animationType="slide"
        onRequestClose={() => setSelectedPost(null)}
      >
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedPost(null)}>
                <Ionicons name="arrow-back" size={22} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Discussion</Text>
              <View style={{ width: 22 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedPost && (
                <>
                  <View style={styles.postDetail}>
                    <View style={styles.postHeader}>
                      <View style={styles.avatar}>
                        <Ionicons name="person" size={20} color={colors.accentText} />
                      </View>
                      <View style={styles.postInfo}>
                        <Text style={styles.authorName}>{selectedPost.author}</Text>
                        <Text style={styles.timestamp}>{selectedPost.timestamp}</Text>
                      </View>
                    </View>
                    <Text style={styles.postTitleLarge}>{selectedPost.title}</Text>
                    <Text style={styles.postContentFull}>{selectedPost.content}</Text>
                  </View>

                  <View style={styles.commentsSection}>
                    <Text style={styles.commentsTitle}>
                      Comments ({comments[selectedPost.id]?.length || 0})
                    </Text>
                    {comments[selectedPost.id]?.map((comment) => (
                      <View key={comment.id} style={styles.commentCard}>
                        <View style={styles.commentHeader}>
                          <View style={styles.avatarSmall}>
                            <Ionicons name="person" size={16} color={colors.accentText} />
                          </View>
                          <View>
                            <Text style={styles.commentAuthor}>{comment.author}</Text>
                            <Text style={styles.commentTimestamp}>{comment.timestamp}</Text>
                          </View>
                        </View>
                        <Text style={styles.commentText}>{comment.text}</Text>
                        <View style={styles.commentActions}>
                          <TouchableOpacity
                            style={styles.commentActionButton}
                            onPress={() => toggleCommentLike(selectedPost.id, comment.id)}
                          >
                            <Ionicons
                              name={comment.liked ? 'thumbs-up' : 'thumbs-up-outline'}
                              size={16}
                              color={comment.liked ? colors.text : colors.textSecondary}
                            />
                            <Text style={[styles.commentActionText, comment.liked && styles.actionTextActive]}>
                              {comment.likes}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.commentActionButton}
                            onPress={() => setReplyingTo(comment.id)}
                          >
                            <Ionicons name="arrow-undo-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.commentActionText}>Reply</Text>
                          </TouchableOpacity>
                        </View>

                        {comment.replies.map((reply) => (
                          <View key={reply.id} style={styles.replyCard}>
                            <View style={styles.commentHeader}>
                              <View style={styles.avatarSmall}>
                                <Ionicons name="person" size={14} color={colors.accentText} />
                              </View>
                              <View>
                                <Text style={styles.replyAuthor}>{reply.author}</Text>
                                <Text style={styles.commentTimestamp}>{reply.timestamp}</Text>
                              </View>
                            </View>
                            <Text style={styles.replyText}>{reply.text}</Text>
                          </View>
                        ))}

                        {replyingTo === comment.id && (
                          <View style={styles.replyInputContainer}>
                            <TextInput
                              style={styles.replyInput}
                              placeholder="Write a reply..."
                              placeholderTextColor={colors.textSecondary}
                              value={replyText}
                              onChangeText={setReplyText}
                              multiline
                            />
                            <View style={styles.replyButtons}>
                              <TouchableOpacity
                                onPress={() => {
                                  setReplyingTo(null);
                                  setReplyText('');
                                }}
                              >
                                <Text style={styles.cancelButton}>Cancel</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.sendReplyButton}
                                onPress={() => addReply(selectedPost.id, comment.id)}
                              >
                                <Text style={styles.sendReplyButtonText}>Reply</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            {selectedPost && (
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  placeholderTextColor={colors.textSecondary}
                  value={commentText}
                  onChangeText={setCommentText}
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={() => addComment(selectedPost.id)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="send" size={18} color={colors.accentText} />
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* New Post Modal */}
      <Modal
        visible={newPostModalVisible}
        animationType="slide"
        onRequestClose={() => setNewPostModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setNewPostModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>New Post</Text>
              <TouchableOpacity onPress={addPost}>
                <Text style={styles.postButton}>Post</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.newPostContent}>
              <TextInput
                style={styles.titleInput}
                placeholder="Title"
                placeholderTextColor={colors.textSecondary}
                value={newPostTitle}
                onChangeText={setNewPostTitle}
              />
              <TextInput
                style={styles.contentInput}
                placeholder="What's on your mind?"
                placeholderTextColor={colors.textSecondary}
                value={newPostContent}
                onChangeText={setNewPostContent}
                multiline
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  newPostButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  postCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    padding: 16,
    borderRadius: 18,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  postContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  postFooter: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  actionTextActive: {
    color: colors.text,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  postButton: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
  },
  postDetail: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  postTitleLarge: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  postContentFull: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  commentsSection: {
    padding: 20,
  },
  commentsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 15,
  },
  commentCard: {
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  commentTimestamp: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  commentText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 8,
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  replyCard: {
    marginLeft: 20,
    marginTop: 10,
    padding: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  replyAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  replyText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  replyInputContainer: {
    marginLeft: 20,
    marginTop: 10,
  },
  replyInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: colors.text,
    minHeight: 60,
  },
  replyButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sendReplyButton: {
    backgroundColor: colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  sendReplyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accentText,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newPostContent: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 15,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  contentInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 15,
    fontSize: 15,
    color: colors.text,
    minHeight: 200,
    textAlignVertical: 'top',
  },
});

