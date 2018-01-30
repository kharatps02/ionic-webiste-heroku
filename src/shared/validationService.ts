
export class ValidationService {
  static emailValidator(control) {
    let emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    //console.log('control.value',control.value);
    if (emailPattern.test(control.value)) {
      return null;
    } else {
      return { 'invalidEmailAddress': true };
    }
  };

  static zipcodeValidator(control) {
    let zipcodePattern = /^[0-9]{5}(?:-[0-9]{4})?$/;
    if (zipcodePattern.test(control.value)) {
      return null;
    } else {
      return { 'invalidZipcode': true };
    }
  };

  static strongPasswordValidator(control) {
    let passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,100})$/;
    if (passwordPattern.test(control.value)) {
      return null;
    } else {
      return { 'invalidPassword': true };
    }
  };

  static isTrueValue(control) {
    if (control && control.value) {
      return null;
    } else {
      return { 'isFalseValue': true };
    }
  }
}