import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography } from '@/constants/theme';

interface ImpressumSection {
  heading: string;
  body?: React.ReactNode;
}

export default function ImpressumScreen() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const typography = getTypography(theme);
  const insets = useSafeAreaInsets();

  const openMail = (address: string) => {
    void Linking.openURL(`mailto:${address}`);
  };

  const openTel = (number: string) => {
    void Linking.openURL(`tel:${number.replace(/\s/g, '')}`);
  };

  const link = (text: string, onPress: () => void) => (
    <Text style={[styles.link, { color: colors.primary }]} onPress={onPress}>{text}</Text>
  );

  const sections: ImpressumSection[] = [
    {
      heading: 'Anbieter',
      body: (
        <Text style={[styles.body, { color: colors.text.primary }]}>
          Kochgourmet Portale & Verlag GmbH{'\n'}
          Kohlmarkt 8–10{'\n'}
          A-1010 Wien
        </Text>
      ),
    },
    {
      heading: 'Kontakt',
      body: (
        <Text style={[styles.body, { color: colors.text.primary }]}>
          Telefon: {link('0800 400 30 77', () => openTel('0800 400 30 77'))}
          {'\n'}
          <Text style={[styles.bodyMuted, { color: colors.text.tertiary }]}>
            (nicht für Kund:innen-Anfragen){' '}
          </Text>
          {'\n'}
          E-Mail: {link('info@kochgourmet.com', () => openMail('info@kochgourmet.com'))}
        </Text>
      ),
    },
    {
      heading: 'Firmenbuch',
      body: (
        <Text style={[styles.body, { color: colors.text.primary }]}>
          Firmenbuchnummer: FN 558516 y{'\n'}
          Firmenbuchgericht: Handelsgericht Wien{'\n'}
          Geschäftsführer: Mag.(FH) Thomas Maldoner
        </Text>
      ),
    },
    {
      heading: 'Umsatzsteuer',
      body: (
        <Text style={[styles.body, { color: colors.text.primary }]}>
          UID-Nummer: ATU76962306
        </Text>
      ),
    },
    {
      heading: 'Digital Services Act (EU 2022/2065)',
      body: (
        <Text style={[styles.body, { color: colors.text.primary }]}>
          Meldungen zu rechtswidrigen Inhalten richte bitte an{' '}
          {link('support@kochgourmet.com', () => openMail('support@kochgourmet.com'))}.
        </Text>
      ),
    },
    {
      heading: 'Werbung & Kooperationen',
      body: (
        <Text style={[styles.body, { color: colors.text.primary }]}>
          Anfragen zu Werbekampagnen und Kooperationen an{' '}
          {link('brands@kochgourmet.com', () => openMail('brands@kochgourmet.com'))}.
        </Text>
      ),
    },
    {
      heading: 'Streitbeilegung',
      body: (
        <Text style={[styles.body, { color: colors.text.primary }]}>
          Wir nehmen an keinem Streitschlichtungsverfahren nach Verordnung (EU)
          Nr. 524/2013 teil. Die OS-Plattform der Europäischen Kommission ist
          dennoch erreichbar unter{' '}
          {link('ec.europa.eu/consumers/odr', () =>
            Linking.openURL('https://ec.europa.eu/consumers/odr')
          )}.
        </Text>
      ),
    },
    {
      heading: 'Bildrechte',
      body: (
        <Text style={[styles.body, { color: colors.text.primary }]}>
          Die vollständige Liste der Bildurheber findest du auf{' '}
          {link('kochgourmet.com/impressum/bildrechte', () =>
            Linking.openURL('https://www.kochgourmet.com/impressum/bildrechte')
          )}.
        </Text>
      ),
    },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.secondary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16 }]}>
        <TouchableOpacity
          style={[styles.backCircle, { borderColor: colors.border.primary, backgroundColor: colors.background.card }]}
          onPress={() => router.back()}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text.primary, fontFamily: typography.fontFamily.display }]}>
          Impressum
        </Text>

        {sections.map(section => (
          <View key={section.heading} style={styles.section}>
            <Text style={[styles.sectionHeading, { color: colors.text.primary }]}>
              {section.heading}
            </Text>
            {section.body}
          </View>
        ))}

        <Text style={[styles.disclaimer, { color: colors.text.tertiary }]}>
          Stand: {new Date().toLocaleDateString('de-DE')}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  title: {
    fontSize: 42,
    lineHeight: 52,
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeading: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 6,
  },
  body: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },
  bodyMuted: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  link: {
    fontFamily: 'Inter-SemiBold',
    textDecorationLine: 'underline',
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 8,
  },
});
