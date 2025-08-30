// config/sites.js
// Centralized configuration for all default sites across the extension

export const DEFAULT_SITES = [
  { 
    url: 'https://www.myntra.com', 
    name: 'Myntra', 
    icon: 'M',
    pattern: 'https://www.myntra.com/*'
  },
  { 
    url: 'https://www.ajio.com', 
    name: 'AJIO', 
    icon: 'A',
    pattern: 'https://www.ajio.com/*'
  },
  { 
    url: 'https://www.flipkart.com', 
    name: 'Flipkart', 
    icon: 'F',
    pattern: 'https://www.flipkart.com/*'
  },
  { 
    url: 'https://www.amazon.in', 
    name: 'Amazon India', 
    icon: 'A',
    pattern: 'https://www.amazon.in/*'
  },
  { 
    url: 'https://www.nykaa.com', 
    name: 'Nykaa', 
    icon: 'N',
    pattern: 'https://www.nykaa.com/*'
  },
  { 
    url: 'https://www.snapdeal.com', 
    name: 'Snapdeal', 
    icon: 'S',
    pattern: 'https://www.snapdeal.com/*'
  },
  { 
    url: 'https://www.purplle.com', 
    name: 'Purplle', 
    icon: 'P',
    pattern: 'https://www.purplle.com/*'
  },
  { 
    url: 'https://www.limeroad.com', 
    name: 'Limeroad', 
    icon: 'L',
    pattern: 'https://www.limeroad.com/*'
  },
  { 
    url: 'https://www.voonik.com', 
    name: 'Voonik', 
    icon: 'V',
    pattern: 'https://www.voonik.com/*'
  },
  { 
    url: 'https://www.koovs.com', 
    name: 'Koovs', 
    icon: 'K',
    pattern: 'https://www.koovs.com/*'
  },
  { 
    url: 'https://www.tatacliq.com', 
    name: 'Tata CLiQ', 
    icon: 'T',
    pattern: 'https://www.tatacliq.com/*'
  },
  { 
    url: 'https://www.reliancedigital.in', 
    name: 'Reliance Digital', 
    icon: 'R',
    pattern: 'https://www.reliancedigital.in/*'
  },
  { 
    url: 'https://www.croma.com', 
    name: 'Croma', 
    icon: 'C',
    pattern: 'https://www.croma.com/*'
  },
  { 
    url: 'https://www.shopclues.com', 
    name: 'ShopClues', 
    icon: 'S',
    pattern: 'https://www.shopclues.com/*'
  },
  { 
    url: 'https://www.paytmmall.com', 
    name: 'Paytm Mall', 
    icon: 'P',
    pattern: 'https://www.paytmmall.com/*'
  }
];

// Helper functions
export const getDefaultSiteByUrl = (url) => {
  return DEFAULT_SITES.find(site => url.startsWith(site.url));
};

export const isDefaultSite = (url) => {
  return DEFAULT_SITES.some(site => url.startsWith(site.url));
};

export const getDefaultSitePatterns = () => {
  return DEFAULT_SITES.map(site => site.pattern);
};

export const getDefaultSiteNames = () => {
  const names = {};
  DEFAULT_SITES.forEach(site => {
    names[site.pattern] = site.name;
  });
  return names;
};
