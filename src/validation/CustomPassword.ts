import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'customText', async: false })
export class ValidPasswordFormat implements ValidatorConstraintInterface {
    validate(text: string, args: ValidationArguments) {  
        const upperCasePattern = /(?=.*[A-Z])/;
        const lowerCasePattern = /(?=.*[a-z])/;
        const specialCharacterPattern = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/
        const numberPattern = /\d/
        return upperCasePattern.test(text) && lowerCasePattern.test(text) && numberPattern.test(text) && specialCharacterPattern.test(text)
    }
}
