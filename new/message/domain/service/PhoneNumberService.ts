import {PhoneNumberFormat, PhoneNumberType, PhoneNumberUtil} from "google-libphonenumber";

const phoneUtil = PhoneNumberUtil.getInstance();


/**
 * This service contains utility functions to process phone number
 * Old code migrate totaly as it was 10/04/2024
 */
export class PhoneNumberService {
    static FRENCH_REGION_CODE = [
        // France
        'FR',
        // Guadeloupe
        'GP',
        // Guyane Française
        'GF',
        // Martinique
        'MQ',
        // La Réunion
        'RE',
        // Mayotte
        'YT',
        // Saint Barthélémy
        'BL',
        // Saint Martin
        'MF',
        // Nouvelle Calédonie
        'NC',
        // Polynésie Française
        'PF',
        // Saint Pierre et Miquelon
        'PM',
        // Terres australes et antarctique
        'TF',
        // Wallis et Futuna
        'WF'
    ];

    static FRENCH_MOBILE_NUM_ROOT_TO_COUNTRYCODE = {
        // Racines correspondant à la France Métropolitaine (+33)
        '06[1-2]': '+33',
        '064': '+33',
        '06[6-8]': '+33',
        '073': '+33',
        '07[5-8]': '+33',
        '060[1-9]': '+33',
        '063[0-8]': '+33',
        '065[0-2]': '+33',
        '065[6-9]': '+33',
        '0695': '+33',
        '069[8-9]': '+33',
        '074[0-9]': '+33',

        // Racines correspondant à la Guadeloupe, Saint-Martin et Saint-Barthélemy (+590)
        '069[0-1]': '+590',

        // Racines correspondant à la Guyane (+594)
        '0694': '+594',

        // Racines correspondant à la Martinique (+596)
        '069[6-7]': '+596',

        // Racines correspondant à Mayotte (+262)
        '0639': '+262',

        // Racines correspondant à la Réunion et autres territoires de l’Océan Indien (+262)
        '069[2-3]': '+262',

        // Racines correspondant à Saint-Pierre-et-Miquelon (+508)
        '0508': '+508',

        // Racines de routage des numéros mobiles
        '0600[0-3]': '+33',
        '0600[6-9]': '+33',
        '0509': '+33',
        '051[0-5]': '+33'
    };

    // in theory, webxms doesn't care about home phone number, so this should be useless, but keep it here, just in case
    FRENCH_PHONE_NUM_ROOT_TO_COUNTRYCODE = {
        // Racines correspondant à la France Métropolitaine (+33)
        '0105': '+33',
        '01[1-5]': '+33',
        '016[0-9]': '+33',
        '01[7-9]': '+33',
        '02[1-5]': '+33',
        '026[0-1]': '+33',
        '026[5-7]': '+33',
        '027[0-9]': '+33',
        '03[1-6]': '+33',
        '037[0-9]': '+33',
        '03[8-9]': '+33',
        '041': '+33',
        '042[0-9]': '+33',
        '04[3-9]': '+33',
        '051[6-9]': '+33',
        '05[2-5]': '+33',
        '056[0-9]': '+33',
        '05[7-8]': '+33',
        '090[1-9]': '+33',
        '09[1-3]': '+33',
        '094[0-6]': '+33',
        '094[8-9]': '+33',
        '09[5-6]': '+33',
        '097[0-5]': '+33',
        '097[7-9]': '+33',
        '098': '+33',
        '099[0-8]': '+33',

        // Racines correspondant à la Guadeloupe, Saint-Martin et Saint-Barthélemy (+590)
        '0590': '+590',
        '09475': '+590',
        '0976[0-1]': '+590',
        '09768': '+590',

        // Racines correspondant à la Guyane (+594)
        '0594': '+594',
        '09476': '+594',
        '0976[4-5]': '+594',

        // Racines correspondant à la Martinique (+596)
        '0596': '+596',
        '09477': '+596',
        '0976[6-7]': '+596',

        // Racines correspondant à la Réunion, Mayotte et autres territoires de l’Océan Indien (+262)
        '026[2-3]': '+262',
        '0269': '+262',
        '0947[8-9]': '+262',
        '0976[2-3]': '+262',
        '09769': '+262',

        // Racines correspondant à Saint-Pierre-et-Miquelon (+508)
        '0508': '+508'
    };



