import { weightedRandom, randomInt, randomChoice, type WeightedItem } from '@/utils/random';

export interface GA4Event {
  name: string;
  params: Record<string, string | number>;
}

export interface FBEvent {
  ev: string;
  params: Record<string, string | number>;
}

const GA4_EVENTS: WeightedItem<string>[] = [
  { value: 'page_view', weight: 0.40 },
  { value: 'scroll', weight: 0.12 },
  { value: 'click', weight: 0.10 },
  { value: 'view_item', weight: 0.10 },
  { value: 'add_to_cart', weight: 0.08 },
  { value: 'begin_checkout', weight: 0.05 },
  { value: 'purchase', weight: 0.04 },
  { value: 'sign_up', weight: 0.03 },
  { value: 'login', weight: 0.03 },
  { value: 'search', weight: 0.03 },
  { value: 'view_item_list', weight: 0.02 },
];

const FB_EVENTS: WeightedItem<string>[] = [
  { value: 'PageView', weight: 0.40 },
  { value: 'ViewContent', weight: 0.18 },
  { value: 'AddToCart', weight: 0.12 },
  { value: 'InitiateCheckout', weight: 0.08 },
  { value: 'Purchase', weight: 0.06 },
  { value: 'Lead', weight: 0.05 },
  { value: 'CompleteRegistration', weight: 0.04 },
  { value: 'Search', weight: 0.04 },
  { value: 'AddToWishlist', weight: 0.03 },
];

const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Sports',
  'Books',
  'Toys',
  'Health',
  'Automotive',
];

const PRODUCT_NAMES = [
  'Premium Wireless Headphones',
  'Smart Fitness Watch Pro',
  'Organic Cotton T-Shirt',
  'Ergonomic Office Chair',
  'Stainless Steel Cookware Set',
  'Leather Messenger Bag',
  'Memory Foam Mattress',
  'Professional Camera Kit',
  'Electric Standing Desk',
  'Bamboo Bed Sheets Set',
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

export function generateGA4Event(eventType?: string): GA4Event {
  const eventName = eventType || weightedRandom(GA4_EVENTS);
  const params: Record<string, string | number> = {};

  switch (eventName) {
    case 'page_view':
      params.page_location = `https://example-${randomInt(1, 10)}.com/page-${randomInt(1, 100)}`;
      params.page_title = `Page Title ${randomInt(1, 100)}`;
      break;

    case 'scroll':
      params.percent_scrolled = randomChoice([25, 50, 75, 90, 100]);
      break;

    case 'click':
      params.link_url = `https://example.com/link-${randomInt(1, 50)}`;
      params.link_text = `Link Text ${randomInt(1, 20)}`;
      params.outbound = Math.random() > 0.7 ? 1 : 0;
      break;

    case 'view_item':
    case 'add_to_cart':
      params.currency = randomChoice(CURRENCIES);
      params.value = randomInt(10, 500);
      params.item_id = `SKU-${randomInt(10000, 99999)}`;
      params.item_name = randomChoice(PRODUCT_NAMES);
      params.item_category = randomChoice(PRODUCT_CATEGORIES);
      params.price = randomInt(10, 500);
      params.quantity = randomInt(1, 3);
      break;

    case 'begin_checkout':
      params.currency = randomChoice(CURRENCIES);
      params.value = randomInt(50, 1000);
      params.coupon = Math.random() > 0.7 ? `SAVE${randomInt(5, 30)}` : '';
      params.items_count = randomInt(1, 5);
      break;

    case 'purchase':
      params.currency = randomChoice(CURRENCIES);
      params.value = randomInt(50, 2000);
      params.transaction_id = `TXN-${Date.now()}-${randomInt(1000, 9999)}`;
      params.tax = randomInt(5, 100);
      params.shipping = randomInt(0, 50);
      params.items_count = randomInt(1, 5);
      break;

    case 'sign_up':
    case 'login':
      params.method = randomChoice(['Google', 'Facebook', 'Email', 'Apple']);
      break;

    case 'search':
      params.search_term = randomChoice([
        'wireless headphones',
        'running shoes',
        'coffee maker',
        'laptop stand',
        'yoga mat',
      ]);
      break;

    case 'view_item_list':
      params.item_list_id = `list-${randomInt(1, 20)}`;
      params.item_list_name = randomChoice(['Featured', 'Bestsellers', 'New Arrivals', 'Sale']);
      break;
  }

  return { name: eventName, params };
}

export function generateFBEvent(eventType?: string): FBEvent {
  const eventName = eventType || weightedRandom(FB_EVENTS);
  const params: Record<string, string | number> = {};

  switch (eventName) {
    case 'PageView':
      // PageView typically has minimal params
      break;

    case 'ViewContent':
      params.content_name = randomChoice(PRODUCT_NAMES);
      params.content_category = randomChoice(PRODUCT_CATEGORIES);
      params.content_ids = `[${randomInt(10000, 99999)}]`;
      params.content_type = 'product';
      params.value = randomInt(10, 500);
      params.currency = randomChoice(CURRENCIES);
      break;

    case 'AddToCart':
      params.content_name = randomChoice(PRODUCT_NAMES);
      params.content_ids = `[${randomInt(10000, 99999)}]`;
      params.content_type = 'product';
      params.value = randomInt(10, 500);
      params.currency = randomChoice(CURRENCIES);
      params.num_items = randomInt(1, 3);
      break;

    case 'InitiateCheckout':
      params.value = randomInt(50, 1000);
      params.currency = randomChoice(CURRENCIES);
      params.num_items = randomInt(1, 5);
      break;

    case 'Purchase':
      params.value = randomInt(50, 2000);
      params.currency = randomChoice(CURRENCIES);
      params.content_type = 'product';
      params.num_items = randomInt(1, 5);
      break;

    case 'Lead':
      params.content_name = 'Newsletter Signup';
      params.content_category = 'lead_gen';
      break;

    case 'CompleteRegistration':
      params.content_name = 'Account Registration';
      params.status = 'complete';
      break;

    case 'Search':
      params.search_string = randomChoice([
        'wireless headphones',
        'running shoes',
        'coffee maker',
        'laptop stand',
        'yoga mat',
      ]);
      break;

    case 'AddToWishlist':
      params.content_name = randomChoice(PRODUCT_NAMES);
      params.content_ids = `[${randomInt(10000, 99999)}]`;
      params.value = randomInt(10, 500);
      params.currency = randomChoice(CURRENCIES);
      break;
  }

  return { ev: eventName, params };
}
