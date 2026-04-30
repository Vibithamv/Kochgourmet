import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Share,
  Dimensions,
  ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy, Star, Users, Gift, Target, BookOpen, Share2, Crown, Medal, Award, TrendingUp, CircleCheck as CheckCircle, Clock, ArrowRight, X, Copy, Sparkles, Flame, Diamond } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useGlobalAlert } from '@/contexts/AlertContext';

const { width } = Dimensions.get('window');

const FlatListSeparatorSm = () => <View style={{ height: Spacing.sm }} />;
const FlatListSeparatorMd = () => <View style={{ height: Spacing.md }} />;
const FlatListSeparatorLg = () => <View style={{ height: Spacing.lg }} />;

interface UserStats {
  totalPoints: number;
  level: number;
  rank: number;
  totalUsers: number;
  completedChallenges: number;
  referrals: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'learning' | 'investment' | 'social';
  points: number;
  completed: boolean;
  progress: number;
  maxProgress: number;
  timeLeft?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  points: number;
  level: number;
  rank: number;
  isCurrentUser?: boolean;
}

const EngagementScreen = React.memo(() => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'achievements' | 'challenges'>('overview');
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const { showAlert } = useGlobalAlert();
  const colors = getColors(theme);
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [userStats] = useState<UserStats>({
    totalPoints: 2850,
    level: 7,
    rank: 23,
    totalUsers: 15420,
    completedChallenges: 12,
    referrals: 3,
  });

  const [achievements] = useState<Achievement[]>([
    {
      id: '1',
      title: t('engagement.achievements.firstInvestment'),
      description: t('engagement.achievements.firstInvestmentDesc'),
      icon: '🎯',
      points: 100,
      unlocked: true,
      unlockedAt: '2024-01-15',
    },
    {
      id: '2',
      title: t('engagement.achievements.portfolioBuilder'),
      description: t('engagement.achievements.portfolioBuilderDesc'),
      icon: '🏗️',
      points: 250,
      unlocked: true,
      unlockedAt: '2024-01-20',
    },
    {
      id: '3',
      title: t('engagement.achievements.knowledgeSeeker'),
      description: t('engagement.achievements.knowledgeSeekerDesc'),
      icon: '📚',
      points: 150,
      unlocked: true,
      unlockedAt: '2024-01-18',
    },
    {
      id: '4',
      title: t('engagement.achievements.socialInvestor'),
      description: t('engagement.achievements.socialInvestorDesc'),
      icon: '👥',
      points: 200,
      unlocked: false,
      progress: 1,
      maxProgress: 3,
    },
    {
      id: '5',
      title: t('engagement.achievements.highRoller'),
      description: t('engagement.achievements.highRollerDesc'),
      icon: '💎',
      points: 500,
      unlocked: false,
      progress: 25000,
      maxProgress: 50000,
    },
    {
      id: '6',
      title: t('engagement.achievements.earlyBird'),
      description: t('engagement.achievements.earlyBirdDesc'),
      icon: '🐦',
      points: 300,
      unlocked: false,
      progress: 0,
      maxProgress: 1,
    },
  ]);

  const [challenges] = useState<Challenge[]>([
    {
      id: '1',
      title: t('engagement.challenges.dailyCheck'),
      description: t('engagement.challenges.dailyCheckDesc'),
      type: 'learning',
      points: 50,
      completed: false,
      progress: 4,
      maxProgress: 7,
      timeLeft: '3d',
      difficulty: 'easy',
    },
    {
      id: '2',
      title: t('engagement.challenges.portfolioDiversify'),
      description: t('engagement.challenges.portfolioDiversifyDesc'),
      type: 'investment',
      points: 200,
      completed: false,
      progress: 2,
      maxProgress: 5,
      difficulty: 'medium',
    },
    {
      id: '3',
      title: t('engagement.challenges.shareApp'),
      description: t('engagement.challenges.shareAppDesc'),
      type: 'social',
      points: 100,
      completed: true,
      progress: 1,
      maxProgress: 1,
      difficulty: 'easy',
    },
    {
      id: '4',
      title: t('engagement.challenges.masterInvestor'),
      description: t('engagement.challenges.masterInvestorDesc'),
      type: 'learning',
      points: 300,
      completed: false,
      progress: 3,
      maxProgress: 10,
      difficulty: 'hard',
    },
  ]);

  const [leaderboard] = useState<LeaderboardUser[]>([
    {
      id: '1',
      name: 'Sarah Chen',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      points: 8950,
      level: 15,
      rank: 1,
    },
    {
      id: '2',
      name: 'Michael Rodriguez',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      points: 7420,
      level: 13,
      rank: 2,
    },
    {
      id: '3',
      name: 'Emma Thompson',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      points: 6890,
      level: 12,
      rank: 3,
    },
    {
      id: 'current',
      name: user?.lastName + ' ' + user?.firstName || 'You',
      avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
      points: userStats.totalPoints,
      level: userStats.level,
      rank: userStats.rank,
      isCurrentUser: true,
    },
  ]);

  const tabs = [
    { id: 'overview', label: t('engagement.tabs.overview'), icon: Sparkles },
    { id: 'leaderboard', label: t('engagement.tabs.leaderboard'), icon: Trophy },
    { id: 'achievements', label: t('engagement.tabs.achievements'), icon: Award },
    { id: 'challenges', label: t('engagement.tabs.challenges'), icon: Target },
  ];

  const getLevelProgress = () => {
    const pointsForCurrentLevel = userStats.level * 500;
    const pointsForNextLevel = (userStats.level + 1) * 500;
    const progress = ((userStats.totalPoints - pointsForCurrentLevel) / (pointsForNextLevel - pointsForCurrentLevel)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const getPointsToNextLevel = () => {
    const pointsForNextLevel = (userStats.level + 1) * 500;
    return pointsForNextLevel - userStats.totalPoints;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return colors.success;
      case 'medium': return colors.warning;
      case 'hard': return colors.error;
      default: return colors.text.secondary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'learning': return BookOpen;
      case 'investment': return TrendingUp;
      case 'social': return Users;
      default: return Target;
    }
  };

  const handleReferFriend = async () => {
    const referralCode = `REI${user?.email?.split('@')[0]?.slice(-6).toUpperCase() || 'DEMO'}`;
    const message = t('engagement.referral.shareMessage', { 
      name: user?.lastName + ' ' + user?.firstName || 'Friend',
      code: referralCode 
    });
    
    try {
      await Share.share({
        message: message,
        title: t('engagement.referral.shareTitle'),
      });
    } catch (error) {
      console.error('Share referral failed:', error);
      showAlert(t('common.error'), t('engagement.referral.shareError'));
    }
  };

  const copyReferralCode = () => {
    showAlert(t('engagement.referral.copied'), t('engagement.referral.codeCopied'));
  };

  const renderAchievement: ListRenderItem<Achievement> = ({ item }) => {
    const progress = item.progress;
    const maxProgress = item.maxProgress;
    const showLockedProgress =
      !item.unlocked && progress !== undefined && maxProgress != null && maxProgress > 0;

    return (
      <TouchableOpacity
        style={[
          styles.achievementCard,
          { 
            backgroundColor: colors.background.card,
            borderColor: item.unlocked ? colors.primary : colors.border.primary,
            opacity: item.unlocked ? 1 : 0.7
          }
        ]}
        onPress={() => setSelectedAchievement(item)}
      >
        <View style={styles.achievementHeader}>
          <Text style={styles.achievementIcon}>{item.icon}</Text>
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementTitle, { color: colors.text.primary }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.achievementPoints, { color: colors.primary }]}>
              +{item.points} {t('engagement.points')}
            </Text>
          </View>
          {item.unlocked && (
            <View style={[styles.unlockedBadge, { backgroundColor: colors.success }]}>
              <CheckCircle size={16} color={colors.text.inverse} />
            </View>
          )}
        </View>
        
        {showLockedProgress && (
          <View style={styles.achievementProgress}>
            <View style={[styles.progressTrack, { backgroundColor: colors.border.secondary }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(progress / maxProgress) * 100}%`,
                    backgroundColor: colors.primary 
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: colors.text.secondary }]}>
              {progress}/{maxProgress}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderChallenge: ListRenderItem<Challenge> = ({ item }) => {
    const TypeIcon = getTypeIcon(item.type);
    const timeLeft = item.timeLeft;
    const hasTimeLeft = timeLeft != null && timeLeft.length > 0;

    return (
      <View style={[styles.challengeCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
        <View style={styles.challengeHeader}>
          <View style={[styles.challengeTypeIcon, { backgroundColor: `${getDifficultyColor(item.difficulty)}15` }]}>
            <TypeIcon size={20} color={getDifficultyColor(item.difficulty)} />
          </View>
          <View style={styles.challengeInfo}>
            <View style={styles.challengeTitleRow}>
              <Text style={[styles.challengeTitle, { color: colors.text.primary }]} numberOfLines={1}>
                {item.title}
              </Text>
              {hasTimeLeft && (
                <View style={[styles.timeLeftBadge, { backgroundColor: colors.interactive.hover }]}>
                  <Clock size={12} color={colors.text.secondary} />
                  <Text style={[styles.timeLeftText, { color: colors.text.secondary }]}>
                    {timeLeft}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.challengeDescription, { color: colors.text.secondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
          <View style={styles.challengeReward}>
            <Text style={[styles.challengePoints, { color: colors.primary }]}>+{item.points}</Text>
            <Text style={[styles.challengePointsLabel, { color: colors.text.tertiary }]}>{t('engagement.points')}</Text>
          </View>
        </View>

        <View style={styles.challengeProgress}>
          <View style={styles.challengeProgressHeader}>
            <Text style={[styles.challengeProgressText, { color: colors.text.secondary }]}>
              {t('engagement.progress')}: {item.progress}/{item.maxProgress}
            </Text>
            <Text style={[styles.challengeDifficulty, { color: getDifficultyColor(item.difficulty) }]}>
              {t(`engagement.difficulty.${item.difficulty}`)}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border.secondary }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${(item.progress / item.maxProgress) * 100}%`,
                  backgroundColor: item.completed ? colors.success : colors.primary 
                }
              ]} 
            />
          </View>
        </View>

        {!item.completed && (
          <TouchableOpacity 
            style={[styles.challengeButton, { backgroundColor: colors.primary }]}
            onPress={() => showAlert(t('engagement.challenges.startChallenge'), item.title)}
          >
            <Text style={[styles.challengeButtonText, { color: colors.text.inverse }]}>
              {t('engagement.challenges.continue')}
            </Text>
            <ArrowRight size={16} color={colors.text.inverse} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderLeaderboardUser: ListRenderItem<LeaderboardUser> = ({ item, index }) => {
    const getRankIcon = (rank: number) => {
      switch (rank) {
        case 1: return <Crown size={20} color="#FFD700" />;
        case 2: return <Medal size={20} color="#C0C0C0" />;
        case 3: return <Award size={20} color="#CD7F32" />;
        default: return <Text style={[styles.rankNumber, { color: colors.text.secondary }]}>#{rank}</Text>;
      }
    };

    return (
      <View style={[
        styles.leaderboardItem,
        { 
          backgroundColor: item.isCurrentUser ? colors.interactive.hover : colors.background.card,
          borderColor: item.isCurrentUser ? colors.primary : colors.border.primary
        }
      ]}>
        <View style={styles.leaderboardRank}>
          {getRankIcon(item.rank)}
        </View>
        
        <View style={styles.leaderboardAvatar}>
          <View style={[styles.avatarContainer, { borderColor: item.isCurrentUser ? colors.primary : colors.border.primary }]}>
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={[styles.levelBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.levelText, { color: colors.text.inverse }]}>{item.level}</Text>
          </View>
        </View>

        <View style={styles.leaderboardInfo}>
          <Text style={[styles.leaderboardName, { color: colors.text.primary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.leaderboardPoints, { color: colors.text.secondary }]}>
            {item.points.toLocaleString()} {t('engagement.points')}
          </Text>
        </View>

        {item.isCurrentUser && (
          <View style={[styles.currentUserBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.currentUserText, { color: colors.text.inverse }]}>{t('engagement.you')}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderOverview = () => (
    <ScrollView 
      style={styles.tabContent} 
      contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Level Progress Card */}
      <View style={[styles.levelCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.levelCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.levelHeader}>
            <View style={styles.levelInfo}>
              <Text style={styles.levelNumber}>Level {userStats.level}</Text>
              <Text style={styles.levelTitle}>{t('engagement.level.title')}</Text>
            </View>
            <View style={styles.pointsContainer}>
              <Sparkles size={20} color="#FFFFFF" />
              <Text style={styles.pointsText}>{userStats.totalPoints.toLocaleString()}</Text>
            </View>
          </View>
          
          <View style={styles.levelProgressContainer}>
            <View style={styles.levelProgressTrack}>
              <View style={[styles.levelProgressFill, { width: `${getLevelProgress()}%` }]} />
            </View>
            <Text style={styles.levelProgressText}>
              {getPointsToNextLevel()} {t('engagement.level.pointsToNext')}
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
            <Trophy size={24} color={colors.warning} />
          </View>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>#{userStats.rank}</Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>{t('engagement.stats.rank')}</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
            <Target size={24} color={colors.success} />
          </View>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>{userStats.completedChallenges}</Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>{t('engagement.stats.completed')}</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.info}15` }]}>
            <Users size={24} color={colors.info} />
          </View>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>{userStats.referrals}</Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>{t('engagement.stats.referrals')}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t('engagement.quickActions')}</Text>
        
        <TouchableOpacity 
          style={[styles.referralCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
          onPress={() => setShareModalVisible(true)}
        >
          <LinearGradient
            colors={[`${colors.primary}10`, `${colors.primaryDark}10`]}
            style={styles.referralGradient}
          >
            <View style={styles.referralContent}>
              <View style={[styles.referralIcon, { backgroundColor: colors.primary }]}>
                <Gift size={24} color={colors.text.inverse} />
              </View>
              <View style={styles.referralInfo}>
                <Text style={[styles.referralTitle, { color: colors.text.primary }]}>
                  {t('engagement.referral.title')}
                </Text>
                <Text style={[styles.referralSubtitle, { color: colors.text.secondary }]}>
                  {t('engagement.referral.subtitle')}
                </Text>
              </View>
              <View style={styles.referralReward}>
                <Text style={[styles.referralPoints, { color: colors.primary }]}>+500</Text>
                <Text style={[styles.referralPointsLabel, { color: colors.text.tertiary }]}>{t('engagement.points')}</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Recent Achievements */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t('engagement.recent.achievements')}</Text>
          <TouchableOpacity onPress={() => setActiveTab('achievements')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>{t('engagement.seeAll')}</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={achievements.filter(a => a.unlocked).slice(0, 3)}
          renderItem={renderAchievement}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={FlatListSeparatorMd}
        />
      </View>
    </ScrollView>
  );

  const renderLeaderboard = () => (
    <View style={styles.tabContent}>
      <View style={[styles.leaderboardHeader, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
        <Text style={[styles.leaderboardTitle, { color: colors.text.primary }]}>
          {t('engagement.leaderboard.title')}
        </Text>
        <Text style={[styles.leaderboardSubtitle, { color: colors.text.secondary }]}>
          {t('engagement.leaderboard.subtitle', { total: userStats.totalUsers })}
        </Text>
      </View>

      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.leaderboardList, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={FlatListSeparatorSm}
      />
    </View>
  );

  const renderAchievements = () => (
    <View style={styles.tabContent}>
      <View style={styles.achievementsHeader}>
        <Text style={[styles.achievementsTitle, { color: colors.text.primary }]}>
          {t('engagement.achievements.title')}
        </Text>
        <Text style={[styles.achievementsSubtitle, { color: colors.text.secondary }]}>
          {achievements.filter(a => a.unlocked).length}/{achievements.length} {t('engagement.achievements.unlocked')}
        </Text>
      </View>

      <FlatList
        data={achievements}
        renderItem={renderAchievement}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.achievementsList, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={FlatListSeparatorMd}
      />
    </View>
  );

  const renderChallenges = () => (
    <View style={styles.tabContent}>
      <View style={styles.challengesHeader}>
        <Text style={[styles.challengesTitle, { color: colors.text.primary }]}>
          {t('engagement.challenges.title')}
        </Text>
        <Text style={[styles.challengesSubtitle, { color: colors.text.secondary }]}>
          {t('engagement.challenges.subtitle')}
        </Text>
      </View>

      <FlatList
        data={challenges}
        renderItem={renderChallenge}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.challengesList, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={FlatListSeparatorLg}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 20, backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{t('engagement.title')}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>{t('engagement.subtitle')}</Text>
          </View>
          <View style={[styles.headerBadge, { backgroundColor: colors.primary }]}>
            <Flame size={20} color={colors.text.inverse} />
            <Text style={[styles.headerBadgeText, { color: colors.text.inverse }]}>
              {userStats.totalPoints.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabNavigation, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  { 
                    backgroundColor: isActive ? colors.primary : colors.background.secondary,
                    borderColor: isActive ? colors.primary : colors.border.primary
                  }
                ]}
                onPress={() => setActiveTab(tab.id as any)}
              >
                <IconComponent 
                  size={18} 
                  color={isActive ? colors.text.inverse : colors.text.secondary} 
                />
                <Text style={[
                  styles.tabText,
                  { 
                    color: isActive ? colors.text.inverse : colors.text.secondary,
                    fontFamily: isActive ? Typography.fontFamily.semiBold : Typography.fontFamily.regular
                  }
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'leaderboard' && renderLeaderboard()}
        {activeTab === 'achievements' && renderAchievements()}
        {activeTab === 'challenges' && renderChallenges()}
      </View>

      {/* Share Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={shareModalVisible}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.shareModal, { backgroundColor: colors.background.primary }]}>
            <View style={styles.shareModalHeader}>
              <Text style={[styles.shareModalTitle, { color: colors.text.primary }]}>
                {t('engagement.referral.title')}
              </Text>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.background.secondary }]}
                onPress={() => setShareModalVisible(false)}
              >
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.shareModalContent}>
              <View style={[styles.referralCodeCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}>
                <Text style={[styles.referralCodeLabel, { color: colors.text.secondary }]}>
                  {t('engagement.referral.yourCode')}
                </Text>
                <View style={styles.referralCodeRow}>
                  <Text style={[styles.referralCode, { color: colors.text.primary }]}>
                    REI{user?.email?.split('@')[0]?.slice(-6).toUpperCase() || 'DEMO'}
                  </Text>
                  <TouchableOpacity 
                    style={[styles.copyButton, { backgroundColor: colors.primary }]}
                    onPress={copyReferralCode}
                  >
                    <Copy size={16} color={colors.text.inverse} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.referralBenefits}>
                <Text style={[styles.benefitsTitle, { color: colors.text.primary }]}>
                  {t('engagement.referral.benefits')}
                </Text>
                <View style={styles.benefitsList}>
                  <View style={styles.benefitItem}>
                    <Gift size={16} color={colors.success} />
                    <Text style={[styles.benefitText, { color: colors.text.secondary }]}>
                      {t('engagement.referral.benefit1')}
                    </Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Star size={16} color={colors.warning} />
                    <Text style={[styles.benefitText, { color: colors.text.secondary }]}>
                      {t('engagement.referral.benefit2')}
                    </Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Diamond size={16} color={colors.info} />
                    <Text style={[styles.benefitText, { color: colors.text.secondary }]}>
                      {t('engagement.referral.benefit3')}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.shareButton, { backgroundColor: colors.primary }]}
                onPress={handleReferFriend}
              >
                <Share2 size={20} color={colors.text.inverse} />
                <Text style={[styles.shareButtonText, { color: colors.text.inverse }]}>
                  {t('engagement.referral.shareNow')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Achievement Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!selectedAchievement}
        onRequestClose={() => setSelectedAchievement(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.achievementModal, { backgroundColor: colors.background.primary }]}>
            {selectedAchievement && (
              <>
                <View style={styles.achievementModalHeader}>
                  <Text style={styles.achievementModalIcon}>{selectedAchievement.icon}</Text>
                  <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: colors.background.secondary }]}
                    onPress={() => setSelectedAchievement(null)}
                  >
                    <X size={24} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>
                
                <Text style={[styles.achievementModalTitle, { color: colors.text.primary }]}>
                  {selectedAchievement.title}
                </Text>
                <Text style={[styles.achievementModalDescription, { color: colors.text.secondary }]}>
                  {selectedAchievement.description}
                </Text>
                
                <View style={[styles.achievementModalReward, { backgroundColor: colors.interactive.hover }]}>
                  <Star size={20} color={colors.primary} />
                  <Text style={[styles.achievementModalPoints, { color: colors.primary }]}>
                    +{selectedAchievement.points} {t('engagement.points')}
                  </Text>
                </View>

                {selectedAchievement.unlocked &&
                  selectedAchievement.unlockedAt != null &&
                  selectedAchievement.unlockedAt.length > 0 && (
                  <Text style={[styles.achievementModalDate, { color: colors.text.tertiary }]}>
                    {t('engagement.achievements.unlockedOn')} {new Date(selectedAchievement.unlockedAt).toLocaleDateString()}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
});

EngagementScreen.displayName = 'EngagementScreen';

export default EngagementScreen;

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: -0.4,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  headerBadgeText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: -0.2,
  },

  // Tab Navigation
  tabNavigation: {
    borderBottomWidth: 1,
  },
  tabScrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.sm,
    minWidth: 100,
    justifyContent: 'center',
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    letterSpacing: -0.1,
  },

  // Content
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },

  // Level Card
  levelCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    ...Shadows.lg,
  },
  levelCardGradient: {
    padding: Spacing.xl,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  levelInfo: {
    flex: 1,
  },
  levelNumber: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  levelTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Spacing.xs,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pointsText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  levelProgressContainer: {
    marginTop: Spacing.lg,
  },
  levelProgressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  levelProgressText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    ...Shadows.sm,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.xs,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
  },

  // Quick Actions
  quickActionsSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.lg,
    letterSpacing: -0.2,
  },
  referralCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    ...Shadows.md,
  },
  referralGradient: {
    padding: Spacing.xl,
  },
  referralContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  referralIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  referralInfo: {
    flex: 1,
  },
  referralTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    marginBottom: Spacing.xs,
    letterSpacing: -0.1,
  },
  referralSubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  referralReward: {
    alignItems: 'center',
  },
  referralPoints: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: -0.2,
  },
  referralPointsLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },

  // Recent Section
  recentSection: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  seeAllText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
  },

  // Achievements
  achievementsHeader: {
    marginBottom: Spacing.xl,
  },
  achievementsTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.xs,
    letterSpacing: -0.2,
  },
  achievementsSubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  achievementsList: {
  },
  achievementCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    ...Shadows.sm,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: Spacing.lg,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    marginBottom: Spacing.xs,
    letterSpacing: -0.1,
  },
  achievementPoints: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  unlockedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementProgress: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    minWidth: 40,
  },

  // Challenges
  challengesHeader: {
    marginBottom: Spacing.xl,
  },
  challengesTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.xs,
    letterSpacing: -0.2,
  },
  challengesSubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  challengesList: {
  },
  challengeCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    ...Shadows.sm,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  challengeTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  challengeTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: -0.1,
    flex: 1,
  },
  timeLeftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  timeLeftText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  challengeDescription: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },
  challengeReward: {
    alignItems: 'center',
  },
  challengePoints: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: -0.2,
  },
  challengePointsLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  challengeProgress: {
    marginBottom: Spacing.lg,
  },
  challengeProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  challengeProgressText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  challengeDifficulty: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  challengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  challengeButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
  },

  // Leaderboard
  leaderboardHeader: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    ...Shadows.sm,
  },
  leaderboardTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.xs,
    letterSpacing: -0.2,
  },
  leaderboardSubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  leaderboardList: {
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.xs,
  },
  leaderboardRank: {
    width: 40,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  rankNumber: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
  },
  leaderboardAvatar: {
    position: 'relative',
    marginRight: Spacing.lg,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: colors.text.inverse,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    marginBottom: Spacing.xs,
    letterSpacing: -0.1,
  },
  leaderboardPoints: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  currentUserBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  currentUserText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareModal: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    margin: Spacing.xl,
    width: width - Spacing.xl * 2,
    maxHeight: '80%',
    ...Shadows.xl,
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  shareModalTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareModalContent: {
    alignItems: 'center',
  },
  referralCodeCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    width: '100%',
  },
  referralCodeLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  referralCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  referralCode: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: 2,
  },
  copyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralBenefits: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  benefitsTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  benefitsList: {
    gap: Spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  benefitText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    flex: 1,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    width: '100%',
    ...Shadows.button,
  },
  shareButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
  },

  // Achievement Modal
  achievementModal: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    margin: Spacing.xl,
    alignItems: 'center',
    ...Shadows.xl,
  },
  achievementModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  achievementModalIcon: {
    fontSize: 64,
  },
  achievementModalTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },
  achievementModalDescription: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  achievementModalReward: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  achievementModalPoints: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
  },
  achievementModalDate: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
  },
});