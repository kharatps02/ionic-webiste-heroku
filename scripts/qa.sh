rm -rf www/
export BUILD_ENV=qa
echo $BUILD_ENV
ionic cordova build ios --prod  --release
ionic cordova build android --prod --release
