import { randomChoice, weightedRandom, randomInt, type WeightedItem } from '@/utils/random';

export interface PageData {
  url: string;
  title: string;
  referrer: string;
  path: string;
  hostname: string;
}

interface FakeSite {
  domain: string;
  name: string;
  pages: { path: string; titleTemplate: string }[];
}

const FAKE_SITES: FakeSite[] = [
  {
    domain: 'techgadgets-store.com',
    name: 'TechGadgets Store',
    pages: [
      { path: '/products/smartphones', titleTemplate: 'Smartphones - {name}' },
      { path: '/products/laptops', titleTemplate: 'Laptops - {name}' },
      { path: '/products/accessories', titleTemplate: 'Accessories - {name}' },
      { path: '/cart', titleTemplate: 'Shopping Cart - {name}' },
      { path: '/checkout', titleTemplate: 'Checkout - {name}' },
      { path: '/account', titleTemplate: 'My Account - {name}' },
    ],
  },
  {
    domain: 'fashionhub-online.com',
    name: 'FashionHub',
    pages: [
      { path: '/women/dresses', titleTemplate: "Women's Dresses - {name}" },
      { path: '/men/shirts', titleTemplate: "Men's Shirts - {name}" },
      { path: '/sale', titleTemplate: 'Sale Items - {name}' },
      { path: '/new-arrivals', titleTemplate: 'New Arrivals - {name}' },
      { path: '/wishlist', titleTemplate: 'My Wishlist - {name}' },
    ],
  },
  {
    domain: 'dailynews-portal.net',
    name: 'Daily News Portal',
    pages: [
      { path: '/politics', titleTemplate: 'Politics News - {name}' },
      { path: '/technology', titleTemplate: 'Tech News - {name}' },
      { path: '/sports', titleTemplate: 'Sports - {name}' },
      { path: '/entertainment', titleTemplate: 'Entertainment - {name}' },
      { path: '/article/breaking-news', titleTemplate: 'Breaking News - {name}' },
    ],
  },
  {
    domain: 'homestyle-decor.com',
    name: 'HomeStyle Decor',
    pages: [
      { path: '/furniture/living-room', titleTemplate: 'Living Room Furniture - {name}' },
      { path: '/furniture/bedroom', titleTemplate: 'Bedroom Furniture - {name}' },
      { path: '/decor/wall-art', titleTemplate: 'Wall Art - {name}' },
      { path: '/lighting', titleTemplate: 'Lighting - {name}' },
    ],
  },
  {
    domain: 'fitlife-wellness.com',
    name: 'FitLife Wellness',
    pages: [
      { path: '/supplements', titleTemplate: 'Supplements - {name}' },
      { path: '/equipment', titleTemplate: 'Fitness Equipment - {name}' },
      { path: '/nutrition/plans', titleTemplate: 'Nutrition Plans - {name}' },
      { path: '/blog/workout-tips', titleTemplate: 'Workout Tips - {name}' },
    ],
  },
  {
    domain: 'bookworm-reads.com',
    name: 'Bookworm Reads',
    pages: [
      { path: '/fiction/bestsellers', titleTemplate: 'Bestselling Fiction - {name}' },
      { path: '/non-fiction', titleTemplate: 'Non-Fiction Books - {name}' },
      { path: '/ebooks', titleTemplate: 'E-Books - {name}' },
      { path: '/audiobooks', titleTemplate: 'Audiobooks - {name}' },
    ],
  },
  {
    domain: 'petparadise-shop.com',
    name: 'Pet Paradise',
    pages: [
      { path: '/dogs/food', titleTemplate: 'Dog Food - {name}' },
      { path: '/cats/toys', titleTemplate: 'Cat Toys - {name}' },
      { path: '/supplies', titleTemplate: 'Pet Supplies - {name}' },
      { path: '/grooming', titleTemplate: 'Grooming Products - {name}' },
    ],
  },
  {
    domain: 'traveldreams-agency.com',
    name: 'Travel Dreams',
    pages: [
      { path: '/destinations/europe', titleTemplate: 'Europe Destinations - {name}' },
      { path: '/destinations/asia', titleTemplate: 'Asia Destinations - {name}' },
      { path: '/hotels', titleTemplate: 'Hotels - {name}' },
      { path: '/flights', titleTemplate: 'Flights - {name}' },
      { path: '/packages', titleTemplate: 'Travel Packages - {name}' },
    ],
  },
  {
    domain: 'gourmet-kitchen.net',
    name: 'Gourmet Kitchen',
    pages: [
      { path: '/recipes/dinner', titleTemplate: 'Dinner Recipes - {name}' },
      { path: '/recipes/desserts', titleTemplate: 'Dessert Recipes - {name}' },
      { path: '/cookware', titleTemplate: 'Cookware - {name}' },
      { path: '/ingredients', titleTemplate: 'Specialty Ingredients - {name}' },
    ],
  },
  {
    domain: 'autoworld-motors.com',
    name: 'AutoWorld Motors',
    pages: [
      { path: '/new-cars', titleTemplate: 'New Cars - {name}' },
      { path: '/used-cars', titleTemplate: 'Used Cars - {name}' },
      { path: '/parts', titleTemplate: 'Auto Parts - {name}' },
      { path: '/service', titleTemplate: 'Service Center - {name}' },
    ],
  },
];

const REFERRERS: WeightedItem<string>[] = [
  { value: 'https://www.google.com/', weight: 0.40 },
  { value: 'https://www.bing.com/', weight: 0.08 },
  { value: 'https://www.facebook.com/', weight: 0.10 },
  { value: 'https://www.instagram.com/', weight: 0.06 },
  { value: 'https://twitter.com/', weight: 0.04 },
  { value: 'https://www.reddit.com/', weight: 0.03 },
  { value: 'https://www.youtube.com/', weight: 0.04 },
  { value: '', weight: 0.25 }, // Direct traffic
];

const PRODUCT_SLUGS = [
  'premium-wireless-headphones',
  'smart-fitness-watch',
  'organic-cotton-shirt',
  'ergonomic-office-chair',
  'stainless-steel-cookware-set',
  'leather-messenger-bag',
  'memory-foam-mattress',
  'professional-camera-kit',
  'electric-standing-desk',
  'bamboo-bed-sheets',
];

export function generatePageData(): PageData {
  const site = randomChoice(FAKE_SITES);
  const page = randomChoice(site.pages);

  const pathSuffix = Math.random() > 0.5 ? `/${randomChoice(PRODUCT_SLUGS)}` : '';
  const productId = randomInt(1000, 99999);
  const fullPath = page.path + pathSuffix + (Math.random() > 0.7 ? `?id=${productId}` : '');

  const title = page.titleTemplate.replace('{name}', site.name);
  const referrer = weightedRandom(REFERRERS);

  return {
    url: `https://${site.domain}${fullPath}`,
    title,
    referrer,
    path: fullPath,
    hostname: site.domain,
  };
}

export function generateSearchReferrer(): string {
  const searchEngines = [
    'https://www.google.com/search?q=',
    'https://www.bing.com/search?q=',
    'https://duckduckgo.com/?q=',
  ];

  const searchTerms = [
    'best+deals+online',
    'buy+electronics+cheap',
    'fashion+trends+2024',
    'home+decor+ideas',
    'fitness+equipment',
    'travel+packages',
    'new+cars+2024',
  ];

  return randomChoice(searchEngines) + randomChoice(searchTerms);
}
