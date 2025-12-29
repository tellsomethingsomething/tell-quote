import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
    encryptData,
    decryptData,
    encryptFields,
    decryptFields,
    showSecurityWarning,
    validateApiKeyFormat,
    logSecurityEvent
} from '../utils/encryption';

const SETTINGS_KEY = 'tell_settings';
const SENSITIVE_FIELDS = ['anthropicKey', 'openaiKey'];
const BANK_SENSITIVE_FIELDS = ['accountNumber', 'swiftCode', 'iban', 'sortCode', 'routingNumber'];

// Comprehensive list of world currencies
export const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
    { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
    { code: 'NPR', name: 'Nepalese Rupee', symbol: 'Rs' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
    { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق' },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
    { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب' },
    { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.' },
    { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا' },
    { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
    { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
    { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
    { code: 'ARS', name: 'Argentine Peso', symbol: 'AR$' },
    { code: 'CLP', name: 'Chilean Peso', symbol: 'CLP$' },
    { code: 'COP', name: 'Colombian Peso', symbol: 'COL$' },
    { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
    { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
    { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
    { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
    { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
    { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
    { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
    { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸' },
    { code: 'UZS', name: 'Uzbekistani Som', symbol: 'лв' },
    { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K' },
    { code: 'KHR', name: 'Cambodian Riel', symbol: '៛' },
    { code: 'LAK', name: 'Laotian Kip', symbol: '₭' },
    { code: 'BND', name: 'Brunei Dollar', symbol: 'B$' },
    { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ع.د' },
    { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل' },
    // Additional Americas
    { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q' },
    { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡' },
    { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.' },
    { code: 'DOP', name: 'Dominican Peso', symbol: 'RD$' },
    { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$' },
    { code: 'TTD', name: 'Trinidad Dollar', symbol: 'TT$' },
    { code: 'BSD', name: 'Bahamian Dollar', symbol: 'B$' },
    { code: 'BBD', name: 'Barbadian Dollar', symbol: 'Bds$' },
    { code: 'XCD', name: 'East Caribbean Dollar', symbol: 'EC$' },
    { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs.S' },
    { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs.' },
    { code: 'PYG', name: 'Paraguayan Guaraní', symbol: '₲' },
    { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U' },
    { code: 'GYD', name: 'Guyanese Dollar', symbol: 'G$' },
    { code: 'SRD', name: 'Surinamese Dollar', symbol: 'Sr$' },
    { code: 'HNL', name: 'Honduran Lempira', symbol: 'L' },
    { code: 'NIO', name: 'Nicaraguan Córdoba', symbol: 'C$' },
    // Additional Europe
    { code: 'ISK', name: 'Icelandic Króna', symbol: 'kr' },
    { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин.' },
    { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден' },
    { code: 'ALL', name: 'Albanian Lek', symbol: 'L' },
    { code: 'BAM', name: 'Bosnia Mark', symbol: 'KM' },
    { code: 'GEL', name: 'Georgian Lari', symbol: '₾' },
    { code: 'AMD', name: 'Armenian Dram', symbol: '֏' },
    { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼' },
    { code: 'MDL', name: 'Moldovan Leu', symbol: 'L' },
    { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br' },
    // Central Asia
    { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'SM' },
    { code: 'TMT', name: 'Turkmenistani Manat', symbol: 'm' },
    { code: 'KGS', name: 'Kyrgyzstani Som', symbol: 'с' },
    { code: 'MNT', name: 'Mongolian Tugrik', symbol: '₮' },
    // Middle East
    { code: 'SYP', name: 'Syrian Pound', symbol: '£S' },
    { code: 'YER', name: 'Yemeni Rial', symbol: '﷼' },
    { code: 'IRR', name: 'Iranian Rial', symbol: '﷼' },
    { code: 'AFN', name: 'Afghan Afghani', symbol: '؋' },
    // Africa
    { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت' },
    { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج' },
    { code: 'LYD', name: 'Libyan Dinar', symbol: 'ل.د' },
    { code: 'SDG', name: 'Sudanese Pound', symbol: 'ج.س.' },
    { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
    { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
    { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
    { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw' },
    { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA' },
    { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA' },
    { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨' },
    { code: 'SCR', name: 'Seychellois Rupee', symbol: 'SR' },
    { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT' },
    { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz' },
    { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK' },
    { code: 'BWP', name: 'Botswana Pula', symbol: 'P' },
    { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$' },
    { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK' },
    { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: 'Z$' },
    { code: 'SZL', name: 'Eswatini Lilangeni', symbol: 'E' },
    { code: 'LSL', name: 'Lesotho Loti', symbol: 'M' },
    { code: 'GMD', name: 'Gambian Dalasi', symbol: 'D' },
    { code: 'SLL', name: 'Sierra Leonean Leone', symbol: 'Le' },
    { code: 'LRD', name: 'Liberian Dollar', symbol: 'L$' },
    { code: 'CVE', name: 'Cape Verdean Escudo', symbol: '$' },
    { code: 'MRU', name: 'Mauritanian Ouguiya', symbol: 'UM' },
    { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fdj' },
    { code: 'ERN', name: 'Eritrean Nakfa', symbol: 'Nfk' },
    { code: 'SOS', name: 'Somali Shilling', symbol: 'Sh.So.' },
    // Asia Pacific
    { code: 'FJD', name: 'Fiji Dollar', symbol: 'FJ$' },
    { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K' },
    { code: 'XPF', name: 'CFP Franc', symbol: '₣' },
    { code: 'WST', name: 'Samoan Tala', symbol: 'WS$' },
    { code: 'TOP', name: 'Tongan Paʻanga', symbol: 'T$' },
    { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'VT' },
    { code: 'SBD', name: 'Solomon Islands Dollar', symbol: 'SI$' },
    { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: 'Nu.' },
    { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf' },
];

// Tax rules for all countries - used for invoicing and country names - COMPREHENSIVE GLOBAL LIST
export const DEFAULT_TAX_RULES = {
    // North America
    'US': { name: 'United States', taxName: 'Sales Tax', rate: 0, taxIdLabel: 'EIN', reverseCharge: false },
    'CA': { name: 'Canada', taxName: 'GST/HST', rate: 5, taxIdLabel: 'GST/HST Number', reverseCharge: false },
    'MX': { name: 'Mexico', taxName: 'IVA', rate: 16, taxIdLabel: 'RFC', reverseCharge: false },
    // Central America & Caribbean
    'GT': { name: 'Guatemala', taxName: 'IVA', rate: 12, taxIdLabel: 'NIT', reverseCharge: false },
    'BZ': { name: 'Belize', taxName: 'GST', rate: 12.5, taxIdLabel: 'TIN', reverseCharge: false },
    'SV': { name: 'El Salvador', taxName: 'IVA', rate: 13, taxIdLabel: 'NIT', reverseCharge: false },
    'HN': { name: 'Honduras', taxName: 'ISV', rate: 15, taxIdLabel: 'RTN', reverseCharge: false },
    'NI': { name: 'Nicaragua', taxName: 'IVA', rate: 15, taxIdLabel: 'RUC', reverseCharge: false },
    'CR': { name: 'Costa Rica', taxName: 'IVA', rate: 13, taxIdLabel: 'Cedula Juridica', reverseCharge: false },
    'PA': { name: 'Panama', taxName: 'ITBMS', rate: 7, taxIdLabel: 'RUC', reverseCharge: false },
    'CU': { name: 'Cuba', taxName: 'Sales Tax', rate: 10, taxIdLabel: 'NIT', reverseCharge: false },
    'JM': { name: 'Jamaica', taxName: 'GCT', rate: 15, taxIdLabel: 'TRN', reverseCharge: false },
    'HT': { name: 'Haiti', taxName: 'TCA', rate: 10, taxIdLabel: 'NIF', reverseCharge: false },
    'DO': { name: 'Dominican Republic', taxName: 'ITBIS', rate: 18, taxIdLabel: 'RNC', reverseCharge: false },
    'PR': { name: 'Puerto Rico', taxName: 'IVU', rate: 11.5, taxIdLabel: 'EIN', reverseCharge: false },
    'TT': { name: 'Trinidad and Tobago', taxName: 'VAT', rate: 12.5, taxIdLabel: 'BIR', reverseCharge: false },
    'BB': { name: 'Barbados', taxName: 'VAT', rate: 17.5, taxIdLabel: 'TIN', reverseCharge: false },
    'BS': { name: 'Bahamas', taxName: 'VAT', rate: 12, taxIdLabel: 'TIN', reverseCharge: false },
    'LC': { name: 'Saint Lucia', taxName: 'VAT', rate: 15, taxIdLabel: 'TIN', reverseCharge: false },
    'GD': { name: 'Grenada', taxName: 'VAT', rate: 15, taxIdLabel: 'TIN', reverseCharge: false },
    'VC': { name: 'Saint Vincent', taxName: 'VAT', rate: 16, taxIdLabel: 'TIN', reverseCharge: false },
    'AG': { name: 'Antigua and Barbuda', taxName: 'ABST', rate: 15, taxIdLabel: 'TIN', reverseCharge: false },
    'DM': { name: 'Dominica', taxName: 'VAT', rate: 15, taxIdLabel: 'TIN', reverseCharge: false },
    'KN': { name: 'Saint Kitts and Nevis', taxName: 'VAT', rate: 17, taxIdLabel: 'TIN', reverseCharge: false },
    // South America
    'BR': { name: 'Brazil', taxName: 'ICMS', rate: 18, taxIdLabel: 'CNPJ', reverseCharge: false },
    'AR': { name: 'Argentina', taxName: 'IVA', rate: 21, taxIdLabel: 'CUIT', reverseCharge: false },
    'CO': { name: 'Colombia', taxName: 'IVA', rate: 19, taxIdLabel: 'NIT', reverseCharge: false },
    'PE': { name: 'Peru', taxName: 'IGV', rate: 18, taxIdLabel: 'RUC', reverseCharge: false },
    'VE': { name: 'Venezuela', taxName: 'IVA', rate: 16, taxIdLabel: 'RIF', reverseCharge: false },
    'CL': { name: 'Chile', taxName: 'IVA', rate: 19, taxIdLabel: 'RUT', reverseCharge: false },
    'EC': { name: 'Ecuador', taxName: 'IVA', rate: 12, taxIdLabel: 'RUC', reverseCharge: false },
    'BO': { name: 'Bolivia', taxName: 'IVA', rate: 13, taxIdLabel: 'NIT', reverseCharge: false },
    'PY': { name: 'Paraguay', taxName: 'IVA', rate: 10, taxIdLabel: 'RUC', reverseCharge: false },
    'UY': { name: 'Uruguay', taxName: 'IVA', rate: 22, taxIdLabel: 'RUT', reverseCharge: false },
    'GY': { name: 'Guyana', taxName: 'VAT', rate: 14, taxIdLabel: 'TIN', reverseCharge: false },
    'SR': { name: 'Suriname', taxName: 'BTW', rate: 10, taxIdLabel: 'TIN', reverseCharge: false },
    // Western Europe
    'GB': { name: 'United Kingdom', taxName: 'VAT', rate: 20, taxIdLabel: 'VAT Number', reverseCharge: true },
    'IE': { name: 'Ireland', taxName: 'VAT', rate: 23, taxIdLabel: 'VAT Number', reverseCharge: true },
    'FR': { name: 'France', taxName: 'TVA', rate: 20, taxIdLabel: 'TVA Intracommunautaire', reverseCharge: true },
    'DE': { name: 'Germany', taxName: 'MwSt', rate: 19, taxIdLabel: 'USt-IdNr', reverseCharge: true },
    'NL': { name: 'Netherlands', taxName: 'BTW', rate: 21, taxIdLabel: 'BTW-nummer', reverseCharge: true },
    'BE': { name: 'Belgium', taxName: 'BTW/TVA', rate: 21, taxIdLabel: 'BTW nummer', reverseCharge: true },
    'LU': { name: 'Luxembourg', taxName: 'TVA', rate: 17, taxIdLabel: 'TVA Number', reverseCharge: true },
    'CH': { name: 'Switzerland', taxName: 'MwSt', rate: 8.1, taxIdLabel: 'MwSt-Nr', reverseCharge: false },
    'AT': { name: 'Austria', taxName: 'USt', rate: 20, taxIdLabel: 'UID-Nummer', reverseCharge: true },
    'LI': { name: 'Liechtenstein', taxName: 'MWST', rate: 8.1, taxIdLabel: 'MWST-Nr', reverseCharge: false },
    // Southern Europe
    'ES': { name: 'Spain', taxName: 'IVA', rate: 21, taxIdLabel: 'NIF/CIF', reverseCharge: true },
    'PT': { name: 'Portugal', taxName: 'IVA', rate: 23, taxIdLabel: 'NIF', reverseCharge: true },
    'IT': { name: 'Italy', taxName: 'IVA', rate: 22, taxIdLabel: 'Partita IVA', reverseCharge: true },
    'GR': { name: 'Greece', taxName: 'FPA', rate: 24, taxIdLabel: 'AFM', reverseCharge: true },
    'MT': { name: 'Malta', taxName: 'VAT', rate: 18, taxIdLabel: 'VAT Number', reverseCharge: true },
    'CY': { name: 'Cyprus', taxName: 'VAT', rate: 19, taxIdLabel: 'VAT Number', reverseCharge: true },
    'AD': { name: 'Andorra', taxName: 'IGI', rate: 4.5, taxIdLabel: 'NRT', reverseCharge: false },
    'SM': { name: 'San Marino', taxName: 'IGC', rate: 17, taxIdLabel: 'COE', reverseCharge: false },
    'MC': { name: 'Monaco', taxName: 'TVA', rate: 20, taxIdLabel: 'TVA Number', reverseCharge: false },
    'VA': { name: 'Vatican City', taxName: 'None', rate: 0, taxIdLabel: 'None', reverseCharge: false },
    // Northern Europe
    'SE': { name: 'Sweden', taxName: 'Moms', rate: 25, taxIdLabel: 'Momsreg.nummer', reverseCharge: true },
    'NO': { name: 'Norway', taxName: 'MVA', rate: 25, taxIdLabel: 'MVA-nummer', reverseCharge: false },
    'DK': { name: 'Denmark', taxName: 'Moms', rate: 25, taxIdLabel: 'CVR-nummer', reverseCharge: true },
    'FI': { name: 'Finland', taxName: 'ALV', rate: 25.5, taxIdLabel: 'ALV-numero', reverseCharge: true },
    'IS': { name: 'Iceland', taxName: 'VSK', rate: 24, taxIdLabel: 'VSK Number', reverseCharge: false },
    'EE': { name: 'Estonia', taxName: 'KM', rate: 22, taxIdLabel: 'KMKR', reverseCharge: true },
    'LV': { name: 'Latvia', taxName: 'PVN', rate: 21, taxIdLabel: 'PVN Number', reverseCharge: true },
    'LT': { name: 'Lithuania', taxName: 'PVM', rate: 21, taxIdLabel: 'PVM Code', reverseCharge: true },
    // Eastern Europe
    'PL': { name: 'Poland', taxName: 'VAT', rate: 23, taxIdLabel: 'NIP', reverseCharge: true },
    'CZ': { name: 'Czech Republic', taxName: 'DPH', rate: 21, taxIdLabel: 'DIC', reverseCharge: true },
    'SK': { name: 'Slovakia', taxName: 'DPH', rate: 20, taxIdLabel: 'IC DPH', reverseCharge: true },
    'HU': { name: 'Hungary', taxName: 'AFA', rate: 27, taxIdLabel: 'EU VAT', reverseCharge: true },
    'RO': { name: 'Romania', taxName: 'TVA', rate: 19, taxIdLabel: 'CIF', reverseCharge: true },
    'BG': { name: 'Bulgaria', taxName: 'DDS', rate: 20, taxIdLabel: 'EIK', reverseCharge: true },
    'UA': { name: 'Ukraine', taxName: 'PDV', rate: 20, taxIdLabel: 'EDRPOU', reverseCharge: false },
    'BY': { name: 'Belarus', taxName: 'VAT', rate: 20, taxIdLabel: 'UNP', reverseCharge: false },
    'MD': { name: 'Moldova', taxName: 'TVA', rate: 20, taxIdLabel: 'IDNO', reverseCharge: false },
    'RU': { name: 'Russia', taxName: 'NDS', rate: 20, taxIdLabel: 'INN', reverseCharge: false },
    // Balkans
    'HR': { name: 'Croatia', taxName: 'PDV', rate: 25, taxIdLabel: 'OIB', reverseCharge: true },
    'SI': { name: 'Slovenia', taxName: 'DDV', rate: 22, taxIdLabel: 'ID za DDV', reverseCharge: true },
    'RS': { name: 'Serbia', taxName: 'PDV', rate: 20, taxIdLabel: 'PIB', reverseCharge: false },
    'BA': { name: 'Bosnia and Herzegovina', taxName: 'PDV', rate: 17, taxIdLabel: 'ID', reverseCharge: false },
    'ME': { name: 'Montenegro', taxName: 'PDV', rate: 21, taxIdLabel: 'PIB', reverseCharge: false },
    'MK': { name: 'North Macedonia', taxName: 'DDV', rate: 18, taxIdLabel: 'EDB', reverseCharge: false },
    'AL': { name: 'Albania', taxName: 'TVSH', rate: 20, taxIdLabel: 'NUIS', reverseCharge: false },
    'XK': { name: 'Kosovo', taxName: 'VAT', rate: 18, taxIdLabel: 'Fiscal Number', reverseCharge: false },
    // Middle East
    'AE': { name: 'UAE', taxName: 'VAT', rate: 5, taxIdLabel: 'TRN', reverseCharge: false },
    'SA': { name: 'Saudi Arabia', taxName: 'VAT', rate: 15, taxIdLabel: 'VAT Registration No', reverseCharge: false },
    'QA': { name: 'Qatar', taxName: 'None', rate: 0, taxIdLabel: 'QID', reverseCharge: false },
    'KW': { name: 'Kuwait', taxName: 'None', rate: 0, taxIdLabel: 'Civil ID', reverseCharge: false },
    'BH': { name: 'Bahrain', taxName: 'VAT', rate: 10, taxIdLabel: 'VAT Registration No', reverseCharge: false },
    'OM': { name: 'Oman', taxName: 'VAT', rate: 5, taxIdLabel: 'VAT Registration No', reverseCharge: false },
    'JO': { name: 'Jordan', taxName: 'GST', rate: 16, taxIdLabel: 'Tax Number', reverseCharge: false },
    'LB': { name: 'Lebanon', taxName: 'VAT', rate: 11, taxIdLabel: 'VAT Number', reverseCharge: false },
    'SY': { name: 'Syria', taxName: 'VAT', rate: 10, taxIdLabel: 'Tax ID', reverseCharge: false },
    'IQ': { name: 'Iraq', taxName: 'Sales Tax', rate: 15, taxIdLabel: 'Tax ID', reverseCharge: false },
    'IR': { name: 'Iran', taxName: 'VAT', rate: 9, taxIdLabel: 'Economic Code', reverseCharge: false },
    'YE': { name: 'Yemen', taxName: 'GST', rate: 5, taxIdLabel: 'Tax ID', reverseCharge: false },
    'IL': { name: 'Israel', taxName: 'VAT', rate: 17, taxIdLabel: 'Osek Murshe', reverseCharge: false },
    'PS': { name: 'Palestine', taxName: 'VAT', rate: 16, taxIdLabel: 'Tax ID', reverseCharge: false },
    'TR': { name: 'Turkey', taxName: 'KDV', rate: 20, taxIdLabel: 'Vergi No', reverseCharge: false },
    // Central Asia
    'KZ': { name: 'Kazakhstan', taxName: 'VAT', rate: 12, taxIdLabel: 'BIN', reverseCharge: false },
    'UZ': { name: 'Uzbekistan', taxName: 'VAT', rate: 12, taxIdLabel: 'TIN', reverseCharge: false },
    'TM': { name: 'Turkmenistan', taxName: 'VAT', rate: 15, taxIdLabel: 'TIN', reverseCharge: false },
    'TJ': { name: 'Tajikistan', taxName: 'VAT', rate: 18, taxIdLabel: 'TIN', reverseCharge: false },
    'KG': { name: 'Kyrgyzstan', taxName: 'VAT', rate: 12, taxIdLabel: 'TIN', reverseCharge: false },
    'AF': { name: 'Afghanistan', taxName: 'BRT', rate: 4, taxIdLabel: 'TIN', reverseCharge: false },
    // South Asia
    'IN': { name: 'India', taxName: 'GST', rate: 18, taxIdLabel: 'GSTIN', reverseCharge: false },
    'PK': { name: 'Pakistan', taxName: 'GST', rate: 18, taxIdLabel: 'NTN', reverseCharge: false },
    'BD': { name: 'Bangladesh', taxName: 'VAT', rate: 15, taxIdLabel: 'BIN', reverseCharge: false },
    'LK': { name: 'Sri Lanka', taxName: 'VAT', rate: 15, taxIdLabel: 'TIN', reverseCharge: false },
    'NP': { name: 'Nepal', taxName: 'VAT', rate: 13, taxIdLabel: 'PAN', reverseCharge: false },
    'BT': { name: 'Bhutan', taxName: 'Sales Tax', rate: 0, taxIdLabel: 'TIN', reverseCharge: false },
    'MV': { name: 'Maldives', taxName: 'GST', rate: 16, taxIdLabel: 'TIN', reverseCharge: false },
    // Southeast Asia
    'SG': { name: 'Singapore', taxName: 'GST', rate: 9, taxIdLabel: 'GST Registration No', reverseCharge: false },
    'MY': { name: 'Malaysia', taxName: 'SST', rate: 6, taxIdLabel: 'SST Registration No', reverseCharge: false },
    'TH': { name: 'Thailand', taxName: 'VAT', rate: 7, taxIdLabel: 'Tax ID', reverseCharge: false },
    'ID': { name: 'Indonesia', taxName: 'PPN', rate: 11, taxIdLabel: 'NPWP', reverseCharge: false },
    'PH': { name: 'Philippines', taxName: 'VAT', rate: 12, taxIdLabel: 'TIN', reverseCharge: false },
    'VN': { name: 'Vietnam', taxName: 'VAT', rate: 10, taxIdLabel: 'Tax Code', reverseCharge: false },
    'MM': { name: 'Myanmar', taxName: 'CT', rate: 5, taxIdLabel: 'TIN', reverseCharge: false },
    'KH': { name: 'Cambodia', taxName: 'VAT', rate: 10, taxIdLabel: 'TIN', reverseCharge: false },
    'LA': { name: 'Laos', taxName: 'VAT', rate: 10, taxIdLabel: 'TIN', reverseCharge: false },
    'BN': { name: 'Brunei', taxName: 'None', rate: 0, taxIdLabel: 'BRN', reverseCharge: false },
    'TL': { name: 'Timor-Leste', taxName: 'Sales Tax', rate: 2.5, taxIdLabel: 'TIN', reverseCharge: false },
    // East Asia
    'CN': { name: 'China', taxName: 'VAT', rate: 13, taxIdLabel: 'Tax Registration No', reverseCharge: false },
    'JP': { name: 'Japan', taxName: 'JCT', rate: 10, taxIdLabel: 'Corporate Number', reverseCharge: false },
    'KR': { name: 'South Korea', taxName: 'VAT', rate: 10, taxIdLabel: 'Business Reg No', reverseCharge: false },
    'TW': { name: 'Taiwan', taxName: 'VAT', rate: 5, taxIdLabel: 'Unified Business No', reverseCharge: false },
    'HK': { name: 'Hong Kong', taxName: 'None', rate: 0, taxIdLabel: 'BR Number', reverseCharge: false },
    'MO': { name: 'Macau', taxName: 'None', rate: 0, taxIdLabel: 'BRN', reverseCharge: false },
    'MN': { name: 'Mongolia', taxName: 'VAT', rate: 10, taxIdLabel: 'TIN', reverseCharge: false },
    // Oceania
    'AU': { name: 'Australia', taxName: 'GST', rate: 10, taxIdLabel: 'ABN', reverseCharge: false },
    'NZ': { name: 'New Zealand', taxName: 'GST', rate: 15, taxIdLabel: 'GST Number', reverseCharge: false },
    'FJ': { name: 'Fiji', taxName: 'VAT', rate: 9, taxIdLabel: 'TIN', reverseCharge: false },
    'PG': { name: 'Papua New Guinea', taxName: 'GST', rate: 10, taxIdLabel: 'TIN', reverseCharge: false },
    'WS': { name: 'Samoa', taxName: 'VAGST', rate: 15, taxIdLabel: 'TIN', reverseCharge: false },
    'TO': { name: 'Tonga', taxName: 'CT', rate: 15, taxIdLabel: 'TIN', reverseCharge: false },
    'VU': { name: 'Vanuatu', taxName: 'VAT', rate: 15, taxIdLabel: 'TIN', reverseCharge: false },
    'SB': { name: 'Solomon Islands', taxName: 'GST', rate: 15, taxIdLabel: 'TIN', reverseCharge: false },
    'NC': { name: 'New Caledonia', taxName: 'TGC', rate: 11, taxIdLabel: 'RIDET', reverseCharge: false },
    'PF': { name: 'French Polynesia', taxName: 'TVA', rate: 16, taxIdLabel: 'TAHITI', reverseCharge: false },
    'GU': { name: 'Guam', taxName: 'GRT', rate: 4, taxIdLabel: 'TIN', reverseCharge: false },
    // North Africa
    'EG': { name: 'Egypt', taxName: 'VAT', rate: 14, taxIdLabel: 'Tax Reg No', reverseCharge: false },
    'MA': { name: 'Morocco', taxName: 'TVA', rate: 20, taxIdLabel: 'IF', reverseCharge: false },
    'DZ': { name: 'Algeria', taxName: 'TVA', rate: 19, taxIdLabel: 'NIF', reverseCharge: false },
    'TN': { name: 'Tunisia', taxName: 'TVA', rate: 19, taxIdLabel: 'MF', reverseCharge: false },
    'LY': { name: 'Libya', taxName: 'None', rate: 0, taxIdLabel: 'TIN', reverseCharge: false },
    'SD': { name: 'Sudan', taxName: 'VAT', rate: 17, taxIdLabel: 'TIN', reverseCharge: false },
    // West Africa
    'NG': { name: 'Nigeria', taxName: 'VAT', rate: 7.5, taxIdLabel: 'TIN', reverseCharge: false },
    'GH': { name: 'Ghana', taxName: 'VAT', rate: 15, taxIdLabel: 'TIN', reverseCharge: false },
    'SN': { name: 'Senegal', taxName: 'TVA', rate: 18, taxIdLabel: 'NINEA', reverseCharge: false },
    'CI': { name: "Cote d'Ivoire", taxName: 'TVA', rate: 18, taxIdLabel: 'CC', reverseCharge: false },
    'ML': { name: 'Mali', taxName: 'TVA', rate: 18, taxIdLabel: 'NIF', reverseCharge: false },
    'BF': { name: 'Burkina Faso', taxName: 'TVA', rate: 18, taxIdLabel: 'IFU', reverseCharge: false },
    'NE': { name: 'Niger', taxName: 'TVA', rate: 19, taxIdLabel: 'NIF', reverseCharge: false },
    'GN': { name: 'Guinea', taxName: 'TVA', rate: 18, taxIdLabel: 'NIF', reverseCharge: false },
    'BJ': { name: 'Benin', taxName: 'TVA', rate: 18, taxIdLabel: 'IFU', reverseCharge: false },
    'TG': { name: 'Togo', taxName: 'TVA', rate: 18, taxIdLabel: 'NIF', reverseCharge: false },
    'SL': { name: 'Sierra Leone', taxName: 'GST', rate: 15, taxIdLabel: 'TIN', reverseCharge: false },
    'LR': { name: 'Liberia', taxName: 'GST', rate: 10, taxIdLabel: 'TIN', reverseCharge: false },
    'MR': { name: 'Mauritania', taxName: 'TVA', rate: 16, taxIdLabel: 'NIF', reverseCharge: false },
    'GM': { name: 'Gambia', taxName: 'VAT', rate: 15, taxIdLabel: 'TIN', reverseCharge: false },
    'GW': { name: 'Guinea-Bissau', taxName: 'IGV', rate: 17, taxIdLabel: 'NIF', reverseCharge: false },
    'CV': { name: 'Cape Verde', taxName: 'IVA', rate: 15, taxIdLabel: 'NIF', reverseCharge: false },
    // East Africa
    'KE': { name: 'Kenya', taxName: 'VAT', rate: 16, taxIdLabel: 'KRA PIN', reverseCharge: false },
    'TZ': { name: 'Tanzania', taxName: 'VAT', rate: 18, taxIdLabel: 'TIN', reverseCharge: false },
    'UG': { name: 'Uganda', taxName: 'VAT', rate: 18, taxIdLabel: 'TIN', reverseCharge: false },
    'ET': { name: 'Ethiopia', taxName: 'VAT', rate: 15, taxIdLabel: 'TIN', reverseCharge: false },
    'RW': { name: 'Rwanda', taxName: 'VAT', rate: 18, taxIdLabel: 'TIN', reverseCharge: false },
    'BI': { name: 'Burundi', taxName: 'TVA', rate: 18, taxIdLabel: 'NIF', reverseCharge: false },
    'SO': { name: 'Somalia', taxName: 'Sales Tax', rate: 5, taxIdLabel: 'TIN', reverseCharge: false },
    'DJ': { name: 'Djibouti', taxName: 'TVA', rate: 10, taxIdLabel: 'NIF', reverseCharge: false },
    'ER': { name: 'Eritrea', taxName: 'Sales Tax', rate: 5, taxIdLabel: 'TIN', reverseCharge: false },
    'SS': { name: 'South Sudan', taxName: 'VAT', rate: 18, taxIdLabel: 'TIN', reverseCharge: false },
    'MU': { name: 'Mauritius', taxName: 'VAT', rate: 15, taxIdLabel: 'VAT Number', reverseCharge: false },
    'SC': { name: 'Seychelles', taxName: 'VAT', rate: 15, taxIdLabel: 'TIN', reverseCharge: false },
    'MG': { name: 'Madagascar', taxName: 'TVA', rate: 20, taxIdLabel: 'NIF', reverseCharge: false },
    'KM': { name: 'Comoros', taxName: 'TVA', rate: 10, taxIdLabel: 'NIF', reverseCharge: false },
    'RE': { name: 'Reunion', taxName: 'TVA', rate: 8.5, taxIdLabel: 'SIRET', reverseCharge: false },
    // Central Africa
    'CD': { name: 'DR Congo', taxName: 'TVA', rate: 16, taxIdLabel: 'NIF', reverseCharge: false },
    'CG': { name: 'Congo', taxName: 'TVA', rate: 18, taxIdLabel: 'NIF', reverseCharge: false },
    'CF': { name: 'Central African Republic', taxName: 'TVA', rate: 19, taxIdLabel: 'NIF', reverseCharge: false },
    'CM': { name: 'Cameroon', taxName: 'TVA', rate: 19.25, taxIdLabel: 'NIU', reverseCharge: false },
    'TD': { name: 'Chad', taxName: 'TVA', rate: 18, taxIdLabel: 'NIF', reverseCharge: false },
    'GA': { name: 'Gabon', taxName: 'TVA', rate: 18, taxIdLabel: 'NIF', reverseCharge: false },
    'GQ': { name: 'Equatorial Guinea', taxName: 'IVA', rate: 15, taxIdLabel: 'NIF', reverseCharge: false },
    'ST': { name: 'Sao Tome and Principe', taxName: 'IVA', rate: 15, taxIdLabel: 'NIF', reverseCharge: false },
    'AO': { name: 'Angola', taxName: 'IVA', rate: 14, taxIdLabel: 'NIF', reverseCharge: false },
    // Southern Africa
    'ZA': { name: 'South Africa', taxName: 'VAT', rate: 15, taxIdLabel: 'VAT Number', reverseCharge: false },
    'ZW': { name: 'Zimbabwe', taxName: 'VAT', rate: 15, taxIdLabel: 'TIN', reverseCharge: false },
    'ZM': { name: 'Zambia', taxName: 'VAT', rate: 16, taxIdLabel: 'TPIN', reverseCharge: false },
    'BW': { name: 'Botswana', taxName: 'VAT', rate: 14, taxIdLabel: 'TIN', reverseCharge: false },
    'NA': { name: 'Namibia', taxName: 'VAT', rate: 15, taxIdLabel: 'TIN', reverseCharge: false },
    'MZ': { name: 'Mozambique', taxName: 'IVA', rate: 17, taxIdLabel: 'NUIT', reverseCharge: false },
    'MW': { name: 'Malawi', taxName: 'VAT', rate: 16.5, taxIdLabel: 'TPIN', reverseCharge: false },
    'SZ': { name: 'Eswatini', taxName: 'VAT', rate: 15, taxIdLabel: 'TIN', reverseCharge: false },
    'LS': { name: 'Lesotho', taxName: 'VAT', rate: 15, taxIdLabel: 'TIN', reverseCharge: false },
    // Caucasus
    'GE': { name: 'Georgia', taxName: 'VAT', rate: 18, taxIdLabel: 'TIN', reverseCharge: false },
    'AM': { name: 'Armenia', taxName: 'VAT', rate: 20, taxIdLabel: 'TIN', reverseCharge: false },
    'AZ': { name: 'Azerbaijan', taxName: 'VAT', rate: 18, taxIdLabel: 'VOEN', reverseCharge: false },
};

// Default settings
const defaultSettings = {
    theme: 'dark', // 'dark' | 'light'
    company: {
        name: '', // User sets their company name during onboarding
        address: '',
        city: '',
        country: '',
        phone: '',
        email: '',
        website: '',
        logo: null,
    },
    taxInfo: {
        taxNumber: '',
        registrationNumber: '',
        licenses: '',
    },
    // Tax configuration for invoicing
    taxConfig: {
        homeCountry: 'MY', // ISO country code
        taxRegistered: true, // Whether company is registered for tax
        domesticTaxRate: 6, // Tax rate for domestic invoicing
        domesticTaxName: 'SST', // Name of domestic tax (VAT, GST, SST, etc.)
        applyTaxToInternational: false, // Whether to charge tax on international invoices
        showTaxBreakdown: true, // Show tax as separate line item
        reverseChargeEnabled: true, // Enable reverse charge for EU B2B
        // Invoice wording for different scenarios
        reverseChargeText: 'Reverse charge: VAT to be accounted for by the recipient as per Article 196 of the EU VAT Directive',
        exportServicesText: 'Export of services - zero rated for VAT purposes',
        domesticExemptText: '', // For domestic tax-exempt supplies
        // B2B requirements
        requireClientTaxId: false, // Require client VAT/Tax ID for B2B
        validateTaxId: false, // Validate tax ID format
        // E-invoicing readiness
        eInvoicingEnabled: false, // For countries requiring e-invoicing
        eInvoicingFormat: '', // PEPPOL, FatturaPA, etc.
        // Custom tax rules (overrides DEFAULT_TAX_RULES)
        customTaxRules: {},
    },
    bankDetails: {
        bankName: '',
        bankAddress: '',
        accountName: '',
        accountNumber: '',
        sortCode: '', // UK sort code
        iban: '', // International Bank Account Number
        swiftCode: '', // BIC/SWIFT code
        routingNumber: '', // US routing number
        branchCode: '', // Branch code (various countries)
        bsbNumber: '', // Australian BSB
        currency: 'MYR',
        additionalInfo: '', // Any other payment instructions
    },
    quoteDefaults: {
        validityDays: 30,
        quotePrefix: 'QT', // Prefix for quote numbers (e.g., QT-2025-1234)
        invoicePrefix: 'INV', // Prefix for invoice numbers
        paymentTerms: '50% deposit on confirmation, balance on completion',
        termsAndConditions: `• This quote is valid for 30 days from the date of issue.
• 50% deposit required upon confirmation.
• Final payment due within 14 days of project completion.
• Any additional requirements may incur extra charges.
• Cancellation within 7 days of project start may incur fees.`,
    },
    users: [
        { id: 'default', name: 'Tom', email: '', role: 'admin' }
    ],
    pdfOptions: {
        showCompanyAddress: true,
        showCompanyPhone: true,
        showCompanyEmail: true,
        showTaxNumber: false,
        showBankDetails: false,
        showLogo: true,
        // PDF Colors
        primaryColor: '#143642',    // Headers, section titles
        accentColor: '#6E44FF',     // Accent elements
        lineColor: '#143642',       // All lines and borders
        textColor: '#374151',       // Body text
        mutedColor: '#6B7280',      // Secondary text
        backgroundColor: '#FFFFFF', // Page background
    },
    aiSettings: {
        anthropicKey: '',
        openaiKey: '',
    },
    projectTypes: [
        { id: 'broadcast', label: 'Broadcast' },
        { id: 'streaming', label: 'Streaming' },
        { id: 'graphics', label: 'Graphics' },
        { id: 'sports_presentation', label: 'Sports Presentation' },
        { id: 'technical_consultancy', label: 'Technical Management & Consultancy' },
        { id: 'other', label: 'Other' },
    ],
    regions: [
        { id: 'SEA', label: 'South East Asia', currency: 'USD', countries: ['Malaysia', 'Singapore', 'Indonesia', 'Thailand', 'Vietnam', 'Philippines', 'Myanmar', 'Cambodia', 'Laos', 'Brunei'] },
        { id: 'GCC', label: 'Gulf States', currency: 'KWD', countries: ['Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'] },
        { id: 'LEVANT', label: 'Levant', currency: 'USD', countries: ['Jordan', 'Lebanon', 'Iraq'] },
        { id: 'CENTRAL_ASIA', label: 'Central Asia', currency: 'USD', countries: ['Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Tajikistan', 'Kyrgyzstan'] },
    ],
    // Preferred currencies - shown in dropdowns throughout the app
    // User selects which currencies they commonly use
    preferredCurrencies: ['USD', 'EUR', 'GBP', 'MYR', 'SGD'],
    // Company OKRs that guide research priorities
    okrs: [
        { id: 'okr1', objective: 'Expand into GCC market', keyResult: 'Win 3 major sports broadcast contracts in Saudi Arabia or UAE by end of 2025', priority: 1 },
        { id: 'okr2', objective: 'Grow recurring revenue', keyResult: 'Establish 5 long-term league partnerships across SEA region', priority: 2 },
        { id: 'okr3', objective: 'Build Central Asia presence', keyResult: 'Deliver 2 multi-sport events in Kazakhstan or Uzbekistan', priority: 3 },
    ],
    // Opportunities page preferences (synced across devices)
    opsPreferences: {
        expandedCountries: {}, // { countryName: boolean }
        hiddenCountries: {},   // { countryName: boolean }
        dashboardCurrency: 'USD',
    },
    // Dashboard page preferences
    dashboardPreferences: {
        currency: 'USD',
        collapsedColumns: {},  // { statusId: boolean }
        pipelineMinimized: false,
    },
    // Quotes page preferences
    quotesPreferences: {
        displayCurrency: 'USD',
        sortBy: 'updatedAt',
        sortDir: 'desc',
    },
    // Clients page preferences
    clientsPreferences: {
        currency: 'USD',
    },
    // Activity log for tracking all changes
    activityLog: [],
};

// Load from localStorage (fallback) with decryption
async function loadSettingsLocal() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            const merged = mergeSettings(parsed);

            // Decrypt sensitive fields
            if (merged.aiSettings) {
                merged.aiSettings = await decryptFields(merged.aiSettings, SENSITIVE_FIELDS);
            }

            if (merged.bankDetails) {
                merged.bankDetails = await decryptFields(merged.bankDetails, BANK_SENSITIVE_FIELDS);
            }

            return merged;
        }
        return defaultSettings;
    } catch (e) {
        console.error('Failed to load settings:', e);
        return defaultSettings;
    }
}

// Merge with defaults
function mergeSettings(parsed) {
    return {
        ...defaultSettings,
        ...parsed,
        theme: parsed.theme || defaultSettings.theme,
        company: { ...defaultSettings.company, ...parsed.company },
        taxInfo: { ...defaultSettings.taxInfo, ...parsed.taxInfo },
        taxConfig: { ...defaultSettings.taxConfig, ...parsed.taxConfig },
        bankDetails: { ...defaultSettings.bankDetails, ...parsed.bankDetails },
        quoteDefaults: { ...defaultSettings.quoteDefaults, ...parsed.quoteDefaults },
        pdfOptions: { ...defaultSettings.pdfOptions, ...parsed.pdfOptions },
        aiSettings: { ...defaultSettings.aiSettings, ...parsed.aiSettings },
        opsPreferences: { ...defaultSettings.opsPreferences, ...parsed.opsPreferences },
        dashboardPreferences: { ...defaultSettings.dashboardPreferences, ...parsed.dashboardPreferences },
        quotesPreferences: { ...defaultSettings.quotesPreferences, ...parsed.quotesPreferences },
        clientsPreferences: { ...defaultSettings.clientsPreferences, ...parsed.clientsPreferences },
        users: parsed.users || defaultSettings.users,
        projectTypes: parsed.projectTypes || defaultSettings.projectTypes,
        regions: parsed.regions || defaultSettings.regions,
        activityLog: parsed.activityLog || defaultSettings.activityLog,
    };
}

// Helper function to calculate tax for an invoice
export function calculateInvoiceTax(settings, clientCountry, subtotal) {
    const { taxConfig } = settings;
    const homeCountry = taxConfig.homeCountry;

    // Not registered for tax - no tax charged
    if (!taxConfig.taxRegistered) {
        return { taxRate: 0, taxAmount: 0, taxName: '', showTax: false, note: '' };
    }

    // Domestic invoice - same country
    if (clientCountry === homeCountry) {
        const taxAmount = subtotal * (taxConfig.domesticTaxRate / 100);
        return {
            taxRate: taxConfig.domesticTaxRate,
            taxAmount,
            taxName: taxConfig.domesticTaxName,
            showTax: taxConfig.showTaxBreakdown,
            note: '',
        };
    }

    // International invoice
    if (!taxConfig.applyTaxToInternational) {
        // Check if reverse charge applies (EU B2B)
        const clientTaxRules = taxConfig.customTaxRules[clientCountry] || DEFAULT_TAX_RULES[clientCountry];
        if (clientTaxRules?.reverseCharge && taxConfig.reverseChargeEnabled) {
            return {
                taxRate: 0,
                taxAmount: 0,
                taxName: '',
                showTax: false,
                note: 'Reverse charge: VAT to be accounted for by the recipient',
            };
        }

        return {
            taxRate: 0,
            taxAmount: 0,
            taxName: '',
            showTax: false,
            note: 'Export of services - zero rated',
        };
    }

    // Apply tax to international (rare case)
    const taxAmount = subtotal * (taxConfig.domesticTaxRate / 100);
    return {
        taxRate: taxConfig.domesticTaxRate,
        taxAmount,
        taxName: taxConfig.domesticTaxName,
        showTax: taxConfig.showTaxBreakdown,
        note: '',
    };
}

// Save to localStorage (cache) with encryption
async function saveSettingsLocal(settings) {
    try {
        // Clone settings to avoid mutating state
        const toSave = JSON.parse(JSON.stringify(settings));

        // Encrypt sensitive fields before saving
        if (toSave.aiSettings) {
            toSave.aiSettings = await encryptFields(toSave.aiSettings, SENSITIVE_FIELDS);
        }

        if (toSave.bankDetails) {
            toSave.bankDetails = await encryptFields(toSave.bankDetails, BANK_SENSITIVE_FIELDS);
        }

        localStorage.setItem(SETTINGS_KEY, JSON.stringify(toSave));
        logSecurityEvent('settings_saved', { encrypted: true });
    } catch (e) {
        console.error('Failed to save settings locally:', e);
    }
}

// Database ID for settings (single row)
let settingsDbId = null;

// Save to Supabase with error tracking
async function saveSettingsToDb(settings, setSync) {
    if (!isSupabaseConfigured()) return { success: true };

    try {
        // Encrypt AI settings before saving to DB
        const aiSettingsToSave = await encryptFields(
            settings.aiSettings || {},
            SENSITIVE_FIELDS
        );

        if (settingsDbId) {
            const { error } = await supabase
                .from('settings')
                .update({
                    company: settings.company,
                    quote_defaults: settings.quoteDefaults,
                    terms_and_conditions: settings.quoteDefaults?.termsAndConditions || '',
                    users: settings.users,
                    ai_settings: aiSettingsToSave,
                    ops_preferences: settings.opsPreferences,
                    dashboard_preferences: settings.dashboardPreferences,
                    quotes_preferences: settings.quotesPreferences,
                    clients_preferences: settings.clientsPreferences,
                })
                .eq('id', settingsDbId);

            if (error) throw error;

            logSecurityEvent('settings_synced_to_db', { encrypted: true });
            if (setSync) setSync({ syncStatus: 'success', syncError: null });
            return { success: true };
        }
        return { success: true };
    } catch (e) {
        console.error('Failed to save settings to DB:', e);
        if (setSync) setSync({ syncStatus: 'error', syncError: e.message });
        return { success: false, error: e.message };
    }
}

// Initialize with async load
let initialSettings = defaultSettings;
loadSettingsLocal().then(loaded => {
    initialSettings = loaded;
    useSettingsStore.setState({ settings: loaded, loading: false });
});

export const useSettingsStore = create(
    subscribeWithSelector((set, get) => ({
        settings: initialSettings,
        loading: true,
        syncStatus: 'idle', // 'idle' | 'syncing' | 'error' | 'success'
        syncError: null,

        clearSyncError: () => {
            set({ syncError: null, syncStatus: 'idle' });
        },

        // Set theme (dark/light)
        setTheme: async (theme) => {
            const state = get();
            const updated = {
                ...state.settings,
                theme: theme,
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
            // Apply theme to document
            if (theme === 'light') {
                document.documentElement.classList.add('light');
                document.documentElement.classList.remove('dark');
            } else {
                document.documentElement.classList.add('dark');
                document.documentElement.classList.remove('light');
            }
        },

        // Initialize - load from Supabase (or localStorage fallback)
        initialize: async () => {
            // If Supabase not configured, just use localStorage data
            if (!isSupabaseConfigured()) {
                const localSettings = await loadSettingsLocal();
                set({ settings: localSettings, loading: false, syncStatus: 'idle' });
                return;
            }

            set({ loading: true, syncStatus: 'syncing' });
            try {
                const { data, error } = await supabase
                    .from('settings')
                    .select('*')
                    .limit(1)
                    .single();

                if (error) throw error;

                if (data) {
                    settingsDbId = data.id;

                    // Decrypt AI settings from DB
                    const aiSettings = data.ai_settings
                        ? await decryptFields(data.ai_settings, SENSITIVE_FIELDS)
                        : defaultSettings.aiSettings;

                    const dbSettings = {
                        ...await loadSettingsLocal(),
                        company: data.company || defaultSettings.company,
                        quoteDefaults: {
                            ...defaultSettings.quoteDefaults,
                            ...data.quote_defaults,
                            termsAndConditions: data.terms_and_conditions || defaultSettings.quoteDefaults.termsAndConditions,
                        },
                        users: data.users || defaultSettings.users,
                        aiSettings,
                        opsPreferences: data.ops_preferences || defaultSettings.opsPreferences,
                        dashboardPreferences: data.dashboard_preferences || defaultSettings.dashboardPreferences,
                        quotesPreferences: data.quotes_preferences || defaultSettings.quotesPreferences,
                        clientsPreferences: data.clients_preferences || defaultSettings.clientsPreferences,
                    };

                    const merged = mergeSettings(dbSettings);
                    await saveSettingsLocal(merged);
                    set({ settings: merged, loading: false, syncStatus: 'success', syncError: null });
                } else {
                    const localSettings = await loadSettingsLocal();
                    set({ settings: localSettings, loading: false, syncStatus: 'success', syncError: null });
                }
            } catch (e) {
                console.error('Failed to load settings from DB:', e);
                const localSettings = await loadSettingsLocal();
                set({ settings: localSettings, loading: false, syncStatus: 'error', syncError: e.message });
            }
        },

        // Update company info
        setCompanyInfo: async (company) => {
            const state = get();
            const updated = {
                ...state.settings,
                company: { ...state.settings.company, ...company },
            };
            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });
        },

        // Update tax info
        setTaxInfo: async (taxInfo) => {
            const state = get();
            const updated = {
                ...state.settings,
                taxInfo: { ...state.settings.taxInfo, ...taxInfo },
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        // Update tax configuration (for invoicing)
        setTaxConfig: async (taxConfig) => {
            const state = get();
            const updated = {
                ...state.settings,
                taxConfig: { ...state.settings.taxConfig, ...taxConfig },
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        // Update preferred currencies (shown in dropdowns throughout the app)
        setPreferredCurrencies: async (preferredCurrencies) => {
            const state = get();
            const updated = {
                ...state.settings,
                preferredCurrencies,
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        // Update bank details (encrypted)
        setBankDetails: async (bankDetails) => {
            const state = get();
            const updated = {
                ...state.settings,
                bankDetails: { ...state.settings.bankDetails, ...bankDetails },
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });

            logSecurityEvent('bank_details_updated', { encrypted: true });
        },

        // Update quote defaults
        setQuoteDefaults: async (quoteDefaults) => {
            const state = get();
            const updated = {
                ...state.settings,
                quoteDefaults: { ...state.settings.quoteDefaults, ...quoteDefaults },
            };
            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });
        },

        // Update PDF options
        setPdfOptions: async (pdfOptions) => {
            const state = get();
            const updated = {
                ...state.settings,
                pdfOptions: { ...state.settings.pdfOptions, ...pdfOptions },
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        // Update ops preferences (synced to Supabase for multi-device)
        setOpsPreferences: async (opsPreferences) => {
            const state = get();
            const updated = {
                ...state.settings,
                opsPreferences: { ...state.settings.opsPreferences, ...opsPreferences },
            };
            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });
        },

        // Update dashboard preferences (synced to Supabase for multi-device)
        setDashboardPreferences: async (dashboardPreferences) => {
            const state = get();
            const updated = {
                ...state.settings,
                dashboardPreferences: { ...state.settings.dashboardPreferences, ...dashboardPreferences },
            };
            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });
        },

        // Update quotes preferences (synced to Supabase for multi-device)
        setQuotesPreferences: async (quotesPreferences) => {
            const state = get();
            const updated = {
                ...state.settings,
                quotesPreferences: { ...state.settings.quotesPreferences, ...quotesPreferences },
            };
            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });
        },

        // Update clients preferences (synced to Supabase for multi-device)
        setClientsPreferences: async (clientsPreferences) => {
            const state = get();
            const updated = {
                ...state.settings,
                clientsPreferences: { ...state.settings.clientsPreferences, ...clientsPreferences },
            };
            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });
        },

        // Update AI settings (encrypted)
        setAiSettings: async (aiSettings) => {
            const state = get();

            // Validate API key formats and show warnings
            if (aiSettings.anthropicKey && !validateApiKeyFormat(aiSettings.anthropicKey, 'sk-ant-')) {
                showSecurityWarning('Invalid Anthropic API key format. Expected format: sk-ant-...');
            }

            if (aiSettings.openaiKey && !validateApiKeyFormat(aiSettings.openaiKey, 'sk-')) {
                showSecurityWarning('Invalid OpenAI API key format. Expected format: sk-...');
            }

            // Warn about client-side API keys
            if (aiSettings.anthropicKey || aiSettings.openaiKey) {
                showSecurityWarning(
                    'API keys are stored in browser localStorage (encrypted). ' +
                    'For production use, implement a backend proxy to keep keys secure on the server.'
                );
            }

            const updated = {
                ...state.settings,
                aiSettings: { ...state.settings.aiSettings, ...aiSettings },
            };

            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });

            logSecurityEvent('api_keys_updated', {
                hasAnthropicKey: !!aiSettings.anthropicKey,
                hasOpenaiKey: !!aiSettings.openaiKey,
                encrypted: true
            });
        },

        // Add user
        addUser: async (user) => {
            const state = get();
            const newUser = {
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                name: user.name || '',
                email: user.email || '',
                role: user.role || 'user',
            };
            const updated = {
                ...state.settings,
                users: [...state.settings.users, newUser],
            };
            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });
        },

        // Update user
        updateUser: async (userId, updates) => {
            const state = get();
            const updated = {
                ...state.settings,
                users: state.settings.users.map(u =>
                    u.id === userId ? { ...u, ...updates } : u
                ),
            };
            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });
        },

        // Delete user
        deleteUser: async (userId) => {
            const state = get();
            const updated = {
                ...state.settings,
                users: state.settings.users.filter(u => u.id !== userId),
            };
            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });
        },

        // Get user by ID
        getUser: (userId) => {
            return get().settings.users.find(u => u.id === userId);
        },

        // Project Types
        addProjectType: async (label) => {
            const state = get();
            const id = label.toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substring(2, 7);
            const updated = {
                ...state.settings,
                projectTypes: [...state.settings.projectTypes, { id, label }],
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        updateProjectType: async (id, label) => {
            const state = get();
            const updated = {
                ...state.settings,
                projectTypes: state.settings.projectTypes.map(pt =>
                    pt.id === id ? { ...pt, label } : pt
                ),
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        deleteProjectType: async (id) => {
            const state = get();
            const updated = {
                ...state.settings,
                projectTypes: state.settings.projectTypes.filter(pt => pt.id !== id),
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        moveProjectType: async (id, direction) => {
            const state = get();
            const types = [...state.settings.projectTypes];
            const index = types.findIndex(t => t.id === id);
            if (index === -1) return;

            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= types.length) return;

            [types[index], types[newIndex]] = [types[newIndex], types[index]];
            const updated = { ...state.settings, projectTypes: types };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        // Regions
        addRegion: async (label, currency = 'USD', countries = []) => {
            const state = get();
            const id = label.toUpperCase().replace(/\s+/g, '_');
            const updated = {
                ...state.settings,
                regions: [...state.settings.regions, { id, label, currency, countries }],
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        updateRegion: async (id, updates) => {
            const state = get();
            const updated = {
                ...state.settings,
                regions: state.settings.regions.map(r =>
                    r.id === id ? { ...r, ...updates } : r
                ),
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        deleteRegion: async (id) => {
            const state = get();
            const updated = {
                ...state.settings,
                regions: state.settings.regions.filter(r => r.id !== id),
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        moveRegion: async (id, direction) => {
            const state = get();
            const regions = [...state.settings.regions];
            const index = regions.findIndex(r => r.id === id);
            if (index === -1) return;

            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= regions.length) return;

            [regions[index], regions[newIndex]] = [regions[newIndex], regions[index]];
            const updated = { ...state.settings, regions };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        // OKRs - Update an OKR
        updateOkr: async (id, updates) => {
            const state = get();
            const updated = {
                ...state.settings,
                okrs: state.settings.okrs.map(okr =>
                    okr.id === id ? { ...okr, ...updates } : okr
                ),
            };
            await saveSettingsLocal(updated);
            saveSettingsToDb(updated);
            set({ settings: updated });
        },

        // Get OKRs formatted for research prompt
        getOkrsForPrompt: () => {
            const { settings } = get();
            const okrs = settings.okrs || [];
            if (okrs.length === 0) return '';

            return okrs
                .sort((a, b) => a.priority - b.priority)
                .map((okr, i) => `${i + 1}. **${okr.objective}**: ${okr.keyResult}`)
                .join('\n');
        },

        // Export settings
        exportSettings: async () => {
            const { settings } = get();

            // Create a sanitized export (remove encrypted keys for security)
            const sanitized = {
                ...settings,
                aiSettings: {
                    anthropicKey: settings.aiSettings.anthropicKey ? '***REDACTED***' : '',
                    openaiKey: settings.aiSettings.openaiKey ? '***REDACTED***' : '',
                },
                bankDetails: {
                    ...settings.bankDetails,
                    accountNumber: settings.bankDetails.accountNumber ? '***REDACTED***' : '',
                    swiftCode: settings.bankDetails.swiftCode ? '***REDACTED***' : '',
                }
            };

            const blob = new Blob([JSON.stringify(sanitized, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            logSecurityEvent('settings_exported', { sanitized: true });
        },

        // Activity Log - Add entry
        addActivityLog: async (entry) => {
            const state = get();
            const newEntry = {
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                timestamp: new Date().toISOString(),
                ...entry,
            };
            const updated = {
                ...state.settings,
                activityLog: [newEntry, ...(state.settings.activityLog || [])].slice(0, 1000), // Keep last 1000 entries
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        // Activity Log - Clear all
        clearActivityLog: async () => {
            const state = get();
            const updated = {
                ...state.settings,
                activityLog: [],
            };
            await saveSettingsLocal(updated);
            set({ settings: updated });
        },

        // Activity Log - Export to CSV
        exportActivityLog: () => {
            const { settings } = get();
            const logs = settings.activityLog || [];

            if (logs.length === 0) {
                alert('No activity logs to export');
                return;
            }

            const headers = ['Timestamp', 'User', 'Quote #', 'Action', 'Category', 'Field', 'Description', 'Old Value', 'New Value'];
            const rows = logs.map(log => [
                log.timestamp,
                log.userName || log.userId || '',
                log.quoteNumber || '',
                log.action || '',
                log.category || '',
                log.field || '',
                log.description || '',
                typeof log.oldValue === 'object' ? JSON.stringify(log.oldValue) : (log.oldValue || ''),
                typeof log.newValue === 'object' ? JSON.stringify(log.newValue) : (log.newValue || ''),
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        },

        // Reset to defaults
        resetSettings: async () => {
            set({ settings: defaultSettings });
            await saveSettingsLocal(defaultSettings);
        },
    }))
);