    /**
     * Get the normalized E164 notation of a phone number (+33...)
     * @param {string} str The input phone number to format
     * @returns {string|null} The normalized phone number, or null if phone num couldn't be parsed
     */
    static getNormalizedNumber(str: string) {
        // Remove spaces; Remove the (0) indicator; Remove everything that is not a number
        let number = str.replace(/\s/g, '')
            .replace('(0)', '')
            .replace(/[^0-9]/g, '');

        // If the number begins with 00 it's to "go out" with an international number. Basically it's like a +.
        if (number.startsWith('00')) {
            number = number.replace('00', '');
        }

        // if it's starts with a 0 it's a local number, so it should be a french number (metropolitan or DOM TOM)
        // A french number is 10 digits long (except for short number and technical number, but those aren't for
        // public customers)
        if ((number.startsWith('0') && number.length === 10) || number.startsWith('33')) {
            // if number starts with 33, we can't be sure it's a metropolitan french number. We have to check the rest
            // of the phone number to see if it's a metropolitan or DOM TOM french number. So, set the number as local
            // number, and let the regexp analyse the format
            if (number.startsWith('33')) {
                number = number.replace('33', '0');
            }

            // try to parse number as french mobile phone number, using the Plan De Numérotation International
            // which is more clever than the Google lib, when it comes to french phone numbers
            for (const [regexp, countryCode] of Object.entries(PhoneNumberService.FRENCH_MOBILE_NUM_ROOT_TO_COUNTRYCODE)) {
                if (number.match(new RegExp(`^${regexp}`)) !== null) {
                    return number.replace('0', countryCode);
                }
            }

            // if previous analysis failed, try to use the Google phone lib, using french region codes only
            const formattedNum = this.getNormalizedFrenchNumber(number);

            if (formattedNum) {
                return formattedNum;
            }
        }

        // default parsing/formatting : add a + att the beginning and call Phone lib
        number = `+${number}`;

        try {
            const parsedNum = phoneUtil.parseAndKeepRawInput(number);

            if (phoneUtil.isValidNumber(parsedNum)) {
                return phoneUtil.format(parsedNum, PhoneNumberFormat.E164);
            }
        } catch (err) {
            // ignore exception
        }

        return null;
    }


    /**
     * Check if a phone number is a french phone (metropolitan or DOM-TOM)
     * @param {string} number A phone number
     * @returns {boolean} True if it is a French phone number, false otherwise
     */
    isFrenchNumber(number: string) {
        // do a clever analysis and parsing of phone number. Sometimes we can received things like +33693834322 :
        // we could believe it's a french metropolitan phone number due to the +33, but it's not. It should be
        // +262693834322 as it's from réunion. The Google Phone Lib isn't capable of distinguishing that
        const normalizedNum = PhoneNumberService.getNormalizedNumber(number);

        for (const regionCode of PhoneNumberService.FRENCH_REGION_CODE) {
            try {
                const parsedNum = phoneUtil.parseAndKeepRawInput(normalizedNum!, regionCode);

                if (phoneUtil.isValidNumberForRegion(parsedNum, regionCode)) {
                    return true;
                }
            } catch (err) {
                // ignore exception
            }
        }

        return false;
    }


    /**
     * Check of a phone number is a metropolitan french phone
     * @param {string} number A phone number
     * @returns {boolean} True if it is a French phone number, else false
     */
    static isMetropolitanFrenchNumber(number: string) {
        // do a clever analysis and parsing of phone number. Sometimes we can received things like +33693834322 :
        // we could believe it's a french metropolitan phone number due to the +33, but it's not. It should be
        // +262693834322. The Google Phone Lib isn't capable of distinguishing that
        const normalizedNum = this.getNormalizedNumber(number);

        try {
            const parsedNum = phoneUtil.parseAndKeepRawInput(normalizedNum!, 'FR');

            return phoneUtil.isValidNumberForRegion(parsedNum, 'FR');
        } catch (err) {
            // ignore exception
        }

        return false;
    }


    /**
     * Get the normalized notation of a French number
     * /!\ This function only uses the Google Phone Lib, which process +33693834322 as a valid metropolitan french
     * phone number, which is not. It's supposed to be +262693834322 (Réunion)
     * @param {string} number The input phone number
     * @returns {string|null} The formatted normalized phone number, or null if phone number couldn't be parsed as
     * french number
     */
    static getNormalizedFrenchNumber(number: string) {
        for (const regionCode of PhoneNumberService.FRENCH_REGION_CODE) {
            try {
                const parsedNum = phoneUtil.parseAndKeepRawInput(number, regionCode);

                if (phoneUtil.isValidNumberForRegion(parsedNum, regionCode)) {
                    return phoneUtil.format(parsedNum, PhoneNumberFormat.E164);
                }
            } catch (err) {
                // ignore exception
            }
        }

        return null;
    }


    /**
     * Get the country code matching the given phone number
     * @param {string} number A phone number
     * @returns {string|null} The phone number country code, or null if phone number couldn't be parsed
     */
    getPhoneNumberCountryCode(number: string) {
        // do a clever analysis and parsing of phone number. Sometimes we can received things like +33693834322 :
        // we could believe it's a french metropolitan phone number due to the +33, but it's not. It should be
        // +262693834322. The Google Phone Lib isn't capable of distinguishing that
        const normalizedNum = PhoneNumberService.getNormalizedNumber(number);

        try {
            const parsedNum = phoneUtil.parseAndKeepRawInput(normalizedNum!);

            return phoneUtil.getRegionCodeForNumber(parsedNum);
        } catch (err) {
            return null;
        }
    }


    formatAsNationalNumberForBroker(number: string) {
        try {
            const parsedNum = phoneUtil.parseAndKeepRawInput(number);
            let nationalFormat = phoneUtil.format(parsedNum, PhoneNumberFormat.NATIONAL);

            if (nationalFormat) {
                nationalFormat = nationalFormat.replace(/\s/g, '');
            }

            return nationalFormat;
        } catch (err) {
            return null;
        }
    }


    isMobilePhoneNumber(number: string) {
        const normalizedNum = PhoneNumberService.getNormalizedNumber(number);

        try {
            const parsedNum = phoneUtil.parseAndKeepRawInput(normalizedNum!);
            const numType = phoneUtil.getNumberType(parsedNum);

            return numType === PhoneNumberType.MOBILE || numType === PhoneNumberType.FIXED_LINE_OR_MOBILE;
        } catch (err) {
            return false;
        }
    }
}


