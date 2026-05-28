/** Mock recipe detail data for the demo. Keyed by recipe id. */

export interface RecipeIngredient {
  amount: string;
  unit: string;
  name: string;
}

export interface RecipeIngredientSection {
  title: string;
  items: RecipeIngredient[];
}

export interface RecipeStep {
  number: number;
  total: number;
  text: string;
}

export interface RecipeNutrition {
  label: string;
  value: string;
}

export interface RecipeDetail {
  id: string;
  title: string;
  imageUrl: string;
  bakeDurationMinutes: number;
  prepDurationMinutes: number;
  servings: number;
  author: { name: string; avatarUrl: string };
  nutrition: RecipeNutrition[];
  ingredientSections: RecipeIngredientSection[];
  steps: RecipeStep[];
}

const AUTHOR_FABIAN = { name: 'fabian', avatarUrl: 'https://i.pravatar.cc/150?img=12' };
const AUTHOR_MARIA  = { name: 'maria',  avatarUrl: 'https://i.pravatar.cc/150?img=5' };
const AUTHOR_LUKAS  = { name: 'lukas',  avatarUrl: 'https://i.pravatar.cc/150?img=33' };

export const MOCK_RECIPE_DETAILS: Record<string, RecipeDetail> = {

  '1': {
    id: '1',
    title: 'Fränkischer Bratwurst Döner',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800',
    bakeDurationMinutes: 40,
    prepDurationMinutes: 20,
    servings: 4,
    author: AUTHOR_LUKAS,
    nutrition: [
      { label: 'Kalorien', value: '480 kcal' },
      { label: 'Fett', value: '22 g' },
      { label: 'Kohlenhydrate', value: '42 g' },
      { label: 'Protein', value: '28 g' },
      { label: 'Salz', value: '1.8 g' },
    ],
    ingredientSections: [
      {
        title: 'Für den Döner',
        items: [
          { amount: '4', unit: 'Stück', name: 'Fränkische Bratwürste' },
          { amount: '4', unit: 'Stück', name: 'Fladenbrot (Dürüm)' },
          { amount: '1', unit: 'Kopf', name: 'Eisbergsalat, fein geschnitten' },
          { amount: '2', unit: 'Stück', name: 'Tomaten, gewürfelt' },
          { amount: '1', unit: 'Stück', name: 'Rote Zwiebel, in Ringe' },
        ],
      },
      {
        title: 'Für die Sauce',
        items: [
          { amount: '200 g', unit: '', name: 'Joghurt (3,5 %)' },
          { amount: '2', unit: 'EL', name: 'Mayonnaise' },
          { amount: '1', unit: 'TL', name: 'Knoblauchpulver' },
          { amount: '1', unit: 'TL', name: 'Paprikapulver (edelsüß)' },
          { amount: '', unit: '', name: 'Salz und Pfeffer nach Geschmack' },
        ],
      },
    ],
    steps: [
      { number: 1, total: 4, text: 'Die Bratwürste auf dem Grill oder in der Pfanne bei mittlerer Hitze ca. 8–10 Minuten rundum goldbraun braten, bis sie vollständig durchgegart sind.' },
      { number: 2, total: 4, text: 'Für die Sauce Joghurt, Mayonnaise, Knoblauchpulver und Paprikapulver verrühren. Mit Salz und Pfeffer abschmecken und kalt stellen.' },
      { number: 3, total: 4, text: 'Das Fladenbrot kurz in der Pfanne oder im Ofen bei 180 °C für 3 Minuten anwärmen, damit es weich und geschmeidig wird.' },
      { number: 4, total: 4, text: 'Das Brot aufklappen, großzügig mit Sauce bestreichen, dann Salat, Tomaten, Zwiebelringe und die geschnittenen Bratwürste belegen. Sofort servieren.' },
    ],
  },

  '2': {
    id: '2',
    title: 'Veganer Döner-Flammkuchen',
    imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800',
    bakeDurationMinutes: 30,
    prepDurationMinutes: 15,
    servings: 5,
    author: AUTHOR_FABIAN,
    nutrition: [
      { label: 'Kalorien', value: '220 kcal' },
      { label: 'Fett', value: '8 g' },
      { label: 'Kohlenhydrate', value: '25 g' },
      { label: 'Protein', value: '10 g' },
      { label: 'Zucker', value: '3 g' },
    ],
    ingredientSections: [
      {
        title: 'Für den Flammkuchen',
        items: [
          { amount: '1', unit: 'Packung', name: 'Flammkuchenteig' },
          { amount: '80 g', unit: '', name: 'veganes Dönerflleisch (Alternativ: veganes Grilled Chicken)' },
          { amount: '1', unit: 'TL', name: 'vegane Kräutercreme' },
          { amount: '0.5', unit: '', name: 'Zwiebel (Rot)' },
          { amount: '1', unit: 'TL', name: 'Öl' },
          { amount: '1', unit: 'Prise', name: 'Salz' },
          { amount: '1', unit: 'Prise', name: 'Pfeffer' },
        ],
      },
      {
        title: 'Für die frische Topping',
        items: [
          { amount: '', unit: '', name: 'Salatgurke (nach belieben)' },
          { amount: '1', unit: 'Blatt', name: 'Eisblattsalat' },
          { amount: '1', unit: 'TL', name: 'Sriracha-Sauce (optional)' },
        ],
      },
    ],
    steps: [
      { number: 1, total: 6, text: 'Die Zwiebel schälen und in feine Würfel schneiden. Die Gurke zuerst in dünne Scheiben schneiden und anschließend klein würfeln.' },
      { number: 2, total: 6, text: 'Das vegane Dönerflleisch in einer Pfanne mit etwas Öl bei mittlerer Hitze kurz anbraten, bis es leicht gebräunt ist.' },
      { number: 3, total: 6, text: 'Den Flammkuchenteig auf ein Backblech legen und gleichmäßig mit der veganen Kräutercreme bestreichen.' },
      { number: 4, total: 6, text: 'Das gebratene vegane Dönerflleisch locker auf die Creme verteilen. Zwiebeln darübergeben und gleichmäßig auf dem Fladen verteilen.' },
      { number: 5, total: 6, text: 'Den Flammkuchen bei 220 °C für 12–15 Minuten backen, bis der Teig goldbraun und knusprig ist.' },
      { number: 6, total: 6, text: 'Mit frischer Gurke, Eisblattsalat und optional Sriracha-Sauce toppen und sofort servieren.' },
    ],
  },

  '3': {
    id: '3',
    title: 'Brazil Limonade',
    imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800',
    bakeDurationMinutes: 0,
    prepDurationMinutes: 5,
    servings: 2,
    author: AUTHOR_MARIA,
    nutrition: [
      { label: 'Kalorien', value: '180 kcal' },
      { label: 'Fett', value: '5 g' },
      { label: 'Kohlenhydrate', value: '30 g' },
      { label: 'Protein', value: '3 g' },
      { label: 'Zucker', value: '26 g' },
    ],
    ingredientSections: [
      {
        title: 'Zutaten',
        items: [
          { amount: '3', unit: 'Stück', name: 'Bio-Limetten (ungewachst)' },
          { amount: '100 ml', unit: '', name: 'gesüßte Kondensmilch' },
          { amount: '400 ml', unit: '', name: 'kaltes Wasser' },
          { amount: '200 g', unit: '', name: 'Eiswürfel' },
          { amount: '2', unit: 'EL', name: 'Zucker (nach Geschmack)' },
        ],
      },
    ],
    steps: [
      { number: 1, total: 3, text: 'Die Limetten gründlich waschen und in grobe Stücke schneiden – mit Schale! Die weiße Innenhaut der Schale enthält wichtige Aromen, macht das Getränk aber leicht bitter.' },
      { number: 2, total: 3, text: 'Limettenstücke, Kondensmilch, Zucker, Wasser und Eiswürfel in den Mixer geben. Auf höchster Stufe ca. 20 Sekunden mixen.' },
      { number: 3, total: 3, text: 'Das Getränk durch ein feines Sieb oder Tuch gießen, um die Schalen herauszufiltern. Sofort in Gläser füllen und mit einer Limettenscheibe garnieren.' },
    ],
  },

  '4': {
    id: '4',
    title: 'Kinderriegel Cheesecake',
    imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800',
    bakeDurationMinutes: 0,
    prepDurationMinutes: 25,
    servings: 8,
    author: AUTHOR_MARIA,
    nutrition: [
      { label: 'Kalorien', value: '420 kcal' },
      { label: 'Fett', value: '24 g' },
      { label: 'Kohlenhydrate', value: '46 g' },
      { label: 'Protein', value: '7 g' },
      { label: 'Zucker', value: '34 g' },
    ],
    ingredientSections: [
      {
        title: 'Für den Boden',
        items: [
          { amount: '200 g', unit: '', name: 'Butterkekse' },
          { amount: '80 g', unit: '', name: 'Butter, geschmolzen' },
        ],
      },
      {
        title: 'Für die Creme',
        items: [
          { amount: '400 g', unit: '', name: 'Frischkäse (Doppelrahmstufe)' },
          { amount: '200 ml', unit: '', name: 'Sahne, geschlagen' },
          { amount: '6', unit: 'Stück', name: 'Kinderriegel' },
          { amount: '80 g', unit: '', name: 'Puderzucker' },
          { amount: '1', unit: 'TL', name: 'Vanilleextrakt' },
        ],
      },
    ],
    steps: [
      { number: 1, total: 4, text: 'Butterkekse in einem Blitzhacker fein zerkleinern und mit der geschmolzenen Butter vermengen. In eine 20 cm Springform drücken und 15 Minuten kalt stellen.' },
      { number: 2, total: 4, text: 'Die Kinderriegel fein hacken. Frischkäse, Puderzucker und Vanilleextrakt cremig rühren. Die Hälfte der gehackten Kinderriegel unterheben.' },
      { number: 3, total: 4, text: 'Die geschlagene Sahne vorsichtig unter die Frischkäsemasse heben. Die Creme auf dem Keksboden verteilen und glatt streichen.' },
      { number: 4, total: 4, text: 'Mit den restlichen Kinderriegel-Stücken dekorieren und mindestens 3 Stunden (besser über Nacht) im Kühlschrank fest werden lassen.' },
    ],
  },

  '5': {
    id: '5',
    title: "Nicht gegrillter Dickmann's Smores",
    imageUrl: 'https://images.unsplash.com/photo-1481070414801-51fd732d7184?w=800',
    bakeDurationMinutes: 0,
    prepDurationMinutes: 2,
    servings: 1,
    author: AUTHOR_FABIAN,
    nutrition: [
      { label: 'Kalorien', value: '210 kcal' },
      { label: 'Fett', value: '9 g' },
      { label: 'Kohlenhydrate', value: '30 g' },
      { label: 'Protein', value: '2 g' },
      { label: 'Zucker', value: '22 g' },
    ],
    ingredientSections: [
      {
        title: 'Zutaten',
        items: [
          { amount: '2', unit: 'Stück', name: "Dickmann's Schokoküsse" },
          { amount: '2', unit: 'Stück', name: 'Graham Cracker oder Vollkornkekse' },
          { amount: '1', unit: 'TL', name: 'Nutella oder dunkle Schokolade' },
        ],
      },
    ],
    steps: [
      { number: 1, total: 2, text: "Einen Dickmann auf einen Keks legen und mit einem zweiten Keks belegen. Leicht andrücken, damit die Marshmallow-Schicht etwas herausquillt." },
      { number: 2, total: 2, text: "Optional: Keks kurz in die Mikrowelle (10 Sekunden) geben, damit die Marshmallowschicht etwas weicher wird. Mit einem Klecks Nutella verfeinern und sofort genießen." },
    ],
  },

  '6': {
    id: '6',
    title: 'Karamelisiert Zwiebelpasta',
    imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800',
    bakeDurationMinutes: 20,
    prepDurationMinutes: 5,
    servings: 2,
    author: AUTHOR_LUKAS,
    nutrition: [
      { label: 'Kalorien', value: '520 kcal' },
      { label: 'Fett', value: '18 g' },
      { label: 'Kohlenhydrate', value: '72 g' },
      { label: 'Protein', value: '14 g' },
      { label: 'Salz', value: '1.2 g' },
    ],
    ingredientSections: [
      {
        title: 'Zutaten',
        items: [
          { amount: '4', unit: 'große', name: 'Zwiebeln, in Ringe geschnitten' },
          { amount: '3', unit: 'EL', name: 'Butter' },
          { amount: '1', unit: 'EL', name: 'Olivenöl' },
          { amount: '1', unit: 'TL', name: 'Zucker' },
          { amount: '100 ml', unit: '', name: 'Weißwein (oder Gemüsebrühe)' },
          { amount: '250 g', unit: '', name: 'Pasta (z.B. Tagliatelle)' },
          { amount: '40 g', unit: '', name: 'Parmesan, gerieben' },
          { amount: '', unit: '', name: 'Salz, Pfeffer, frischer Thymian' },
        ],
      },
    ],
    steps: [
      { number: 1, total: 4, text: 'Butter und Olivenöl in einer großen Pfanne bei mittlerer Hitze schmelzen. Die Zwiebeln mit einer Prise Salz zugeben und bei niedriger Hitze 30–40 Minuten langsam karamelisieren, dabei gelegentlich umrühren.' },
      { number: 2, total: 4, text: 'Zucker einrühren und 2 weitere Minuten karamelisieren lassen. Mit Weißwein ablöschen und einkochen lassen. Mit Salz, Pfeffer und frischem Thymian würzen.' },
      { number: 3, total: 4, text: 'Pasta in reichlich Salzwasser al dente kochen. Etwa 100 ml Kochwasser auffangen, dann abgießen.' },
      { number: 4, total: 4, text: 'Pasta zu den Zwiebeln geben, Kochwasser nach Bedarf zugeben und gut vermischen. Mit geriebenem Parmesan anrichten und sofort servieren.' },
    ],
  },

  '7': {
    id: '7',
    title: 'Allgäuer Käsespätzle',
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    bakeDurationMinutes: 20,
    prepDurationMinutes: 40,
    servings: 4,
    author: AUTHOR_MARIA,
    nutrition: [
      { label: 'Kalorien', value: '620 kcal' },
      { label: 'Fett', value: '32 g' },
      { label: 'Kohlenhydrate', value: '58 g' },
      { label: 'Protein', value: '26 g' },
      { label: 'Calcium', value: '480 mg' },
    ],
    ingredientSections: [
      {
        title: 'Für die Spätzle',
        items: [
          { amount: '400 g', unit: '', name: 'Weizenmehl (Type 405)' },
          { amount: '4', unit: 'Stück', name: 'Eier (Größe M)' },
          { amount: '180 ml', unit: '', name: 'lauwarmes Wasser' },
          { amount: '1', unit: 'TL', name: 'Salz' },
          { amount: '1', unit: 'Prise', name: 'Muskatnuss, gerieben' },
        ],
      },
      {
        title: 'Zum Überbacken',
        items: [
          { amount: '250 g', unit: '', name: 'Allgäuer Emmentaler, gerieben' },
          { amount: '2', unit: 'große', name: 'Zwiebeln, in Ringe' },
          { amount: '3', unit: 'EL', name: 'Butter' },
          { amount: '', unit: '', name: 'Schnittlauch zum Garnieren' },
        ],
      },
    ],
    steps: [
      { number: 1, total: 5, text: 'Mehl, Eier, Wasser, Salz und Muskat zu einem zähflüssigen Teig verrühren. Der Teig sollte blasen werfen, wenn man ihn schlägt. 20 Minuten ruhen lassen.' },
      { number: 2, total: 5, text: 'Einen großen Topf Salzwasser zum Kochen bringen. Teig portionsweise durch ein Spätzlesieb oder einen Spätzlehobel ins kochende Wasser drücken.' },
      { number: 3, total: 5, text: 'Sobald die Spätzle oben schwimmen (ca. 2–3 Minuten), mit einer Schaumkelle herausheben und in einer gefetteten Auflaufform schichten – abwechselnd Spätzle und Käse.' },
      { number: 4, total: 5, text: 'Butter in einer Pfanne erhitzen und die Zwiebeln darin goldbraun karamelisieren. Über die Käsespätzle geben.' },
      { number: 5, total: 5, text: 'Die Auflaufform bei 180 °C (Umluft) für 15–20 Minuten im Ofen überbacken, bis der Käse goldbraun und blubbrig ist. Mit Schnittlauch bestreuen und heiß servieren.' },
    ],
  },

  '8': {
    id: '8',
    title: 'Klassische Gulaschsuppe',
    imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800',
    bakeDurationMinutes: 80,
    prepDurationMinutes: 10,
    servings: 6,
    author: AUTHOR_LUKAS,
    nutrition: [
      { label: 'Kalorien', value: '340 kcal' },
      { label: 'Fett', value: '16 g' },
      { label: 'Kohlenhydrate', value: '22 g' },
      { label: 'Protein', value: '28 g' },
      { label: 'Ballaststoffe', value: '3 g' },
    ],
    ingredientSections: [
      {
        title: 'Für die Suppe',
        items: [
          { amount: '600 g', unit: '', name: 'Rindergulasch, gewürfelt' },
          { amount: '3', unit: 'große', name: 'Zwiebeln, gewürfelt' },
          { amount: '3', unit: 'Stück', name: 'Knoblauchzehen, gehackt' },
          { amount: '2', unit: 'EL', name: 'Tomatenmark' },
          { amount: '2', unit: 'TL', name: 'Paprikapulver (edelsüß)' },
          { amount: '1', unit: 'TL', name: 'Paprikapulver (scharf)' },
          { amount: '1', unit: 'TL', name: 'Kümmel, gemahlen' },
          { amount: '1.5 l', unit: '', name: 'Rinderbrühe' },
          { amount: '3', unit: 'Stück', name: 'Kartoffeln, gewürfelt' },
          { amount: '2', unit: 'Stück', name: 'Paprika (rot & gelb), gewürfelt' },
          { amount: '2', unit: 'EL', name: 'Öl' },
          { amount: '', unit: '', name: 'Salz, Pfeffer, Lorbeerblätter' },
        ],
      },
    ],
    steps: [
      { number: 1, total: 4, text: 'Öl in einem großen Topf erhitzen. Fleisch in Portionen scharf anbraten, bis es rundum gebräunt ist, dann herausnehmen. Im selben Topf die Zwiebeln glasig dünsten, Knoblauch zugeben und kurz mitbraten.' },
      { number: 2, total: 4, text: 'Tomatenmark einrühren und kurz rösten. Beide Paprikapulver und Kümmel zugeben und 1 Minute mitrösten. Das Fleisch zurück in den Topf geben.' },
      { number: 3, total: 4, text: 'Mit Rinderbrühe ablöschen, Lorbeerblätter zugeben, aufkochen und bei niedriger Hitze abgedeckt 50 Minuten köcheln lassen.' },
      { number: 4, total: 4, text: 'Kartoffeln und Paprika zugeben und weitere 20–25 Minuten garen, bis beides weich ist. Mit Salz und Pfeffer abschmecken, Lorbeer entfernen und mit Brot oder Brötchen servieren.' },
    ],
  },
};

