rm -rf www/
export BUILD_ENV=dev
echo $BUILD_ENV
ionic cordova build ios 
ionic cordova build android

