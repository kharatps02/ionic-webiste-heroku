Keystore - 
alias name - rezility
password - rezilityNC!
CN=Manish Oswal, OU=Enterprise Community, O=Extentia, L=Pune, ST=Maharashtra, C=IN

keytool -genkey -v -keystore rezility.keystore -alias rezility -keyalg RSA -keysize 2048 -validity 10000

openssl pkcs12 -in RezDevAPNS.p12 -out RezDevAPNSP12.pem -nodes -clcerts
openssl pkcs12 -in RezPRODAPNS.p12 -out RezPRODAPNSP12.pem -nodes -clcerts

openssl x509 -in RezDevAPNS.cer -inform der -outform pem -out RezDevAPNScer.pem
openssl x509 -in RezPRODAPNS.cer -inform der -outform pem -out RezPRODAPNS.pem