import { createContext, useCallback, useContext, useState } from 'react';

const dict = {
  en: {
    home: 'Home', properties: 'Properties', blog: 'Blog', contact: 'Contact', login: 'Log in', register: 'Sign up', logout: 'Log out',
    postProperty: 'Post a property', wishlist: 'Wishlist', myProperties: 'My properties', myOrders: 'My payments', profile: 'Profile',
    exploreTitle: 'Explore listings', exploreSub: 'Hand-picked and recently added homes', catTitle: 'Browse by type', catSub: 'Pick the kind of place you are looking for',
    howTitle: 'How Smart To-Let works', howSub: 'Three simple steps from search to your new home',
    step1T: 'Search & filter', step1D: 'Choose city, area, budget and rooms to see only homes that fit.',
    step2T: 'Book a visit', step2D: 'Pick a day and time online. We confirm it with the owner for you.',
    step3T: 'Move in', step3D: 'Agree the terms, pay securely and get the keys to your new place.',
    trust1T: 'Verified listings', trust1D: 'Every property is reviewed by our team', trust2T: 'Book visits online', trust2D: 'Pick a time that suits you',
    trust3T: 'Secure payments', trust3D: 'Pay by card, bank or mobile banking', trust4T: 'Free to search', trust4D: 'No account needed to browse',
    citiesTitle: 'Popular cities', citiesSub: 'Find homes in the neighbourhoods people love',
    ownerT: 'Own a property?', ownerD: 'List it on Smart To-Let and reach thousands of renters. Our team reviews and publishes it for you.', ownerCta: 'List your property',
    ownerP1: 'Free to post, reviewed within a day', ownerP2: 'Manage listings from your account', ownerP3: 'Get visit and rent requests directly',
    results: 'results', sortBy: 'Sort by', gridView: 'Grid', listView: 'List', clearAll: 'Clear all', activeFilters: 'Active filters',
    priceRange: 'Monthly rent', bedrooms: 'Bedrooms', bathrooms: 'Bathrooms', anyLabel: 'Any', keyword: 'Keyword', purposeLabel: 'Purpose',
    showResults: 'Show results', viewDetails: 'View details',
    overview: 'Overview', propInfo: 'Property information', locationT: 'Location', bookVisit: 'Book a visit', askQuestion: 'Ask a question',
    listedBy: 'Listed by Smart To-Let', verifiedNote: 'This listing was reviewed by our team.', similar: 'Similar properties',
    share: 'Share', saved: 'Saved', save: 'Save', linkCopied: 'Link copied',
    heroKicker: 'Bangladesh\'s smart home-finding platform', heroTitle: 'Find your dream home', heroTitle2: 'easily', heroSub: 'Flat, family home, sublet or bachelor seat. Search by what you need and find the right place.', heroCardTitle: 'Find your home', heroCardSub: 'Search by your preferences.', cityLabel: 'District', areaLabel: 'Area', typeLabel: 'Type', allAreas: 'All areas', allTypes: 'All types', maxRent: 'Max rent (৳)',
    searchPlaceholder: 'Search by area, road or keyword', allCities: 'All cities', search: 'Search',
    hotNew: 'Hot & new', trending: 'Trending now', bestRated: 'Best rated', latest: 'Latest listings', viewAll: 'View all',
    browseByCity: 'Browse by city', reviews: 'What people say', subscribe: 'Subscribe', subscribeTitle: 'Get new listings in your inbox',
    emailAddress: 'Email address', bed: 'Beds', bath: 'Baths', sqft: 'Area', perMonth: '/ month',
    noResults: 'No properties found', noResultsHint: 'Try changing or clearing some filters.', filters: 'Filters', clear: 'Clear',
    sort: 'Sort by', newest: 'Newest', priceLow: 'Price: low to high', priceHigh: 'Price: high to low',
    interested: "I'm interested", send: 'Send request', nearby: 'Nearby properties', details: 'Details', location: 'Location',
    readMore: 'Read more', footerAbout: 'Smart Tolet helps you find, list and rent homes with confidence.', quickLinks: 'Quick links',
  },
  bn: {
    home: 'হোম', properties: 'প্রপার্টি', blog: 'ব্লগ', contact: 'যোগাযোগ', login: 'লগইন', register: 'সাইন আপ', logout: 'লগআউট',
    postProperty: 'প্রপার্টি দিন', wishlist: 'পছন্দের তালিকা', myProperties: 'আমার প্রপার্টি', myOrders: 'আমার পেমেন্ট', profile: 'প্রোফাইল',
    exploreTitle: 'লিস্টিং দেখুন', exploreSub: 'বাছাই করা ও নতুন যোগ হওয়া বাসা', catTitle: 'ধরন অনুযায়ী দেখুন', catSub: 'কেমন বাসা খুঁজছেন তা বেছে নিন',
    howTitle: 'স্মার্ট টু-লেট কীভাবে কাজ করে', howSub: 'খোঁজা থেকে নতুন বাসায় ওঠা, তিনটি সহজ ধাপে',
    step1T: 'খুঁজুন ও ফিল্টার করুন', step1D: 'শহর, এলাকা, বাজেট ও রুম বেছে নিয়ে শুধু মানানসই বাসা দেখুন।',
    step2T: 'ভিজিট বুক করুন', step2D: 'অনলাইনে দিন ও সময় বেছে নিন। মালিকের সাথে আমরা নিশ্চিত করব।',
    step3T: 'বাসায় উঠুন', step3D: 'শর্ত ঠিক করুন, নিরাপদে পেমেন্ট করুন এবং নতুন বাসার চাবি নিন।',
    trust1T: 'যাচাইকৃত লিস্টিং', trust1D: 'প্রতিটি প্রপার্টি আমাদের টিম দেখে', trust2T: 'অনলাইনে ভিজিট বুক', trust2D: 'আপনার সুবিধার সময় বেছে নিন',
    trust3T: 'নিরাপদ পেমেন্ট', trust3D: 'কার্ড, ব্যাংক বা মোবাইল ব্যাংকিংয়ে পেমেন্ট', trust4T: 'খোঁজা বিনামূল্যে', trust4D: 'ব্রাউজ করতে অ্যাকাউন্ট লাগে না',
    citiesTitle: 'জনপ্রিয় শহর', citiesSub: 'মানুষের পছন্দের এলাকায় বাসা খুঁজুন',
    ownerT: 'আপনার কি প্রপার্টি আছে?', ownerD: 'স্মার্ট টু-লেটে দিন, হাজারো ভাড়াটের কাছে পৌঁছান। আমাদের টিম যাচাই করে প্রকাশ করবে।', ownerCta: 'প্রপার্টি দিন',
    ownerP1: 'পোস্ট করা বিনামূল্যে, একদিনের মধ্যে যাচাই', ownerP2: 'নিজের অ্যাকাউন্ট থেকে লিস্টিং পরিচালনা', ownerP3: 'ভিজিট ও ভাড়ার অনুরোধ সরাসরি পান',
    results: 'টি ফলাফল', sortBy: 'সাজান', gridView: 'গ্রিড', listView: 'লিস্ট', clearAll: 'সব মুছুন', activeFilters: 'সক্রিয় ফিল্টার',
    priceRange: 'মাসিক ভাড়া', bedrooms: 'বেডরুম', bathrooms: 'বাথরুম', anyLabel: 'যেকোনো', keyword: 'কীওয়ার্ড', purposeLabel: 'উদ্দেশ্য',
    showResults: 'ফলাফল দেখুন', viewDetails: 'বিস্তারিত দেখুন',
    overview: 'সারসংক্ষেপ', propInfo: 'প্রপার্টির তথ্য', locationT: 'অবস্থান', bookVisit: 'ভিজিট বুক করুন', askQuestion: 'প্রশ্ন করুন',
    listedBy: 'স্মার্ট টু-লেট কর্তৃক তালিকাভুক্ত', verifiedNote: 'এই লিস্টিং আমাদের টিম যাচাই করেছে।', similar: 'একই রকম প্রপার্টি',
    share: 'শেয়ার', saved: 'সংরক্ষিত', save: 'সংরক্ষণ', linkCopied: 'লিংক কপি হয়েছে',
    heroKicker: 'বাংলাদেশের স্মার্ট বাসা খোঁজার প্ল্যাটফর্ম', heroTitle: 'আপনার স্বপ্নের বাসা', heroTitle2: 'খুঁজে নিন সহজেই', heroSub: 'বাসা, ফ্ল্যাট, সাবলেট কিংবা ব্যাচেলর সিট— আপনার প্রয়োজন অনুযায়ী খুঁজে নিন পছন্দের ঠিকানা।', heroCardTitle: 'আপনার বাসা খুঁজুন', heroCardSub: 'আপনার পছন্দ অনুযায়ী সার্চ করুন।', cityLabel: 'জেলা', areaLabel: 'এলাকা', typeLabel: 'বাসার ধরন', allAreas: 'সব এলাকা', allTypes: 'সব ধরনের', maxRent: 'সর্বোচ্চ ভাড়া (৳)',
    searchPlaceholder: 'এলাকা, রোড বা কীওয়ার্ড লিখুন', allCities: 'সব শহর', search: 'খুঁজুন',
    hotNew: 'হট ও নতুন', trending: 'ট্রেন্ডিং', bestRated: 'সেরা রেটিং', latest: 'সর্বশেষ লিস্টিং', viewAll: 'সব দেখুন',
    browseByCity: 'শহর অনুযায়ী দেখুন', reviews: 'মানুষ কী বলছে', subscribe: 'সাবস্ক্রাইব', subscribeTitle: 'নতুন লিস্টিং ইমেইলে পান',
    emailAddress: 'ইমেইল ঠিকানা', bed: 'বেড', bath: 'বাথ', sqft: 'এলাকা', perMonth: '/ মাস',
    noResults: 'কোনো প্রপার্টি পাওয়া যায়নি', noResultsHint: 'ফিল্টার পরিবর্তন বা মুছে চেষ্টা করুন।', filters: 'ফিল্টার', clear: 'মুছুন',
    sort: 'সাজান', newest: 'নতুন আগে', priceLow: 'দাম: কম থেকে বেশি', priceHigh: 'দাম: বেশি থেকে কম',
    interested: 'আমি আগ্রহী', send: 'অনুরোধ পাঠান', nearby: 'কাছাকাছি প্রপার্টি', details: 'বিস্তারিত', location: 'অবস্থান',
    readMore: 'আরও পড়ুন', footerAbout: 'বাড়িওয়ালা আপনাকে নিশ্চিন্তে বাসা খুঁজতে, দিতে ও ভাড়া নিতে সাহায্য করে।', quickLinks: 'দ্রুত লিংক',
  },
};

const LangContext = createContext(null);
export const useLang = () => useContext(LangContext);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('hr_lang') || 'en');

  const setLang = (l) => {
    localStorage.setItem('hr_lang', l);
    setLangState(l);
  };
  const t = useCallback((key) => dict[lang][key] ?? dict.en[key] ?? key, [lang]);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}
