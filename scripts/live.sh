rm -rf www/
export BUILD_ENV=live
echo $BUILD_ENV
ionic cordova build ios --prod  --release
ionic cordova build android --prod --release