// ─── Themed demo recipes used by Favoriten → Ordner thumbnails ────────────────
// Compact factory so each entry stays readable.

interface DemoRecipeInput {
  id: string;
  title: string;
  imageUrl: string;
  bake: number;
  prep: number;
  servings: number;
  author?: 'fabian' | 'maria' | 'lukas';
  nutrition: [string, string][];
  ingredients: { title: string; items: [string, string, string][] }[];
  steps: string[];
}

function demoRecipe(d: DemoRecipeInput): RecipeDetail {
  const authorMap = { fabian: AUTHOR_FABIAN, maria: AUTHOR_MARIA, lukas: AUTHOR_LUKAS };
  return {
    id: d.id,
    title: d.title,
    imageUrl: d.imageUrl,
    bakeDurationMinutes: d.bake,
    prepDurationMinutes: d.prep,
    servings: d.servings,
    author: authorMap[d.author ?? 'maria'],
    nutrition: d.nutrition.map(([label, value]) => ({ label, value })),
    ingredientSections: d.ingredients.map(sec => ({
      title: sec.title,
      items: sec.items.map(([amount, unit, name]) => ({ amount, unit, name })),
    })),
    steps: d.steps.map((text, i) => ({ number: i + 1, total: d.steps.length, text })),
  };
}

