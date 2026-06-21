// src/i18n/index.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  en: {
    translation: {
      nav: {
        home: 'Home',
        findHouse: 'Find House',
        roommate: 'Roommate',
        community: 'Community',
        login: 'Login',
        signUp: 'Sign Up',
        postListing: 'Post Listing',
      },
      home: {
        heroTitle: 'Safe Homes.',
        heroSubtitle: 'Better Living.',
        heroDescription: 'Find verified bachelor accommodations across Bangladesh.',
        searchPlaceholder: 'Search by location...',
      },
    },
  },
  bn: {
    translation: {
      nav: {
        home: 'হোম',
        findHouse: 'বাসা খুঁজুন',
        roommate: 'রুমমেট',
        community: 'কমিউনিটি',
        login: 'লগইন',
        signUp: 'সাইন আপ',
        postListing: 'লিস্টিং পোস্ট করুন',
      },
      home: {
        heroTitle: 'নিরাপদ বাসস্থান।',
        heroSubtitle: 'উন্নত জীবনযাপন।',
        heroDescription: 'বাংলাদেশ জুড়ে যাচাইকৃত ব্যাচেলর আবাসন খুঁজুন।',
        searchPlaceholder: 'অবস্থান অনুসারে অনুসন্ধান করুন...',
      },
    },
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n