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

interface Subsection {
  heading?: string;
  body: React.ReactNode;
}

interface Section {
  heading: string;
  subsections: Subsection[];
}

export default function DatenschutzScreen() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const typography = getTypography(theme);
  const insets = useSafeAreaInsets();

  const openMail = (address: string) => void Linking.openURL(`mailto:${address}`);
  const openTel = (number: string) => void Linking.openURL(`tel:${number.replace(/\s/g, '')}`);
  const openLink = (url: string) => void Linking.openURL(url);
  const linkStyle = [styles.link, { color: colors.primary }];

  const body = (text: string) => (
    <Text style={[styles.body, { color: colors.text.primary }]}>{text}</Text>
  );

  const bullet = (items: string[]) => (
    <View style={styles.bulletList}>
      {items.map(item => (
        <View key={item} style={styles.bulletRow}>
          <Text style={[styles.bulletDot, { color: colors.primary }]}>•</Text>
          <Text style={[styles.bulletText, { color: colors.text.primary }]}>{item}</Text>
        </View>
      ))}
    </View>
  );

  const sections: Section[] = [
    {
      heading: 'Verantwortliche Stelle',
      subsections: [{
        body: (
          <Text style={[styles.body, { color: colors.text.primary }]}>
            Kochgourmet Portale & Verlag GmbH{'\n'}
            Kohlmarkt 8–10, 1010 Wien{'\n'}
            Vertreter: Thomas Maldoner{'\n'}
            Telefon: <Text style={linkStyle} onPress={() => openTel('+43 5572 949 949')}>+43 5572 949 949</Text>{'\n'}
            E-Mail: <Text style={linkStyle} onPress={() => openMail('support@kochgourmet.com')}>support@kochgourmet.com</Text>
          </Text>
        ),
      }],
    },
    {
      heading: 'Allgemeine Informationen',
      subsections: [{
        body: body(
          'Wir erfassen personenbezogene Daten sowohl durch deine direkten Eingaben (Kontaktformulare, Registrierung) als auch automatisch durch technische Systeme. Diese Daten werden zur Bereitstellung der Website, zur fehlerfreien Darstellung und zur Analyse des Nutzerverhaltens verwendet.'
        ),
      }],
    },
    {
      heading: 'Hosting',
      subsections: [{
        body: body(
          'Die Website wird bei All-Inkl gehostet (ALL-INKL.COM – Neue Medien Münnich, Hauptstraße 68, 02742 Friedersdorf). Ein Auftragsverarbeitungsvertrag regelt die Datenschutzkonformität.'
        ),
      }],
    },
    {
      heading: 'Datenerfassung auf der Website',
      subsections: [
        {
          heading: 'Cookies',
          body: (
            <>
              {body('Wir verwenden verschiedene Arten von Cookies:')}
              {bullet([
                'Session-Cookies — werden nach Sitzungsende automatisch gelöscht',
                'Permanente Cookies — bleiben bis zur manuellen Löschung gespeichert',
                'Third-Party-Cookies — von Drittanbietern für Zahlungsdienstleistungen',
              ])}
              {body(
                'Notwendige Cookies basieren auf berechtigtem Interesse (Art. 6 Abs. 1 lit. f DSGVO). Andere Cookies erfordern deine Zustimmung gemäß § 25 Abs. 1 TDDDG.'
              )}
            </>
          ),
        },
        {
          heading: 'Server-Log-Dateien',
          body: body(
            'Automatisch erfasst werden: Browsertyp, Betriebssystem, Referrer-URL, Hostname, Anfrageuhrzeit und IP-Adresse. Rechtsgrundlage ist das berechtigte Interesse an einer technisch fehlerfreien Darstellung.'
          ),
        },
        {
          heading: 'Kontaktformular und E-Mail',
          body: body(
            'Daten werden zur Anfrageverarbeitung gespeichert. Rechtsgrundlage: Art. 6 Abs. 1 lit. b oder f DSGVO. Speicherdauer bis zur Erledigung oder bis zu deiner Löschungsaufforderung.'
          ),
        },
        {
          heading: 'Registrierung',
          body: body(
            'Pflichtangaben sind für die Vertragsdurchführung erforderlich (Art. 6 Abs. 1 lit. b DSGVO) und werden nach Abmeldung gelöscht.'
          ),
        },
      ],
    },
    {
      heading: 'Deine Rechte',
      subsections: [{
        body: (
          <>
            {body('Du hast jederzeit folgende Rechte:')}
            {bullet([
              'Auskunftspflicht — unentgeltliche Informationen zu deinen gespeicherten Daten',
              'Berichtigungsrecht — Korrektur falscher Daten',
              'Löschungsrecht — „Recht auf Vergessenwerden"',
              'Einschränkung der Verarbeitung',
              'Datenportabilität — Aushändigung in maschinenlesbarem Format',
              'Widerspruchsrecht — gegen Direktwerbung und bestimmte Verarbeitungen',
              'Beschwerderecht bei der Aufsichtsbehörde',
            ])}
          </>
        ),
      }],
    },
    {
      heading: 'Soziale Medien',
      subsections: [{
        heading: 'Instagram',
        body: body(
          'Meta Platforms Ireland Limited (Dublin 4) erhält Besuchsinformationen. Wenn du eingeloggt bist, können Besuche deinem Profil zugeordnet werden. Gemeinsame Verantwortlichkeit nach Art. 26 DSGVO. Datenübertragung in die USA erfolgt über Standardvertragsklauseln.'
        ),
      }],
    },
    {
      heading: 'Analyse und Werbung',
      subsections: [
        {
          heading: 'Google Analytics',
          body: (
            <>
              {bullet([
                'Erfasst Seitenaufrufe, Verweildauer, Betriebssystem, Herkunft',
                'Nutzt Cookies und Device-Fingerprinting',
                'IP-Anonymisierung ist aktiviert',
                'Datenübertragung in die USA via Standardvertragsklauseln',
                'Basis: deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)',
              ])}
            </>
          ),
        },
        {
          heading: 'Google AdSense',
          body: body(
            'Zeigt zielgerichtete Werbung basierend auf Interessen. Nutzt Cookies und Web Beacons. Datenübertragung in die USA möglich.'
          ),
        },
      ],
    },
    {
      heading: 'Newsletter (Rapidmail)',
      subsections: [{
        body: (
          <>
            {bullet([
              'E-Mail-Adresse wird zur Newsletter-Verwaltung benötigt',
              'Tracking-Pixel zur Erfassung von Öffnungen und Klicks',
              'Rechtsgrundlage: Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)',
              'Nach Austragung kann die E-Mail in einer Blacklist gespeichert werden',
              'Auftragsverarbeitungsvertrag abgeschlossen',
            ])}
          </>
        ),
      }],
    },
    {
      heading: 'Plugins und Tools',
      subsections: [
        {
          heading: 'YouTube',
          body: body(
            'Google Ireland Limited (Dublin) betreibt den Service. Bei eingebetteten Videos wird eine Verbindung zu YouTube-Servern hergestellt. Cookies und Device-Fingerprinting möglich. Rechtsgrundlage: berechtigtes Interesse oder Einwilligung.'
          ),
        },
        {
          heading: 'Google Fonts',
          body: body(
            'Schriftarten werden von Google-Servern geladen. Deine IP-Adresse wird dabei übermittelt. Rechtsgrundlage: berechtigtes Interesse an einer einheitlichen Darstellung.'
          ),
        },
        {
          heading: 'Google Maps',
          body: body(
            'Der Kartendienst speichert IP-Adressen und überträgt sie an Google-Server in die USA. Datenübertragung via Standardvertragsklauseln. Rechtsgrundlage: berechtigtes Interesse oder Einwilligung.'
          ),
        },
      ],
    },
    {
      heading: 'Rechtsgrundlagen',
      subsections: [{
        body: (
          <>
            {bullet([
              'Art. 6 Abs. 1 lit. a DSGVO — Einwilligung',
              'Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung',
              'Art. 6 Abs. 1 lit. c DSGVO — Rechtliche Verpflichtung',
              'Art. 6 Abs. 1 lit. f DSGVO — Berechtigtes Interesse',
              '§ 25 Abs. 1 TDDDG — Cookie-Speicherung',
            ])}
          </>
        ),
      }],
    },
    {
      heading: 'Datenschutz-Features',
      subsections: [{
        body: (
          <>
            {bullet([
              'SSL/TLS-Verschlüsselung schützt die Datenübertragung',
              'Einwilligungen sind jederzeit widerrufbar',
              'Daten werden nach Zweckentfall gelöscht (gesetzliche Aufbewahrungsfristen beachtet)',
            ])}
          </>
        ),
      }],
    },
    {
      heading: 'Vollständige Fassung',
      subsections: [{
        body: (
          <Text style={[styles.body, { color: colors.text.primary }]}>
            Die vollständige Datenschutzerklärung findest du auf{' '}
            <Text style={linkStyle} onPress={() => openLink('https://www.kochgourmet.com/datenschutz')}>
              kochgourmet.com/datenschutz
            </Text>.
          </Text>
        ),
      }],
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
          Datenschutz
        </Text>

        {sections.map(section => (
          <View key={section.heading} style={styles.section}>
            <Text style={[styles.sectionHeading, { color: colors.text.primary }]}>
              {section.heading}
            </Text>
            {section.subsections.map((sub, i) => (
              <View key={sub.heading ?? `${section.heading}-${i}`} style={styles.subsection}>
                {sub.heading && (
                  <Text style={[styles.subHeading, { color: colors.text.primary }]}>
                    {sub.heading}
                  </Text>
                )}
                {sub.body}
              </View>
            ))}
          </View>
        ))}

        <Text style={[styles.disclaimer, { color: colors.text.tertiary }]}>
          Gültig ab: 24.07.2025
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
    marginBottom: 20,
  },
  section: { marginBottom: 24 },
  sectionHeading: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 10,
  },
  subsection: { marginBottom: 12 },
  subHeading: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  link: {
    fontFamily: 'Inter-SemiBold',
    textDecorationLine: 'underline',
  },
  bulletList: { gap: 4, marginVertical: 4 },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bulletDot: { fontSize: 14, lineHeight: 22 },
  bulletText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 8,
  },
});