const DEFAULT_NUTRITION: [string, string][] = [
  ['Kalorien', '320 kcal'],
  ['Fett', '12 g'],
  ['Kohlenhydrate', '38 g'],
  ['Protein', '8 g'],
];

const THEMED_RECIPES: DemoRecipeInput[] = [
  // ─── Sommer Cocktails ───────────────────────────────────────────────────
  {
    id: 'cocktail-aperol', title: 'Aperol Spritz Klassik',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800',
    bake: 0, prep: 3, servings: 1, author: 'maria',
    nutrition: [['Kalorien', '180 kcal'], ['Alkohol', '11 %'], ['Zucker', '14 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['9', 'cl', 'Prosecco'],
        ['6', 'cl', 'Aperol'],
        ['3', 'cl', 'Soda Wasser'],
        ['1', 'Scheibe', 'Orange'],
        ['', '', 'Eiswürfel'],
      ],
    }],
    steps: [
      'Ein großes Weinglas mit Eiswürfeln füllen.',
      'Prosecco und Aperol im Verhältnis 3:2 eingießen, vorsichtig mit Soda auffüllen.',
      'Mit einer Orangenscheibe garnieren und sofort genießen.',
    ],
  },
  {
    id: 'cocktail-hugo', title: 'Hugo mit Holunderblüte',
    imageUrl: 'https://images.unsplash.com/photo-1587223962930-cb7f31384c19?w=800',
    bake: 0, prep: 4, servings: 1, author: 'maria',
    nutrition: [['Kalorien', '160 kcal'], ['Alkohol', '9 %'], ['Zucker', '10 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['10', 'cl', 'Prosecco'],
        ['2', 'cl', 'Holunderblütensirup'],
        ['3', 'cl', 'Soda Wasser'],
        ['1', 'Zweig', 'frische Minze'],
        ['1', 'Scheibe', 'Limette'],
      ],
    }],
    steps: [
      'Glas mit Eis füllen, Minze leicht andrücken.',
      'Holunderblütensirup, Prosecco und Soda zugeben.',
      'Mit Limettenscheibe servieren.',
    ],
  },
  {
    id: 'cocktail-mojito', title: 'Erdbeer-Mojito',
    imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800',
    bake: 0, prep: 5, servings: 1, author: 'lukas',
    nutrition: [['Kalorien', '210 kcal'], ['Alkohol', '12 %'], ['Zucker', '18 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['5', 'cl', 'weißer Rum'],
        ['3', '', 'reife Erdbeeren'],
        ['8', 'Blätter', 'Minze'],
        ['2', 'TL', 'Rohrzucker'],
        ['3', 'cl', 'Limettensaft'],
        ['', '', 'Crushed Ice & Soda'],
      ],
    }],
    steps: [
      'Erdbeeren in Stücke schneiden, mit Zucker und Minze im Glas zerstoßen.',
      'Limettensaft, Rum und Crushed Ice hinzufügen.',
      'Mit Soda auffüllen und mit einem Minzzweig garnieren.',
    ],
  },
  {
    id: 'cocktail-eistee', title: 'Hausgemachter Pfirsich-Eistee',
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800',
    bake: 0, prep: 10, servings: 4, author: 'maria',
    nutrition: [['Kalorien', '90 kcal'], ['Zucker', '15 g'], ['Koffein', '20 mg']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['4', 'Beutel', 'Schwarztee'],
        ['1 l', '', 'Wasser'],
        ['2', '', 'reife Pfirsiche'],
        ['2', 'EL', 'Honig'],
        ['1', '', 'Zitrone (Saft)'],
        ['', '', 'Eiswürfel & Minze'],
      ],
    }],
    steps: [
      'Tee 5 Minuten ziehen lassen, dann abkühlen.',
      'Pfirsiche pürieren und mit Honig sowie Zitronensaft verrühren.',
      'Mit dem kalten Tee mischen und mit Eis & Minze servieren.',
    ],
  },
  {
    id: 'cocktail-glitzer', title: 'Glitzer Spritz Bowle',
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800',
    bake: 0, prep: 8, servings: 6, author: 'maria',
    nutrition: [['Kalorien', '170 kcal'], ['Alkohol', '8 %']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['1', 'Flasche', 'Glitzer Spritz Likör'],
        ['1', 'Flasche', 'Prosecco'],
        ['400 ml', '', 'Orangensaft'],
        ['1', '', 'Orange in Scheiben'],
        ['', '', 'Eis'],
      ],
    }],
    steps: [
      'Alle Zutaten in einer großen Bowle vermischen.',
      'Mit Orangenscheiben und Eis garnieren.',
      'Gut gekühlt servieren.',
    ],
  },
  {
    id: 'cocktail-corona', title: 'Corona Sunset',
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800',
    bake: 0, prep: 2, servings: 1, author: 'lukas',
    nutrition: [['Kalorien', '150 kcal'], ['Alkohol', '4.5 %']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['1', 'Flasche', 'Corona Extra'],
        ['1', 'Spritzer', 'Limettensaft'],
        ['1', 'Scheibe', 'Limette'],
      ],
    }],
    steps: [
      'Flasche gut kühlen.',
      'Mit einem Spritzer Limette aufpeppen und Limettenscheibe in den Hals stecken.',
    ],
  },

  // ─── Dessert ────────────────────────────────────────────────────────────
  {
    id: 'dessert-tiramisu', title: 'Klassisches Tiramisu',
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800',
    bake: 0, prep: 30, servings: 6, author: 'maria',
    nutrition: [['Kalorien', '410 kcal'], ['Fett', '22 g'], ['Zucker', '26 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['250 g', '', 'Mascarpone'],
        ['3', '', 'Eier (getrennt)'],
        ['80 g', '', 'Zucker'],
        ['1', 'Pck', 'Löffelbiskuit'],
        ['200 ml', '', 'starker Espresso'],
        ['2', 'EL', 'Amaretto'],
        ['', '', 'Kakaopulver zum Bestäuben'],
      ],
    }],
    steps: [
      'Eigelb mit Zucker schaumig schlagen, Mascarpone unterrühren.',
      'Eiweiß steif schlagen und unterheben.',
      'Löffelbiskuit kurz in Espresso-Amaretto-Mischung tunken und in eine Form schichten.',
      'Creme darauf verteilen, wiederholen. Mind. 4 h kalt stellen.',
      'Vor dem Servieren mit Kakao bestäuben.',
    ],
  },
  {
    id: 'dessert-mousse', title: 'Schokomousse mit Beeren',
    imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800',
    bake: 0, prep: 20, servings: 4, author: 'maria',
    nutrition: [['Kalorien', '380 kcal'], ['Fett', '24 g'], ['Zucker', '28 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['200 g', '', 'Zartbitterschokolade'],
        ['300 ml', '', 'Sahne'],
        ['3', '', 'Eier'],
        ['50 g', '', 'Zucker'],
        ['150 g', '', 'gemischte Beeren'],
      ],
    }],
    steps: [
      'Schokolade über Wasserbad schmelzen, leicht abkühlen.',
      'Sahne und Eier (getrennt) steif schlagen, mit Zucker mischen.',
      'Schokolade unter die Sahne heben, dann Eischnee unterheben.',
      'Mind. 4 h kalt stellen und mit Beeren servieren.',
    ],
  },
  {
    id: 'dessert-pannacotta', title: 'Vanille-Panna-Cotta',
    imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800',
    bake: 0, prep: 15, servings: 4, author: 'maria',
    nutrition: [['Kalorien', '340 kcal'], ['Fett', '22 g'], ['Zucker', '24 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['500 ml', '', 'Sahne'],
        ['80 g', '', 'Zucker'],
        ['1', '', 'Vanilleschote'],
        ['3', 'Blatt', 'Gelatine'],
        ['200 g', '', 'Himbeeren'],
      ],
    }],
    steps: [
      'Gelatine in kaltem Wasser einweichen.',
      'Sahne mit Zucker und Vanille aufkochen, Gelatine darin auflösen.',
      'In Förmchen gießen, mind. 4 h kühlen.',
      'Stürzen und mit Himbeeren servieren.',
    ],
  },
  {
    id: 'dessert-eis', title: 'Selbstgemachtes Mango-Eis',
    imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800',
    bake: 0, prep: 10, servings: 4, author: 'lukas',
    nutrition: [['Kalorien', '180 kcal'], ['Zucker', '28 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['2', '', 'reife Mangos'],
        ['200 ml', '', 'Kokosmilch'],
        ['3', 'EL', 'Honig'],
        ['1', '', 'Limette (Saft)'],
      ],
    }],
    steps: [
      'Mango schälen, würfeln und mit den anderen Zutaten pürieren.',
      'In eine Form gießen und 4 h gefrieren.',
      'Vor dem Servieren 5 Minuten antauen lassen.',
    ],
  },

  // ─── Meal Prep ──────────────────────────────────────────────────────────
  {
    id: 'prep-bowl', title: 'Quinoa Power Bowl',
    imageUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800',
    bake: 0, prep: 25, servings: 4, author: 'fabian',
    nutrition: [['Kalorien', '450 kcal'], ['Protein', '18 g'], ['Ballaststoffe', '10 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['200 g', '', 'Quinoa'],
        ['1', 'Dose', 'Kichererbsen'],
        ['1', '', 'Avocado'],
        ['200 g', '', 'Kirschtomaten'],
        ['1', '', 'Gurke'],
        ['100 g', '', 'Feta'],
        ['', '', 'Olivenöl, Zitrone, Salz'],
      ],
    }],
    steps: [
      'Quinoa nach Packungsanleitung kochen, abkühlen lassen.',
      'Gemüse waschen, schneiden, Kichererbsen abtropfen.',
      'In 4 Meal-Prep-Boxen schichten, Feta zerbröseln.',
      'Dressing aus Öl, Zitronensaft und Salz separat aufbewahren.',
    ],
  },
  {
    id: 'prep-pasta', title: 'Italienischer Nudelsalat',
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
    bake: 0, prep: 20, servings: 6, author: 'lukas',
    nutrition: [['Kalorien', '380 kcal'], ['Protein', '12 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['400 g', '', 'Penne'],
        ['200 g', '', 'Mozzarella Mini'],
        ['250 g', '', 'Kirschtomaten'],
        ['100 g', '', 'Rucola'],
        ['80 g', '', 'Parmesan'],
        ['', '', 'Pesto, Olivenöl, Pfeffer'],
      ],
    }],
    steps: [
      'Pasta al dente kochen, mit kaltem Wasser abschrecken.',
      'Mit halbierten Tomaten, Mozzarella und Rucola mischen.',
      'Pesto, Öl und Parmesan unterheben. Mind. 1 h ziehen lassen.',
    ],
  },
  {
    id: 'prep-curry', title: 'Süßkartoffel-Linsen-Curry',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    bake: 0, prep: 35, servings: 4, author: 'fabian',
    nutrition: [['Kalorien', '420 kcal'], ['Protein', '16 g'], ['Eisen', '6 mg']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['2', '', 'Süßkartoffeln'],
        ['250 g', '', 'rote Linsen'],
        ['1', 'Dose', 'Kokosmilch'],
        ['2', 'EL', 'rote Currypaste'],
        ['1', '', 'Zwiebel'],
        ['2', 'Zehen', 'Knoblauch'],
        ['', '', 'Ingwer, Limette, Koriander'],
      ],
    }],
    steps: [
      'Zwiebel und Knoblauch anbraten, Currypaste mitrösten.',
      'Süßkartoffelwürfel und Linsen zugeben, mit Kokosmilch ablöschen.',
      '20 Minuten köcheln, mit Limette und Koriander abschmecken.',
      'In Boxen portionieren — hält 4 Tage im Kühlschrank.',
    ],
  },

  // ─── Vegane Klassiker ───────────────────────────────────────────────────
  {
    id: 'vegan-buddha', title: 'Buddha Bowl mit Tahindressing',
    imageUrl: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=800',
    bake: 25, prep: 15, servings: 2, author: 'maria',
    nutrition: [['Kalorien', '480 kcal'], ['Protein', '18 g'], ['Ballaststoffe', '12 g']],
    ingredients: [{
      title: 'Bowl',
      items: [
        ['1', '', 'Süßkartoffel'],
        ['200 g', '', 'Kichererbsen'],
        ['100 g', '', 'Quinoa'],
        ['100 g', '', 'Spinat'],
        ['1', '', 'Avocado'],
      ],
    }, {
      title: 'Tahin-Dressing',
      items: [
        ['3', 'EL', 'Tahin'],
        ['1', '', 'Zitrone (Saft)'],
        ['1', 'EL', 'Ahornsirup'],
        ['', '', 'Wasser zum Verdünnen'],
      ],
    }],
    steps: [
      'Süßkartoffel würfeln, mit Kichererbsen 25 Min bei 200 °C rösten.',
      'Quinoa kochen, abkühlen.',
      'Alle Zutaten in einer Schale anrichten.',
      'Dressing-Zutaten verrühren und großzügig darüber träufeln.',
    ],
  },
  {
    id: 'vegan-bolo', title: 'Vegane Linsenbolognese',
    imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800',
    bake: 0, prep: 40, servings: 4, author: 'lukas',
    nutrition: [['Kalorien', '460 kcal'], ['Protein', '20 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['200 g', '', 'rote Linsen'],
        ['1', 'Dose', 'Tomaten'],
        ['1', '', 'Zwiebel'],
        ['2', 'Zehen', 'Knoblauch'],
        ['2', 'EL', 'Tomatenmark'],
        ['400 g', '', 'Spaghetti'],
        ['', '', 'Oregano, Basilikum, Salz'],
      ],
    }],
    steps: [
      'Zwiebel und Knoblauch in Öl anschwitzen, Tomatenmark mitrösten.',
      'Linsen und Tomaten zugeben, mit 500 ml Wasser auffüllen.',
      '25 Min köcheln, mit Kräutern abschmecken.',
      'Spaghetti separat kochen und mit Sauce servieren.',
    ],
  },
  {
    id: 'vegan-curry', title: 'Kokoscurry mit Kichererbsen',
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    bake: 0, prep: 25, servings: 4, author: 'fabian',
    nutrition: [['Kalorien', '390 kcal'], ['Protein', '14 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['2', 'Dosen', 'Kichererbsen'],
        ['1', 'Dose', 'Kokosmilch'],
        ['2', 'EL', 'gelbe Currypaste'],
        ['200 g', '', 'Spinat'],
        ['1', '', 'Zwiebel'],
        ['', '', 'Reis als Beilage'],
      ],
    }],
    steps: [
      'Zwiebel anbraten, Currypaste 1 Min mitrösten.',
      'Kichererbsen und Kokosmilch zugeben, 10 Min köcheln.',
      'Spinat unterheben, bis er zusammenfällt.',
      'Mit Reis servieren.',
    ],
  },

  // ─── Sonntagsbrunch ─────────────────────────────────────────────────────
  {
    id: 'brunch-pancakes', title: 'Fluffige American Pancakes',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800',
    bake: 0, prep: 20, servings: 4, author: 'maria',
    nutrition: [['Kalorien', '320 kcal'], ['Kohlenhydrate', '40 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['250 g', '', 'Mehl'],
        ['2', 'TL', 'Backpulver'],
        ['2', 'EL', 'Zucker'],
        ['300 ml', '', 'Milch'],
        ['2', '', 'Eier'],
        ['50 g', '', 'Butter, geschmolzen'],
        ['', '', 'Ahornsirup & Beeren'],
      ],
    }],
    steps: [
      'Trockene Zutaten mischen, separat Milch, Eier und Butter verrühren.',
      'Beides vermengen — Klumpen sind OK.',
      'In einer Pfanne portionsweise goldbraun backen.',
      'Mit Ahornsirup und Beeren servieren.',
    ],
  },
  {
    id: 'brunch-eggs', title: 'Eggs Benedict mit Sauce Hollandaise',
    imageUrl: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800',
    bake: 0, prep: 30, servings: 2, author: 'lukas',
    nutrition: [['Kalorien', '520 kcal'], ['Protein', '24 g'], ['Fett', '32 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['2', '', 'English Muffins'],
        ['4', 'Scheiben', 'Schinken'],
        ['4', '', 'Eier'],
        ['2', 'Eigelb', ''],
        ['150 g', '', 'Butter'],
        ['1', 'EL', 'Zitronensaft'],
        ['1', 'EL', 'Essig (für Wasser)'],
      ],
    }],
    steps: [
      'Eier in essigsaurem Wasser 3 Minuten pochieren.',
      'Eigelb mit Zitrone schaumig schlagen, langsam Butter einrühren.',
      'Muffins toasten, mit Schinken und Ei belegen.',
      'Mit Hollandaise begießen und sofort servieren.',
    ],
  },
  {
    id: 'brunch-avo', title: 'Avocado Toast mit pochiertem Ei',
    imageUrl: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800',
    bake: 0, prep: 10, servings: 2, author: 'maria',
    nutrition: [['Kalorien', '380 kcal'], ['Protein', '14 g'], ['Fett', '22 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['2', 'Scheiben', 'Sauerteigbrot'],
        ['1', '', 'reife Avocado'],
        ['2', '', 'Eier'],
        ['1', 'TL', 'Chiliflocken'],
        ['', '', 'Zitrone, Salz, Pfeffer'],
      ],
    }],
    steps: [
      'Brot toasten.',
      'Avocado zerdrücken, mit Zitrone, Salz, Pfeffer abschmecken, auf Brot streichen.',
      'Eier pochieren und obenauf legen.',
      'Mit Chiliflocken bestreuen.',
    ],
  },

  // ─── Grillsaison ────────────────────────────────────────────────────────
  {
    id: 'grill-veggie', title: 'Gegrilltes Sommergemüse',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    bake: 15, prep: 15, servings: 4, author: 'fabian',
    nutrition: [['Kalorien', '220 kcal'], ['Ballaststoffe', '6 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['2', '', 'Zucchini'],
        ['2', '', 'Paprika'],
        ['1', '', 'Aubergine'],
        ['200 g', '', 'Champignons'],
        ['', '', 'Olivenöl, Rosmarin, Salz'],
      ],
    }],
    steps: [
      'Gemüse waschen, in dicke Scheiben schneiden.',
      'Mit Öl, Rosmarin und Salz marinieren.',
      'Auf dem Grill 12–15 Minuten von beiden Seiten grillen.',
      'Mit Balsamico-Reduktion servieren.',
    ],
  },
  {
    id: 'grill-steak', title: 'Perfektes Ribeye-Steak',
    imageUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800',
    bake: 0, prep: 25, servings: 2, author: 'lukas',
    nutrition: [['Kalorien', '620 kcal'], ['Protein', '48 g'], ['Fett', '46 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['2', '', 'Ribeye-Steaks (je 300 g)'],
        ['', '', 'grobes Meersalz'],
        ['', '', 'frisch gemahlener Pfeffer'],
        ['2', 'EL', 'Butter'],
        ['2', 'Zweige', 'Rosmarin'],
      ],
    }],
    steps: [
      'Steaks 1 h vor dem Grillen aus dem Kühlschrank nehmen.',
      'Großzügig salzen. Grill auf max. Hitze bringen.',
      'Je 2 Min pro Seite grillen, dann mit Butter und Rosmarin nachziehen.',
      '5 Min ruhen lassen, dann gegen die Faser aufschneiden.',
    ],
  },
  {
    id: 'grill-ribs', title: 'BBQ-Spareribs',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    bake: 180, prep: 20, servings: 4, author: 'lukas',
    nutrition: [['Kalorien', '680 kcal'], ['Protein', '42 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['1.5 kg', '', 'Spareribs'],
        ['200 ml', '', 'BBQ-Sauce'],
        ['2', 'EL', 'Senf'],
        ['2', 'EL', 'brauner Zucker'],
        ['', '', 'Paprika, Knoblauchpulver, Salz'],
      ],
    }],
    steps: [
      'Ribs mit Gewürzmischung einreiben, 1 h ruhen lassen.',
      'In Folie wickeln und bei 130 °C 2,5 h indirekt grillen.',
      'Folie öffnen, mit BBQ-Sauce bepinseln und 20 Min weiter grillen.',
      'Vor dem Servieren kurz ruhen lassen.',
    ],
  },
  {
    id: 'grill-chicken', title: 'Marinierte Grillhähnchenkeulen',
    imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800',
    bake: 35, prep: 15, servings: 4, author: 'fabian',
    nutrition: [['Kalorien', '420 kcal'], ['Protein', '38 g']],
    ingredients: [{
      title: 'Marinade',
      items: [
        ['8', '', 'Hähnchenkeulen'],
        ['4', 'EL', 'Olivenöl'],
        ['2', 'EL', 'Honig'],
        ['1', 'EL', 'Paprikapulver'],
        ['2', 'Zehen', 'Knoblauch'],
        ['1', '', 'Zitrone (Saft)'],
      ],
    }],
    steps: [
      'Keulen mit allen Zutaten marinieren, mind. 2 h ziehen lassen.',
      'Bei mittlerer Hitze 30–35 Minuten indirekt grillen.',
      'Mehrmals mit Marinade einpinseln.',
      'Mit Salat und Brot servieren.',
    ],
  },

  // ─── Kuchen & Torten ───────────────────────────────────────────────────
  {
    id: 'cake-schoko', title: 'Saftiger Schokoladenkuchen',
    imageUrl: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800',
    bake: 35, prep: 25, servings: 12, author: 'maria',
    nutrition: [['Kalorien', '380 kcal'], ['Zucker', '32 g'], ['Fett', '20 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['200 g', '', 'Zartbitterschokolade'],
        ['200 g', '', 'Butter'],
        ['200 g', '', 'Zucker'],
        ['4', '', 'Eier'],
        ['150 g', '', 'Mehl'],
        ['1', 'TL', 'Backpulver'],
      ],
    }],
    steps: [
      'Schokolade mit Butter schmelzen, leicht abkühlen.',
      'Eier mit Zucker schaumig rühren, Schokomischung unterrühren.',
      'Mehl und Backpulver unterheben.',
      'Bei 175 °C 30–35 Min backen.',
    ],
  },
  {
    id: 'cake-erdbeer', title: 'Erdbeertorte mit Sahne',
    imageUrl: 'https://images.unsplash.com/photo-1464195244916-405fa0a82545?w=800',
    bake: 25, prep: 30, servings: 12, author: 'maria',
    nutrition: [['Kalorien', '290 kcal'], ['Zucker', '24 g']],
    ingredients: [{
      title: 'Boden',
      items: [
        ['4', '', 'Eier'],
        ['150 g', '', 'Zucker'],
        ['150 g', '', 'Mehl'],
        ['1', 'TL', 'Backpulver'],
      ],
    }, {
      title: 'Topping',
      items: [
        ['500 g', '', 'Erdbeeren'],
        ['400 ml', '', 'Sahne'],
        ['2', 'EL', 'Puderzucker'],
        ['1', 'Pck', 'Tortenguss'],
      ],
    }],
    steps: [
      'Biskuitboden backen und auskühlen lassen.',
      'Sahne mit Puderzucker steif schlagen, auf den Boden streichen.',
      'Erdbeeren waschen, halbieren und auflegen.',
      'Mit Tortenguss überziehen und 2 h kühlen.',
    ],
  },
  {
    id: 'cake-apfel', title: 'Omas Apfelkuchen',
    imageUrl: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=800',
    bake: 45, prep: 25, servings: 12, author: 'lukas',
    nutrition: [['Kalorien', '260 kcal'], ['Zucker', '22 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['4', '', 'Äpfel'],
        ['250 g', '', 'Mehl'],
        ['150 g', '', 'Butter'],
        ['100 g', '', 'Zucker'],
        ['2', '', 'Eier'],
        ['1', 'TL', 'Zimt'],
        ['', '', 'Vanille, Backpulver'],
      ],
    }],
    steps: [
      'Mürbeteig aus Mehl, Butter, Zucker und Eiern kneten.',
      'Äpfel schälen, in Spalten schneiden, mit Zimt mischen.',
      'Teig in Form drücken, mit Äpfeln belegen.',
      'Bei 180 °C 40–45 Min backen.',
    ],
  },

  // ─── Asiatische Küche ──────────────────────────────────────────────────
  {
    id: 'asia-sushi', title: 'Sushi-Bowl mit Lachs',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
    bake: 0, prep: 30, servings: 2, author: 'lukas',
    nutrition: [['Kalorien', '520 kcal'], ['Protein', '32 g'], ['Omega-3', '2 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['200 g', '', 'Sushireis'],
        ['250 g', '', 'sashimi-tauglicher Lachs'],
        ['1', '', 'Avocado'],
        ['1', '', 'Gurke'],
        ['1', 'EL', 'Sesam'],
        ['', '', 'Sojasauce, Wasabi, Ingwer'],
      ],
    }],
    steps: [
      'Reis nach Anleitung kochen, mit Reisessig würzen.',
      'Lachs in Würfel schneiden.',
      'Avocado und Gurke in Streifen schneiden.',
      'Reis in Schalen, Lachs und Gemüse darauf anrichten, mit Sesam bestreuen.',
    ],
  },
  {
    id: 'asia-pad', title: 'Pad Thai mit Garnelen',
    imageUrl: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800',
    bake: 0, prep: 25, servings: 2, author: 'fabian',
    nutrition: [['Kalorien', '480 kcal'], ['Protein', '26 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['200 g', '', 'Reisnudeln'],
        ['200 g', '', 'Garnelen'],
        ['2', '', 'Eier'],
        ['100 g', '', 'Sojasprossen'],
        ['3', 'EL', 'Pad-Thai-Sauce'],
        ['50 g', '', 'Erdnüsse, gehackt'],
        ['', '', 'Frühlingszwiebeln, Limette'],
      ],
    }],
    steps: [
      'Nudeln einweichen.',
      'Garnelen kurz im Wok anbraten, Eier zugeben und stocken lassen.',
      'Nudeln, Sojasprossen und Sauce zugeben, gut mischen.',
      'Mit Erdnüssen, Frühlingszwiebeln und Limette servieren.',
    ],
  },
  {
    id: 'asia-ramen', title: 'Hausgemachte Ramen',
    imageUrl: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800',
    bake: 0, prep: 45, servings: 2, author: 'lukas',
    nutrition: [['Kalorien', '580 kcal'], ['Protein', '28 g']],
    ingredients: [{
      title: 'Brühe',
      items: [
        ['1 l', '', 'Hühnerbrühe'],
        ['3', 'EL', 'Sojasauce'],
        ['2', 'EL', 'Miso'],
        ['1', 'Stück', 'Ingwer'],
      ],
    }, {
      title: 'Einlage',
      items: [
        ['200 g', '', 'Ramen-Nudeln'],
        ['2', '', 'Eier'],
        ['100 g', '', 'Pak Choi'],
        ['100 g', '', 'Pilze'],
        ['2', '', 'Frühlingszwiebeln'],
      ],
    }],
    steps: [
      'Brühe-Zutaten 30 Min köcheln.',
      'Eier 6 Min kochen, kalt abschrecken, halbieren.',
      'Nudeln separat kochen.',
      'In Schalen Nudeln, Brühe, Ei, Pak Choi und Pilze anrichten.',
    ],
  },
  {
    id: 'asia-curry', title: 'Thai-Curry Grün',
    imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800',
    bake: 0, prep: 25, servings: 4, author: 'fabian',
    nutrition: [['Kalorien', '450 kcal'], ['Protein', '22 g']],
    ingredients: [{
      title: 'Zutaten',
      items: [
        ['500 g', '', 'Hähnchenbrust'],
        ['2', 'Dosen', 'Kokosmilch'],
        ['3', 'EL', 'grüne Currypaste'],
        ['200 g', '', 'Bambussprossen'],
        ['2', '', 'Paprika'],
        ['', '', 'Thai-Basilikum, Limettenblätter'],
      ],
    }],
    steps: [
      'Currypaste in Öl anrösten, Hähnchen kurz anbraten.',
      'Mit Kokosmilch ablöschen, Gemüse zugeben.',
      '15 Min köcheln, mit Limettenblättern und Basilikum abschmecken.',
      'Mit Jasminreis servieren.',
    ],
  },
];

// Merge themed recipes into the main map
THEMED_RECIPES.forEach(r => {
  MOCK_RECIPE_DETAILS[r.id] = demoRecipe({ ...r, nutrition: r.nutrition.length ? r.nutrition : DEFAULT_NUTRITION });
});

export function getRecipeDetail(id: string): RecipeDetail {
  return MOCK_RECIPE_DETAILS[id] ?? MOCK_RECIPE_DETAILS['2'];
}
