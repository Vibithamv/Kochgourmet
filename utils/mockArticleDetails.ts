export interface ArticleSection {
  type: 'heading' | 'text' | 'image' | 'quote' | 'list' | 'product';
  content?: string;
  imageUrl?: string;
  quoteAuthorAvatar?: string;
  quoteAuthorLabel?: string;
  items?: string[];
  productName?: string;
  productImage?: string;
}

export interface ArticleDetail {
  id: string;
  title: string;
  intro: string;
  heroImageUrl: string;
  sections: ArticleSection[];
  relatedRecipeIds: string[];
}

export const MOCK_ARTICLES: ArticleDetail[] = [
  {
    id: '1',
    title: 'Erfrischende Eistee-Ideen für echten Genuss',
    intro:
      'Wenn die Temperaturen steigen, verändert sich auch unser Trinkverhalten. Schweres fällt weg. Frisches rückt in den Fokus. Genau hier zeigt Tee seine sommerliche Stärke. Als Eistee ist er leicht, aromatisch, vielseitig – und eine wohltuende Alternative zu Limonade & Co.',
    heroImageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800',
    sections: [
      {
        type: 'heading',
        content: 'Warum ist Eistee so beliebt?',
      },
      {
        type: 'text',
        content:
          'Die Küche ist einer der am stärksten genutzten Räume im Zuhause. Hier wird gekocht, vorbereitet, gelagert, gespült und oft auch gegessen. Umso wichtiger ist es, dass alles gut organisiert und sauber ist. Ein Küchen-Frühjahrsputz hilft dir dabei, dich von unnötigem Ballast zu trennen, Lebensmittelverschwendung zu reduzieren und wieder bewusster mit deinen Vorräten umzugehen.',
      },
      {
        type: 'image',
        imageUrl: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=800',
      },
      {
        type: 'heading',
        content: 'Die besten Variationen',
      },
      {
        type: 'text',
        content:
          'Ob klassischer Schwarztee mit Zitrone, fruchtiger Hibiskus oder milder Grüntee mit Minze – die Möglichkeiten sind fast unbegrenzt. Kalt gebrüht oder heiß aufgegossen und dann abgekühlt, entfalten die Tees ihr volles Aroma.',
      },
      {
        type: 'quote',
        content: 'Behalte nur die Dinge, die dich glücklich machen.',
        quoteAuthorAvatar: 'https://i.pravatar.cc/150?img=47',
        quoteAuthorLabel: 'BERATERIN | MARIE KONDŌ',
      },
      {
        type: 'heading',
        content: 'Kühlschrank und Gefrierfach neu organisieren',
      },
      {
        type: 'text',
        content:
          'Auch der Kühlschrank verdient beim Küchen-Frühjahrsputz besondere Aufmerksamkeit. Ein gut strukturierter Kühlschrank spart Zeit, erleichtert den Alltag und hilft dabei, Lebensmittel rechtzeitig zu verbrauchen. Wie auf einen Blick erkannt, was vorhanden ist, kaufst gezielter ein und wirft weniger weg.',
      },
      {
        type: 'list',
        items: [
          'Natron neutralisiert unangenehme Gerüche und eignet sich besonders gut für Kühlschrank, Abflüsse oder Vorratsbehälter.',
          'Essig ist ein vielseitiger Helfer im Haushalt und unterstützt dich dabei, Fett, Ablagerungen und leichte Verschmutzungen zu lösen.',
          'Zitronensäure ist ideal, wenn du Kalk entfernen möchtest, zum Beispiel an Geschirrspülern, Armaturen oder Spülbecken.',
        ],
      },
      {
        type: 'image',
        imageUrl: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800',
      },
      {
        type: 'product',
        productName: 'Geschirrtücher 100% Baumwolle',
        productImage: 'https://images.unsplash.com/photo-1558171813-9adfa8b5d5c9?w=400',
      },
    ],
    relatedRecipeIds: ['1', '3', '5', '6'],
  },

  {
    id: '2',
    title: 'Die ausgewogene Vegane Ernährung',
    intro:
      'Wer sich vegan ernährt, lebt nicht nur umweltbewusster – er kann auch seiner Gesundheit etwas Gutes tun. Vorausgesetzt, die Ernährung ist gut geplant und abwechslungsreich. Wir zeigen dir, worauf du achten solltest.',
    heroImageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    sections: [
      {
        type: 'heading',
        content: 'Was bedeutet ausgewogen bei veganer Ernährung?',
      },
      {
        type: 'text',
        content:
          'Eine ausgewogene vegane Ernährung deckt alle wichtigen Nährstoffe ab. Dazu gehören Proteine, gesunde Fette, Kohlenhydrate, Vitamine und Mineralstoffe. Der Schlüssel liegt in der Vielfalt: Je bunter und abwechslungsreicher der Teller, desto besser die Versorgung.',
      },
      {
        type: 'image',
        imageUrl: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=800',
      },
      {
        type: 'heading',
        content: 'Die wichtigsten Nährstoffquellen',
      },
      {
        type: 'list',
        items: [
          'Hülsenfrüchte wie Linsen, Kichererbsen und Bohnen liefern pflanzliches Protein und Eisen.',
          'Nüsse und Samen sind reich an gesunden Fetten, Kalzium und Zink.',
          'Vollkornprodukte versorgen dich mit Ballaststoffen und langanhaltender Energie.',
          'Grünes Blattgemüse ist eine hervorragende Quelle für Kalzium, Magnesium und Vitamin K.',
        ],
      },
      {
        type: 'quote',
        content: 'Essen ist nicht nur Nahrung – es ist Ausdruck von Werten und Lebensfreude.',
        quoteAuthorAvatar: 'https://i.pravatar.cc/150?img=25',
        quoteAuthorLabel: 'ERNÄHRUNGSBERATERIN | LENA WEBER',
      },
      {
        type: 'heading',
        content: 'Auf diese Nährstoffe besonders achten',
      },
      {
        type: 'text',
        content:
          'Vitamin B12 ist der einzige Nährstoff, der bei veganer Ernährung zwingend supplementiert werden sollte. Auch Vitamin D, Jod und Omega-3-Fettsäuren verdienen besondere Aufmerksamkeit. Ein Bluttest beim Arzt gibt Sicherheit.',
      },
      {
        type: 'image',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
      },
    ],
    relatedRecipeIds: ['2', '3', '6', '7'],
  },

  {
    id: '3',
    title: 'Veganer Trend',
    intro:
      'Vegane Küche ist längst kein Nischenthema mehr. Sie hat die Spitzengastronomie erreicht, füllt Supermarktregale und inspiriert Hobbyköche weltweit. Wir erklären, was hinter dem Trend steckt.',
    heroImageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800',
    sections: [
      {
        type: 'heading',
        content: 'Vom Randphänomen zum Mainstream',
      },
      {
        type: 'text',
        content:
          'Noch vor zehn Jahren war veganes Essen in Restaurants eine echte Seltenheit. Heute findet man in nahezu jedem Café, jeder Kantine und jedem Supermarkt plant-based Optionen. Der Wandel ist bemerkenswert schnell gegangen – und er hat gute Gründe.',
      },
      {
        type: 'image',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
      },
      {
        type: 'heading',
        content: 'Warum entscheiden sich so viele Menschen für vegan?',
      },
      {
        type: 'list',
        items: [
          'Umwelt- und Klimaschutz: Pflanzliche Ernährung hat einen deutlich geringeren CO₂-Fußabdruck.',
          'Tierwohl: Immer mehr Menschen wollen keine Kompromisse beim Umgang mit Tieren eingehen.',
          'Gesundheit: Studien zeigen positive Effekte einer pflanzenbasierten Ernährung auf Herz und Stoffwechsel.',
          'Genuss und Kreativität: Die vegane Küche hat eine eigene, aufregende Geschmackswelt entwickelt.',
        ],
      },
      {
        type: 'quote',
        content: 'Die beste Zeit, etwas zu ändern, war gestern. Die zweitbeste Zeit ist jetzt.',
        quoteAuthorAvatar: 'https://i.pravatar.cc/150?img=32',
        quoteAuthorLabel: 'KÜCHENCHEF | FELIX MÜLLER',
      },
      {
        type: 'heading',
        content: 'Innovative Produkte im Blick',
      },
      {
        type: 'text',
        content:
          'Von Hafermilch über pflanzliches Hack bis hin zu veganem Käse – die Produktinnovationen sind beeindruckend. Viele dieser Alternativen haben inzwischen ein Qualitätsniveau erreicht, das selbst Fleischesser überzeugt.',
      },
      {
        type: 'image',
        imageUrl: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=800',
      },
    ],
    relatedRecipeIds: ['2', '4', '5', '8'],
  },
];

export function getArticleDetail(id: string): ArticleDetail {
  return MOCK_ARTICLES.find(a => a.id === id) ?? MOCK_ARTICLES[0];
}
